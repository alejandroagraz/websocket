// src/common/interface/websocket.ts

import { WebSocket } from 'ws';

export interface CustomWebSocket extends WebSocket {
    user?: any;
    ws?: WebSocket;
}
