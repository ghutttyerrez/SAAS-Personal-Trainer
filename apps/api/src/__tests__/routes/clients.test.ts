import request from "supertest";
import express from "express";
import clientsRouter from "../../routes/clients";

// Mock do middleware de autenticação
jest.mock("../../middleware/auth", () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: "user-1111-2222-3333-444444444444" };
    req.tenantId = "tenant-aaaa-bbbb-cccc-111111111111";
    next();
  },
}));

// Mock do ClientsRepository
jest.mock("../../repositories/clients", () => ({
  ClientsRepository: {
    list: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivateClient: jest.fn(),
    createUserAndClient: jest.fn(),
  },
}));

describe("Clients Routes", () => {
  let app: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/clients", clientsRouter);
  });

  it("GET /clients deve listar clientes com paginação", async () => {
    const { ClientsRepository } = require("../../repositories/clients");
    ClientsRepository.list.mockResolvedValue({
      rows: [{ id: "c1" }],
      total: 1,
      page: 1,
      limit: 10,
    });

    const res = await request(app).get("/clients?page=1&limit=10").expect(200);
    expect(res.body).toEqual({
      success: true,
      rows: [{ id: "c1" }],
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(ClientsRepository.list).toHaveBeenCalledWith(
      "tenant-aaaa-bbbb-cccc-111111111111",
      1,
      10
    );
  });

  it("GET /clients/:id deve retornar 404 quando não encontrado", async () => {
    const { ClientsRepository } = require("../../repositories/clients");
    ClientsRepository.findById.mockResolvedValue(null);
    const res = await request(app)
      .get("/clients/550e8400-e29b-41d4-a716-446655440001")
      .expect(404);
    expect(res.body).toEqual({
      success: false,
      message: "Cliente não encontrado",
    });
  });

  it("GET /clients/:id deve retornar cliente quando encontrado", async () => {
    const { ClientsRepository } = require("../../repositories/clients");
    ClientsRepository.findById.mockResolvedValue({ id: "c1" });
    const res = await request(app)
      .get("/clients/550e8400-e29b-41d4-a716-446655440002")
      .expect(200);
    expect(res.body).toEqual({ success: true, data: { id: "c1" } });
  });

  it("POST /clients deve validar body e criar cliente", async () => {
    const { ClientsRepository } = require("../../repositories/clients");
    ClientsRepository.create.mockResolvedValue({ id: "c2", user_id: "u1" });

    const payload = {
      userId: "550e8400-e29b-41d4-a716-446655440010",
      gender: "male",
      height: 180,
    };
    const res = await request(app).post("/clients").send(payload).expect(201);
    expect(res.body).toEqual({
      success: true,
      data: { id: "c2", user_id: "u1" },
    });
    expect(ClientsRepository.create).toHaveBeenCalledWith(
      "tenant-aaaa-bbbb-cccc-111111111111",
      payload.userId,
      { gender: "male", height: 180 }
    );
  });

  it("PUT /clients/:id deve atualizar cliente e retornar 404 quando não encontrado", async () => {
    const { ClientsRepository } = require("../../repositories/clients");
    ClientsRepository.update.mockResolvedValue(null);
    const res404 = await request(app)
      .put("/clients/550e8400-e29b-41d4-a716-446655440020")
      .send({ weight: 80 })
      .expect(404);
    expect(res404.body).toEqual({
      success: false,
      message: "Cliente não encontrado",
    });

    ClientsRepository.update.mockResolvedValue({ id: "c3", weight: 80 });
    const res200 = await request(app)
      .put("/clients/550e8400-e29b-41d4-a716-446655440021")
      .send({ weight: 80 })
      .expect(200);
    expect(res200.body).toEqual({
      success: true,
      data: { id: "c3", weight: 80 },
    });
  });

  it("PATCH /clients/:id/deactivate deve desativar cliente", async () => {
    const { ClientsRepository } = require("../../repositories/clients");
    ClientsRepository.deactivateClient.mockResolvedValue(true);
    const res = await request(app)
      .patch("/clients/550e8400-e29b-41d4-a716-446655440030/deactivate")
      .expect(200);
    expect(res.body).toEqual({
      success: true,
      message: "Cliente desativado com sucesso",
    });
  });

  it("PATCH /clients/:id/deactivate deve retornar 404 quando não encontrado", async () => {
    const { ClientsRepository } = require("../../repositories/clients");
    ClientsRepository.deactivateClient.mockResolvedValue(false);
    const res = await request(app)
      .patch("/clients/550e8400-e29b-41d4-a716-446655440031/deactivate")
      .expect(404);
    expect(res.body).toEqual({
      success: false,
      message: "Cliente não encontrado ou já inativo",
    });
  });

  it("POST /clients/full deve criar usuário e cliente em transação", async () => {
    const { ClientsRepository } = require("../../repositories/clients");
    ClientsRepository.createUserAndClient.mockResolvedValue({
      user: { id: "u2", email: "x@y.com" },
      client: { id: "c4" },
    });
    const payload = {
      user: {
        email: "x@y.com",
        passwordHash: "hashed-password-1234567890",
        firstName: "X",
        lastName: "Y",
      },
      profile: { gender: "female" },
    };
    const res = await request(app)
      .post("/clients/full")
      .send(payload)
      .expect(201);
    expect(res.body).toEqual({
      success: true,
      data: { user: { id: "u2", email: "x@y.com" }, client: { id: "c4" } },
    });
    expect(ClientsRepository.createUserAndClient).toHaveBeenCalled();
  });
});
