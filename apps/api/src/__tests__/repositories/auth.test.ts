import { UserRepository, TenantRepository } from "../../repositories/auth";
import pool from "../../config/database";

// Mock do pool de conexão
jest.mock("../../config/database", () => ({
  query: jest.fn(),
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe("Auth Repositories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("UserRepository", () => {
    describe("findByEmail", () => {
      it("deve encontrar usuário por email", async () => {
        const mockUser = {
          id: 1,
          email: "test@example.com",
          name: "Test User",
          tenant_id: 1,
        };

        mockPool.query.mockResolvedValue({
          rows: [mockUser],
          rowCount: 1,
        } as any);

        const result = await UserRepository.findByEmail("test@example.com");

        expect(result).toEqual(mockUser);
        expect(mockPool.query).toHaveBeenCalledWith(
          "SELECT * FROM users WHERE email = $1",
          ["test@example.com"]
        );
      });

      it("deve retornar null quando usuário não for encontrado", async () => {
        mockPool.query.mockResolvedValue({
          rows: [],
          rowCount: 0,
        } as any);

        const result = await UserRepository.findByEmail("notfound@example.com");

        expect(result).toBeNull();
      });

      it("deve tratar erro de banco de dados", async () => {
        mockPool.query.mockRejectedValue(new Error("Database error"));

        await expect(
          UserRepository.findByEmail("test@example.com")
        ).rejects.toThrow("Database error");
      });
    });

    describe("findById", () => {
      it("deve encontrar usuário por ID", async () => {
        const mockUser = {
          id: 1,
          email: "test@example.com",
          name: "Test User",
        };

        mockPool.query.mockResolvedValue({
          rows: [mockUser],
          rowCount: 1,
        } as any);

        const result = await UserRepository.findById(1);

        expect(result).toEqual(mockUser);
        expect(mockPool.query).toHaveBeenCalledWith(
          "SELECT id, email, name, tenant_id FROM users WHERE id = $1",
          [1]
        );
      });

      it("deve retornar null quando usuário não for encontrado", async () => {
        mockPool.query.mockResolvedValue({
          rows: [],
          rowCount: 0,
        } as any);

        const result = await UserRepository.findById(999);

        expect(result).toBeNull();
      });
    });

    describe("create", () => {
      it("deve criar novo usuário", async () => {
        const userData = {
          email: "new@example.com",
          name: "New User",
          password: "hashed-password",
          tenant_id: 1,
        };

        const mockCreatedUser = {
          id: 2,
          ...userData,
        };

        mockPool.query.mockResolvedValue({
          rows: [mockCreatedUser],
          rowCount: 1,
        } as any);

        const result = await UserRepository.create(userData);

        expect(result).toEqual(mockCreatedUser);
        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO users"),
          expect.arrayContaining([
            userData.email,
            userData.name,
            userData.password,
            userData.tenant_id,
          ])
        );
      });

      it("deve tratar erro na criação", async () => {
        const userData = {
          email: "new@example.com",
          name: "New User",
          password: "hashed-password",
          tenant_id: 1,
        };

        mockPool.query.mockRejectedValue(new Error("Duplicate email"));

        await expect(UserRepository.create(userData)).rejects.toThrow(
          "Duplicate email"
        );
      });
    });
  });

  describe("TenantRepository", () => {
    describe("findById", () => {
      it("deve encontrar tenant por ID", async () => {
        const mockTenant = {
          id: 1,
          name: "Test Business",
          created_at: new Date(),
        };

        mockPool.query.mockResolvedValue({
          rows: [mockTenant],
          rowCount: 1,
        } as any);

        const result = await TenantRepository.findById(1);

        expect(result).toEqual(mockTenant);
        expect(mockPool.query).toHaveBeenCalledWith(
          "SELECT * FROM tenants WHERE id = $1",
          [1]
        );
      });

      it("deve retornar null quando tenant não for encontrado", async () => {
        mockPool.query.mockResolvedValue({
          rows: [],
          rowCount: 0,
        } as any);

        const result = await TenantRepository.findById(999);

        expect(result).toBeNull();
      });
    });

    describe("create", () => {
      it("deve criar novo tenant", async () => {
        const tenantData = {
          name: "New Business",
        };

        const mockCreatedTenant = {
          id: 2,
          name: "New Business",
          created_at: new Date(),
        };

        mockPool.query.mockResolvedValue({
          rows: [mockCreatedTenant],
          rowCount: 1,
        } as any);

        const result = await TenantRepository.create(tenantData);

        expect(result).toEqual(mockCreatedTenant);
        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO tenants"),
          [tenantData.name]
        );
      });

      it("deve tratar erro na criação do tenant", async () => {
        const tenantData = {
          name: "New Business",
        };

        mockPool.query.mockRejectedValue(
          new Error("Database constraint error")
        );

        await expect(TenantRepository.create(tenantData)).rejects.toThrow(
          "Database constraint error"
        );
      });
    });
  });
});
