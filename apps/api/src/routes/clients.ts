import { Router, Request, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { ClientsRepository } from "../repositories/clients";

const router = Router();

// Desativar cliente (soft delete)
router.patch(
  "/:id/deactivate",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const clientId = req.params.id;
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res
        .status(401)
        .json({ success: false, message: "Tenant não autenticado" });
    }
    try {
      const ok = await ClientsRepository.deactivateClient(clientId, tenantId);
      if (!ok) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Cliente não encontrado ou já inativo",
          });
      }
      res.json({ success: true, message: "Cliente desativado com sucesso" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao desativar cliente", error });
    }
  }
);

export default router;
