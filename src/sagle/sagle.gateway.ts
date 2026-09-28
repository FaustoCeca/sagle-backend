import { Logger, OnModuleInit } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";


@WebSocketGateway({
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    }
})
export class SagleGateway implements OnModuleInit {
    // This gateway can be used to handle real-time updates related to the Sagle feature.
    // For example, you could emit events when a user votes, attempts a game, or when the Sagle is chosen.
    @WebSocketServer()
    public server: Server;

    private logger = new Logger('SagleGateway');
    private connectedClients: number = 0;

    onModuleInit() {
        this.server.on('connection', (socket: Socket) => {
            this.logger.log(`New client connected: ${socket.id}`);
            this.connectedClients++;


            socket.on('disconnect', () => {
                this.logger.log(`Client disconnected: ${socket.id}`);
            })
        })
    }

    // emitAttempt(sagaId: number, userId: number) {
    //     this.logger.log(`Emitting attempt update for sagaId: ${sagaId}, userId: ${userId}`);
    //     this.server.emit('attemptUpdate', { sagaId, userId });
    // }

    // BUG-03: never broadcast the Sagle over the socket — it would leak the
    // answer to every connected client. We only signal that votes changed;
    // clients that are allowed to see the answer refetch it over HTTP.
    emiteVoteUpdate(gameId: number, userId: string) {
        this.logger.log(`Emitting vote update for gameId: ${gameId}, userId: ${userId}`);
        this.server.emit('voteUpdate', { gameId });
    }
    
    // Example method to emit an event when a user votes
    // @SubscribeMessage('vote')
    // handleVote(client: any, payload: { gameId: number }) {
    //     this.server.emit('voteUpdate', payload);
    // }
}