import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import suppliersRoutes from './routes/suppliers.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import purchasesRoutes from './routes/purchases.js';
import batchesRoutes from './routes/batches.js';
import dispatchesRoutes from './routes/dispatches.js';
import lossesRoutes from './routes/losses.js';
import dashboardRoutes from './routes/dashboard.js';
import departmentsRoutes from './routes/departments.js';
import requestersRoutes from './routes/requesters.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/dispatches', dispatchesRoutes);
app.use('/api/losses', lossesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/requesters', requestersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'NutriEstoque - Controle de Estoque Escolar', time: new Date() });
});

// Serve static frontend in production if client/dist exists
import path from 'path';
import fs from 'fs';

const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`🚀 NutriEstoque Server rodando na porta ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
