import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatRepository } from "../repositories/chat";

interface AuthenticatedSocket {
  userId: string;
  tenantId: string;
}

export const setupSocketIO = (io: SocketIOServer) => {
  // Middleware de autenticação para Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Token de autenticação requerido"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as any;
      (socket as any).userId = decoded.user.id;
      (socket as any).tenantId = decoded.tenantId;
      next();
    } catch (err) {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    const authenticatedSocket = socket as any as AuthenticatedSocket;
    console.log(`Usuário ${authenticatedSocket.userId} conectado`);

    // Juntar o usuário às salas do seu tenant
    socket.join(`tenant_${authenticatedSocket.tenantId}`);
    socket.join(`user_${authenticatedSocket.userId}`);

    // Evento para enviar mensagem
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, content, type = "text", roomId } = data;

        // Criar sala direta automaticamente se não for fornecido roomId
        let finalRoomId = roomId;
        if (!finalRoomId) {
          const room = await ChatRepository.getOrCreateDirectRoom(
            (socket as any).tenantId,
            authenticatedSocket.userId,
            receiverId
          );
          finalRoomId = room.id;
        }

        const message = await ChatRepository.createMessage({
          roomId: finalRoomId,
          senderId: authenticatedSocket.userId,
          receiverId,
          tenantId: (socket as any).tenantId,
          content,
          type,
        });

        // Emitir mensagem para o destinatário e para membros da sala
        socket.to(`user_${receiverId}`).emit("new_message", message);
        io.to(`tenant_${(socket as any).tenantId}`).emit("room_updated", {
          roomId: finalRoomId,
          lastMessage: message,
        });

        // Confirmar envio para o remetente
        socket.emit("message_sent", {
          status: "success",
          messageId: message.id,
          roomId: finalRoomId,
        });
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        socket.emit("error", { message: "Erro ao enviar mensagem" });
      }
    });

    // Evento para marcar mensagem como lida
    socket.on("mark_as_read", async (data) => {
      try {
        const { messageId, roomId, senderId } = data;

        const result = await ChatRepository.markAsRead(
          roomId,
          authenticatedSocket.userId,
          messageId ? { messageId } : { fromSenderId: senderId }
        );

        // Notificar o remetente e participantes da sala
        if (senderId) {
          socket.to(`user_${senderId}`).emit("message_read", {
            messageIds: result.messageIds,
            readBy: authenticatedSocket.userId,
            readAt: new Date(),
          });
        }
        io.to(`tenant_${(socket as any).tenantId}`).emit("messages_read", {
          roomId,
          messageIds: result.messageIds,
        });
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
      }
    });

    // Evento para indicar que o usuário está digitando
    socket.on("typing_start", (data) => {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit("user_typing", {
        userId: authenticatedSocket.userId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", (data) => {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit("user_typing", {
        userId: authenticatedSocket.userId,
        isTyping: false,
      });
    });

    // Evento de desconexão
    socket.on("disconnect", () => {
      console.log(`Usuário ${authenticatedSocket.userId} desconectado`);
    });
  });
};
