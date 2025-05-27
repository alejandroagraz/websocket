// src/routes/index.route.ts

import { Router } from 'express';
import IndexController from '../controllers/index.controller';
import { Routes } from '../common/interfaces/routes.interface';
import { WebSocketHandler } from '../websocket';
import { RedisHandler } from '../redis';

export default class IndexRoute implements Routes {
  public path = '';
  public router = Router();
  public controller: IndexController;

  constructor(webSocketHandler: WebSocketHandler, redisHandler: RedisHandler) {
    this.controller = new IndexController(webSocketHandler, redisHandler);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/health', this.controller.health.bind(this.controller));
    this.router.post('/publish', this.controller.publishMessage.bind(this.controller));
    this.router.post('/add/channels', this.controller.addChannels.bind(this.controller));
  }
}
