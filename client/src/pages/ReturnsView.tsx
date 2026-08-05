import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle2, ArrowRightLeft, UserCheck, Package, AlertCircle, Sparkles, Filter, Check } from 'lucide-react';
import { Dispatch, Requester } from '../types';

interface Props {
  requesters: Requester[];
  onRefreshAll: () => void;
}

export const ReturnsView: React.FC<Props> = ({ requesters, onRefreshAll }) => {
  const [pendingDispatches, setPendingDispatches] = useState<Dispatch[]>([]);
  const [selectedRequester, setSelectedRequester] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Return modal state
  const [returnModalItem, setReturnModalItem] = useState<Dispatch | null>(null);
  const [qtyToReturnInput, setQtyToReturnInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendingReturns = async (reqName?: string) => {
    setLoading(true);
    try {
      const url = reqName
        ? `/api/dispatches/pending-returns?requestedBy=${encodeURIComponent(reqName)}`
        : '/api/dispatches/pending-returns';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPendingDispatches(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReturns(selectedRequester);
  }, [selectedRequester]);

  const handleMarkAsUsed = async (dispatchId: string) => {
    try {
      const res = await fetch(`/api/dispatches/${dispatchId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'USED' })
      });

      if (!res.ok) throw new Error('Erro ao marcar item como usado.');

      setMsg({ type: 'success', text: 'Item marcado como USADO e pendência baixada com sucesso!' });
      fetchPendingReturns(selectedRequester);
      onRefreshAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const openReturnModal = (item: Dispatch) => {
    setReturnModalItem(item);
    const pendingQty = item.quantity - (item.returnedQuantity || 0);
    setQtyToReturnInput(String(pendingQty));
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalItem) return;

    const qty = parseFloat(qtyToReturnInput);
    const pendingQty = returnModalItem.quantity - (returnModalItem.returnedQuantity || 0);

    if (isNaN(qty) || qty <= 0 || qty > pendingQty) {
      setMsg({ type: 'error', text: `Informe uma quantidade entre 0,1 e ${pendingQty}.` });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/dispatches/${returnModalItem.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETURN', quantityToReturn: qty })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao devolver ao estoque.');
      }

      setMsg({ type: 'success', text: `${qty} ${returnModalItem.unit} devolvidos ao estoque com sucesso!` });
      setReturnModalItem(null);
      fetchPendingReturns(selectedRequester);
      onRefreshAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-200 font-medium text-sm mb-1">
            <RotateCcw className="w-4 h-4 text-brand-300" />
            <span>Gestão de Retornos & Devoluções</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Controle de Devoluções de Estoque</h1>
          <p className="text-brand-100 text-xs sm:text-sm mt-1">
            Selecione o professor/solicitante para registrar o que foi usado e o que retornou para o estoque.
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl font-medium text-sm flex items-center justify-between shadow-sm ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-xs text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-brand-600 shrink-0" />
          <span className="text-sm font-bold text-slate-700">Filtrar por Solicitante / Professor:</span>
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              placeholder="Digite ou selecione o professor..."
              value={selectedRequester}
              onChange={(e) => setSelectedRequester(e.target.value)}
              list="requesters-list-filter"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-semibold text-slate-900 w-64"
            />
            <datalist id="requesters-list-filter">
              {requesters.map((req) => (
                <option key={req.id} value={req.name}>
                  {req.name} ({req.role})
                </option>
              ))}
            </datalist>

            {selectedRequester && (
              <button
                onClick={() => setSelectedRequester('')}
                className="text-xs text-brand-600 hover:text-brand-800 font-bold px-2 py-1 bg-brand-50 rounded border border-brand-200 shrink-0"
              >
                Ver Todos
              </button>
            )}
          </div>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>{pendingDispatches.length} pendência(s) de devolução</span>
        </div>
      </div>

      {/* List of Pending Dispatches */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500 font-medium animate-pulse">Carregando retiradas pendentes...</p>
        </div>
      ) : pendingDispatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Nenhuma devolução pendente!</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Todas as retiradas registradas para este filtro já foram confirmadas como usadas ou devolvidas ao estoque.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingDispatches.map((item) => {
            const pendingQty = item.quantity - (item.returnedQuantity || 0);
            const formattedDate = new Date(item.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

            const prod = item.batch?.product;
            const locationStr =
              prod?.shelfNumber || prod?.shelfRack
                ? `Estante ${prod.shelfNumber || '-'} / Prat. ${prod.shelfRack || '-'}`
                : null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.department}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base">{prod?.name || 'Produto'}</h4>
                    </div>
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      Pendente
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1 text-slate-600">
                    <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                      <span>{item.requestedBy}</span>
                    </p>
                    <p className="text-[11px]">Retirado em: {formattedDate}</p>
                    {locationStr && (
                      <p className="text-[11px] font-medium text-brand-700">📍 Local: {locationStr}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Qtd Retirada Original:</span>
                    <span className="font-bold text-slate-800">
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  {item.returnedQuantity && item.returnedQuantity > 0 ? (
                    <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50 p-1.5 rounded">
                      <span>Já devolvido:</span>
                      <span className="font-bold">
                        {item.returnedQuantity} {item.unit}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-sm bg-brand-50 p-2 rounded-lg border border-brand-100">
                    <span className="font-bold text-brand-800 text-xs">Pendente para Devolução/Uso:</span>
                    <span className="font-black text-brand-700 text-base">
                      {pendingQty} {item.unit}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleMarkAsUsed(item.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                    title="Marcar que o produto foi consumido/usado totalmente"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Foi Usado</span>
                  </button>

                  <button
                    onClick={() => openReturnModal(item)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                    title="Devolver produto totalmente ou parcialmente para o estoque"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Devolver</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Modal */}
      {returnModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-brand-600" />
                <h3 className="font-extrabold text-slate-900 text-lg">Devolver ao Estoque</h3>
              </div>
              <button
                onClick={() => setReturnModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800 text-sm">
                {returnModalItem.batch?.product?.name || 'Produto'}
              </p>
              <p className="text-slate-600">Solicitante: <strong>{returnModalItem.requestedBy}</strong></p>
              <p className="text-slate-600">
                Pendente total: <strong>{returnModalItem.quantity - (returnModalItem.returnedQuantity || 0)} {returnModalItem.unit}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade a Retornar para o Estoque ({returnModalItem.unit}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={returnModalItem.quantity - (returnModalItem.returnedQuantity || 0)}
                  value={qtyToReturnInput}
                  onChange={(e) => setQtyToReturnInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-base font-bold text-brand-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Essa quantidade voltará imediatamente para o saldo em estoque do lote.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar Devolução'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
