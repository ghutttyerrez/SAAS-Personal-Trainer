import request from "supertest";
import express from "express";
import workoutsRouter from "../../routes/workouts";

// Mock do middleware de autenticação
jest.mock("../../middleware/auth", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, tenantId: 1 };
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

    it("deve testar rota inexistente", async () => {
      const response = await request(app)
        .get("/api/workouts/nonexistent")
        .expect(404);
    });
  });
});
