import React, { useState } from 'react';
import { Trash2, AlertTriangle, Plus, CheckCircle2, DollarSign, Calendar, FileText } from 'lucide-react';
import { Loss, Batch } from '../types';

interface Props {
  losses: Loss[];
  batches: Batch[];
  onRefreshAll: () => void;
}

export const LossesView: React.FC<Props> = ({ losses, batches, onRefreshAll }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<'VENCIMENTO' | 'AVARIA' | 'DETERIORACAO' | 'CONTAMINACAO' | 'OUTROS'>('VENCIMENTO');
  const [reportedBy, setReportedBy] = useState('Nutricionista / Cozinha');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedBatch = batches.find((b) => b.id === batchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!batchId || !quantity || !reason || !reportedBy) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/losses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          quantity: parseFloat(quantity),
          reason,
          reportedBy,
          notes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao registrar perda.');
      }

      setIsModalOpen(false);
      setBatchId('');
      setQuantity('1');
      setNotes('');
      onRefreshAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalLossValue = losses.reduce(
    (sum, l) => sum + l.quantity * (l.batch?.unitPrice || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Controle de Perdas & Descartes</h2>
          <p className="text-xs text-slate-500">
            Registro auditável de alimentos descartados por vencimento, avaria de embalagem ou contaminação
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Novo Descarte</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Ocorrências</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{losses.length} descarte(s)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Alimentos retirados de circulação</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prejuízo Financeiro Estimado</p>
            <h3 className="text-2xl font-black text-brand-600 mt-1">{formatCurrency(totalLossValue)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Valor total dos alimentos descartados</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Losses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm">Histórico Completo de Perdas</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Produto / Lote</th>
                <th className="p-4">Quantidade Descartada</th>
                <th className="p-4">Motivo do Descarte</th>
                <th className="p-4">Registrado por</th>
                <th className="p-4 text-right">Custo da Perda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {losses.map((loss) => {
                const dateStr = new Date(loss.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const lossCost = loss.quantity * (loss.batch?.unitPrice || 0);

                return (
                  <tr key={loss.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-500 font-mono">{dateStr}</td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{loss.batch.product.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Nº Lote: <strong className="text-slate-700 font-mono">{loss.batch.batchNumber}</strong>
                      </div>
                    </td>

                    <td className="p-4">
                      <strong className="text-brand-700 text-sm font-black">
                        {loss.quantity} {loss.batch.product.defaultUnit}
                      </strong>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          loss.reason === 'VENCIMENTO'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : loss.reason === 'DETERIORACAO'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : loss.reason === 'AVARIA'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {loss.reason}
                      </span>
                      {loss.notes && <p className="text-[11px] text-slate-400 mt-1 italic">{loss.notes}</p>}
                    </td>

                    <td className="p-4 text-slate-800 font-semibold">{loss.reportedBy}</td>

                    <td className="p-4 text-right font-black text-slate-900">
                      {formatCurrency(lossCost)}
                    </td>
                  </tr>
                );
              })}

              {losses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhum descarte registrado no histórico.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Descarte */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-brand-500" />
                Registrar Descarte de Alimento
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
                <label className="block font-bold text-slate-700 mb-1">Selecione o Lote do Alimento *</label>
                <select
                  required
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Selecione um lote...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.product.name} - Lote: {b.batchNumber} (Saldo: {b.currentQuantity} {b.product.defaultUnit} | Val: {new Date(b.expirationDate).toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBatch && (
                <div className="bg-brand-50 border border-brand-200 p-3 rounded-xl text-brand-900 flex justify-between items-center">
                  <span>Saldo disponível neste lote:</span>
                  <strong className="text-sm font-extrabold">
                    {selectedBatch.currentQuantity} {selectedBatch.product.defaultUnit}
                  </strong>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantidade a Descartar *</label>
                  <input
                    type="number"
                    min="0.1"
                    max={selectedBatch?.currentQuantity}
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motivo do Descarte *</label>
                  <select
                    value={reason}
                    onChange={(e: any) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="VENCIMENTO">Data de Validade Expirada</option>
                    <option value="AVARIA">Avaria / Embalagem Rasgada</option>
                    <option value="DETERIORACAO">Deterioração / Estragado</option>
                    <option value="CONTAMINACAO">Suspeita de Contaminação</option>
                    <option value="OUTROS">Outros Motivos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Responsável pelo Registro *</label>
                <input
                  type="text"
                  required
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Adicionais</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Embalagem chegou furada na entrega"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  Confirmar Descarte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
