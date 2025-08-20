import { RefreshTokenRepository } from "../../repositories/refreshToken";

// Mock simples
jest.mock("../../config/database", () => ({
  query: jest.fn(),
}));

jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => ({ toString: () => "mock-token" })),
  createHash: jest.fn(() => ({
    update: () => ({ digest: () => "mock-hash" }),
  })),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

describe("RefreshTokenRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("deve criar novo refresh token", async () => {
      const pool = require("../../config/database");
      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 1,
      });

      const result = await RefreshTokenRepository.create("user-id");

      expect(result).toBe("mock-token");
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe("verify", () => {
    it("deve verificar refresh token válido", async () => {
      const pool = require("../../config/database");
      const mockToken = {
        id: "1",
        user_id: "user-id",
        token_hash: "mock-hash",
        expires_at: new Date(Date.now() + 86400000),
        is_revoked: false,
      };

      pool.query.mockResolvedValue({
        rows: [mockToken],
        rowCount: 1,
      });

      const result = await RefreshTokenRepository.verify("valid-token");

      expect(result).toBeDefined();
    });

    it("deve retornar null para token inválido", async () => {
      const pool = require("../../config/database");
      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await RefreshTokenRepository.verify("invalid-token");

      expect(result).toBeNull();
    });
  });

  describe("revoke", () => {
    it("deve revogar refresh token", async () => {
      const pool = require("../../config/database");
      pool.query.mockResolvedValue({
        rowCount: 1,
      });

      const result = await RefreshTokenRepository.revoke("token-to-revoke");

      expect(result).toBe(true);
    });

    it("deve retornar false quando token não for encontrado", async () => {
      const pool = require("../../config/database");
      pool.query.mockResolvedValue({
        rowCount: 0,
      });

      const result = await RefreshTokenRepository.revoke("nonexistent-token");

      expect(result).toBe(false);
    });
  });
});
