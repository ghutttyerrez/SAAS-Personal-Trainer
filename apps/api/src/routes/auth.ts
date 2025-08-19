import { Router, Request, Response } from "express";
import { AuthService } from "../services/auth";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Registro de tenant/usuário
router.post("/register", async (req: Request, res: Response) => {
  try {
    const result = await AuthService.register(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro interno no registro", error });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const result = await AuthService.login(req.body);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro interno no login", error });
  }
});

// Refresh token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
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
});

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
