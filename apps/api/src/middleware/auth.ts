import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "@personal-trainer/shared-types";

export interface AuthenticatedRequest extends Request {
  user?: User;
  tenantId?: string;
}

export const authenticateToken = (
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

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback-secret",
    (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token inválido",
        });
      }

      req.user = decoded.user;
      req.tenantId = decoded.tenantId;
      next();
    }
  );
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
    { expiresIn: "7d" }
  );
};
