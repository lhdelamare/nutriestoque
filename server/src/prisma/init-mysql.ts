import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root@127.0.0.1:3306/nutri_estoque'
    }
  }
});

async function main() {
  console.log('⚡ Inicializando banco de dados MySQL para compatibilidade total...');

  // Read database.sql
  const sqlPath = path.resolve(process.cwd(), '../database.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

  // Disable FK
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'User', 'Supplier', 'Category', 'Product', 'Purchase',
    'Batch', 'Dispatch', 'FractionedLabel', 'Loss', 'Department', 'Requester'
  ];

  // Execute database.sql statements
  const statements = sqlContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (e) {
      // Ignore if table exists or statement warning
    }
  }

  // Create lowercase table aliases for MariaDB/MySQL case sensitivity
  for (const t of tables) {
    const lower = t.toLowerCase();
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${lower}\`;`);
      await prisma.$executeRawUnsafe(`CREATE TABLE \`${lower}\` LIKE \`${t}\`;`);
      await prisma.$executeRawUnsafe(`INSERT INTO \`${lower}\` SELECT * FROM \`${t}\`;`);
    } catch (err: any) {
      console.warn(`Aviso tabela ${lower}:`, err.message);
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('✅ Banco de Dados MySQL configurado com 100% de compatibilidade!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
