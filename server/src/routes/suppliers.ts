import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// List all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchases: true }
        }
      }
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedores.' });
  }
});

// Get single supplier with purchases
router.get('/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        purchases: {
          include: {
            batches: {
              include: { product: true }
            }
          },
          orderBy: { purchaseDate: 'desc' }
        }
      }
    });
    if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado.' });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes do fornecedor.' });
  }
});

// Create supplier
router.post('/', async (req, res) => {
  try {
    const { name, tradeName, cnpj, phone, email, address, city, state, contactPerson, notes, status } = req.body;
    
    if (!name || !cnpj) {
      return res.status(400).json({ error: 'Razão Social e CNPJ são obrigatórios.' });
    }

    const existing = await prisma.supplier.findUnique({ where: { cnpj } });
    if (existing) {
      return res.status(400).json({ error: 'Já existe um fornecedor cadastrado com este CNPJ.' });
    }

    const newSupplier = await prisma.supplier.create({
      data: {
        name,
        tradeName,
        cnpj,
        phone,
        email,
        address,
        city,
        state,
        contactPerson,
        notes,
        status: status || 'ACTIVE'
      }
    });

    res.status(201).json(newSupplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar fornecedor.' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, tradeName, cnpj, phone, email, address, city, state, contactPerson, notes, status } = req.body;

    const updated = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        name,
        tradeName,
        cnpj,
        phone,
        email,
        address,
        city,
        state,
        contactPerson,
        notes,
        status
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar fornecedor.' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    await prisma.supplier.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Fornecedor removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover fornecedor. Verifique se existem compras vinculadas.' });
  }
});

export default router;
