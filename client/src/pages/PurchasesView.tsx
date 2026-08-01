import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Calendar, CheckCircle2, Camera, Sparkles, FileText, Search, Eye, Layers, X, TrendingUp, TrendingDown, DollarSign, Award, BarChart3 } from 'lucide-react';
import { Supplier, Product, Category, Purchase } from '../types';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

interface Props {
  suppliers: Supplier[];
  products: Product[];
  categories: Category[];
  purchases: Purchase[];
  onRefresh: () => void;
}

interface CustomPurchaseItem {
  productId?: string;
  productName: string;
  barcode?: string;
  categoryId?: string;
  defaultUnit: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  manufacturingDate?: string;
  expirationDate: string;
  isNewProduct?: boolean;
}

export const PurchasesView: React.FC<Props> = ({ suppliers, products, categories, purchases, onRefresh }) => {
  const [viewTab, setViewTab] = useState<'entry' | 'invoices' | 'price-analysis'>('entry');

  // Form State for Entry
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanItemIndex, setActiveScanItemIndex] = useState<number | null>(null);

  // New Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Selected Purchase for Invoice Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Purchase | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Price Analysis Filter
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<string>(products[0]?.id || '');

  // Items State
  const [items, setItems] = useState<CustomPurchaseItem[]>([
    {
      productName: '',
      defaultUnit: 'UN',
      batchNumber: `LOTE-${Math.floor(10000 + Math.random() * 90000)}`,
      quantity: 10,
      unitPrice: 0,
      manufacturingDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addItemRow = () => {
    setItems([
      ...items,
      {
        productName: '',
        defaultUnit: 'UN',
        batchNumber: `LOTE-${Math.floor(10000 + Math.random() * 90000)}`,
        quantity: 10,
        unitPrice: 0,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CustomPurchaseItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'productName') {
      const match = products.find((p) => p.name.toLowerCase() === String(value).toLowerCase());
      if (match) {
        updated[index].productId = match.id;
        updated[index].defaultUnit = match.defaultUnit;
        updated[index].categoryId = match.categoryId;
        updated[index].barcode = match.barcode || undefined;
        updated[index].isNewProduct = false;
      } else {
        updated[index].productId = undefined;
        updated[index].isNewProduct = true;
      }
    }

    setItems(updated);
  };

  // Barcode scanner
  const handleBarcodeScanned = async (scannedCode: string) => {
    setIsScannerOpen(false);

    try {
      const res = await fetch(`/api/products/barcode/${scannedCode}`);
      const targetIndex = activeScanItemIndex !== null ? activeScanItemIndex : items.length - 1;

      if (res.ok) {
        const prod = await res.json();
        const updated = [...items];
        updated[targetIndex] = {
          ...updated[targetIndex],
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          defaultUnit: prod.defaultUnit,
          categoryId: prod.categoryId,
          isNewProduct: false
        };
        setItems(updated);
        setMsg({ type: 'success', text: `Produto "${prod.name}" reconhecido pelo código de barras!` });
      } else {
        const updated = [...items];
        updated[targetIndex] = {
          ...updated[targetIndex],
          barcode: scannedCode,
          productName: updated[targetIndex].productName || `Produto ${scannedCode}`,
          isNewProduct: true
        };
        setItems(updated);
        setMsg({
          type: 'success',
          text: `Código de barras ${scannedCode} lido! Digite o nome do produto para cadastrar.`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create new Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, description: newCatDesc })
      });

      if (!res.ok) throw new Error('Erro ao criar categoria.');

      setIsCategoryModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      onRefresh();
      setMsg({ type: 'success', text: 'Nova categoria cadastrada com sucesso!' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!supplierId) {
      setMsg({ type: 'error', text: 'Selecione um fornecedor para registrar a compra.' });
      return;
    }

    const invalidItem = items.find((it) => !it.productName.trim() || !it.expirationDate || !it.quantity);
    if (invalidItem) {
      setMsg({
        type: 'error',
        text: 'Preencha o Nome do Produto, Quantidade e Data de Validade para todos os itens.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          invoiceNumber,
          purchaseDate,
          notes,
          items: items.map((it) => ({
            productId: it.productId,
            productName: it.productName,
            barcode: it.barcode,
            categoryId: it.categoryId,
            defaultUnit: it.defaultUnit,
            batchNumber: it.batchNumber,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            manufacturingDate: it.manufacturingDate,
            expirationDate: it.expirationDate
          }))
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao registrar compra.');
      }

      setMsg({
        type: 'success',
        text: 'Entrada de estoque realizada com sucesso! Produtos novos foram cadastrados automaticamente.'
      });

      setInvoiceNumber('');
      setNotes('');
      setItems([
        {
          productName: '',
          defaultUnit: 'UN',
          batchNumber: `LOTE-${Math.floor(10000 + Math.random() * 90000)}`,
          quantity: 10,
          unitPrice: 0,
          manufacturingDate: new Date().toISOString().split('T')[0],
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ]);

      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredPurchases = purchases.filter(
    (p) =>
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
      (p.supplier && p.supplier.name.toLowerCase().includes(invoiceSearch.toLowerCase()))
  );

  // Price Variation Analysis logic
  const selectedProductObj = products.find((p) => p.id === selectedProductForAnalysis);
  const allBatchesForProduct = purchases
    .flatMap((p) =>
      (p.batches || []).map((b) => ({
        ...b,
        purchaseDate: p.purchaseDate,
        supplierName: p.supplier?.name || 'Desconhecido',
        invoiceNumber: p.invoiceNumber
      }))
    )
    .filter((b) => b.productId === selectedProductForAnalysis)
    .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

  // Group by Supplier for Supplier Comparison
  const supplierComparisonMap = allBatchesForProduct.reduce((acc, b) => {
    if (!acc[b.supplierName]) {
      acc[b.supplierName] = { totalPaid: 0, totalQty: 0, purchasesCount: 0, minPrice: b.unitPrice, maxPrice: b.unitPrice };
    }
    acc[b.supplierName].totalPaid += b.unitPrice * b.initialQuantity;
    acc[b.supplierName].totalQty += b.initialQuantity;
    acc[b.supplierName].purchasesCount += 1;
    acc[b.supplierName].minPrice = Math.min(acc[b.supplierName].minPrice, b.unitPrice);
    acc[b.supplierName].maxPrice = Math.max(acc[b.supplierName].maxPrice, b.unitPrice);
    return acc;
  }, {} as Record<string, { totalPaid: number; totalQty: number; purchasesCount: number; minPrice: number; maxPrice: number }>);

  return (
    <div className="space-y-6">
      {/* Top Controls & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Entrada de Compras</h2>
          <p className="text-xs text-slate-500">
            Lançamento de mercadorias, histórico de Notas Fiscais e relatório comparativo de preços de fornecedores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 flex items-center gap-1.5 text-xs transition-all"
          >
            <Layers className="w-4 h-4 text-brand-600" />
            <span>+ Nova Categoria</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveScanItemIndex(items.length - 1);
              setIsScannerOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-xs transition-all active:scale-95 border border-slate-700"
          >
            <Camera className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">Escanear Câmera</span>
          </button>
        </div>
      </div>

      {/* Mode Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setViewTab('entry')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            viewTab === 'entry'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Nova Entrada</span>
        </button>

        <button
          onClick={() => setViewTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            viewTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Consulta de Notas Fiscais ({purchases.length})</span>
        </button>

        <button
          onClick={() => setViewTab('price-analysis')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            viewTab === 'price-analysis'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Variação de Preços & Fornecedores</span>
        </button>
      </div>

      {/* Tab 1: Form Entry */}
      {viewTab === 'entry' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-brand-700 font-bold border-b border-slate-100 pb-3">
            <ShoppingCart className="w-5 h-5 text-brand-600" />
            <h3 className="text-base">Nova Entrada de Mercadorias</h3>
          </div>

          {msg && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {msg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Header info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fornecedor *</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Selecione o Fornecedor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número da Nota Fiscal (NFe) / Recibo</label>
                <input
                  type="text"
                  placeholder="Ex: NFe 10492"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Data da Compra</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm">Itens Comprados e Validades dos Lotes</h4>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-4 h-4" /> Adicionar Produto
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, idx) => {
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        <div className="md:col-span-6 space-y-1">
                          <label className="block font-bold text-slate-700 text-xs flex items-center justify-between">
                            <span>Nome do Alimento / Produto *</span>
                            {item.isNewProduct && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Novo Produto (Auto-Cadastrar)
                              </span>
                            )}
                          </label>

                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="Digite o nome do produto (ex: Leite Integral, Arroz 5kg)..."
                              value={item.productName}
                              onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                              list={`product-list-${idx}`}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-extrabold text-slate-900 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            />
                            <datalist id={`product-list-${idx}`}>
                              {products.map((p) => (
                                <option key={p.id} value={p.name}>
                                  {p.name} ({p.defaultUnit}) - {p.category?.name}
                                </option>
                              ))}
                            </datalist>
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <label className="block font-bold text-slate-600 text-[11px] mb-1">Código de Barras</label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="789..."
                              value={item.barcode || ''}
                              onChange={(e) => updateItem(idx, 'barcode', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveScanItemIndex(idx);
                                setIsScannerOpen(true);
                              }}
                              className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg shrink-0 text-slate-700"
                              title="Ler código com a câmera"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <label className="block font-bold text-slate-600 text-[11px] mb-1">Categoria</label>
                          <select
                            value={item.categoryId || ''}
                            onChange={(e) => updateItem(idx, 'categoryId', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                          >
                            <option value="">Selecione a Categoria...</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-200/60">
                        <div className="col-span-1 md:col-span-3">
                          <label className="block font-bold text-slate-600 text-[11px] mb-1">Nº do Lote *</label>
                          <input
                            type="text"
                            required
                            value={item.batchNumber}
                            onChange={(e) => updateItem(idx, 'batchNumber', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold"
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label className="block font-bold text-slate-600 text-[11px] mb-1">Unidade</label>
                          <select
                            value={item.defaultUnit}
                            onChange={(e) => updateItem(idx, 'defaultUnit', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                          >
                            <option value="UN">UN (Unidade)</option>
                            <option value="KG">KG (Quilograma)</option>
                            <option value="L">L (Litro)</option>
                            <option value="PCT">PCT (Pacote)</option>
                            <option value="CX">CX (Caixa)</option>
                          </select>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label className="block font-bold text-slate-600 text-[11px] mb-1">Quantidade *</label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-black text-sm text-slate-900"
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label className="block font-bold text-slate-600 text-[11px] mb-1">Preço Unit. (R$)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>

                        <div className="col-span-2 md:col-span-2">
                          <label className="block font-bold text-brand-700 text-[11px] mb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Data Validade *
                          </label>
                          <input
                            type="date"
                            required
                            value={item.expirationDate}
                            onChange={(e) => updateItem(idx, 'expirationDate', e.target.value)}
                            className="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded-lg font-bold text-brand-900"
                          />
                        </div>

                        <div className="col-span-2 md:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length === 1}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="w-full sm:w-1/2">
                <label className="block font-bold text-slate-700 mb-1">Observações da Compra</label>
                <input
                  type="text"
                  placeholder="Ex: Entrega conferida no estoque"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block font-semibold uppercase">Total da Compra</span>
                  <span className="text-xl font-black text-brand-700">{formatCurrency(calculateTotal())}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all text-sm"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Finalizar Entrada</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Consulta de Notas Fiscais */}
      {viewTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por número da Nota Fiscal (NFe) ou nome do fornecedor..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Nota Fiscal / NFe</th>
                    <th className="p-4">Fornecedor</th>
                    <th className="p-4">Data da Compra</th>
                    <th className="p-4">Itens / Lotes</th>
                    <th className="p-4">Valor Total</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredPurchases.map((p) => {
                    const dateStr = new Date(p.purchaseDate).toLocaleDateString('pt-BR');

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {p.invoiceNumber ? (
                            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                              {p.invoiceNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sem NFe</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-sm">{p.supplier?.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">CNPJ: {p.supplier?.cnpj}</div>
                        </td>

                        <td className="p-4 text-slate-600">{dateStr}</td>

                        <td className="p-4">
                          <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            {p.batches?.length || 0} produto(s) no lote
                          </span>
                        </td>

                        <td className="p-4 font-black text-slate-900 text-sm">
                          {formatCurrency(p.totalAmount)}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedInvoice(p)}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm text-xs inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver Detalhes NFe
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhuma Nota Fiscal encontrada para o termo pesquisado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Price Variation & Supplier Comparison Report */}
      {viewTab === 'price-analysis' && (
        <div className="space-y-6">
          {/* Header & Product Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Análise de Variação de Preços & Comparativo de Fornecedores
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhe o aumento de custos ao longo do tempo e identifique fornecedores mais competitivos
              </p>
            </div>

            <div className="w-full sm:w-72">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Selecione o Alimento:
              </label>
              <select
                value={selectedProductForAnalysis}
                onChange={(e) => setSelectedProductForAnalysis(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.defaultUnit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Supplier Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(supplierComparisonMap).map(([supName, stats], idx) => {
              const avgUnit = stats.totalQty > 0 ? stats.totalPaid / stats.totalQty : 0;
              const isBestPrice = idx === 0;

              return (
                <div
                  key={supName}
                  className={`p-5 rounded-2xl border shadow-sm space-y-3 relative overflow-hidden bg-white ${
                    isBestPrice ? 'border-emerald-300 ring-2 ring-emerald-400/20' : 'border-slate-200'
                  }`}
                >
                  {isBestPrice && (
                    <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <Award className="w-3 h-3" /> Menor Preço Médio
                    </span>
                  )}

                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Fornecedor</span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{supName}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Preço Médio Unitário</span>
                      <strong className="text-brand-700 text-base font-black">{formatCurrency(avgUnit)}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Compras Efetuadas</span>
                      <strong className="text-slate-800 text-sm font-bold">{stats.purchasesCount} lote(s)</strong>
                    </div>
                  </div>
                </div>
              );
            })}

            {Object.keys(supplierComparisonMap).length === 0 && (
              <div className="col-span-3 p-6 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs">
                Nenhum lote de compra registrado para este alimento ainda.
              </div>
            )}
          </div>

          {/* Historical Purchases Price Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Histórico Cronológico de Entradas e Variação de Preços (Lotes):
              </h4>
              <span className="text-xs font-bold text-slate-500">
                Produto: {selectedProductObj?.name}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Data da Entrada</th>
                    <th className="p-3.5">Nota Fiscal</th>
                    <th className="p-3.5">Fornecedor</th>
                    <th className="p-3.5">Nº do Lote</th>
                    <th className="p-3.5">Preço Unitário</th>
                    <th className="p-3.5">Variação %</th>
                    <th className="p-3.5">Qtd Comprada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {allBatchesForProduct.map((batch, idx) => {
                    const dateStr = new Date(batch.purchaseDate).toLocaleDateString('pt-BR');
                    const prevBatch = idx > 0 ? allBatchesForProduct[idx - 1] : null;

                    let priceVarPercent = 0;
                    if (prevBatch && prevBatch.unitPrice > 0) {
                      priceVarPercent = ((batch.unitPrice - prevBatch.unitPrice) / prevBatch.unitPrice) * 100;
                    }

                    return (
                      <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{dateStr}</td>

                        <td className="p-3.5 font-mono text-slate-600">
                          {batch.invoiceNumber || 'Sem NFe'}
                        </td>

                        <td className="p-3.5 font-bold text-slate-800">{batch.supplierName}</td>

                        <td className="p-3.5 font-mono text-slate-500">{batch.batchNumber}</td>

                        <td className="p-3.5 font-black text-slate-900 text-sm">
                          {formatCurrency(batch.unitPrice)}
                        </td>

                        <td className="p-3.5">
                          {idx === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">- (Primeira Compra)</span>
                          ) : priceVarPercent > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-black bg-red-50 px-2 py-0.5 rounded text-[11px] border border-red-200">
                              <TrendingUp className="w-3.5 h-3.5" /> +{priceVarPercent.toFixed(1)}%
                            </span>
                          ) : priceVarPercent < 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                              <TrendingDown className="w-3.5 h-3.5" /> {priceVarPercent.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-500 font-bold text-[11px]">0.0% (Mantido)</span>
                          )}
                        </td>

                        <td className="p-3.5 font-bold text-slate-800">
                          {batch.initialQuantity} {selectedProductObj?.defaultUnit || 'UN'}
                        </td>
                      </tr>
                    );
                  })}

                  {allBatchesForProduct.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Nenhum lote registrado para este produto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Nota Fiscal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <div>
                  <h3 className="font-bold text-base">
                    Detalhes da Nota Fiscal: {selectedInvoice.invoiceNumber || 'Sem Nº'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fornecedor: {selectedInvoice.supplier?.name} | Data: {new Date(selectedInvoice.purchaseDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Razão Social / CNPJ</span>
                  <strong className="text-slate-900 text-sm font-bold">{selectedInvoice.supplier?.name}</strong>
                  <span className="text-slate-400 font-mono block">CNPJ: {selectedInvoice.supplier?.cnpj}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Valor Total da Compra</span>
                  <strong className="text-brand-700 text-lg font-black">{formatCurrency(selectedInvoice.totalAmount)}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs mb-2 uppercase tracking-wider">
                  Itens Entrados no Estoque por esta Nota Fiscal:
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Produto</th>
                        <th className="p-3">Lote</th>
                        <th className="p-3">Qtd Inicial</th>
                        <th className="p-3">Saldo Atual</th>
                        <th className="p-3">Validade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedInvoice.batches?.map((b) => (
                        <tr key={b.id}>
                          <td className="p-3 font-bold text-slate-900">{b.product.name}</td>
                          <td className="p-3 font-mono text-slate-600">{b.batchNumber}</td>
                          <td className="p-3">{b.initialQuantity} {b.product.defaultUnit}</td>
                          <td className="p-3 font-bold text-brand-700">{b.currentQuantity} {b.product.defaultUnit}</td>
                          <td className="p-3 font-semibold text-slate-800">
                            {new Date(b.expirationDate).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                  <strong>Observações da NFe:</strong> {selectedInvoice.notes}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Nova Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                Cadastrar Nova Categoria
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Laticínios, Enlatados, Bebidas"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Leites, queijos, manteigas e derivados"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  Cadastrar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Camera Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          onScan={handleBarcodeScanned}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};
