// src/websocket.ts

import { WebSocketServer, WebSocket } from 'ws';
import { RedisHandler } from './redis';
import { AuthMiddleware } from './common/middleware/authToken';
import { validateEnv } from './common/utils/validationEnv';
import dotenv from 'dotenv';
import {CustomWebSocket} from "./common/interfaces/websocket";
import {ChannelNames} from "./common/middleware/channelNames";

dotenv.config();

export class WebSocketHandler {
    private readonly SERVER: number;
    public authMiddleware: AuthMiddleware;
    public clients: Map<string, { ws: WebSocket }> = new Map();

    constructor(private wss: WebSocketServer, public redisHandler: RedisHandler | null) {
        validateEnv(['SERVER']);
        this.SERVER = parseInt(process.env.SERVER!);
        this.authMiddleware = new AuthMiddleware();
    }

    async setup() {
        this.wss.on('connection', (ws: WebSocket, req: any) => {
            this.authMiddleware.authenticate(ws, req, () => {
                const clientId = req.headers['sec-websocket-key'];
                this.clients.set(clientId, { ws: ws});

                console.log(`connection server->${this.SERVER}`);

                ws.on('message', (msg: string) => this.handleMessage(msg, clientId));
                ws.on('close', () => this.handleClose(clientId));
            });
        });
    }

    private async handleMessage(message: string, clientId: string) {
        console.log(`handleMessage server->${this.SERVER}, ${message}`);
        const parsedMessage = JSON.parse(message);
        const clientEntry = this.clients.get(clientId);

        if (!clientEntry || !clientEntry.ws) {
            console.error(`Cliente con ID ${clientId} no encontrado o no autenticado.`);
            return;
        }

        if (parsedMessage.type === 'join') {
            const channels = Object.keys(parsedMessage.channels);
            for (const channel of channels) {
                await this.authMiddleware.addChannel(channel, clientEntry.ws);
            }
            return;
        }

        const messageToSend = this.createMessageToSend(parsedMessage);
        // const channelsList = Object.keys(this.authMiddleware.channels)
        //
        // const channel = ChannelNames.getChannelName(clientEntry.ws, parsedMessage.channel)
        //     ??  channelsList.filter(channel => channel.startsWith(parsedMessage.channel))[0]
        //     ?? parsedMessage.channel;
        // await this.handleSendMessage(messageToSend, channel);

        await this.handleSendMessage(messageToSend, parsedMessage.channel);
        parsedMessage.server = this.SERVER;
        await this.redisHandler?.publishMessages(parsedMessage);
    }

    public async handleSendMessage(message: any, channel: string) {
        console.log(`handleSendMessage server->${this.SERVER}, ${message}, ${channel}`);
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

    public createMessageToSend(message: any) {
        return {
            message: message.message
        };
    }

    private async handleClose(clientId: string) {
        console.log(`handleClose server->${this.SERVER}`);

        // Obtener el WebSocket del cliente desconectado
        const clientEntry = Array.from(this.clients.entries()).find(([key, value]) => key === clientId);

        if (clientEntry) {
            const { ws } = clientEntry[1];
            const channel = this.authMiddleware.wsChannelMap.get(ws);

            // Eliminar el WebSocket del canal
            if (channel && this.authMiddleware.channels[channel]) {
                this.authMiddleware.channels[channel].delete(ws);

                if (this.authMiddleware.channels[channel].size === 0) {
                    delete this.authMiddleware.channels[channel];
                    console.log(`Canal ${channel} eliminado porque no tiene clientes conectados.`);
                }
            }

            this.clients.delete(clientId);
        }
    }
}
