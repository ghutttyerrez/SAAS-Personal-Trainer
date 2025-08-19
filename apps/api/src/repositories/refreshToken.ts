import { query } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export class RefreshTokenRepository {
  // Criar refresh token
  static async create(
    userId: string,
    expiresInDays: number = 7
  ): Promise<string> {
    try {
      const token = crypto.randomBytes(64).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      await query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), userId, tokenHash, expiresAt]
      );

      return token;
    } catch (error) {
      console.error("Erro ao criar refresh token:", error);
      throw error;
    }
  }

  // Verificar refresh token
  static async verify(token: string): Promise<RefreshToken | null> {
    try {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const result = await query(
        `SELECT * FROM refresh_tokens 
         WHERE token_hash = $1 
         AND expires_at > CURRENT_TIMESTAMP 
         AND is_revoked = false`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        isRevoked: row.is_revoked,
        createdAt: row.created_at,
      };
    } catch (error) {
      console.error("Erro ao verificar refresh token:", error);
      throw error;
    }
  }

  // Revogar refresh token
  static async revoke(token: string): Promise<void> {
    try {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await query(
        "UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1",
        [tokenHash]
      );
    } catch (error) {
      console.error("Erro ao revogar refresh token:", error);
      throw error;
    }
  }

  // Revogar todos os tokens de um usuário
  static async revokeAllByUserId(userId: string): Promise<void> {
    try {
      await query(
        "UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1",
        [userId]
      );
    } catch (error) {
      console.error("Erro ao revogar todos os tokens do usuário:", error);
      throw error;
    }
  }

  // Limpar tokens expirados
  static async cleanExpired(): Promise<void> {
    try {
      await query(
        "DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = true"
      );
    } catch (error) {
      console.error("Erro ao limpar tokens expirados:", error);
      throw error;
    }
  }
}
