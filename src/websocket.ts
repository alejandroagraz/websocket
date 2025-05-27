// backend
// src/websocket.ts

import { WebSocketServer, WebSocket } from 'ws';
import { RedisHandler } from './redis';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { validateEnv } from './common/utils/validationEnv';
import { UUIDManager } from './common/utils/uuidManager';
import dotenv from 'dotenv';
import {CustomWebSocket} from "./common/interfaces/websocket";
import {ChannelNamesMiddleware} from "./common/middleware/channelNames.middleware";

dotenv.config();
export class WebSocketHandler {
    private readonly SERVER: string;
    public authMiddleware: AuthMiddleware;
    public clients: Map<string, CustomWebSocket> = new Map();

    constructor(private wss: WebSocketServer, public redisHandler: RedisHandler | null) {
        validateEnv(['SERVER']);
        this.SERVER = UUIDManager.getInstance().getUUID();
        this.authMiddleware = new AuthMiddleware();
        this.clients = new Map();
    }

    async setup() {
        this.wss.on('connection', (ws: WebSocket, req: any) => {
            this.authMiddleware.authenticate(ws, req, () => {
                console.log(`connection server->${this.SERVER}`);

                const customWebSocket: CustomWebSocket = ws;
                customWebSocket.ws = ws;
                this.clients.set(customWebSocket.user.id_user, customWebSocket);

                ws.on('message', (msg: string) => this.handleMessage(msg, ws));
                ws.on('close', () => this.handleClose(ws));
            });
        });
    }

    public async handleMessage(message: string, ws: CustomWebSocket) {
        console.log(`handleMessage server->${this.SERVER}, ${message}`);
        const parsedMessage = JSON.parse(message);
        const clientEntry = this.clients.get(ws.user.id_user) as CustomWebSocket;

        if (!clientEntry || !clientEntry.ws) {
            console.error(`Cliente con ID ${ws.user.id_user} no encontrado o no autenticado.`);
            return;
        }

        const channels = parsedMessage.channels

        if (parsedMessage.type === 'join') {
            for (const channel of channels) {
                await this.addChannel(channel, ws);
            }
            return;
        }

        const messageToSend = this.createMessageToSend(parsedMessage);
        const channel = ChannelNamesMiddleware.getChannelName(ws, parsedMessage.channel) ?? parsedMessage.channel;

        if (this.authMiddleware.channels[channel]) {
            await this.handleSendMessage(messageToSend, channel);
            parsedMessage.server = this.SERVER;
            parsedMessage.id_user = ws.user.id_user;
            parsedMessage.uid = ws.user.uid;
            await this.redisHandler?.publishMessages(parsedMessage);
        }
    }

    public async handleSendMessage(message: any, channel: string) {
        console.log(`handleSendMessage server->${this.SERVER}`);
        const clients: Set<WebSocket> = this.authMiddleware.channels[channel];

        if (clients) {
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        } else {
            console.log(`El canal ${channel} no existe o no tiene clientes conectados.`);
        }
    }

    public createMessageToSend(msg: any) {
        return {
            message: msg.message
        };
    }

    private async handleClose(ws: WebSocket) {
        console.log(`handleClose server->${this.SERVER}`);

        const channel = this.authMiddleware.wsChannelMap.get(ws);

        if (channel && this.authMiddleware.channels[channel]) {
            this.authMiddleware.channels[channel].delete(ws);

            if (this.authMiddleware.channels[channel].size === 0) {
                delete this.authMiddleware.channels[channel];
                console.log(`Canal ${channel} eliminado porque no tiene clientes conectados.`);
            }
        }
    }

    private async addChannel(channelName: string, ws: CustomWebSocket) {
        try {
            const channels = this.authMiddleware.channels;
            const channel = ChannelNamesMiddleware.getChannelName(ws, channelName) ?? channelName;

            if (!channels[channel]) {
                channels[channel] = new Set<WebSocket>();
            }
            channels[channel].add(ws);
            this.authMiddleware.wsChannelMap.set(ws, channel);

            console.log(`channels ${Object.keys(this.authMiddleware.channels)}`);
        } catch (err) {
            console.log(err);
            throw new Error(`Error inesperado: ${err}`);
        }
    }

}
