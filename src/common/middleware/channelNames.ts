// src/common/middleware/ChannelNames.ts

export class ChannelNames {
    private static clientChannelsPrivate = ['chat', 'public'];
    private static userChannelsPrivate = ['events'];
    private static clientChannelsPublic = ['dashboard'];
    private static SERVER = parseInt(process.env.SERVER!);

    public static getChannelName(ws: any, channelName: string): string | undefined {
        const user = ws.user;
        console.log(`getChannelName client id: ${user.id_user}`);
        switch (true) {
            case this.clientChannelsPrivate.includes(channelName):
                // return `${user.uid}-${channelName}`;
                const uuid = this.SERVER === 1 ? '5e849b7e-2be7-4c51-a7ef-5b7b6efeeb57' : '4d849b7e-2be7-4c51-a7ef-5b7b6efeeb56'
                return `${uuid}-${channelName}`;
            case this.userChannelsPrivate.includes(channelName):
                return `${user.id_user}-${channelName}`;
            case this.clientChannelsPublic.includes(channelName):
                return channelName
            default:
                break;
        }
    }
}
