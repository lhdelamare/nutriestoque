import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Get list of purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        batches: {
          include: { product: true }
        }
      },
      orderBy: { purchaseDate: 'desc' }
    });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar compras.' });
  }
});

// Create a new purchase order with stock batch entries (Auto-creating products if missing)
router.post('/', async (req, res) => {
  try {
    const { supplierId, invoiceNumber, purchaseDate, notes, items } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Fornecedor e pelo menos um item são obrigatórios.' });
    }

    // Default category fallback
    let defaultCat = await prisma.category.findFirst();
    if (!defaultCat) {
      defaultCat = await prisma.category.create({
        data: { name: 'Alimentos Gerais', description: 'Categoria geral' }
      });
    }

    let totalAmount = 0;
    const batchDataList = [];

    for (const item of items) {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unitPrice || 0);
      totalAmount += qty * price;

      let targetProductId = item.productId;

      // If no productId but a productName/name is provided, search or create on the fly!
      const productNameInput = item.productName || item.name;
      const barcodeInput = item.barcode;

      if (!targetProductId && (productNameInput || barcodeInput)) {
        // Try searching by barcode first, then by name
        let existingProd = null;
        if (barcodeInput) {
          existingProd = await prisma.product.findUnique({ where: { barcode: barcodeInput } });
        }
        if (!existingProd && productNameInput) {
          existingProd = await prisma.product.findFirst({
            where: { name: { equals: productNameInput.trim() } }
          });
        }

        if (existingProd) {
          targetProductId = existingProd.id;
          if (item.shelfNumber || item.shelfRack) {
            await prisma.product.update({
              where: { id: existingProd.id },
              data: {
                shelfNumber: item.shelfNumber || existingProd.shelfNumber,
                shelfRack: item.shelfRack || existingProd.shelfRack
              }
            });
          }
        } else {
          // Create new product on the fly!
          const newProd = await prisma.product.create({
            data: {
              name: productNameInput?.trim() || `Produto ${barcodeInput}`,
              barcode: barcodeInput || null,
              categoryId: item.categoryId || defaultCat.id,
              defaultUnit: item.defaultUnit || 'UN',
              shelfNumber: item.shelfNumber || null,
              shelfRack: item.shelfRack || null
            }
          });
          targetProductId = newProd.id;
        }
      }

      if (!targetProductId) {
        return res.status(400).json({ error: 'Cada item deve ter um produto selecionado ou um nome informado.' });
      }

      const expDate = new Date(item.expirationDate);
      const mfgDate = item.manufacturingDate ? new Date(item.manufacturingDate) : new Date();

      const diffTime = Math.abs(expDate.getTime() - mfgDate.getTime());
      const shelfLifeDaysTotal = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 30;

      batchDataList.push({
        productId: targetProductId,
        batchNumber: item.batchNumber || `LOTE-${Date.now().toString().slice(-6)}`,
        initialQuantity: qty,
        currentQuantity: qty,
        unitPrice: price,
        manufacturingDate: mfgDate,
        expirationDate: expDate,
        status: 'AVAILABLE',
        shelfLifeDaysTotal
      });
    }

    const newPurchase = await prisma.purchase.create({
      data: {
        supplierId,
        invoiceNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        totalAmount,
        notes,
        status: 'COMPLETED',
        batches: {
          create: batchDataList
        }
      },
      include: {
        supplier: true,
        batches: {
          include: { product: true }
        }
      }
    });

    res.status(201).json(newPurchase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar compra e dar entrada nos lotes.' });
  }
});

export default router;
