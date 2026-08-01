import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// POST Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a senha.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Usuário inativo. Entre em contato com a administração.' });
    }

    const { password: _, ...userInfo } = user;
    res.json({
      user: userInfo,
      token: `token-${user.id}-${Date.now()}`
    });
  } catch (error: any) {
    console.error('❌ Erro no login (detalhe do banco):', error);
    res.status(500).json({ error: 'Erro ao realizar login. Verifique a conexão com o banco de dados.' });
  }
});

// POST Register User (Nome, Email, Senha, Perfil)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, E-mail e Senha são obrigatórios.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password,
        role: role || 'ADMIN',
        status: 'ACTIVE'
      }
    });

    const { password: _, ...userInfo } = newUser;
    res.status(201).json(userInfo);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

// GET All Users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // Included for edit modal view/update
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// PUT Update User (Nome, Email, Senha, Perfil, Status)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email.toLowerCase().trim();
    if (password) dataToUpdate.password = password;
    if (role) dataToUpdate.role = role;
    if (status) dataToUpdate.status = status;

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: dataToUpdate
    });

    const { password: _, ...userInfo } = updated;
    res.json(userInfo);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário do sistema.' });
  }
});

// DELETE User (Soft Delete -> Inactivate to preserve data integrity)
router.delete('/users/:id', async (req, res) => {
  try {
    const inactivated = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Usuário inativado com sucesso.', user: inactivated });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inativar usuário.' });
  }
});

export default router;
