import request from "supertest";
import express from "express";
import chatRouter from "../../routes/chat";

// Mock do middleware de autenticação para popular req.user e req.tenantId
jest.mock("../../middleware/auth", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: "user-1111-2222-3333-444444444444" };
    req.tenantId = "tenant-aaaa-bbbb-cccc-111111111111";
    next();
  },
}));

// Mock do ChatRepository
jest.mock("../../repositories/chat", () => ({
  ChatRepository: {
    listRoomsForUser: jest.fn(),
    getOrCreateDirectRoom: jest.fn(),
    listMessages: jest.fn(),
    createMessage: jest.fn(),
    markAsRead: jest.fn(),
    getUnreadCountByRoom: jest.fn(),
  },
}));

describe("Chat Routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/chat", chatRouter);
  });

  it("GET /chat/rooms deve listar salas do usuário", async () => {
    const { ChatRepository } = require("../../repositories/chat");
    ChatRepository.listRoomsForUser.mockResolvedValue([
      { id: "room-1", name: "Room 1" },
    ]);

    const res = await request(app).get("/chat/rooms").expect(200);
    expect(res.body).toEqual({
      success: true,
      data: [{ id: "room-1", name: "Room 1" }],
    });
    expect(ChatRepository.listRoomsForUser).toHaveBeenCalledWith(
      "tenant-aaaa-bbbb-cccc-111111111111",
      "user-1111-2222-3333-444444444444"
    );
  });

  it("POST /chat/rooms/direct deve validar otherUserId obrigatório", async () => {
    const res = await request(app)
      .post("/chat/rooms/direct")
      .send({})
      .expect(400);
    expect(res.body).toEqual({
      success: false,
      message: "otherUserId é obrigatório",
    });
  });

  it("POST /chat/rooms/direct deve criar/obter sala direta", async () => {
    const { ChatRepository } = require("../../repositories/chat");
    ChatRepository.getOrCreateDirectRoom.mockResolvedValue({ id: "room-xyz" });

    const res = await request(app)
      .post("/chat/rooms/direct")
      .send({ otherUserId: "user-9999-8888-7777-666666666666" })
      .expect(200);
    expect(res.body).toEqual({ success: true, data: { id: "room-xyz" } });
    expect(ChatRepository.getOrCreateDirectRoom).toHaveBeenCalledWith(
      "tenant-aaaa-bbbb-cccc-111111111111",
      "user-1111-2222-3333-444444444444",
      "user-9999-8888-7777-666666666666"
    );
  });

  it("GET /chat/rooms/:roomId/messages deve listar mensagens com paginação padrão", async () => {
    const { ChatRepository } = require("../../repositories/chat");
    ChatRepository.listMessages.mockResolvedValue({
      messages: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    const res = await request(app)
      .get("/chat/rooms/00000000-0000-0000-0000-000000000001/messages")
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(ChatRepository.listMessages).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      1,
      20
    );
  });

  it("POST /chat/rooms/:roomId/messages deve validar campos obrigatórios", async () => {
    const res = await request(app)
      .post("/chat/rooms/00000000-0000-0000-0000-000000000002/messages")
      .send({})
      .expect(400);
    expect(res.body).toEqual({
      success: false,
      message: "receiverId e content são obrigatórios",
    });
  });

  it("POST /chat/rooms/:roomId/messages deve criar mensagem com sucesso", async () => {
    const { ChatRepository } = require("../../repositories/chat");
    ChatRepository.createMessage.mockResolvedValue({
      id: "msg-1",
      content: "hello",
    });

    const res = await request(app)
      .post("/chat/rooms/00000000-0000-0000-0000-000000000003/messages")
      .send({ receiverId: "user-2", content: "hello", type: "text" })
      .expect(201);
    expect(res.body).toEqual({
      success: true,
      data: { id: "msg-1", content: "hello" },
    });
    expect(ChatRepository.createMessage).toHaveBeenCalled();
  });

  it("POST /chat/rooms/:roomId/read deve marcar mensagens como lidas", async () => {
    const { ChatRepository } = require("../../repositories/chat");
    ChatRepository.markAsRead.mockResolvedValue({ updated: 3 });

    const res = await request(app)
      .post("/chat/rooms/00000000-0000-0000-0000-000000000004/read")
      .send({ fromSenderId: "user-2" })
      .expect(200);
    expect(res.body).toEqual({ success: true, data: { updated: 3 } });
    expect(ChatRepository.markAsRead).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000004",
      "user-1111-2222-3333-444444444444",
      { messageId: undefined, fromSenderId: "user-2" }
    );
  });

  it("GET /chat/unread deve retornar mapa de não lidas por sala", async () => {
    const { ChatRepository } = require("../../repositories/chat");
    ChatRepository.getUnreadCountByRoom.mockResolvedValue({ "room-1": 2 });

    const res = await request(app).get("/chat/unread").expect(200);
    expect(res.body).toEqual({ success: true, data: { "room-1": 2 } });
    expect(ChatRepository.getUnreadCountByRoom).toHaveBeenCalledWith(
      "tenant-aaaa-bbbb-cccc-111111111111",
      "user-1111-2222-3333-444444444444"
    );
  });
});
