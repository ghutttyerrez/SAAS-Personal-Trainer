import { Router } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { WorkoutRepository } from "../repositories/workouts";
import {
  validateBody,
  validateParams,
  ValidatedRequest,
} from "../middleware/validation";
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  idParamSchema,
  clientIdParamSchema,
} from "../schemas/validation";

const router = Router();

// Criar novo treino
router.post(
  "/",
  authenticateToken,
  validateBody(createWorkoutSchema),
  async (req: any, res) => {
    try {
      const tenantId = req.tenantId!;
      const workoutData = req.validatedData;

      if (!workoutData.clientId || !workoutData.name) {
        return res.status(400).json({
          success: false,
          message: "clientId e name são obrigatórios",
        });
      }

      const workout = await WorkoutRepository.create(tenantId, workoutData);
      res.status(201).json({ success: true, data: workout });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Erro ao criar treino",
      });
    }
  }
);

// Listar treinos de um cliente
router.get(
  "/client/:clientId",
  authenticateToken,
  validateParams(clientIdParamSchema),
  async (req: any, res) => {
    try {
      const tenantId = req.tenantId!;
      const { clientId } = req.validatedData.params;

      const workouts = await WorkoutRepository.findByClient(clientId, tenantId);
      res.json({ success: true, data: workouts });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Erro ao listar treinos",
      });
    }
  }
);

// Buscar treino por ID
router.get(
  "/:id",
  authenticateToken,
  validateParams(idParamSchema),
  async (req: any, res) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.validatedData.params;

      const workout = await WorkoutRepository.findById(id, tenantId);
      if (!workout) {
        return res.status(404).json({
          success: false,
          message: "Treino não encontrado",
        });
      }

      res.json({ success: true, data: workout });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Erro ao buscar treino",
      });
    }
  }
);

// Deletar treino
router.delete(
  "/:id",
  authenticateToken,
  validateParams(idParamSchema),
  async (req: any, res) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.validatedData.params;

      const deleted = await WorkoutRepository.delete(id, tenantId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Treino não encontrado",
        });
      }

      res.json({ success: true, message: "Treino deletado com sucesso" });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Erro ao deletar treino",
      });
    }
  }
);

export default router;
