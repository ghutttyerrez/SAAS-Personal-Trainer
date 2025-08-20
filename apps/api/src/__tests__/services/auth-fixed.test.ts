import { AuthService } from "../../services/auth";

// Mock simples para resolver problemas de tipo
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("../../repositories/auth", () => ({
  UserRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
  TenantRepository: {
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../repositories/refreshToken", () => ({
  RefreshTokenRepository: {
    findByToken: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../middleware/auth", () => ({
  generateToken: jest.fn(() => "mock-token"),
}));

describe.skip("AuthService (fixed, legacy)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    const loginCredentials = {
      email: "test@example.com",
      password: "password123",
    };

    it("deve fazer login com credenciais válidas", async () => {
      const bcrypt = require("bcryptjs");
      const {
        UserRepository,
        TenantRepository,
      } = require("../../repositories/auth");

      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        tenant_id: 1,
        password: "hashed-password",
      };

      const mockTenant = {
        id: 1,
        name: "Test Tenant",
      };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      TenantRepository.findById.mockResolvedValue(mockTenant);
      bcrypt.compare.mockResolvedValue(true);

      const result = await AuthService.login(loginCredentials);

      expect(result.success).toBe(true);
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(
        loginCredentials.email
      );
    });

    it("deve retornar erro para usuário não encontrado", async () => {
      const { UserRepository } = require("../../repositories/auth");
      UserRepository.findByEmail.mockResolvedValue(null);

      const result = await AuthService.login(loginCredentials);

      expect(result.success).toBe(false);
    });

    it("deve retornar erro para senha inválida", async () => {
      const bcrypt = require("bcryptjs");
      const { UserRepository } = require("../../repositories/auth");

      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashed-password",
      };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const result = await AuthService.login(loginCredentials);

      expect(result.success).toBe(false);
    });
  });

  describe("register", () => {
    const registerData = {
      email: "new@example.com",
      password: "password123",
      name: "New User",
      businessName: "New Business",
    };

    it("deve registrar novo usuário com sucesso", async () => {
      const bcrypt = require("bcryptjs");
      const {
        UserRepository,
        TenantRepository,
      } = require("../../repositories/auth");

      UserRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-password");

      const mockTenant = {
        id: 1,
        name: "New Business",
      };

      const mockUser = {
        id: 1,
        email: "new@example.com",
        name: "New User",
        tenant_id: 1,
      };

      TenantRepository.create.mockResolvedValue(mockTenant);
      UserRepository.create.mockResolvedValue(mockUser);

      const result = await AuthService.register(registerData);

      expect(result.success).toBe(true);
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(
        registerData.email
      );
    });

    it("deve retornar erro para email já existente", async () => {
      const { UserRepository } = require("../../repositories/auth");

      const existingUser = {
        id: 1,
        email: "new@example.com",
      };

      UserRepository.findByEmail.mockResolvedValue(existingUser);

      const result = await AuthService.register(registerData);

      expect(result.success).toBe(false);
    });
  });

  describe("refreshToken", () => {
    it("deve renovar token com refresh token válido", async () => {
      const {
        RefreshTokenRepository,
      } = require("../../repositories/refreshToken");
      const { UserRepository } = require("../../repositories/auth");

      const mockRefreshToken = {
        id: 1,
        user_id: 1,
        expires_at: new Date(Date.now() + 86400000),
      };

      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
      };

      RefreshTokenRepository.findByToken.mockResolvedValue(mockRefreshToken);
      UserRepository.findById.mockResolvedValue(mockUser);

      const result = await AuthService.refreshToken("valid-refresh-token");

      expect(result.success).toBe(true);
    });

    it("deve retornar erro para refresh token inválido", async () => {
      const {
        RefreshTokenRepository,
      } = require("../../repositories/refreshToken");
      RefreshTokenRepository.findByToken.mockResolvedValue(null);

      const result = await AuthService.refreshToken("invalid-token");

      expect(result.success).toBe(false);
    });
  });
});
