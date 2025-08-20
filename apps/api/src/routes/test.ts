import { Router } from "express";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import { UserRepository } from "../repositories/auth";

const router = Router();

// Simple ping
router.get("/test", (req, res) => {
  res.json({ message: "Test route working!" });
});

// Dev-only: create a secondary user in the same tenant of the authenticated user
// POST /api/dev/users
// body: { email?, password?, firstName?, lastName?, role? }
router.post(
  "/users",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const {
        email,
        password = "Secret123!",
        firstName = "Test",
        lastName = "User",
        role = "client",
      } = req.body || {};

      const genEmail =
        email ||
        `user_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
      const passwordHash = await bcrypt.hash(password, 12);

      const created = await UserRepository.create({
        email: genEmail,
        passwordHash,
        firstName,
        lastName,
        role,
        tenantId,
      } as any);

      res.status(201).json({
        success: true,
        data: {
          id: created.id,
          email: created.email,
          role: created.role,
          tenantId: created.tenantId,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Erro ao criar usuário dev",
      });
    }
  }
);

// Dev-only: create a client record for a user
// POST /api/dev/clients
// body: { userId, fitnessGoal? }
router.post(
  "/clients",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const { userId, fitnessGoal = "Melhoria geral" } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId é obrigatório",
        });
      }

      const { query } = await import("../config/database");
      const { v4: uuidv4 } = await import("uuid");

      const clientId = uuidv4();
      const result = await query(
        `INSERT INTO clients (id, tenant_id, user_id, fitness_goal)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [clientId, tenantId, userId, fitnessGoal]
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.rows[0].id,
          tenantId: result.rows[0].tenant_id,
          userId: result.rows[0].user_id,
          fitnessGoal: result.rows[0].fitness_goal,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Erro ao criar cliente dev",
      });
    }
  }
);

export default router;
