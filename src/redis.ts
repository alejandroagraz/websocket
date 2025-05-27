// backend
// src/redis.ts

import { createClient } from 'redis';
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './websocket';
import { validateEnv } from './common/utils/validationEnv';
import { UUIDManager } from './common/utils/uuidManager';
import {ChannelNames} from "./common/middleware/channelNames";
import { CustomWebSocket } from './common/interfaces/websocket';
import dotenv from 'dotenv';

dotenv.config();

export class RedisHandler {
    private readonly SERVER: string;
    private readonly REDIS_HOST: string;
    private readonly REDIS_PORT: string;
    private redisClient = createClient({ url: '' });
    private redisSubscriber = createClient({ url: '' });

    constructor(private wss: WebSocketServer, private webSocketHandler: WebSocketHandler) {
        this.redisClient.on('error', (err) => console.error('Redis Client Error', err));
        this.redisSubscriber.on('error', (err) => console.error('Redis Client Error', err));
        validateEnv(['REDIS_HOST', 'REDIS_PORT']);
        this.SERVER = UUIDManager.getInstance().getUUID();
        this.REDIS_HOST = process.env.REDIS_HOST!;
        this.REDIS_PORT = process.env.REDIS_PORT!;
        this.redisClient = createClient({ url: `redis://${this.REDIS_HOST}:${this.REDIS_PORT}` });
        this.redisSubscriber = createClient({ url: `redis://${this.REDIS_HOST}:${this.REDIS_PORT}` });
    }

    async connect() {
        await this.redisClient.connect();
        await this.redisSubscriber.connect();
        await this.redisSubscriber.subscribe('messages', (message) => this.processMessage(message));
    }

    private async processMessage(message: string) {
        await this.handleRedisMessage(message);
    }
    async publishMessages(message: any) {
        console.log(`publishMessages server->${this.SERVER}, ${message}`);
        const messageToSend = JSON.stringify(message);
        console.log(messageToSend);
        await this.redisClient.set(message.channel, JSON.stringify(message));
        await this.redisClient.publish('messages', JSON.stringify(message));
    }

    async handleRedisMessage(message: string) {
        console.log(`handleRedisMessage server->${this.SERVER}, ${message}`);
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.server !== this.SERVER) {
            if (parsedMessage.type === 'join') {
                // const clientWs = this.webSocketHandler.clients.get(parsedMessage.id_user) as CustomWebSocket;
                await this.webSocketHandler.handleMessage(JSON.stringify(parsedMessage), { user: { id_user: parsedMessage.id_user, uid: parsedMessage.uid} } as CustomWebSocket)
            } else {
                const messageToSend = this.webSocketHandler.createMessageToSend(parsedMessage);
                const id_user = parsedMessage.id_user;
                const uid = parsedMessage.uid;
                const channel = ChannelNames.getChannelName({ user: { id_user,  uid} } as CustomWebSocket, parsedMessage.channel) ?? parsedMessage.channel;

                if (this.webSocketHandler.authMiddleware.channels[channel]) {
                    await this.webSocketHandler.handleSendMessage(messageToSend, channel);
                }
            }
        }
    }
}
