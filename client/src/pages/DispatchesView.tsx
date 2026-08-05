import React, { useState, useEffect } from 'react';
import { Search, ArrowDownLeft, Calendar, Clock, Tag, User, School, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { Product, Batch, FractionedLabel, Department, Requester } from '../types';
import { FractionedLabelModal } from '../components/FractionedLabelModal';

interface Props {
  departments: Department[];
  requesters: Requester[];
  onRefreshAll: () => void;
}

export const DispatchesView: React.FC<Props> = ({ departments, requesters, onRefreshAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productsFefo, setProductsFefo] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected Batch for Requisition Form
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields
  const [requestedBy, setRequestedBy] = useState(requesters[0]?.name || '');
  const [department, setDepartment] = useState(departments[0]?.name || '');
  const [quantity, setQuantity] = useState('1');
  const [type, setType] = useState<'TOTAL' | 'FRACIONADO'>('FRACIONADO');
  const [reason, setReason] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');

  // Generated Label State
  const [generatedLabel, setGeneratedLabel] = useState<{ label: FractionedLabel; batch: Batch } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFefoProducts = async (term: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/batches/fefo?query=${encodeURIComponent(term)}`);
      const data = await res.json();
      setProductsFefo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFefoProducts(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (requesters.length > 0 && !requestedBy) {
      setRequestedBy(requesters[0].name);
    }
    if (departments.length > 0 && !department) {
      setDepartment(departments[0].name);
    }
  }, [requesters, departments]);

  const handleSelectBatch = (prod: Product, batch: Batch) => {
    setSelectedProduct(prod);
    setSelectedBatch(batch);
    setQuantity('1');
    setRequestedBy(requestedBy || requesters[0]?.name || '');
    setDepartment(department || departments[0]?.name || '');
  };

  // Live preview of calculated 1/3 expiration date for fractioned items
  const getCalculatedFractionedExpDate = (): { dateStr: string; oneThirdDays: number } => {
    if (!selectedBatch) return { dateStr: '-', oneThirdDays: 0 };
    const openDate = new Date();
    let totalShelfLifeDays = selectedBatch.shelfLifeDaysTotal || 30;
    if (selectedBatch.manufacturingDate && selectedBatch.expirationDate) {
      const diffMs = new Date(selectedBatch.expirationDate).getTime() - new Date(selectedBatch.manufacturingDate).getTime();
      totalShelfLifeDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
    const oneThirdDays = Math.max(1, Math.round(totalShelfLifeDays / 3));

    let calcExp = new Date(openDate.getTime() + oneThirdDays * 24 * 60 * 60 * 1000);
    if (calcExp > new Date(selectedBatch.expirationDate)) {
      calcExp = new Date(selectedBatch.expirationDate);
    }

    return {
      dateStr: calcExp.toLocaleDateString('pt-BR'),
      oneThirdDays
    };
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRequestedBy = requestedBy || requesters[0]?.name;
    const finalResponsible = responsiblePerson.trim();

    if (!selectedBatch || !finalRequestedBy) {
      alert('Selecione o Solicitante (Professor / Colaborador).');
      return;
    }

    if (!finalResponsible) {
      alert('Informe o Responsável pela Cozinha / Baixa.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatch.id,
          quantity: parseFloat(quantity),
          requestedBy: finalRequestedBy,
          department: department || departments[0]?.name || 'Geral',
          type,
          reason,
          responsiblePerson: finalResponsible
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }

      const dispatchData = await res.json();

      // If fractioned, open Label print modal
      if (type === 'FRACIONADO' && dispatchData.fractionedLabel) {
        setGeneratedLabel({
          label: dispatchData.fractionedLabel,
          batch: selectedBatch
        });
      } else {
        alert('Baixa registrada com sucesso!');
      }

      setSelectedBatch(null);
      fetchFefoProducts(searchTerm);
      onRefreshAll();
    } catch (err) {
      alert('Erro ao registrar baixa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-brand-700 bg-brand-100 px-3 py-1 rounded-full border border-brand-200">
            Prioridade por Vencimento - Mais Próximo Primeiro
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Sistema de Retirada por Requisição</h2>
          <p className="text-xs text-slate-500">
            Pesquise o produto para ver os lotes ordenados por data de vencimento e selecione retirada total ou fracionada com etiqueta.
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <label className="block text-xs font-bold text-slate-700">Digite o Alimento Solicitado (ex: Leite, Arroz, Iogurte)</label>
        <div className="relative">
          <Search className="w-5 h-5 text-brand-600 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome do produto ou categoria..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
      </div>

      {/* Grid: Search Results & Batch Cards */}
      <div className="space-y-6">
        {loading && <p className="text-xs text-slate-400 text-center py-6">Consultando estoque disponível...</p>}

        {!loading &&
          productsFefo
            .filter((prod) => prod.totalStock > 0 && prod.batches?.length > 0)
            .map((prod) => (
              <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{prod.name}</h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Unidade: {prod.defaultUnit}
                      </span>
                      {(prod.shelfNumber || prod.shelfRack) && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          📍 Local: Estante {prod.shelfNumber || '-'}{prod.shelfRack ? ` / Prat. ${prod.shelfRack}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Categoria: <strong>{prod.category?.name}</strong> | Saldo Total Disponível: <strong className="text-brand-700">{prod.totalStock} {prod.defaultUnit}</strong>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Lotes em Estoque (Mais Próximos do Vencimento):
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {prod.batches.map((batch: any) => {
                      const expDate = new Date(batch.expirationDate).toLocaleDateString('pt-BR');

                      return (
                        <div
                          key={batch.id}
                          className={`p-4 rounded-xl border transition-all space-y-3 relative ${
                            batch.isFefoRecommended
                              ? 'border-brand-300 bg-gradient-to-br from-brand-50/60 to-white ring-2 ring-brand-500/20'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          {batch.isFefoRecommended && (
                            <span className="bg-brand-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                              <Sparkles className="w-3 h-3" /> 🔥 PRÓXIMO AO VENCIMENTO - USAR PRIMEIRO
                            </span>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Número do Lote</span>
                              <span className="font-mono font-extrabold text-slate-900 text-sm">{batch.batchNumber}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Data de Validade</span>
                              <span className="font-extrabold text-brand-700 text-sm">{expDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-slate-500">Saldo no Lote:</span>
                              <strong className="text-slate-900 font-extrabold ml-1">
                                {batch.currentQuantity} {prod.defaultUnit}
                              </strong>
                              {(prod.shelfNumber || prod.shelfRack) && (
                                <span className="block text-[11px] font-bold text-indigo-700 mt-0.5">
                                  📍 Estante {prod.shelfNumber || '-'}{prod.shelfRack ? ` / Prat. ${prod.shelfRack}` : ''}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedBatch(batch);
                                setSelectedProduct(prod);
                              }}
                              className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-3.5 py-1.5 rounded-lg shadow-sm text-xs flex items-center gap-1 active:scale-95 transition-all shrink-0"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Retirar Alimento
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

        {!loading &&
          productsFefo.filter((prod) => prod.totalStock > 0 && prod.batches?.length > 0).length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              Nenhum alimento com estoque disponível encontrado.
            </div>
          )}
      </div>

      {/* Modal / Drawer for Requisition Dispatch */}
      {selectedBatch && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-brand-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-r from-brand-700 to-brand-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5" /> Retirada / Baixa de Alimento
                </h3>
                <p className="text-xs text-brand-100 mt-0.5">
                  Lote: <strong>{selectedBatch.batchNumber}</strong> | Produto: <strong>{selectedProduct.name}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedBatch(null)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="p-6 space-y-4 text-xs">
              {/* Info Banner */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block">Validade deste Lote:</span>
                  <strong className="text-brand-700 font-extrabold text-sm">
                    {new Date(selectedBatch.expirationDate).toLocaleDateString('pt-BR')}
                  </strong>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block">Localização na Estante:</span>
                  <strong className="text-indigo-800 font-black text-sm flex items-center gap-1">
                    📍 {selectedProduct.shelfNumber || selectedProduct.shelfRack ? `Estante ${selectedProduct.shelfNumber || '-'}${selectedProduct.shelfRack ? ` / Prat. ${selectedProduct.shelfRack}` : ''}` : 'Não informada'}
                  </strong>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Saldo Atual do Lote:</span>
                  <strong className="text-slate-900 font-extrabold text-sm">
                    {selectedBatch.currentQuantity} {selectedProduct.defaultUnit}
                  </strong>
                </div>
              </div>

              {/* Requisition Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand-600" /> Solicitante (Professor / Colaborador) *
                  </label>
                  <select
                    required
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {requesters.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.role})
                      </option>
                    ))}
                    {requesters.length === 0 && <option value="Outro Colaborador">Outro Colaborador</option>}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-brand-600" /> Setor / Destino *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    {departments.length === 0 && <option value="Refeitório Central">Refeitório Central</option>}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quantidade a Retirar ({selectedProduct.defaultUnit}) *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max={selectedBatch.currentQuantity}
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Responsável pela Cozinha / Baixa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Digite seu nome (Responsável pela Baixa)..."
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Requirement #6: Retirada Total vs Fracionada Switch */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-extrabold text-slate-900 text-sm">
                  Tipo de Retirada da Embalagem *
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('TOTAL')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      type === 'TOTAL'
                        ? 'border-slate-900 bg-slate-900 text-white font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs uppercase font-extrabold">Retirada Total</span>
                    <span className="text-[11px] opacity-80 block font-normal mt-0.5">
                      Utiliza toda a embalagem/lote. Não haverá sobras.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('FRACIONADO')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      type === 'FRACIONADO'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-xs uppercase font-extrabold text-brand-700">Retirada Fracionada</span>
                      <Tag className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="text-[11px] text-slate-600 block font-normal mt-0.5">
                      Abre a embalagem e armazena o restante. Gera Etiqueta com 1/3 da Validade.
                    </span>
                  </button>
                </div>
              </div>

              {/* Live Expiration calculation for fractioned mode */}
              {type === 'FRACIONADO' && (
                <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 rounded-xl space-y-1 shadow-md">
                  <div className="flex items-center gap-1.5 text-brand-100 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    Cálculo Automático de Validade Fracionada (Regra 1/3)
                  </div>
                  <div className="text-xl font-black">{getCalculatedFractionedExpDate().dateStr}</div>
                  <p className="text-[11px] text-brand-100">
                    Por padrão, calculada como <strong>1/3 da validade original ({getCalculatedFractionedExpDate().oneThirdDays} dias a partir de hoje)</strong>. Uma etiqueta será gerada para colar no recipiente mantido aberto.
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{type === 'FRACIONADO' ? 'Confirmar & Gerar Etiqueta' : 'Confirmar Baixa Total'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Fractioned Label Modal */}
      {generatedLabel && (
        <FractionedLabelModal
          label={generatedLabel.label}
          batch={generatedLabel.batch}
          onClose={() => setGeneratedLabel(null)}
        />
      )}
    </div>
  );
};
