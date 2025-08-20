// Mock dos middlewares e serviços
jest.mock("../../services/auth", () => ({
  AuthService: {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAllDevices: jest.fn(),
  },
}));

jest.mock("../../middleware/auth", () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
}));

import request from "supertest";
import express from "express";
import authRouter from "../../routes/auth";
import { AuthService } from "../../services/auth";

const mockedAuthService = jest.mocked(AuthService);

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

describe.skip("Auth Routes (comprehensive)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    test("deve registrar usuário com sucesso", async () => {
      const registerData = {
        email: "test@test.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
        role: "admin",
        businessName: "Test Business",
        businessEmail: "business@test.com",
        businessPhone: "123456789",
      };

      const mockResponse = {
        user: {
          id: "user-id",
          tenantId: "tenant-id",
          email: "test@test.com",
          firstName: "Test",
          lastName: "User",
          role: "admin" as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tenant: {
          id: "tenant-id",
          name: "Test Business",
          email: "business@test.com",
          planType: "basic" as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: "access-token",
        refreshToken: "refresh-token",
      };

      mockedAuthService.register.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(registerData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
        message: "Usuário registrado com sucesso",
      });

      expect(mockedAuthService.register).toHaveBeenCalledWith(registerData);
    });

    test("deve retornar erro 400 para dados inválidos", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "123", // muito curta
        firstName: "",
        lastName: "",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test("deve retornar erro 409 quando email já existe", async () => {
      const registerData = {
        email: "existing@test.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
        role: "admin",
        businessName: "Test Business",
        businessEmail: "business@test.com",
      };

      mockedAuthService.register.mockRejectedValue(
        new Error("Email já está sendo usado")
      );

      const response = await request(app)
        .post("/auth/register")
        .send(registerData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Email já está sendo usado");
    });
  });

  describe("POST /auth/login", () => {
    test("deve fazer login com sucesso", async () => {
      const loginData = {
        email: "test@test.com",
        password: "password123",
      };

      const mockResponse = {
        user: {
          id: "user-id",
          email: "test@test.com",
          firstName: "Test",
          lastName: "User",
        },
        tenant: {
          id: "tenant-id",
          name: "Test Business",
        },
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
      };

      mockedAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockResponse.user,
          tenant: mockResponse.tenant,
          accessToken: mockResponse.tokens.accessToken,
        },
        message: "Login realizado com sucesso",
      });

      // Verifica se o refresh token foi definido como cookie
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    test("deve retornar erro 400 para dados inválidos", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "",
      };

      const response = await request(app)
        .post("/auth/login")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test("deve retornar erro 401 para credenciais inválidas", async () => {
      const loginData = {
        email: "test@test.com",
        password: "wrong-password",
      };

      mockedAuthService.login.mockRejectedValue(
        new Error("Credenciais inválidas")
      );

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Credenciais inválidas");
    });
  });

  describe("POST /auth/refresh", () => {
    test("deve renovar token com sucesso", async () => {
      const mockResponse = {
        user: {
          id: "user-id",
          email: "test@test.com",
        },
        tenant: {
          id: "tenant-id",
          name: "Test Business",
        },
        accessToken: "new-access-token",
      };

      mockedAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", ["refreshToken=refresh-token"])
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
        message: "Token renovado com sucesso",
      });
    });

    test("deve retornar erro 401 quando refresh token não está presente", async () => {
      const response = await request(app).post("/auth/refresh").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Refresh token não encontrado");
    });

    test("deve retornar erro 401 para refresh token inválido", async () => {
      mockedAuthService.refreshToken.mockRejectedValue(
        new Error("Refresh token inválido")
      );

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", ["refreshToken=invalid-token"])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Refresh token inválido");
    });
  });

  describe("POST /auth/logout", () => {
    test("deve fazer logout com sucesso", async () => {
      mockedAuthService.logout.mockResolvedValue();

      const response = await request(app)
        .post("/auth/logout")
        .set("Cookie", ["refreshToken=refresh-token"])
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Logout realizado com sucesso",
      });

      // Verifica se o cookie foi limpo
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    test("deve fazer logout mesmo sem refresh token", async () => {
      const response = await request(app).post("/auth/logout").expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Logout realizado com sucesso",
      });
    });
  });

  describe("POST /auth/logout-all", () => {
    test("deve fazer logout de todos os dispositivos", async () => {
      mockedAuthService.logoutAllDevices.mockResolvedValue();

      const response = await request(app).post("/auth/logout-all").expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Logout realizado em todos os dispositivos",
      });
    });
  });
});
