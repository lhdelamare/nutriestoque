-- ============================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS MYSQL PARA NUTRI-ESTOQUE
-- SISTEMA DE DEPOSITOS E ESTOQUE DE ALIMENTOS ESCOLAR (SENAI)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `nutri_estoque` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nutri_estoque`;

-- Disable Foreign Key checks for clean recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `fractionedlabel`;
DROP TABLE IF EXISTS `dispatch`;
DROP TABLE IF EXISTS `loss`;
DROP TABLE IF EXISTS `batch`;
DROP TABLE IF EXISTS `purchase`;
DROP TABLE IF EXISTS `product`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `supplier`;
DROP TABLE IF EXISTS `requester`;
DROP TABLE IF EXISTS `department`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS DO SISTEMA (user)
-- ------------------------------------------------------------
CREATE TABLE `user` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'ADMIN', -- ADMIN, NUTRICIONISTA, COZINHA
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. TABELA DE FORNECEDORES (supplier)
-- ------------------------------------------------------------
CREATE TABLE `supplier` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `tradeName` VARCHAR(191) DEFAULT NULL,
  `cnpj` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) DEFAULT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `address` VARCHAR(191) DEFAULT NULL,
  `city` VARCHAR(191) DEFAULT NULL,
  `state` VARCHAR(191) DEFAULT NULL,
  `contactPerson` VARCHAR(191) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplier_cnpj_key` (`cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. TABELA DE CATEGORIAS DE ALIMENTOS (category)
-- ------------------------------------------------------------
CREATE TABLE `category` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. TABELA DE CATÁLOGO DE ALIMENTOS (product)
-- ------------------------------------------------------------
CREATE TABLE `product` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `barcode` VARCHAR(191) DEFAULT NULL,
  `categoryId` VARCHAR(191) NOT NULL,
  `defaultUnit` VARCHAR(50) NOT NULL DEFAULT 'UN', -- KG, L, UN, PCT, CX
  `minStockAlert` DOUBLE NOT NULL DEFAULT 5,
  `storageInstructions` TEXT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_barcode_key` (`barcode`),
  KEY `product_categoryId_fkey` (`categoryId`),
  CONSTRAINT `product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. TABELA DE NOTAS FISCAIS DE COMPRA (purchase)
-- ------------------------------------------------------------
CREATE TABLE `purchase` (
  `id` VARCHAR(191) NOT NULL,
  `supplierId` VARCHAR(191) NOT NULL,
  `invoiceNumber` VARCHAR(191) DEFAULT NULL,
  `purchaseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `totalAmount` DOUBLE NOT NULL DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `purchase_supplierId_fkey` (`supplierId`),
  CONSTRAINT `purchase_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. TABELA DE LOTES E VALIDADES FEFO (batch)
-- ------------------------------------------------------------
CREATE TABLE `batch` (
  `id` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `purchaseId` VARCHAR(191) DEFAULT NULL,
  `batchNumber` VARCHAR(191) NOT NULL,
  `initialQuantity` DOUBLE NOT NULL,
  `currentQuantity` DOUBLE NOT NULL,
  `unitPrice` DOUBLE NOT NULL DEFAULT 0,
  `manufacturingDate` DATETIME(3) DEFAULT NULL,
  `expirationDate` DATETIME(3) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, DEPLETED, EXPIRED, DISCARDED
  `isFractioned` TINYINT(1) NOT NULL DEFAULT 0,
  `originalBatchId` VARCHAR(191) DEFAULT NULL,
  `fractionedAt` DATETIME(3) DEFAULT NULL,
  `shelfLifeDaysTotal` INT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `batch_productId_fkey` (`productId`),
  KEY `batch_purchaseId_fkey` (`purchaseId`),
  CONSTRAINT `batch_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `batch_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchase` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. TABELA DE SETORES DA ESCOLA (department)
-- ------------------------------------------------------------
CREATE TABLE `department` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `department_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. TABELA DE PROFESSORES / COLABORADORES (requester)
-- ------------------------------------------------------------
CREATE TABLE `requester` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'PROFESSOR',
  `departmentId` VARCHAR(191) DEFAULT NULL,
  `phone` VARCHAR(191) DEFAULT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `requester_departmentId_fkey` (`departmentId`),
  CONSTRAINT `requester_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. TABELA DE BAIXAS / RETIRADAS (dispatch)
-- ------------------------------------------------------------
CREATE TABLE `dispatch` (
  `id` VARCHAR(191) NOT NULL,
  `batchId` VARCHAR(191) NOT NULL,
  `quantity` DOUBLE NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `requestedBy` VARCHAR(191) NOT NULL,
  `department` VARCHAR(191) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'TOTAL', -- TOTAL, FRACIONADO
  `reason` TEXT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `dispatch_batchId_fkey` (`batchId`),
  CONSTRAINT `dispatch_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. TABELA DE ETIQUETAS FRACIONADAS (fractionedlabel)
-- ------------------------------------------------------------
CREATE TABLE `fractionedlabel` (
  `id` VARCHAR(191) NOT NULL,
  `dispatchId` VARCHAR(191) DEFAULT NULL,
  `batchId` VARCHAR(191) NOT NULL,
  `openDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `newExpirationDate` DATETIME(3) NOT NULL,
  `fractionedQuantity` DOUBLE NOT NULL,
  `remainingQuantity` DOUBLE NOT NULL,
  `labelCode` VARCHAR(191) NOT NULL,
  `printedBy` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `fractionedlabel_dispatchId_key` (`dispatchId`),
  UNIQUE KEY `fractionedlabel_labelCode_key` (`labelCode`),
  KEY `fractionedlabel_batchId_fkey` (`batchId`),
  CONSTRAINT `fractionedlabel_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fractionedlabel_dispatchId_fkey` FOREIGN KEY (`dispatchId`) REFERENCES `dispatch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. TABELA DE PERDAS E DESCARTES (loss)
-- ------------------------------------------------------------
CREATE TABLE `loss` (
  `id` VARCHAR(191) NOT NULL,
  `batchId` VARCHAR(191) NOT NULL,
  `quantity` DOUBLE NOT NULL,
  `reason` VARCHAR(191) NOT NULL, -- VENCIMENTO, AVARIA, DETERIORACAO, CONTAMINACAO
  `reportedBy` VARCHAR(191) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `loss_batchId_fkey` (`batchId`),
  CONSTRAINT `loss_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DADOS INICIAIS (SEED) PARA POPULAR O BANCO MYSQL
-- ============================================================

-- Usuários Padrão
INSERT INTO `user` (`id`, `name`, `email`, `password`, `role`, `status`) VALUES
('usr-admin-01', 'Administrador SENAI', 'admin@senai.br', 'admin123', 'ADMIN', 'ACTIVE'),
('usr-nutri-02', 'Nutricionista Responsável', 'nutri@senai.br', 'senai123', 'NUTRICIONISTA', 'ACTIVE');

-- Setores da Escola
INSERT INTO `department` (`id`, `name`, `description`, `status`) VALUES
('dep-01', 'Berçário 1 e 2', 'Atendimento à primeira infância', 'ACTIVE'),
('dep-02', 'Ensino Fundamental 1', 'Salas de aula e lanche dos alunos', 'ACTIVE'),
('dep-03', 'Cozinha Principal', 'Preparo das refeições comunitárias', 'ACTIVE'),
('dep-04', 'Refeitório Central', 'Espaço de alimentação geral', 'ACTIVE');

-- Professores e Colaboradores
INSERT INTO `requester` (`id`, `name`, `role`, `departmentId`, `phone`, `email`, `status`) VALUES
('req-01', 'Profa. Ana Paula Souza', 'PROFESSOR', 'dep-01', '(11) 98877-6655', 'ana.souza@senai.br', 'ACTIVE'),
('req-02', 'Tia Maria Oliveira', 'MERENDEIRA', 'dep-03', '(11) 97766-5544', 'maria.cozinha@senai.br', 'ACTIVE'),
('req-03', 'Prof. Carlos Eduardo', 'PROFESSOR', 'dep-02', '(11) 96655-4433', 'carlos.eduardo@senai.br', 'ACTIVE');

-- Categorias de Alimentos
INSERT INTO `category` (`id`, `name`, `description`) VALUES
('cat-01', 'Laticínios', 'Leite, queijo, iogurte e derivados'),
('cat-02', 'Grãos e Cereais', 'Arroz, feijão, aveia e milho'),
('cat-03', 'Carnes e Proteínas', 'Frango, carne bovina e peixe'),
('cat-04', 'Hortifruti', 'Frutas, legumes e verduras frescas'),
('cat-05', 'Enlatados e Conservas', 'Molho de tomate, milho em lata e ervilha');

-- Fornecedores de Exemplo
INSERT INTO `supplier` (`id`, `name`, `tradeName`, `cnpj`, `phone`, `email`, `city`, `state`, `status`) VALUES
('sup-01', 'Distribuidora Laticínios Vale Verde Ltda', 'Laticínios Vale Verde', '12.345.678/0001-90', '(11) 4004-1234', 'contato@valeverde.com.br', 'São Paulo', 'SP', 'ACTIVE'),
('sup-02', 'Atacadão de Alimentos São José S.A.', 'Atacadão São José', '98.765.432/0001-10', '(11) 3322-5544', 'vendas@atacadaosaojose.com.br', 'Campinas', 'SP', 'ACTIVE');

-- Produtos no Catálogo
INSERT INTO `product` (`id`, `name`, `barcode`, `categoryId`, `defaultUnit`, `minStockAlert`, `storageInstructions`) VALUES
('prod-01', 'Leite Integral 1L', '7891000123456', 'cat-01', 'L', 10, 'Após aberto, manter sob refrigeração e consumir em até 3 dias.'),
('prod-02', 'Arroz Branco 5kg', '7891000654321', 'cat-02', 'PCT', 5, 'Conservar em local seco, arejado e protegido da umidade.'),
('prod-03', 'Feijão Carioca 1kg', '7891000987654', 'cat-02', 'PCT', 8, 'Armazenar em local fresco.');

-- Compra Inicial
INSERT INTO `purchase` (`id`, `supplierId`, `invoiceNumber`, `purchaseDate`, `totalAmount`, `status`) VALUES
('pur-01', 'sup-01', 'NFe-10492', '2026-08-01 10:00:00', 450.00, 'COMPLETED');

-- Lotes FEFO Iniciais
INSERT INTO `batch` (`id`, `productId`, `purchaseId`, `batchNumber`, `initialQuantity`, `currentQuantity`, `unitPrice`, `expirationDate`, `status`, `shelfLifeDaysTotal`) VALUES
('batch-01', 'prod-01', 'pur-01', 'LOTE-L8492', 50, 42, 4.50, DATE_ADD(NOW(), INTERVAL 5 DAY), 'AVAILABLE', 30),
('batch-02', 'prod-01', 'pur-01', 'LOTE-L8499', 40, 40, 4.60, DATE_ADD(NOW(), INTERVAL 25 DAY), 'AVAILABLE', 30),
('batch-03', 'prod-02', 'pur-01', 'LOTE-A5011', 20, 18, 22.00, DATE_ADD(NOW(), INTERVAL 180 DAY), 'AVAILABLE', 365);
