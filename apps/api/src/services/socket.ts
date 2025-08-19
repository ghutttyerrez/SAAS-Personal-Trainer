import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

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
        const { receiverId, content, type = "text" } = data;

        // TODO: Salvar mensagem no banco de dados

        // Emitir mensagem para o destinatário
        socket.to(`user_${receiverId}`).emit("new_message", {
          id: Date.now().toString(), // TODO: usar UUID real
          senderId: authenticatedSocket.userId,
          receiverId,
          content,
          type,
          timestamp: new Date(),
          isRead: false,
        });

        // Confirmar envio para o remetente
        socket.emit("message_sent", {
          status: "success",
          messageId: Date.now().toString(),
        });
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        socket.emit("error", { message: "Erro ao enviar mensagem" });
      }
    });

    // Evento para marcar mensagem como lida
    socket.on("mark_as_read", async (data) => {
      try {
        const { messageId, senderId } = data;

        // TODO: Atualizar status no banco de dados

        // Notificar o remetente
        socket.to(`user_${senderId}`).emit("message_read", {
          messageId,
          readBy: authenticatedSocket.userId,
          readAt: new Date(),
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
