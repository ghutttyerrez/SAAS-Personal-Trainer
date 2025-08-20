import { ChatRepository } from "../../repositories/chat";

jest.mock("../../config/database", () => ({
  query: jest.fn(),
}));

describe("ChatRepository", () => {
  const db = require("../../config/database");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getOrCreateDirectRoom retorna existente", async () => {
    const row = {
      id: "room-1",
      tenant_id: "tenant-1",
      participants: ["u1", "u2"],
      last_activity: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    db.query.mockResolvedValueOnce({ rows: [row] });

    const room = await ChatRepository.getOrCreateDirectRoom(
      "tenant-1",
      "u1",
      "u2"
    );
    expect(room.id).toBe("room-1");
    expect(db.query).toHaveBeenCalled();
  });

  it("createMessage insere e retorna mensagem mapeada", async () => {
    const msgRow = {
      id: "m1",
      room_id: "room-1",
      sender_id: "u1",
      receiver_id: "u2",
      tenant_id: "tenant-1",
      content: "hi",
      message_type: "text",
      is_read: false,
      read_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    // insert
    db.query.mockResolvedValueOnce({ rows: [msgRow] });
    // update room last activity
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const m = await ChatRepository.createMessage({
      roomId: "room-1",
      senderId: "u1",
      receiverId: "u2",
      tenantId: "tenant-1",
      content: "hi",
    });
    expect(m.id).toBe("m1");
    expect(m.type).toBe("text");
    expect(db.query).toHaveBeenCalledTimes(2);
  });
});
