// src/redis.ts

import { createClient } from 'redis';
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './websocket';
import { validateEnv } from './common/utils/validationEnv';
import {ChannelNames} from "./common/middleware/channelNames";
import dotenv from 'dotenv';

dotenv.config();

export class RedisHandler {
    private readonly SERVER: number;
    private readonly REDIS_HOST: string;
    private redisClient = createClient({ url: '' });
    private redisSubscriber = createClient({ url: '' });

    constructor(private wss: WebSocketServer, private webSocketHandler: WebSocketHandler) {
        this.redisClient.on('error', (err) => console.error('Redis Client Error', err));
        this.redisSubscriber.on('error', (err) => console.error('Redis Client Error', err));
        validateEnv(['SERVER', 'REDIS_HOST']);
        this.SERVER = parseInt(process.env.SERVER!);
        this.REDIS_HOST = process.env.REDIS_HOST!;
        this.redisClient = createClient({ url: this.REDIS_HOST });
        this.redisSubscriber = createClient({ url: this.REDIS_HOST });
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
        // const messageToSend = JSON.stringify(message);
        await this.redisClient.publish('messages', JSON.stringify(message));
    }

    async handleRedisMessage(message: string) {
        console.log(`handleRedisMessage server->${this.SERVER}, ${message}`);
        const parsedMessage = JSON.parse(message);
        const messageToSend = this.webSocketHandler.createMessageToSend(parsedMessage);

        if (parsedMessage.server !== this.SERVER) {
            const channelsList = Object.keys(this.webSocketHandler.authMiddleware.channels)

            if(channelsList.includes(parsedMessage.channel))
                console.log(`channelsList.includes(parsedMessage.channel):  ${parsedMessage.channel}`);
            await this.webSocketHandler.handleSendMessage(messageToSend, parsedMessage.channel);


            // const channel = channelsList.filter(channel => channel.startsWith(parsedMessage.channel));
            // if (channel) {
            //     await this.webSocketHandler.handleSendMessage(messageToSend, channel[0]);
            // }
        }
    }
}
