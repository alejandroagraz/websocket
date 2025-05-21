// src/common/middleware/authToken.ts

import { WebSocket } from 'ws';
import { CustomWebSocket } from '../interfaces/websocket';
import axios from 'axios';
import { validateEnv } from '../utils/validationEnv';
import { ChannelNames } from './channelNames';
import dotenv from 'dotenv';

dotenv.config();

export class AuthMiddleware {
    private readonly AUTH_TOKEN: string;
    public channels: { [key: string]: Set<WebSocket> } = {};
    public wsChannelMap: Map<WebSocket, string> = new Map();

    constructor() {
        validateEnv(['AUTH_TOKEN']);
        this.AUTH_TOKEN = process.env.AUTH_TOKEN!;
    }

    public async authenticate(ws: WebSocket, req: any, next: () => void) {
        const token = req.url.split('?token=')[1];
        if (token) {
            try {
                const resp = await this.certificateToken(token);
                console.log(`authenticate: ${resp.user.id_user}`);
                (ws as any).user = resp.user;
                next();
            } catch (error) {
                ws.close(1008, 'Token inválido');
            }
        } else {
            ws.close(1008, 'Token no proporcionado');
        }
    }

    private async certificateToken(token: string): Promise<any> {
        try {
            const response = await axios.get(this.AUTH_TOKEN, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return response.data;
        } catch (err) {
            throw new Error('Error al certificar el token: ' + err);
        }
    }

    public async addChannel(channelName: string, ws: CustomWebSocket) {
        try {
            const channel = ChannelNames.getChannelName(ws, channelName) ?? channelName;

            if (!this.channels[channel]) {
                this.channels[channel] = new Set<WebSocket>();
            }
            this.channels[channel].add(ws);
            this.wsChannelMap.set(ws, channel);

            console.log(`channels ${Object.keys(this.channels)}`);
        } catch (err) {
            console.log(err);
            throw new Error(`Error inesperado: ${err}`);
        }
    }
}
