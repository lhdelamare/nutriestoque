import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET list of dispatches (baixas)
router.get('/', async (req, res) => {
  try {
    const dispatches = await prisma.dispatch.findMany({
      include: {
        batch: {
          include: { product: true }
        },
        fractionedLabel: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(dispatches);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar baixas de produtos.' });
  }
});

// POST process a new product dispatch (Baixa Total ou Fracionada)
router.post('/', async (req, res) => {
  try {
    const {
      batchId,
      quantity,
      requestedBy,
      department,
      type, // 'TOTAL' | 'FRACIONADO'
      reason,
      customFractionDays, // Opção de sobrescrever a regra de 1/3 se quiser
      responsiblePerson // Quem retirou/fracionou
    } = req.body;

    if (!batchId || !quantity || !requestedBy) {
      return res.status(400).json({ error: 'Lote, Quantidade e Solicitante são obrigatórios.' });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { product: true }
    });

    if (!batch) {
      return res.status(404).json({ error: 'Lote não encontrado.' });
    }

    const qtyToDeduct = parseFloat(quantity);

    if (qtyToDeduct > batch.currentQuantity) {
      return res.status(400).json({
        error: `Quantidade solicitada (${qtyToDeduct}) é maior que a disponível no lote (${batch.currentQuantity}).`
      });
    }

    const remainingQty = batch.currentQuantity - qtyToDeduct;
    const newStatus = remainingQty === 0 ? 'DEPLETED' : 'AVAILABLE';

    // Update batch stock
    await prisma.batch.update({
      where: { id: batchId },
      data: {
        currentQuantity: remainingQty,
        status: newStatus,
        isFractioned: type === 'FRACIONADO' ? true : batch.isFractioned,
        fractionedAt: type === 'FRACIONADO' ? new Date() : batch.fractionedAt
      }
    });

    // Create Dispatch Record
    const dispatch = await prisma.dispatch.create({
      data: {
        batchId,
        quantity: qtyToDeduct,
        unit: batch.product.defaultUnit,
        requestedBy,
        department: department || 'Geral',
        type: type || 'TOTAL',
        reason
      }
    });

    let fractionedLabel = null;

    // If FRACIONADO, generate fractioned label and new calculated expiration date (1/3 default rule)
    if (type === 'FRACIONADO') {
      const openDate = new Date();
      
      // Calculate total shelf life in days
      let totalShelfLifeDays = batch.shelfLifeDaysTotal;
      if (!totalShelfLifeDays && batch.manufacturingDate) {
        const diffMs = batch.expirationDate.getTime() - batch.manufacturingDate.getTime();
        totalShelfLifeDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
      if (!totalShelfLifeDays || totalShelfLifeDays <= 0) {
        totalShelfLifeDays = 30; // fallback 30 dias se não informado
      }

      // Rule: 1/3 of total shelf life from open date
      const fractionDays = customFractionDays 
        ? parseInt(customFractionDays)
        : Math.max(1, Math.round(totalShelfLifeDays / 3));

      // New expiration date = openDate + 1/3 shelf life days
      let calculatedExp = new Date(openDate.getTime() + fractionDays * 24 * 60 * 60 * 1000);

      // New expiry date should not exceed original expiration date
      if (calculatedExp > new Date(batch.expirationDate)) {
        calculatedExp = new Date(batch.expirationDate);
      }

      const labelCode = `ETQ-${Math.floor(100000 + Math.random() * 900000)}`;

      fractionedLabel = await prisma.fractionedLabel.create({
        data: {
          dispatchId: dispatch.id,
          batchId: batch.id,
          openDate,
          newExpirationDate: calculatedExp,
          fractionedQuantity: qtyToDeduct,
          remainingQuantity: remainingQty,
          labelCode,
          printedBy: responsiblePerson || requestedBy
        }
      });
    }

    const fullDispatch = await prisma.dispatch.findUnique({
      where: { id: dispatch.id },
      include: {
        batch: {
          include: { product: true }
        },
        fractionedLabel: true
      }
    });

    res.status(201).json(fullDispatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar baixa de produto.' });
  }
});

export default router;
