import { Request, Response } from 'express';
import { UUIDManager } from "../common/utils/uuidManager";
import { ChannelNamesMiddleware } from "../common/middleware/channelNames.middleware";
import { WebSocketHandler } from "../websocket";
import { RedisHandler } from "../redis";
import {CustomWebSocket} from "../common/interfaces/websocket";

export default class IndexController {
  private webSocketHandler: WebSocketHandler;
  private redisHandler: RedisHandler;
  private readonly SERVER: string;

  constructor(webSocketHandler: WebSocketHandler, redisHandler: RedisHandler) {
    this.webSocketHandler = webSocketHandler;
    this.redisHandler = redisHandler;
    this.SERVER = UUIDManager.getInstance().getUUID();
  }

  public publishMessage = async (req: Request, res: Response): Promise<any> => {
    try {
      const { channel, message, id_user, uid } = req.body;

      if (!channel || !message) {
        return res.status(400).json({ error: 'Faltan parámetros: channel, message, id_user,  son requeridos.' });
      }

      const messageToSend = this.webSocketHandler.createMessageToSend({message});
      const channelName = ChannelNamesMiddleware.getChannelName({ user: { id_user,  uid} } as CustomWebSocket, channel) ?? channel;
      await this.webSocketHandler.handleSendMessage(messageToSend, channelName);
      const parsedMessage = { channel: channelName, message, id_user, uid, server: this.SERVER };
      await this.redisHandler?.publishMessages(parsedMessage);

      return res.status(200).json({ success: true, message: 'Mensaje publicado.' });
    } catch (err) {
      console.error('Error al publicar el mensaje:', err);
      return res.status(500).json({ error: 'Error al publicar el mensaje.' });
    }
  }

  public addChannels = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id_user, type, channels, uid} = req.body;

      if (!type || !channels) {
        return res.status(400).json({ error: 'Faltan parámetros: channels y type son requeridos.' });
      }

      const messageToSend = JSON.stringify({ type, channels });
      await this.webSocketHandler.handleMessage(messageToSend, { user: { id_user,  uid} } as CustomWebSocket);
      const parsedMessage: any = { type, channels, id_user, uid, server: this.SERVER, channel: type };
      await this.redisHandler?.publishMessages(parsedMessage);

      return res.status(200).json({ success: true, message: 'Canales añadidos.' });
    } catch (err) {
      console.error('Error al publicar el mensaje:', err);
      return res.status(500).json({ error: 'Error al crear el canal.' });
    }
  }

  public health = async (req: Request, res: Response): Promise<any> => {
    res.status(200).send('OK');
  }
}
