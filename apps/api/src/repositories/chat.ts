import { query } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface CreateMessageInput {
  roomId: string;
  senderId: string;
  receiverId: string;
  tenantId: string;
  content: string;
  type?: "text" | "image" | "file";
}

export interface ChatRoomDTO {
  id: string;
  tenantId: string;
  participants: string[];
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageDTO {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  tenantId: string;
  content: string;
  type: "text" | "image" | "file";
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatRepository {
  // Find a direct room between two users within a tenant or create if not exists
  static async getOrCreateDirectRoom(
    tenantId: string,
    userA: string,
    userB: string
  ): Promise<ChatRoomDTO> {
    const findRes = await query(
      `SELECT * FROM chat_rooms
       WHERE tenant_id = $1
         AND participants @> $2::uuid[]
         AND participants @> $3::uuid[]
         AND array_length(participants, 1) = 2
       LIMIT 1`,
      [tenantId, [userA], [userB]]
    );

    if (findRes.rows.length > 0) {
      const r = findRes.rows[0];
      return ChatRepository.mapRoom(r);
    }

    const id = uuidv4();
    const createRes = await query(
      `INSERT INTO chat_rooms (id, tenant_id, participants)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, tenantId, [userA, userB]]
    );
    return ChatRepository.mapRoom(createRes.rows[0]);
  }

  static async getRoomById(roomId: string): Promise<ChatRoomDTO | null> {
    const res = await query(`SELECT * FROM chat_rooms WHERE id = $1`, [roomId]);
    if (res.rows.length === 0) return null;
    return ChatRepository.mapRoom(res.rows[0]);
  }

  static async listRoomsForUser(
    tenantId: string,
    userId: string
  ): Promise<(ChatRoomDTO & { lastMessage?: ChatMessageDTO })[]> {
    const res = await query(
      `SELECT r.*, (
          SELECT row_to_json(m)
          FROM (
            SELECT * FROM chat_messages cm
            WHERE cm.room_id = r.id
            ORDER BY cm.created_at DESC
            LIMIT 1
          ) m
        ) as last_message
       FROM chat_rooms r
       WHERE r.tenant_id = $1 AND $2 = ANY(r.participants)
       ORDER BY r.updated_at DESC`,
      [tenantId, userId]
    );

    return res.rows.map((row: any) => {
      const room = ChatRepository.mapRoom(row);
      const last = row.last_message
        ? ChatRepository.mapMessage(row.last_message)
        : undefined;
      return { ...room, lastMessage: last };
    });
  }

  static async createMessage(
    input: CreateMessageInput
  ): Promise<ChatMessageDTO> {
    const id = uuidv4();
    const type = input.type || "text";
    const res = await query(
      `INSERT INTO chat_messages
        (id, room_id, sender_id, receiver_id, tenant_id, content, message_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        input.roomId,
        input.senderId,
        input.receiverId,
        input.tenantId,
        input.content,
        type,
      ]
    );

    // Update room last activity
    await query(
      `UPDATE chat_rooms SET last_activity = NOW(), updated_at = NOW() WHERE id = $1`,
      [input.roomId]
    );

    return ChatRepository.mapMessage(res.rows[0]);
  }

  static async listMessages(
    roomId: string,
    page = 1,
    limit = 20
  ): Promise<{
    messages: ChatMessageDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const res = await query(
      `SELECT * FROM chat_messages
       WHERE room_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    );

    const countRes = await query(
      `SELECT COUNT(*)::int AS count FROM chat_messages WHERE room_id = $1`,
      [roomId]
    );

    return {
      messages: res.rows.map(ChatRepository.mapMessage),
      total: countRes.rows[0].count,
      page,
      limit,
    };
  }

  static async markAsRead(
    roomId: string,
    readerId: string,
    options?: { messageId?: string; fromSenderId?: string }
  ): Promise<{ updated: number; messageIds: string[] }> {
    if (options?.messageId) {
      const res = await query(
        `UPDATE chat_messages
         SET is_read = true, read_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND room_id = $2 AND receiver_id = $3 AND is_read = false
         RETURNING id`,
        [options.messageId, roomId, readerId]
      );
      return {
        updated: res.rowCount,
        messageIds: res.rows.map((r: any) => r.id),
      };
    }

    // Mark all unread targeting this reader (optionally filtered by sender)
    const params: any[] = [roomId, readerId];
    let filter = "";
    if (options?.fromSenderId) {
      filter = " AND sender_id = $3";
      params.push(options.fromSenderId);
    }

    const res = await query(
      `UPDATE chat_messages
       SET is_read = true, read_at = NOW(), updated_at = NOW()
       WHERE room_id = $1 AND receiver_id = $2 AND is_read = false${filter}
       RETURNING id`,
      params
    );
    return {
      updated: res.rowCount,
      messageIds: res.rows.map((r: any) => r.id),
    };
  }

  static async getUnreadCountByRoom(
    tenantId: string,
    userId: string
  ): Promise<Record<string, number>> {
    const res = await query(
      `SELECT room_id, COUNT(*)::int AS unread
       FROM chat_messages
       WHERE tenant_id = $1 AND receiver_id = $2 AND is_read = false
       GROUP BY room_id`,
      [tenantId, userId]
    );
    const map: Record<string, number> = {};
    res.rows.forEach((r: any) => (map[r.room_id] = r.unread));
    return map;
  }

  // Helpers
  private static mapRoom(row: any): ChatRoomDTO {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      participants: row.participants,
      lastActivity: row.last_activity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapMessage(row: any): ChatMessageDTO {
    return {
      id: row.id,
      roomId: row.room_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      tenantId: row.tenant_id,
      content: row.content,
      type: row.message_type,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
