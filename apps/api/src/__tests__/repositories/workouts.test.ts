import { WorkoutRepository } from "../../repositories/workouts";

jest.mock("../../config/database", () => ({
  query: jest.fn(),
  transaction: jest.fn((cb: any) => cb({ query: jest.fn() })),
}));

describe("WorkoutRepository", () => {
  const db = require("../../config/database");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create deve inserir treino e exercícios", async () => {
    const client = { query: jest.fn() };
    (db.transaction as jest.Mock).mockImplementation((cb: any) => cb(client));

    const workoutRow = {
      id: "w1",
      tenant_id: "t1",
      client_id: "c1",
      name: "Treino A",
      description: null,
      scheduled_date: null,
      completed_date: null,
      status: "planned",
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    (client.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [workoutRow] }) // insert workout
      .mockResolvedValueOnce({
        rows: [
          {
            exercise_id: "e1",
            sets: 3,
            reps: 10,
            weight: 20,
            duration: null,
            rest_time: 60,
            notes: null,
          },
        ],
      }); // insert exercise

    const created = await WorkoutRepository.create("t1", {
      clientId: "c1",
      name: "Treino A",
      description: undefined,
      scheduledDate: undefined,
      completedDate: undefined,
      status: "planned" as const,
      notes: undefined,
      exercises: [
        {
          exerciseId: "e1",
          sets: 3,
          reps: 10,
          weight: 20,
          duration: undefined,
          restTime: 60,
          notes: undefined,
        },
      ],
    } as any);

    expect(created.id).toBe("w1");
    expect(client.query as jest.Mock).toHaveBeenCalledTimes(2);
  });

  it("findById deve retornar treino mapeado", async () => {
    const workoutRow = {
      id: "w1",
      tenant_id: "t1",
      client_id: "c1",
      name: "Treino A",
      description: null,
      scheduled_date: null,
      completed_date: null,
      status: "planned",
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const exerciseRow = {
      exercise_id: "e1",
      sets: 3,
      reps: 10,
      weight: 20,
      duration: null,
      rest_time: 60,
      notes: null,
    };

    db.query
      .mockResolvedValueOnce({ rows: [workoutRow] })
      .mockResolvedValueOnce({ rows: [exerciseRow] });

    const result = await WorkoutRepository.findById("w1", "t1");
    expect(result?.id).toBe("w1");
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it("delete deve retornar true quando apagar", async () => {
    db.query.mockResolvedValue({ rowCount: 1 });
    const ok = await WorkoutRepository.delete("w1", "t1");
    expect(ok).toBe(true);
  });
});
