import request from "supertest";
import express from "express";
import clientsRouter from "../../routes/clients";

// Mock do middleware de autenticação
jest.mock("../../middleware/auth", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, tenantId: 1 };
    next();
  },
}));

// Mock do repository
jest.mock("../../repositories/clients", () => ({
  ClientsRepository: {
    deactivateClient: jest.fn(),
  },
}));

describe("Clients Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/clients", clientsRouter);
    jest.clearAllMocks();
  });

  describe("PATCH /api/clients/:id/deactivate", () => {
    it("deve desativar cliente com sucesso", async () => {
      const { ClientsRepository } = require("../../repositories/clients");
      ClientsRepository.deactivateClient.mockResolvedValue(true);

      const response = await request(app)
        .patch("/api/clients/1/deactivate")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Cliente desativado com sucesso",
      });
    });

    it("deve retornar erro 404 quando cliente não for encontrado", async () => {
      const { ClientsRepository } = require("../../repositories/clients");
      ClientsRepository.deactivateClient.mockResolvedValue(false);

      const response = await request(app)
        .patch("/api/clients/999/deactivate")
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: "Cliente não encontrado",
      });
    });

    it("deve tratar erro do repository", async () => {
      const { ClientsRepository } = require("../../repositories/clients");
      ClientsRepository.deactivateClient.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .patch("/api/clients/1/deactivate")
        .expect(500);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Erro ao desativar cliente"
      );
    });

    it("deve validar ID do parâmetro", async () => {
      const response = await request(app)
        .patch("/api/clients/invalid-id/deactivate")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
