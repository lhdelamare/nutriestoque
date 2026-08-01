import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Trash2, ArrowDownLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Batch } from '../types';
import { TabType } from '../components/Sidebar';

interface Props {
  onNavigate: (tab: TabType) => void;
}

export const AlertsView: React.FC<Props> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<{
    expired: Batch[];
    critical: Batch[];
    warning: Batch[];
    totalAlerts: number;
  }>({ expired: [], critical: [], warning: [], totalAlerts: 0 });

  const [activeTab, setActiveTab] = useState<'expired' | 'critical' | 'warning'>('expired');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/batches/expiring-alerts');
      const data = await res.json();
      setAlerts(data);
      if (data.expired.length === 0 && data.critical.length > 0) {
        setActiveTab('critical');
      } else if (data.expired.length === 0 && data.critical.length === 0 && data.warning.length > 0) {
        setActiveTab('warning');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getActiveList = () => {
    if (activeTab === 'expired') return alerts.expired;
    if (activeTab === 'critical') return alerts.critical;
    return alerts.warning;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900">Alertas de Vencimento de Alimentos</h2>
        <p className="text-xs text-slate-500">
          Monitoramento contínuo de datas de validade para segurança alimentar e redução de desperdício
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('expired')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === 'expired'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Vencidos ({alerts.expired.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('critical')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === 'critical'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Vencem em até 7 dias ({alerts.critical.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warning')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === 'warning'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Vencem em até 30 dias ({alerts.warning.length})</span>
        </button>
      </div>

      {/* Active Tab List */}
      <div className="space-y-3">
        {loading && <p className="text-xs text-slate-400 text-center py-8">Carregando alertas...</p>}

        {!loading &&
          getActiveList().map((batch) => {
            const expDate = new Date(batch.expirationDate).toLocaleDateString('pt-BR');

            return (
              <div
                key={batch.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-200 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      activeTab === 'expired'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : activeTab === 'critical'
                        ? 'bg-brand-100 text-brand-700 border border-brand-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base">{batch.product.name}</h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Nº Lote: {batch.batchNumber}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>
                        Saldo: <strong className="text-slate-900">{batch.currentQuantity} {batch.product.defaultUnit}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Categoria: <strong>{batch.product.category?.name}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Fornecedor: <strong>{batch.purchase?.supplier?.name || 'Não informado'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Data de Validade</span>
                    <strong className="text-sm font-black text-slate-900">{expDate}</strong>
                    <span className="text-[11px] block font-bold text-brand-600 mt-0.5">
                      {batch.daysToExpire! < 0
                        ? `Vencido há ${Math.abs(batch.daysToExpire!)} dia(s)`
                        : `Faltam ${batch.daysToExpire} dia(s)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'expired' ? (
                      <button
                        onClick={() => onNavigate('losses')}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Descartar Lote</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('fefo-dispatch')}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 active:scale-95"
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>Priorizar Uso</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {!loading && getActiveList().length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span>Nenhum alerta nesta categoria no momento.</span>
          </div>
        )}
      </div>
    </div>
  );
};
