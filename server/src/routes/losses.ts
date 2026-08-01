import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET all registered losses
router.get('/', async (req, res) => {
  try {
    const losses = await prisma.loss.findMany({
      include: {
        batch: {
          include: {
            product: { include: { category: true } },
            purchase: { include: { supplier: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(losses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar histórico de perdas.' });
  }
});

// POST record a new food loss/discard
router.post('/', async (req, res) => {
  try {
    const { batchId, quantity, reason, reportedBy, notes } = req.body;

    if (!batchId || !quantity || !reason || !reportedBy) {
      return res.status(400).json({ error: 'Lote, quantidade, motivo e responsável são obrigatórios.' });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { product: true }
    });

    if (!batch) {
      return res.status(404).json({ error: 'Lote não encontrado.' });
    }

    const lossQty = parseFloat(quantity);
    if (lossQty > batch.currentQuantity) {
      return res.status(400).json({
        error: `Quantidade informada (${lossQty}) excede o saldo atual do lote (${batch.currentQuantity}).`
      });
    }

    const remaining = batch.currentQuantity - lossQty;
    const newStatus = remaining === 0 ? 'DISCARDED' : 'AVAILABLE';

    // Update batch stock
    await prisma.batch.update({
      where: { id: batchId },
      data: {
        currentQuantity: remaining,
        status: newStatus
      }
    });

    // Create Loss entry
    const newLoss = await prisma.loss.create({
      data: {
        batchId,
        quantity: lossQty,
        reason,
        reportedBy,
        notes
      },
      include: {
        batch: {
          include: { product: true }
        }
      }
    });

    res.status(201).json(newLoss);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar perda/descarte.' });
  }
});

export default router;
