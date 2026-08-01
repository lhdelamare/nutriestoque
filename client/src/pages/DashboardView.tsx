import React from 'react';
import {
  Truck,
  Package,
  AlertTriangle,
  DollarSign,
  Trash2,
  ArrowDownLeft,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { DashboardMetrics, Dispatch, Purchase, Batch } from '../types';
import { TabType } from '../components/Sidebar';

interface Props {
  metrics: DashboardMetrics | null;
  recentDispatches: Dispatch[];
  recentPurchases: Purchase[];
  expiringBatches: Batch[];
  onNavigate: (tab: TabType) => void;
}

export const DashboardView: React.FC<Props> = ({
  metrics,
  recentDispatches,
  recentPurchases,
  expiringBatches,
  onNavigate
}) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Carregando informações do painel...
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Action */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-700/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Recomendação Diária da Cozinha Escolar
          </span>
          <h2 className="text-2xl font-black mt-2">Sistema de Baixa por Validade (FEFO)</h2>
          <p className="text-brand-100 text-sm mt-1 max-w-2xl">
            Priorize o uso dos produtos com menor tempo de validade. Ao retirar produtos fracionados, o sistema calcula a nova validade de 1/3 e gera a etiqueta de armazenamento.
          </p>
        </div>
        <button
          onClick={() => onNavigate('fefo-dispatch')}
          className="bg-white text-brand-700 hover:bg-brand-50 font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 hover:gap-3 transition-all shrink-0 active:scale-95"
        >
          <ArrowDownLeft className="w-5 h-5 text-brand-600" />
          <span>Dar Baixa em Produtos</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor em Estoque</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(metrics.totalInventoryValue)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{metrics.activeBatchesCount} lotes ativos no depósito</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alertas de Vencimento</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-brand-600">
                {metrics.expiredCount + metrics.criticalCount}
              </h3>
              <span className="text-xs font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md">
                {metrics.expiredCount} vencidos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{metrics.criticalCount} vencem em até 7 dias</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fornecedores Ativos</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.suppliersCount}</h3>
            <p className="text-xs text-slate-400 mt-1">{metrics.productsCount} itens no catálogo</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perdas & Descartes</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalLossesCount}
            </h3>
            <p className="text-xs text-brand-600 font-semibold mt-1">
              Total: {formatCurrency(metrics.totalLossesValue)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Prioridade de Uso (Produtos que Vencem Mais Rápido) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              <h3 className="font-extrabold text-slate-900 text-lg">Alimentos Próximos do Vencimento (Usar Primeiro)</h3>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Estes lotes devem ser priorizados no cardápio escolar para evitar perdas e desperdícios.
          </p>

          <div className="space-y-3">
            {expiringBatches.slice(0, 4).map((batch) => {
              const expDate = new Date(batch.expirationDate).toLocaleDateString('pt-BR');

              return (
                <div
                  key={batch.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${batch.daysToExpire! <= 3 ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-amber-100 text-amber-800'}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{batch.product.name}</h4>
                      <div className="mt-0.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono inline-block">
                          Lote: {batch.batchNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Saldo: <strong className="text-slate-800">{batch.currentQuantity} {batch.product.defaultUnit}</strong> | Vencimento: <strong className="text-brand-700">{expDate}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      batch.daysToExpire! < 0
                        ? 'bg-red-600 text-white'
                        : batch.daysToExpire! <= 3
                        ? 'bg-brand-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {batch.daysToExpire! < 0
                        ? 'VENCIDO'
                        : batch.daysToExpire === 0
                        ? 'VENCE HOJE'
                        : `Vence em ${batch.daysToExpire} dias`}
                    </span>

                    <button
                      onClick={() => onNavigate('fefo-dispatch')}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg transition-colors"
                      title="Ir para tela de baixa"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {expiringBatches.length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span>Nenhum alimento próximo do vencimento no momento. Todos os lotes estão em dia!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Últimas Baixas Realizadas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">Últimas Retiradas</h3>
            <button
              onClick={() => onNavigate('fefo-dispatch')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Nova Baixa
            </button>
          </div>

          <div className="space-y-3">
            {recentDispatches.map((disp) => {
              const dateStr = new Date(disp.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={disp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-start justify-between font-bold text-slate-900">
                    <div>
                      <span className="block font-black text-slate-900">{disp.batch.product.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 block font-semibold">Lote: {disp.batch.batchNumber}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] shrink-0 ${disp.type === 'FRACIONADO' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-200 text-slate-700'}`}>
                      {disp.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Qtd: <strong className="text-slate-800">{disp.quantity} {disp.unit}</strong></span>
                    <span>Prof: <strong className="text-slate-800">{disp.requestedBy}</strong></span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                    <span>Setor: {disp.department}</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
              );
            })}

            {recentDispatches.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Nenhuma baixa registrada recentemente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
