import React, { useState } from 'react';
import { Package, Search, Plus, Edit3, Trash2, Tag, AlertCircle, LayoutGrid, LayoutList, Layers } from 'lucide-react';
import { Product, Category } from '../types';

interface Props {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

export const ProductsView: React.FC<Props> = ({ products, categories, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showZeroStock, setShowZeroStock] = useState(false); // Default to false (only show active stock)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table'); // Default to Table/List view

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('UN');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [storageInstructions, setStorageInstructions] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openNewModal = () => {
    setEditingProduct(null);
    setName('');
    setBarcode('');
    setCategoryId(categories[0]?.id || '');
    setDefaultUnit('UN');
    setMinStockAlert('5');
    setStorageInstructions('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setBarcode(prod.barcode || '');
    setCategoryId(prod.categoryId);
    setDefaultUnit(prod.defaultUnit);
    setMinStockAlert(String(prod.minStockAlert));
    setStorageInstructions(prod.storageInstructions || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !categoryId) {
      setErrorMsg('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const payload = {
        name,
        barcode: barcode || undefined,
        categoryId,
        defaultUnit,
        minStockAlert: parseFloat(minStockAlert) || 0,
        storageInstructions
      };

      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar produto.');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja inativar este produto do catálogo?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      alert('Erro ao inativar produto.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.category?.name && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesStock = showZeroStock || (p.currentStock || 0) > 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Catálogo de Alimentos & Ingredientes</h2>
          <p className="text-xs text-slate-500">
            Cadastro de alimentos da merenda escolar, unidades de medida e orientações de conservação
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 flex items-center gap-1.5 text-xs transition-all"
          >
            <Tag className="w-4 h-4 text-brand-600" />
            <span>+ Nova Categoria</span>
          </button>

          <button
            onClick={openNewModal}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-xs sm:text-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Alimento</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Category Filter, Zero Stock Checkbox & View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por alimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-600 hidden sm:inline">Categoria:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Todas as Categorias ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Show Zero Stock Checkbox */}
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={showZeroStock}
              onChange={(e) => setShowZeroStock(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <span>Exibir sem estoque</span>
          </label>

          {/* View Switcher (Table vs Cards) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Listagem / Tabela (Padrão)"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Listagem</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Cards / Grade"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode 1: Table List View (DEFAULT) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Alimento / Produto</th>
                  <th className="p-4">Unidade</th>
                  <th className="p-4">Estoque Atual</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredProducts.map((p) => {
                  const currentStock = p.currentStock || 0;
                  const isLow = currentStock <= p.minStockAlert;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">{p.name}</span>
                            <span className="text-[11px] text-slate-400">Estoque Mínimo: {p.minStockAlert} {p.defaultUnit}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-bold text-slate-800 text-sm">{p.defaultUnit}</td>

                      <td className="p-4">
                        <span
                          className={`font-black text-sm px-3 py-1 rounded-lg ${
                            isLow ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {currentStock} {p.defaultUnit}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Editar Alimento"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Inativar Alimento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      Nenhum alimento encontrado para a categoria ou busca informada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Mode 2: Grid / Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const currentStock = p.currentStock || 0;
            const isLow = currentStock <= p.minStockAlert;

            return (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{p.name}</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 mt-0.5">
                          <Tag className="w-3 h-3" />
                          {p.category?.name || 'Sem Categoria'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-slate-400 hover:text-brand-600 p-1.5 rounded-lg hover:bg-slate-100"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100"
                        title="Inativar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {p.barcode && (
                    <div className="mt-3 text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 inline-block">
                      Cód. Barras: {p.barcode}
                    </div>
                  )}

                  {p.storageInstructions && (
                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      {p.storageInstructions}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Estoque Atual</span>
                    <span
                      className={`text-lg font-black ${
                        isLow ? 'text-red-600' : 'text-slate-900'
                      }`}
                    >
                      {currentStock} <span className="text-xs font-normal text-slate-500">{p.defaultUnit}</span>
                    </span>
                  </div>

                  {isLow && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" /> Estoque Baixo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastro/Edição de Alimento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-400" />
                {editingProduct ? 'Editar Alimento' : 'Cadastrar Novo Alimento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Alimento / Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Leite Integral 1L, Feijão Carioca 1kg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Código de Barras (EAN-13)</label>
                <input
                  type="text"
                  placeholder="789..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Selecione a Categoria...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade Padrão *</label>
                  <select
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilograma)</option>
                    <option value="L">L (Litro)</option>
                    <option value="PCT">PCT (Pacote)</option>
                    <option value="CX">CX (Caixa)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque Mínimo (Alerta)</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instruções de Conservação</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Após aberto, manter sob refrigeração e consumir em até 3 dias"
                  value={storageInstructions}
                  onChange={(e) => setStorageInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Alimento'}
                </button>
              </div>
            </form>
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
    </div>
  );
};
