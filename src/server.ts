// server.ts

import App from './app';
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './websocket';
import { RedisHandler } from './redis';
import IndexRoute from './routes/index.route';

const server = new WebSocketServer({ noServer: true });
const webSocketHandler = new WebSocketHandler(server, null);
const redisHandler = new RedisHandler(server, webSocketHandler);
const indexRoute = new IndexRoute(webSocketHandler, redisHandler);

const app = new App([indexRoute]);

app.listen();
