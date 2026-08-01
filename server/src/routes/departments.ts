import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET all departments
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { requesters: true } }
      }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar setores.' });
  }
});

// POST create department
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do setor é obrigatório.' });

    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Já existe um setor com este nome.' });

    const newDep = await prisma.department.create({
      data: { name, description, status: 'ACTIVE' }
    });
    res.status(201).json(newDep);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar setor.' });
  }
});

// PUT update department
router.put('/:id', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const updated = await prisma.department.update({
      where: { id: req.params.id },
      data: { name, description, status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar setor.' });
  }
});

// DELETE (Soft delete -> Inactivate to preserve data integrity)
router.delete('/:id', async (req, res) => {
  try {
    const inactivated = await prisma.department.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Setor inativado com sucesso para manter a integridade dos dados.', department: inactivated });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inativar setor.' });
  }
});

export default router;
