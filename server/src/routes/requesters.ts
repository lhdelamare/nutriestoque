import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET all requesters (Professores / Colaboradores)
router.get('/', async (req, res) => {
  try {
    const requesters = await prisma.requester.findMany({
      orderBy: { name: 'asc' },
      include: { department: true }
    });
    res.json(requesters);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar professores e colaboradores.' });
  }
});

// POST create requester
router.post('/', async (req, res) => {
  try {
    const { name, role, departmentId, phone, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do colaborador é obrigatório.' });

    const newRequester = await prisma.requester.create({
      data: {
        name,
        role: role || 'PROFESSOR',
        departmentId: departmentId || null,
        phone,
        email,
        status: 'ACTIVE'
      },
      include: { department: true }
    });

    res.status(201).json(newRequester);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar professor/colaborador.' });
  }
});

// PUT update requester
router.put('/:id', async (req, res) => {
  try {
    const { name, role, departmentId, phone, email, status } = req.body;
    const updated = await prisma.requester.update({
      where: { id: req.params.id },
      data: {
        name,
        role,
        departmentId: departmentId || null,
        phone,
        email,
        status
      },
      include: { department: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar colaborador.' });
  }
});

// DELETE (Soft delete -> Inactivate to preserve data integrity)
router.delete('/:id', async (req, res) => {
  try {
    const inactivated = await prisma.requester.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Colaborador inativado com sucesso.', requester: inactivated });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inativar colaborador.' });
  }
});

export default router;
