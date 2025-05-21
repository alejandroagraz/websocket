// src/common/interface/websocket.ts

import { WebSocket } from 'ws';

export interface CustomWebSocket extends WebSocket {
    user?: any; // Cambia `any` por el tipo adecuado de tu usuario
}
