import { Router, Request, Response } from "express";
import { AuthService } from "../services/auth";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { validateBody, ValidatedRequest } from "../middleware/validation";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../schemas/validation";

const router = Router();

// Registro de tenant/usuário
router.post(
  "/register",
  validateBody(registerSchema),
  async (req: any, res: Response) => {
    try {
      const result = await AuthService.register(req.validatedData);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.status(201).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro interno no registro", error });
    }
  }
);

// Login
router.post(
  "/login",
  validateBody(loginSchema),
  async (req: any, res: Response) => {
    try {
      const result = await AuthService.login(req.validatedData);
      if (!result.success) {
        return res.status(401).json(result);
      }
      res.json(result);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro interno no login", error });
    }
  }
);

// Refresh token
router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  async (req: any, res: Response) => {
    try {
      const { refreshToken } = req.validatedData;
      const result = await AuthService.refreshToken(refreshToken);
      if (!result.success) {
        return res.status(401).json(result);
      }
      res.json(result);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro interno no refresh", error });
    }
  }
);

// Perfil do usuário logado
router.get(
  "/profile",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await AuthService.getUserProfile(req.user, req.tenantId);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json(result);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro interno no perfil", error });
    }
  }
);

export default router;
