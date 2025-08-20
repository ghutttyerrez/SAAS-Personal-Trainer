import { generateToken } from "../../middleware/auth";

// Mock do jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-jwt-token"),
  verify: jest.fn(),
}));

describe("Auth Middleware", () => {
  describe("generateToken", () => {
    it("deve gerar token JWT válido", () => {
      const user = {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        tenantId: "1",
        role: "admin" as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = generateToken(user, "tenant-1");

      expect(token).toBe("mock-jwt-token");
    });

    it("deve ser chamado com parâmetros corretos", () => {
      const jwt = require("jsonwebtoken");
      const user = {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        tenantId: "1",
        role: "admin" as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      generateToken(user, "tenant-1");

      expect(jwt.sign).toHaveBeenCalledWith(
        { user, tenantId: "tenant-1" },
        expect.any(String), // JWT_SECRET
        { expiresIn: "24h" }
      );
    });
  });
});
