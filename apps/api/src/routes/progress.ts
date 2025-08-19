import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { ProgressRepository } from "../repositories/progress";
import { validateBody, validateParams } from '../middleware/validation';
import { createProgressSchema, clientIdParamSchema } from '../schemas/validation';

const router = Router();

// Criar novo registro de progresso
router.post("/", authenticateToken, validateBody(createProgressSchema), async (req: any, res) => {
  try {
    const tenantId = req.tenantId!;
    const progressData = req.validatedData;

    const log = await ProgressRepository.create(tenantId, progressData.client_id, progressData);
    res.status(201).json({ success: true, data: log });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao criar registro de progresso",
    });
  }
});

// Listar progresso de um cliente
router.get("/client/:clientId", authenticateToken, validateParams(clientIdParamSchema), async (req: any, res) => {
  try {
    const tenantId = req.tenantId!;
    const { clientId } = req.validatedData.params;

    const logs = await ProgressRepository.findByClient(clientId, tenantId);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao buscar progresso",
    });
  }
});

export default router;
