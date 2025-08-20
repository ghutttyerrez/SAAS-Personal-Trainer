import request from "supertest";
import express from "express";
import workoutsRouter from "../../routes/workouts";

// Mock do middleware de autenticação
jest.mock("../../middleware/auth", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: "user123", tenantId: "tenant123" };
    req.tenantId = "tenant123";
    next();
  },
}));

describe("Workouts Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/workouts", workoutsRouter);
    jest.clearAllMocks();
  });

  describe("Route structure", () => {
    it("deve ter as rotas definidas", () => {
      // Teste básico para verificar se o router está funcionando
      expect(workoutsRouter).toBeDefined();
    });

    it("deve retornar 404 para treino inexistente", async () => {
      // A rota '/:id' existe, mas retornará 404 se não achar
      const response = await request(app)
        .get("/api/workouts/00000000-0000-0000-0000-000000000000")
        .expect(404);
    });
  });
});
