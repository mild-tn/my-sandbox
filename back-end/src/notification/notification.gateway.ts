import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface User {
  socketId: string;
  roomId: string;
}

@WebSocketGateway()
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeUsers: User[] = [];
  private rooms: Set<string> = new Set();

  handleConnection(client: Socket) {
    console.log('New connection:', client.id);
  }

  handleDisconnect(client: Socket) {
    this.activeUsers = this.activeUsers.filter(
      (user) => user.socketId !== client.id,
    );
    this.broadcastActiveUsers(client);
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    this.rooms.add(roomId);
    client.join(roomId);
    this.activeUsers.push({ socketId: client.id, roomId });
    this.broadcastRooms();
    this.broadcastActiveUsers(client);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    if (this.rooms.has(roomId)) {
      client.join(roomId);
      this.activeUsers.push({ socketId: client.id, roomId });
      this.broadcastActiveUsers(client);
    } else {
      client.emit('error', { message: 'Room does not exist' });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    client.leave(roomId);
    this.activeUsers = this.activeUsers.filter(
      (user) => user.socketId !== client.id || user.roomId !== roomId,
    );
    this.broadcastActiveUsers(client);
  }

  @SubscribeMessage('newMessage')
  onNewMessage(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, message } = data;
    this.server
      .to(roomId)
      .emit('newMessage', { socketId: client.id, message, roomId });
  }

  broadcastActiveUsers(client: Socket) {
    const userRooms = this.activeUsers
      .filter((user) => user.socketId === client.id)
      .map((user) => user.roomId);
    userRooms.forEach((roomId) => {
      const activeUserIds = this.activeUsers
        .filter((user) => user.roomId === roomId)
        .map((user) => user.socketId);
      this.server.to(roomId).emit('activeUsers', activeUserIds);
    });
  }

  broadcastRooms() {
    this.server.emit('rooms', Array.from(this.rooms));
  }
}
