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

    if (!batchId || !quantity || !requestedBy || !responsiblePerson) {
      return res.status(400).json({ error: 'Lote, Quantidade, Solicitante e Responsável são obrigatórios.' });
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
        reason,
        returnStatus: 'PENDING'
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

// GET pending returns (optional query requestedBy)
router.get('/pending-returns', async (req, res) => {
  try {
    const { requestedBy } = req.query;
    const term = requestedBy ? String(requestedBy).trim() : '';

    const whereClause: any = {
      returnStatus: { in: ['PENDING', 'PARTIAL_RETURN'] }
    };

    if (term) {
      whereClause.requestedBy = { contains: term };
    }

    const dispatches = await prisma.dispatch.findMany({
      where: whereClause,
      include: {
        batch: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(dispatches);
  } catch (error) {
    console.error('Erro ao buscar pendências:', error);
    res.status(500).json({ error: 'Erro ao buscar retiradas pendentes de devolução.' });
  }
});

// POST process return or mark as used
router.post('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, quantityToReturn } = req.body; // action: 'USED' | 'RETURN'

    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
      include: { batch: true }
    });

    if (!dispatch) {
      return res.status(404).json({ error: 'Registro de retirada não encontrado.' });
    }

    if (action === 'USED') {
      const updated = await prisma.dispatch.update({
        where: { id },
        data: { returnStatus: 'USED' }
      });
      return res.json(updated);
    }

    if (action === 'RETURN') {
      const qtyToReturn = parseFloat(quantityToReturn);
      if (isNaN(qtyToReturn) || qtyToReturn <= 0) {
        return res.status(400).json({ error: 'Quantidade a devolver inválida.' });
      }

      const pendingQty = dispatch.quantity - dispatch.returnedQuantity;
      if (qtyToReturn > pendingQty) {
        return res.status(400).json({ error: `Quantidade (${qtyToReturn}) é maior que a pendência (${pendingQty}).` });
      }

      const newReturnedQty = dispatch.returnedQuantity + qtyToReturn;
      const isFullyReturned = newReturnedQty >= dispatch.quantity;
      const newStatus = isFullyReturned ? 'RETURNED' : 'PARTIAL_RETURN';

      // Update dispatch
      const updatedDispatch = await prisma.dispatch.update({
        where: { id },
        data: {
          returnedQuantity: newReturnedQty,
          returnStatus: newStatus
        }
      });

      // Restore quantity to Batch stock
      await prisma.batch.update({
        where: { id: dispatch.batchId },
        data: {
          currentQuantity: dispatch.batch.currentQuantity + qtyToReturn,
          status: 'AVAILABLE'
        }
      });

      return res.json(updatedDispatch);
    }

    res.status(400).json({ error: 'Ação de devolução inválida.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar devolução.' });
  }
});

// POST acknowledge all unread dispatches for Admin alert
router.post('/acknowledge-all', async (req, res) => {
  try {
    await prisma.dispatch.updateMany({
      where: { acknowledged: false },
      data: { acknowledged: true }
    });
    res.json({ message: 'Todos os alertas de retirada foram marcados como vistos.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar alertas.' });
  }
});

export default router;
