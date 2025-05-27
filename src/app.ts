// src/app.ts

import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './websocket';
import { RedisHandler } from './redis';
import { Routes } from './common/interfaces/routes.interface';
import IndexRoute from './routes/index.route';

export default class App {
    private readonly app: express.Application;
    private readonly server: http.Server;
    private readonly wss: WebSocketServer;
    private readonly wsHandler: WebSocketHandler;
    private readonly redisHandler: RedisHandler;
    private readonly port: string | number;

    constructor(routes: Routes[]) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || 3000;
        this.wss = new WebSocketServer({ server: this.server });
        this.wsHandler = new WebSocketHandler(this.wss, null);
        this.redisHandler = new RedisHandler(this.wss, this.wsHandler);
        this.wsHandler.redisHandler = this.redisHandler;

        this.app.use(express.json());

        this.initializeSocket();
        this.initializeRoutes(routes);
    }

    public listen() {
        this.server.listen(this.port, () => {
            console.log(`Servidor escuchando en http://localhost:${this.port}`);
        });
    }

    public initializeSocket() {
        try {
            this.redisHandler.connect();
            this.wsHandler.setup();
        } catch (err) {
            console.error('Error al iniciar el webSocket:', err);
        }
    }

    private initializeRoutes(routes: Routes[]) {
        const indexRoute = new IndexRoute(this.wsHandler, this.redisHandler);
        this.app.use('/', indexRoute.router);

        routes.forEach(route => {
            this.app.use('/', route.router);
        });
    }
}
