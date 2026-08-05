import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Get single product by barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { barcode: req.params.barcode },
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado para este código de barras.' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto por código de barras.' });
  }
});

// Get all products with current calculated stock
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        batches: {
          where: {
            currentQuantity: { gt: 0 },
            status: { in: ['AVAILABLE'] }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = products.map((prod) => {
      const currentStock = prod.batches.reduce((acc, b) => acc + b.currentQuantity, 0);
      return {
        ...prod,
        currentStock,
        isLowStock: currentStock <= prod.minStockAlert,
        activeBatchesCount: prod.batches.length
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, barcode, categoryId, defaultUnit, minStockAlert, storageInstructions, shelfNumber, shelfRack } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome do produto é obrigatório.' });
    }

    let catId = categoryId;
    if (!catId) {
      const defaultCategory = await prisma.category.findFirst();
      catId = defaultCategory?.id;
    }

    const product = await prisma.product.create({
      data: {
        name,
        barcode: barcode || null,
        categoryId: catId,
        defaultUnit: defaultUnit || 'UN',
        minStockAlert: minStockAlert ? parseFloat(minStockAlert) : 5,
        storageInstructions,
        shelfNumber: shelfNumber ? String(shelfNumber).trim() : null,
        shelfRack: shelfRack ? String(shelfRack).trim() : null
      },
      include: { category: true }
    });

    res.status(201).json(product);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe um produto com este código de barras.' });
    }
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, barcode, categoryId, defaultUnit, minStockAlert, storageInstructions, shelfNumber, shelfRack } = req.body;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        barcode: barcode || null,
        categoryId,
        defaultUnit,
        minStockAlert: minStockAlert ? parseFloat(minStockAlert) : undefined,
        storageInstructions,
        shelfNumber: shelfNumber ? String(shelfNumber).trim() : null,
        shelfRack: shelfRack ? String(shelfRack).trim() : null
      },
      include: { category: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

export default router;
