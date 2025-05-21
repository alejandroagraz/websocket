// src/server.ts

import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './websocket';
import { RedisHandler } from './redis';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const startServer = async () => {
    try {
        const wsHandler = new WebSocketHandler(wss, null);
        const redisHandler = new RedisHandler(wss, wsHandler);
        wsHandler.redisHandler = redisHandler;

        await redisHandler.connect();
        await wsHandler.setup();

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error al iniciar el servidor:', err);
    }
};

startServer();
