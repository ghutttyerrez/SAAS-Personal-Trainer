import { Router } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { ChatRepository } from "../repositories/chat";

const router = Router();

// Listar salas do usuário atual
router.get(
  "/rooms",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const rooms = await ChatRepository.listRoomsForUser(tenantId, userId);
      res.json({ success: true, data: rooms });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Erro ao listar salas",
        });
    }
  }
);

// Criar/obter sala direta entre usuário atual e outro usuário
router.post(
  "/rooms/direct",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { otherUserId } = req.body as { otherUserId: string };
      if (!otherUserId)
        return res
          .status(400)
          .json({ success: false, message: "otherUserId é obrigatório" });

      const room = await ChatRepository.getOrCreateDirectRoom(
        tenantId,
        userId,
        otherUserId
      );
      res.json({ success: true, data: room });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Erro ao criar sala",
        });
    }
  }
);

// Listar mensagens de uma sala com paginação
router.get(
  "/rooms/:roomId/messages",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roomId } = req.params;
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "20", 10);
      const result = await ChatRepository.listMessages(roomId, page, limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Erro ao listar mensagens",
        });
    }
  }
);

// Enviar mensagem (alternativa REST, além do Socket.IO)
router.post(
  "/rooms/:roomId/messages",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roomId } = req.params;
      const senderId = req.user!.id;
      const tenantId = req.tenantId!;
      const { receiverId, content, type } = req.body as {
        receiverId: string;
        content: string;
        type?: "text" | "image" | "file";
      };
      if (!receiverId || !content)
        return res
          .status(400)
          .json({
            success: false,
            message: "receiverId e content são obrigatórios",
          });

      const msg = await ChatRepository.createMessage({
        roomId,
        senderId,
        receiverId,
        tenantId,
        content,
        type,
      });
      res.status(201).json({ success: true, data: msg });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Erro ao enviar mensagem",
        });
    }
  }
);

// Marcar mensagens como lidas
router.post(
  "/rooms/:roomId/read",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roomId } = req.params;
      const readerId = req.user!.id;
      const { messageId, fromSenderId } = req.body as {
        messageId?: string;
        fromSenderId?: string;
      };
      const result = await ChatRepository.markAsRead(roomId, readerId, {
        messageId,
        fromSenderId,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Erro ao marcar como lida",
        });
    }
  }
);

// Quantidade de não lidas por sala
router.get(
  "/unread",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const map = await ChatRepository.getUnreadCountByRoom(tenantId, userId);
      res.json({ success: true, data: map });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Erro ao buscar não lidas",
        });
    }
  }
);

export default router;
