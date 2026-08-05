export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  cnpj: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  contactPerson?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  _count?: {
    purchases: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  categoryId: string;
  category?: Category;
  defaultUnit: string;
  minStockAlert: number;
  storageInstructions?: string;
  shelfNumber?: string;
  shelfRack?: string;
  currentStock?: number;
  isLowStock?: boolean;
  activeBatchesCount?: number;
}

export interface PurchaseItem {
  productId: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  manufacturingDate?: string;
  expirationDate: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  invoiceNumber?: string;
  purchaseDate: string;
  totalAmount: number;
  notes?: string;
  batches?: Batch[];
  createdAt: string;
}

export interface Batch {
  id: string;
  productId: string;
  product: Product;
  purchaseId?: string;
  purchase?: Purchase;
  batchNumber: string;
  initialQuantity: number;
  currentQuantity: number;
  unitPrice: number;
  manufacturingDate?: string;
  expirationDate: string;
  status: 'AVAILABLE' | 'DEPLETED' | 'EXPIRED' | 'DISCARDED';
  isFractioned: boolean;
  fractionedAt?: string;
  shelfLifeDaysTotal?: number;
  daysToExpire?: number;
  urgency?: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK';
  isFefoRecommended?: boolean;
}

export interface FractionedLabel {
  id: string;
  dispatchId?: string;
  batchId: string;
  openDate: string;
  newExpirationDate: string;
  fractionedQuantity: number;
  remainingQuantity: number;
  labelCode: string;
  printedBy: string;
  createdAt: string;
}

export interface Dispatch {
  id: string;
  batchId: string;
  batch: Batch;
  quantity: number;
  unit: string;
  requestedBy: string;
  department: string;
  type: 'TOTAL' | 'FRACIONADO';
  reason?: string;
  returnStatus?: 'PENDING' | 'USED' | 'RETURNED' | 'PARTIAL_RETURN';
  returnedQuantity?: number;
  acknowledged?: boolean;
  fractionedLabel?: FractionedLabel;
  createdAt: string;
}

export interface Loss {
  id: string;
  batchId: string;
  batch: Batch;
  quantity: number;
  reason: 'VENCIMENTO' | 'AVARIA' | 'DETERIORACAO' | 'CONTAMINACAO' | 'OUTROS';
  reportedBy: string;
  notes?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  status?: string;
  _count?: { requesters: number };
}

export interface Requester {
  id: string;
  name: string;
  role: 'PROFESSOR' | 'MERENDEIRA' | 'INSPETOR' | 'DIRECAO' | 'OUTRO';
  departmentId?: string;
  department?: Department;
  phone?: string;
  email?: string;
  status?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'PROFESSOR' | 'NUTRICIONISTA' | 'COZINHA';
  status: string;
  createdAt?: string;
}

export interface DashboardMetrics {
  suppliersCount: number;
  productsCount: number;
  activeBatchesCount: number;
  totalInventoryValue: number;
  expiredCount: number;
  criticalCount: number;
  warningCount: number;
  totalLossesCount: number;
  totalLossesValue: number;
}
