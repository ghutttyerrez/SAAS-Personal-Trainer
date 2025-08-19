import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { generateToken, generateRefreshToken } from "../middleware/auth";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
} from "@personal-trainer/shared-types";

const router = Router();

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password }: LoginCredentials = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
      });
    }

    // TODO: Implementar busca no banco de dados
    // Por enquanto, resposta mock
    const mockUser = {
      id: uuidv4(),
      tenantId: uuidv4(),
      email,
      firstName: "João",
      lastName: "Silva",
      role: "trainer" as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTenant = {
      id: mockUser.tenantId,
      name: "Academia Silva",
      email,
      planType: "premium" as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = generateToken(mockUser, mockUser.tenantId);
    const refreshToken = generateRefreshToken(mockUser.id);

    const response: AuthResponse = {
      user: mockUser,
      tenant: mockTenant,
      token,
      refreshToken,
    };

    res.json({
      success: true,
      data: response,
      message: "Login realizado com sucesso",
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Registro
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, tenantName }: RegisterData =
      req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios",
      });
    }

    // TODO: Verificar se email já existe
    // TODO: Criar hash da senha
    // TODO: Inserir no banco de dados

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const tenantId = uuidv4();

    const newUser = {
      id: userId,
      tenantId,
      email,
      firstName,
      lastName,
      role: "trainer" as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newTenant = {
      id: tenantId,
      name: tenantName || `${firstName} ${lastName} - Personal Trainer`,
      email,
      planType: "basic" as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = generateToken(newUser, tenantId);
    const refreshToken = generateRefreshToken(userId);

    const response: AuthResponse = {
      user: newUser,
      tenant: newTenant,
      token,
      refreshToken,
    };

    res.status(201).json({
      success: true,
      data: response,
      message: "Conta criada com sucesso",
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token é obrigatório",
      });
    }

    // TODO: Verificar refresh token e gerar novo access token
    res.json({
      success: true,
      message: "Token atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro no refresh:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

export default router;
