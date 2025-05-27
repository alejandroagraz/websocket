// backend
// src/common/middleware/auth.middleware.ts

import { WebSocket } from 'ws';
import axios from 'axios';
import { validateEnv } from '../utils/validationEnv';
import dotenv from 'dotenv';

dotenv.config();

export class AuthMiddleware {
    private readonly AUTH_TOKEN: string;
    public channels: { [key: string]: Set<WebSocket> } = {};
    public wsChannelMap: Map<WebSocket, string> = new Map();
    // private API;

    constructor() {
        validateEnv(['AUTH_TOKEN']);
        this.AUTH_TOKEN = process.env.AUTH_TOKEN!;

        // this.API = axios.create({
        //     baseURL: AUTH_SERVICE
        // })
    }

    public async authenticate(ws: WebSocket, req: any, next: () => void) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const token = urlParams.get('token');
        const uid = urlParams.get('uuid');
        const id_user = urlParams.get('userId');

        console.log(`Token: ${token}, UID: ${uid}, ID User: ${id_user}`);

        if (token) {
            try {
                const resp = await this.verifyToken(token);
                resp.user.uid = uid;
                resp.user.id_user = id_user;
                (ws as any).user = resp.user;
                next();
            } catch (error) {
                console.error('Token inválido:', error);
                ws.close(1008, 'Token inválido');
            }
        } else {
            console.error('Token no proporcionado');
            ws.close(1008, 'Token no proporcionado');
        }
    }

    private async verifyToken(token: string): Promise<any> {
        try {
            // return await this.API.post('/validation/token', { token })

            const response = await axios.get(this.AUTH_TOKEN, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return response.data;
        } catch (err) {
            throw new Error('Error al certificar el token: ' + err);
        }
    }

    // public ValidationApiKey(apikey: string) {
    //     return this.API.get('/validation/apikey', {
    //         headers: {
    //             apikey
    //         }
    //     })
    // }
}
