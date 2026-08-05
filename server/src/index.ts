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

app.get('/api/health', async (req, res) => {
  const host = process.env.DB_HOST || '127.0.0.1';
  const db = process.env.DB_NAME || 'nutri_estoque';
  
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: 'OK',
      dbConnected: true,
      dbHost: host,
      dbName: db,
      userCount,
      message: `Conectado com sucesso ao MySQL (${host}/${db})`,
      time: new Date()
    });
  } catch (error: any) {
    console.error('❌ Erro no teste de conexão MySQL (/api/health):', error);
    res.status(500).json({
      status: 'ERROR',
      dbConnected: false,
      dbHost: host,
      dbName: db,
      error: error.message || 'Falha na conexão com o banco de dados MySQL.',
      time: new Date()
    });
  }
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

import { prisma } from './lib/prisma.js';

async function initDatabaseOnStartup() {
  try {
    const userCount = await prisma.user.count().catch(() => -1);
    // Garantir colunas adicionais para atualização de versão
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`product\` ADD COLUMN \`shelfNumber\` VARCHAR(191) DEFAULT NULL`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`product\` ADD COLUMN \`shelfRack\` VARCHAR(191) DEFAULT NULL`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`dispatch\` ADD COLUMN \`returnStatus\` VARCHAR(50) NOT NULL DEFAULT 'PENDING'`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`dispatch\` ADD COLUMN \`returnedQuantity\` DOUBLE NOT NULL DEFAULT 0`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`dispatch\` ADD COLUMN \`acknowledged\` TINYINT(1) NOT NULL DEFAULT 0`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`UPDATE \`dispatch\` SET \`returnStatus\` = 'PENDING' WHERE \`returnStatus\` IS NULL OR \`returnStatus\` = '' OR \`returnStatus\` = '0'`);
    } catch (e) {}

    if (userCount === -1 || userCount === 0) {
      console.log('⚡ Inicializando estrutura de tabelas e seed no MySQL...');
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`user\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`name\` VARCHAR(191) NOT NULL,
          \`email\` VARCHAR(191) NOT NULL,
          \`password\` VARCHAR(191) NOT NULL,
          \`role\` VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
          \`status\` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`user_email_key\` (\`email\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`department\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`name\` VARCHAR(191) NOT NULL,
          \`description\` TEXT DEFAULT NULL,
          \`status\` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`department_name_key\` (\`name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`requester\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`name\` VARCHAR(191) NOT NULL,
          \`role\` VARCHAR(50) NOT NULL DEFAULT 'PROFESSOR',
          \`departmentId\` VARCHAR(191) DEFAULT NULL,
          \`phone\` VARCHAR(191) DEFAULT NULL,
          \`email\` VARCHAR(191) DEFAULT NULL,
          \`status\` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`category\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`name\` VARCHAR(191) NOT NULL,
          \`description\` TEXT DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`category_name_key\` (\`name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`supplier\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`name\` VARCHAR(191) NOT NULL,
          \`tradeName\` VARCHAR(191) DEFAULT NULL,
          \`cnpj\` VARCHAR(191) NOT NULL,
          \`phone\` VARCHAR(191) DEFAULT NULL,
          \`email\` VARCHAR(191) DEFAULT NULL,
          \`address\` VARCHAR(191) DEFAULT NULL,
          \`city\` VARCHAR(191) DEFAULT NULL,
          \`state\` VARCHAR(191) DEFAULT NULL,
          \`contactPerson\` VARCHAR(191) DEFAULT NULL,
          \`notes\` TEXT DEFAULT NULL,
          \`status\` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`supplier_cnpj_key\` (\`cnpj\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`product\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`name\` VARCHAR(191) NOT NULL,
          \`barcode\` VARCHAR(191) DEFAULT NULL,
          \`categoryId\` VARCHAR(191) NOT NULL,
          \`defaultUnit\` VARCHAR(50) NOT NULL DEFAULT 'UN',
          \`minStockAlert\` DOUBLE NOT NULL DEFAULT 5,
          \`storageInstructions\` TEXT DEFAULT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`purchase\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`supplierId\` VARCHAR(191) NOT NULL,
          \`invoiceNumber\` VARCHAR(191) DEFAULT NULL,
          \`purchaseDate\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`totalAmount\` DOUBLE NOT NULL DEFAULT 0,
          \`notes\` TEXT DEFAULT NULL,
          \`status\` VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`batch\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`productId\` VARCHAR(191) NOT NULL,
          \`purchaseId\` VARCHAR(191) DEFAULT NULL,
          \`batchNumber\` VARCHAR(191) NOT NULL,
          \`initialQuantity\` DOUBLE NOT NULL,
          \`currentQuantity\` DOUBLE NOT NULL,
          \`unitPrice\` DOUBLE NOT NULL DEFAULT 0,
          \`manufacturingDate\` DATETIME(3) DEFAULT NULL,
          \`expirationDate\` DATETIME(3) NOT NULL,
          \`status\` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
          \`isFractioned\` TINYINT(1) NOT NULL DEFAULT 0,
          \`originalBatchId\` VARCHAR(191) DEFAULT NULL,
          \`fractionedAt\` DATETIME(3) DEFAULT NULL,
          \`shelfLifeDaysTotal\` INT DEFAULT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`dispatch\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`batchId\` VARCHAR(191) NOT NULL,
          \`quantity\` DOUBLE NOT NULL,
          \`unit\` VARCHAR(50) NOT NULL,
          \`requestedBy\` VARCHAR(191) NOT NULL,
          \`department\` VARCHAR(191) NOT NULL,
          \`type\` VARCHAR(50) NOT NULL DEFAULT 'TOTAL',
          \`reason\` TEXT DEFAULT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`fractionedlabel\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`dispatchId\` VARCHAR(191) DEFAULT NULL,
          \`batchId\` VARCHAR(191) NOT NULL,
          \`openDate\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`newExpirationDate\` DATETIME(3) NOT NULL,
          \`fractionedQuantity\` DOUBLE NOT NULL,
          \`remainingQuantity\` DOUBLE NOT NULL,
          \`labelCode\` VARCHAR(191) NOT NULL,
          \`printedBy\` VARCHAR(191) NOT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`loss\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`batchId\` VARCHAR(191) NOT NULL,
          \`quantity\` DOUBLE NOT NULL,
          \`reason\` VARCHAR(191) NOT NULL,
          \`reportedBy\` VARCHAR(191) NOT NULL,
          \`notes\` TEXT DEFAULT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await prisma.$executeRawUnsafe(`
        INSERT IGNORE INTO \`user\` (\`id\`, \`name\`, \`email\`, \`password\`, \`role\`, \`status\`) VALUES
        ('usr-admin-01', 'Administrador SENAI', 'admin@senai.br', 'admin123', 'ADMIN', 'ACTIVE'),
        ('usr-nutri-02', 'Nutricionista Responsável', 'nutri@senai.br', 'senai123', 'NUTRICIONISTA', 'ACTIVE');
      `);

      await prisma.$executeRawUnsafe(`
        INSERT IGNORE INTO \`department\` (\`id\`, \`name\`, \`description\`, \`status\`) VALUES
        ('dep-01', 'Berçário 1 e 2', 'Atendimento à primeira infância', 'ACTIVE'),
        ('dep-02', 'Ensino Fundamental 1', 'Salas de aula e lanche dos alunos', 'ACTIVE'),
        ('dep-03', 'Cozinha Principal', 'Preparo das refeições comunitárias', 'ACTIVE');
      `);

      await prisma.$executeRawUnsafe(`
        INSERT IGNORE INTO \`requester\` (\`id\`, \`name\`, \`role\`, \`departmentId\`, \`phone\`, \`email\`, \`status\`) VALUES
        ('req-01', 'Profa. Ana Paula Souza', 'PROFESSOR', 'dep-01', '(11) 98877-6655', 'ana.souza@senai.br', 'ACTIVE'),
        ('req-02', 'Tia Maria Oliveira', 'MERENDEIRA', 'dep-03', '(11) 97766-5544', 'maria.cozinha@senai.br', 'ACTIVE');
      `);

      await prisma.$executeRawUnsafe(`
        INSERT IGNORE INTO \`category\` (\`id\`, \`name\`, \`description\`) VALUES
        ('cat-01', 'Laticínios', 'Leite, queijo, iogurte e derivados'),
        ('cat-02', 'Grãos e Cereais', 'Arroz, feijão, aveia e milho');
      `);

      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Inicialização de Tabelas e Usuários (admin@senai.br) concluída com sucesso!');
    }
  } catch (err: any) {
    console.error('⚠️ Aviso na verificação de banco de dados:', err.message);
  }
}

const server = app.listen(PORT, () => {
  console.log(`🚀 NutriEstoque Server rodando na porta ${PORT}`);
  initDatabaseOnStartup();
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
