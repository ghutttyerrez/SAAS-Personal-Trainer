import { ClientsRepository } from "../../repositories/clients";

// Mock simples
jest.mock("../../config/database", () => ({
  query: jest.fn(),
}));

describe("ClientsRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("deactivateClient", () => {
    it("deve desativar cliente com sucesso", async () => {
      const pool = require("../../config/database");
      pool.query.mockResolvedValue({
        rowCount: 1,
      });

      const result = await ClientsRepository.deactivateClient("1", "1");

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        "UPDATE clients SET is_active = false WHERE id = $1 AND tenant_id = $2",
        ["1", "1"]
      );
    });

    it("deve retornar false quando cliente não for encontrado", async () => {
      const pool = require("../../config/database");
      pool.query.mockResolvedValue({
        rowCount: 0,
      });

      const result = await ClientsRepository.deactivateClient("999", "1");

      expect(result).toBe(false);
    });

    it("deve retornar false quando result for null", async () => {
      const pool = require("../../config/database");
      pool.query.mockResolvedValue(null);

      const result = await ClientsRepository.deactivateClient("1", "1");

      expect(result).toBe(false);
    });

    it("deve verificar parâmetros corretos", async () => {
      const pool = require("../../config/database");
      pool.query.mockResolvedValue({
        rowCount: 1,
      });

      await ClientsRepository.deactivateClient("123", "456");

      expect(pool.query).toHaveBeenCalledWith(
        "UPDATE clients SET is_active = false WHERE id = $1 AND tenant_id = $2",
        ["123", "456"]
      );
    });
  });
});
