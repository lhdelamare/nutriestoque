import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET all active batches sorted by FEFO (expiration date ascending)
router.get('/', async (req, res) => {
  try {
    const { productId, status } = req.query;

    const whereClause: any = {};
    if (productId) whereClause.productId = String(productId);
    if (status) {
      whereClause.status = String(status);
    } else {
      whereClause.status = { in: ['AVAILABLE'] };
      whereClause.currentQuantity = { gt: 0 };
    }

    const batches = await prisma.batch.findMany({
      where: whereClause,
      include: {
        product: {
          include: { category: true }
        },
        purchase: {
          include: { supplier: true }
        }
      },
      orderBy: { expirationDate: 'asc' } // FEFO principle
    });

    const now = new Date();
    const enriched = batches.map((b) => {
      const exp = new Date(b.expirationDate);
      const diffMs = exp.getTime() - now.getTime();
      const daysToExpire = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      let urgency: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK' = 'OK';
      if (daysToExpire < 0) urgency = 'EXPIRED';
      else if (daysToExpire <= 7) urgency = 'CRITICAL';
      else if (daysToExpire <= 30) urgency = 'WARNING';

      return {
        ...b,
        daysToExpire,
        urgency
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lotes de estoque.' });
  }
});

// FEFO search endpoint specifically for Requisition screen (e.g. searching "Leite")
router.get('/fefo', async (req, res) => {
  try {
    const { query } = req.query;
    const searchTerm = query ? String(query).trim() : '';

    const products = await prisma.product.findMany({
      where: searchTerm ? {
        OR: [
          { name: { contains: searchTerm } },
          { category: { name: { contains: searchTerm } } }
        ]
      } : undefined,
      include: {
        category: true,
        batches: {
          where: {
            currentQuantity: { gt: 0 },
            status: 'AVAILABLE'
          },
          orderBy: { expirationDate: 'asc' }, // FEFO Priority!
          include: {
            purchase: { include: { supplier: true } }
          }
        }
      }
    });

    const now = new Date();

    // Map and decorate products with FEFO priority
    const result = products.map((prod) => {
      const totalStock = prod.batches.reduce((sum, b) => sum + b.currentQuantity, 0);

      const batchesDecorated = prod.batches.map((b, index) => {
        const exp = new Date(b.expirationDate);
        const diffMs = exp.getTime() - now.getTime();
        const daysToExpire = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let urgency: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK' = 'OK';
        if (daysToExpire < 0) urgency = 'EXPIRED';
        else if (daysToExpire <= 7) urgency = 'CRITICAL';
        else if (daysToExpire <= 30) urgency = 'WARNING';

        return {
          ...b,
          daysToExpire,
          urgency,
          isFefoRecommended: index === 0 // First batch in list is earliest expiring!
        };
      });

      return {
        ...prod,
        totalStock,
        batches: batchesDecorated
      };
    }).filter((prod) => prod.totalStock > 0 && prod.batches.length > 0);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro na busca FEFO de produtos.' });
  }
});

// GET Expiration alerts overview
router.get('/expiring-alerts', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        status: 'AVAILABLE'
      },
      include: {
        product: { include: { category: true } },
        purchase: { include: { supplier: true } }
      },
      orderBy: { expirationDate: 'asc' }
    });

    const now = new Date();
    const expired: any[] = [];
    const critical: any[] = [];
    const warning: any[] = [];

    batches.forEach((b) => {
      const exp = new Date(b.expirationDate);
      const diffMs = exp.getTime() - now.getTime();
      const daysToExpire = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const item = { ...b, daysToExpire };

      if (daysToExpire < 0) {
        expired.push(item);
      } else if (daysToExpire <= 7) {
        critical.push(item);
      } else if (daysToExpire <= 30) {
        warning.push(item);
      }
    });

    res.json({
      expired,
      critical,
      warning,
      totalAlerts: expired.length + critical.length + warning.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar alertas de vencimento.' });
  }
});

export default router;
