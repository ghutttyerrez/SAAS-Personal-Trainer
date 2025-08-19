import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "@personal-trainer/shared-types";
import { AuthService } from "../services/auth";

export interface AuthenticatedRequest extends Request {
  user?: User;
  tenantId?: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token de acesso requerido",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as any;

    // Verificar se o usuário ainda existe e está ativo
    const user = await AuthService.getUserById(decoded.user.id);
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Usuário não encontrado ou inativo",
      });
    }

    // Verificar se o tenant ainda existe e está ativo
    const tenant = await AuthService.getTenantById(decoded.tenantId);
    if (!tenant || !tenant.isActive) {
      return res.status(403).json({
        success: false,
        message: "Conta não encontrada ou inativa",
      });
    }

    req.user = user;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Token inválido",
    });
  }
};

export const generateToken = (user: User, tenantId: string): string => {
  return jwt.sign(
    { user, tenantId },
    process.env.JWT_SECRET || "fallback-secret",
    { expiresIn: "24h" } as any
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
    { expiresIn: "7d" } as any
  );
};
