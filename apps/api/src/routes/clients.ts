import { Router, Request, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { ClientsRepository } from "../repositories/clients";
import {
  validateBody,
  validateParams,
  ValidatedRequest,
  validateQuery,
} from "../middleware/validation";
import {
  createClientBodySchema,
  updateClientBodySchema,
  idParamSchema,
  paginationQuerySchema,
} from "../schemas/validation";

const router = Router();

// Listar clientes com paginação
router.get(
  "/",
  authenticateToken,
  validateQuery(paginationQuerySchema),
  async (req: any, res: Response) => {
    const tenantId = req.tenantId;
    const { page, limit } = req.validatedData.query;
    try {
      const result = await ClientsRepository.list(tenantId, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao listar clientes" });
    }
  }
);

// Obter cliente por ID
router.get(
  "/:id",
  authenticateToken,
  validateParams(idParamSchema),
  async (req: any, res: Response) => {
    const { id } = req.validatedData.params;
    const tenantId = req.tenantId;
    try {
      const client = await ClientsRepository.findById(id, tenantId);
      if (!client)
        return res
          .status(404)
          .json({ success: false, message: "Cliente não encontrado" });
      res.json({ success: true, data: client });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar cliente" });
    }
  }
);

// Criar cliente
router.post(
  "/",
  authenticateToken,
  validateBody(createClientBodySchema),
  async (req: any, res: Response) => {
    const tenantId = req.tenantId;
    const raw = { ...req.validatedData };
    delete (raw as any).params;
    delete (raw as any).query;
    const { userId, ...profile } = raw;
    try {
      const client = await ClientsRepository.create(tenantId, userId, profile);
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao criar cliente" });
    }
  }
);

// Transacional: criar usuário + cliente
router.post(
  "/full",
  authenticateToken,
  validateBody(
    // Inline schema para evitar duplicação
    // Espera { user: { email, passwordHash, firstName, lastName, role? }, profile: {...campos de client} }
    // passwordHash esperado já hashed pelo painel admin
    require("zod").z.object({
      user: require("zod").z.object({
        email: require("zod").z.string().email(),
        passwordHash: require("zod").z.string().min(10),
        firstName: require("zod").z.string().min(1),
        lastName: require("zod").z.string().min(1),
        role: require("zod").z.enum(["client", "trainer", "admin"]).optional(),
      }),
      profile: updateClientBodySchema,
    })
  ),
  async (req: any, res: Response) => {
    const tenantId = req.tenantId;
    const { user, profile } = req.validatedData;
    try {
      const result = await ClientsRepository.createUserAndClient(
        tenantId,
        user,
        profile
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao criar usuário e cliente" });
    }
  }
);

// Atualizar cliente
router.put(
  "/:id",
  authenticateToken,
  validateParams(idParamSchema),
  validateBody(updateClientBodySchema),
  async (req: any, res: Response) => {
    const { id } = req.validatedData.params;
    const tenantId = req.tenantId;
    try {
      const body = { ...req.validatedData };
      // Remover dados que não pertencem ao corpo
      delete (body as any).params;
      delete (body as any).query;
      const updated = await ClientsRepository.update(id, tenantId, body);
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Cliente não encontrado" });
      res.json({ success: true, data: updated });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar cliente" });
    }
  }
);

// Desativar cliente (soft delete)
router.patch(
  "/:id/deactivate",
  authenticateToken,
  validateParams(idParamSchema),
  async (req: any, res: Response) => {
    const { id: clientId } = req.validatedData.params;
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res
        .status(401)
        .json({ success: false, message: "Tenant não autenticado" });
    }
    try {
      const ok = await ClientsRepository.deactivateClient(clientId, tenantId);
      if (!ok) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado ou já inativo",
        });
      }
      res.json({ success: true, message: "Cliente desativado com sucesso" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao desativar cliente" });
    }
  }
);

export default router;
