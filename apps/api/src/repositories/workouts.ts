import { transaction, query } from "../config/database";
import { Workout, WorkoutExercise } from "@personal-trainer/shared-types";
import { v4 as uuidv4 } from "uuid";

export class WorkoutRepository {
  static async create(
    tenantId: string,
    workoutData: Omit<Workout, "id" | "createdAt" | "updatedAt" | "tenantId">
  ): Promise<Workout> {
    return await transaction(async (client) => {
      const workoutId = uuidv4();
      const {
        clientId,
        name,
        description,
        scheduledDate,
        status,
        notes,
        exercises,
      } = workoutData;

      const workoutRes = await client.query(
        `INSERT INTO workouts (id, tenant_id, client_id, name, description, scheduled_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          workoutId,
          tenantId,
          clientId,
          name,
          description,
          scheduledDate,
          status,
          notes,
        ]
      );
      const createdWorkout = workoutRes.rows[0];

      const createdExercises: WorkoutExercise[] = [];
      if (exercises && exercises.length > 0) {
        for (const [index, exercise] of exercises.entries()) {
          const exerciseRes = await client.query(
            `INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, sets, reps, weight, duration, rest_time, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
              uuidv4(),
              workoutId,
              exercise.exerciseId,
              index,
              exercise.sets,
              exercise.reps,
              exercise.weight,
              exercise.duration,
              exercise.restTime,
              exercise.notes,
            ]
          );
          createdExercises.push({
            exerciseId: exerciseRes.rows[0].exercise_id,
            sets: exerciseRes.rows[0].sets,
            reps: exerciseRes.rows[0].reps,
            weight: exerciseRes.rows[0].weight,
            duration: exerciseRes.rows[0].duration,
            restTime: exerciseRes.rows[0].rest_time,
            notes: exerciseRes.rows[0].notes,
          });
        }
      }

      return {
        id: createdWorkout.id,
        tenantId: createdWorkout.tenant_id,
        clientId: createdWorkout.client_id,
        name: createdWorkout.name,
        description: createdWorkout.description,
        scheduledDate: createdWorkout.scheduled_date,
        completedDate: createdWorkout.completed_date,
        status: createdWorkout.status,
        notes: createdWorkout.notes,
        exercises: createdExercises,
        createdAt: createdWorkout.created_at,
        updatedAt: createdWorkout.updated_at,
      };
    });
  }

  static async findById(
    workoutId: string,
    tenantId: string
  ): Promise<Workout | null> {
    const workoutRes = await query(
      "SELECT * FROM workouts WHERE id = $1 AND tenant_id = $2",
      [workoutId, tenantId]
    );
    if (workoutRes.rows.length === 0) return null;
    const workout = workoutRes.rows[0];

    const exercisesRes = await query(
      "SELECT * FROM workout_exercises WHERE workout_id = $1 ORDER BY order_index ASC",
      [workoutId]
    );

    return {
      id: workout.id,
      tenantId: workout.tenant_id,
      clientId: workout.client_id,
      name: workout.name,
      description: workout.description,
      scheduledDate: workout.scheduled_date,
      completedDate: workout.completed_date,
      status: workout.status,
      notes: workout.notes,
      exercises: exercisesRes.rows.map((e: any) => ({
        exerciseId: e.exercise_id,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        duration: e.duration,
        restTime: e.rest_time,
        notes: e.notes,
      })),
      createdAt: workout.created_at,
      updatedAt: workout.updated_at,
    };
  }

  static async findByClient(
    clientId: string,
    tenantId: string
  ): Promise<Workout[]> {
    const workoutsRes = await query(
      "SELECT id FROM workouts WHERE client_id = $1 AND tenant_id = $2 ORDER BY scheduled_date DESC",
      [clientId, tenantId]
    );

    const workouts: Workout[] = [];
    for (const row of workoutsRes.rows) {
      const workout = await this.findById(row.id, tenantId);
      if (workout) {
        workouts.push(workout);
      }
    }
    return workouts;
  }

  static async delete(workoutId: string, tenantId: string): Promise<boolean> {
    const result = await query(
      "DELETE FROM workouts WHERE id = $1 AND tenant_id = $2",
      [workoutId, tenantId]
    );
    return result.rowCount > 0;
  }
}
