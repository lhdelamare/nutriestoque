import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed de dados para o NutriEstoque...');

  // Clean existing tables
  await prisma.user.deleteMany();
  await prisma.fractionedLabel.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.loss.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.requester.deleteMany();
  await prisma.department.deleteMany();

  // Initial Users
  await prisma.user.create({
    data: {
      name: 'Administrador SENAI',
      email: 'admin@senai.br',
      password: 'admin123',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  await prisma.user.create({
    data: {
      name: 'Nutricionista Responsável',
      email: 'nutri@senai.br',
      password: 'senai123',
      role: 'NUTRICIONISTA',
      status: 'ACTIVE'
    }
  });

  // Setores (Departments)
  const depBercario = await prisma.department.create({
    data: { name: 'Berçário 1 e 2', description: 'Atendimento à primeira infância' }
  });
  const depMaternal = await prisma.department.create({
    data: { name: 'Maternal e Pré-Escola', description: 'Turmas de 2 a 5 anos' }
  });
  const depFundamental = await prisma.department.create({
    data: { name: 'Ensino Fundamental', description: 'Salas do 1º ao 9º ano' }
  });
  const depCozinha = await prisma.department.create({
    data: { name: 'Cozinha Principal / Almoço', description: 'Preparo da merenda escolar' }
  });
  const depRefeitorio = await prisma.department.create({
    data: { name: 'Refeitório Central', description: 'Distribuição dos lanches' }
  });

  // Professores e Colaboradores (Requesters)
  await prisma.requester.create({
    data: { name: 'Profa. Ana Paula Souza', role: 'PROFESSOR', departmentId: depBercario.id, phone: '(11) 98888-1111' }
  });
  await prisma.requester.create({
    data: { name: 'Tia Maria Oliveira (Merendeira)', role: 'MERENDEIRA', departmentId: depCozinha.id, phone: '(11) 97777-2222' }
  });
  await prisma.requester.create({
    data: { name: 'Prof. Roberto Carlos (Ed. Física)', role: 'PROFESSOR', departmentId: depFundamental.id }
  });
  await prisma.requester.create({
    data: { name: 'Mariana Luz (Nutricionista)', role: 'DIRECAO', departmentId: depCozinha.id }
  });

  // 1. Fornecedores
  const f1 = await prisma.supplier.create({
    data: {
      name: 'Distribuidora de Alimentos Brasil Ltda',
      tradeName: 'Alimentos Brasil',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 3456-7890',
      email: 'contato@alimentosbrasil.com.br',
      address: 'Av. das Nações Unidas, 1200 - Centro',
      city: 'São Paulo',
      state: 'SP',
      contactPerson: 'Carlos Eduardo',
      notes: 'Fornecedor de secos e molhados com entrega semanal às terças-feiras.',
      status: 'ACTIVE'
    }
  });

  const f2 = await prisma.supplier.create({
    data: {
      name: 'Laticínios Vale Verde S.A.',
      tradeName: 'Vale Verde',
      cnpj: '98.765.432/0001-10',
      phone: '(19) 3871-4400',
      email: 'vendas@valeverde.com.br',
      address: 'Rodovia SP-340, Km 45',
      city: 'Campinas',
      state: 'SP',
      contactPerson: 'Mariana Luz',
      notes: 'Fornecedor exclusivo de leites, queijos e iogurtes frescos.',
      status: 'ACTIVE'
    }
  });

  const f3 = await prisma.supplier.create({
    data: {
      name: 'Cooperativa Agrícola Hortifruti Escolar',
      tradeName: 'HortiEscolar',
      cnpj: '45.123.890/0001-55',
      phone: '(11) 98765-4321',
      email: 'pedidos@hortiescolar.org.br',
      address: 'Rua dos Agricultores, 88 - Zona Rural',
      city: 'Jundiaí',
      state: 'SP',
      contactPerson: 'Seu Antônia',
      notes: 'Fornecedor de frutas e legumes orgânicos da agricultura familiar.',
      status: 'ACTIVE'
    }
  });

  // 2. Categorias
  const catLaticinios = await prisma.category.create({
    data: { name: 'Laticínios', description: 'Leites, iogurtes, queijos e manteigas' }
  });
  const catGraos = await prisma.category.create({
    data: { name: 'Cereais e Grãos', description: 'Arroz, feijão, milho, aveia e macarrão' }
  });
  const catProteinas = await prisma.category.create({
    data: { name: 'Carnes e Proteínas', description: 'Carne bovina, frango, peixe e ovos' }
  });
  const catHorti = await prisma.category.create({
    data: { name: 'Hortifruti', description: 'Frutas, legumes e verduras frescas' }
  });
  const catPadaria = await prisma.category.create({
    data: { name: 'Padaria e Biscoitos', description: 'Pães, biscoitos e torradas' }
  });

  // 3. Produtos
  const pLeite = await prisma.product.create({
    data: {
      name: 'Leite Integral UHT 1L',
      categoryId: catLaticinios.id,
      defaultUnit: 'CX', // caixa com unidades ou litros
      minStockAlert: 20,
      storageInstructions: 'Conservar em local seco e arejado. Após aberto, manter refrigerado e consumir em até 3 dias.'
    }
  });

  const pArroz = await prisma.product.create({
    data: {
      name: 'Arroz Branco Tipo 1 (5kg)',
      categoryId: catGraos.id,
      defaultUnit: 'PCT',
      minStockAlert: 10,
      storageInstructions: 'Armazenar em local seco, fresco e afastado do solo.'
    }
  });

  const pFeijao = await prisma.product.create({
    data: {
      name: 'Feijão Carioca (1kg)',
      categoryId: catGraos.id,
      defaultUnit: 'PCT',
      minStockAlert: 15,
      storageInstructions: 'Manter em embalagem fechada ao abrigo da luz e umidade.'
    }
  });

  const pIogurte = await prisma.product.create({
    data: {
      name: 'Iogurte Frutas Amarelas (170g)',
      categoryId: catLaticinios.id,
      defaultUnit: 'UN',
      minStockAlert: 30,
      storageInstructions: 'Manter sob refrigeração entre 1°C e 8°C.'
    }
  });

  const pMaca = await prisma.product.create({
    data: {
      name: 'Maçã Gala Selecionada',
      categoryId: catHorti.id,
      defaultUnit: 'KG',
      minStockAlert: 15,
      storageInstructions: 'Armazenar na gaveta de hortifruti sob refrigeração.'
    }
  });

  const pBiscoito = await prisma.product.create({
    data: {
      name: 'Biscoito Doce Tipo Maria (400g)',
      categoryId: catPadaria.id,
      defaultUnit: 'PCT',
      minStockAlert: 12,
      storageInstructions: 'Após aberto, guardar em recipiente fechado para manter a crocância.'
    }
  });

  // 4. Compras e Lotes com Validades Variadas (para testar FEFO)
  const now = new Date();

  // Compra 1: Laticínios Vale Verde
  const comp1 = await prisma.purchase.create({
    data: {
      supplierId: f2.id,
      invoiceNumber: 'NF-88412',
      purchaseDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 dias atrás
      totalAmount: 480.00,
      notes: 'Entrega para o mês de Agosto.'
    }
  });

  // Lote 1 de Leite (VENCE EM 3 DIAS - FEFO RECOMENDADO!)
  const expLeiteCritico = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  await prisma.batch.create({
    data: {
      productId: pLeite.id,
      purchaseId: comp1.id,
      batchNumber: 'LT-LEITE-001',
      initialQuantity: 50,
      currentQuantity: 30,
      unitPrice: 4.80,
      manufacturingDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      expirationDate: expLeiteCritico,
      status: 'AVAILABLE',
      shelfLifeDaysTotal: 28
    }
  });

  // Lote 2 de Leite (VENCE EM 30 DIAS)
  const expLeiteNormal = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.batch.create({
    data: {
      productId: pLeite.id,
      purchaseId: comp1.id,
      batchNumber: 'LT-LEITE-002',
      initialQuantity: 60,
      currentQuantity: 60,
      unitPrice: 4.80,
      manufacturingDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      expirationDate: expLeiteNormal,
      status: 'AVAILABLE',
      shelfLifeDaysTotal: 40
    }
  });

  // Compra 2: Alimentos Brasil (Grãos e Biscoitos)
  const comp2 = await prisma.purchase.create({
    data: {
      supplierId: f1.id,
      invoiceNumber: 'NF-10492',
      purchaseDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      totalAmount: 1250.00,
      notes: 'Abastecimento de estoque seco.'
    }
  });

  // Lote Arroz (Vence em 120 dias)
  await prisma.batch.create({
    data: {
      productId: pArroz.id,
      purchaseId: comp2.id,
      batchNumber: 'LT-ARROZ-88',
      initialQuantity: 25,
      currentQuantity: 22,
      unitPrice: 24.50,
      manufacturingDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      expirationDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
      status: 'AVAILABLE',
      shelfLifeDaysTotal: 150
    }
  });

  // Lote Iogurte (VENCE AMANHÃ - 1 DIA!)
  await prisma.batch.create({
    data: {
      productId: pIogurte.id,
      purchaseId: comp1.id,
      batchNumber: 'LT-IOG-04',
      initialQuantity: 40,
      currentQuantity: 15,
      unitPrice: 2.90,
      manufacturingDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      expirationDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      status: 'AVAILABLE',
      shelfLifeDaysTotal: 15
    }
  });

  // Lote Biscoito (VENCEU HÁ 2 DIAS - EXPIRED)
  await prisma.batch.create({
    data: {
      productId: pBiscoito.id,
      purchaseId: comp2.id,
      batchNumber: 'LT-BISC-OLD',
      initialQuantity: 10,
      currentQuantity: 8,
      unitPrice: 5.20,
      manufacturingDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      expirationDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'AVAILABLE',
      shelfLifeDaysTotal: 88
    }
  });

  console.log('✅ Seed executado com sucesso! Dados de fornecedores, produtos e lotes (FEFO) criados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
