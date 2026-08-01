import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const suppliersCount = await prisma.supplier.count({ where: { status: 'ACTIVE' } });
    const productsCount = await prisma.product.count();

    const activeBatches = await prisma.batch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        status: 'AVAILABLE'
      },
      include: {
        product: { include: { category: true } }
      }
    });

    const now = new Date();
    let expiredCount = 0;
    let criticalCount = 0; // <= 7 days
    let warningCount = 0; // <= 30 days
    let totalInventoryValue = 0;

    activeBatches.forEach((b) => {
      totalInventoryValue += b.currentQuantity * b.unitPrice;

      const exp = new Date(b.expirationDate);
      const diffMs = exp.getTime() - now.getTime();
      const daysToExpire = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysToExpire < 0) expiredCount++;
      else if (daysToExpire <= 7) criticalCount++;
      else if (daysToExpire <= 30) warningCount++;
    });

    // Losses statistics
    const losses = await prisma.loss.findMany({
      include: { batch: true }
    });
    const totalLossesCount = losses.length;
    const totalLossesValue = losses.reduce((acc, l) => acc + (l.quantity * (l.batch.unitPrice || 0)), 0);

    // Recent Dispatches
    const recentDispatches = await prisma.dispatch.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        batch: { include: { product: true } },
        fractionedLabel: true
      }
    });

    // Recent Purchases
    const recentPurchases = await prisma.purchase.findMany({
      take: 5,
      orderBy: { purchaseDate: 'desc' },
      include: {
        supplier: true,
        _count: { select: { batches: true } }
      }
    });

    res.json({
      metrics: {
        suppliersCount,
        productsCount,
        activeBatchesCount: activeBatches.length,
        totalInventoryValue,
        expiredCount,
        criticalCount,
        warningCount,
        totalLossesCount,
        totalLossesValue
      },
      recentDispatches,
      recentPurchases
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar métricas do dashboard.' });
  }
});

export default router;
