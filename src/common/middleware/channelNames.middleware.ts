// backend
// src/common/middleware/ChannelNamesMiddleware.ts

import { CustomWebSocket } from '../interfaces/websocket';

export class ChannelNamesMiddleware {
    private static clientChannelsPrivate = ['chat', 'public'];
    private static userChannelsPrivate = ['events'];
    public static clientChannelsPublic = ['dashboard'];

    public static getChannelName(ws: CustomWebSocket, channelName: string): string | null {
        const user = ws.user;
        console.log(`getChannelName client id: ${user.id_user}`);
        switch (true) {
            case this.clientChannelsPrivate.includes(channelName):
                return `${user.uid}-${channelName}`;
            case this.userChannelsPrivate.includes(channelName):
                return `${user.id_user}-${channelName}`;
            case this.clientChannelsPublic.includes(channelName):
                return channelName
            default:
                return null
        }
    }
}
