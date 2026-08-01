import React from 'react';
import { X, Printer, Calendar, Clock, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';
import { FractionedLabel, Batch } from '../types';

interface Props {
  label: FractionedLabel;
  batch: Batch;
  onClose: () => void;
}

export const FractionedLabelModal: React.FC<Props> = ({ label, batch, onClose }) => {
  const openDateStr = new Date(label.openDate).toLocaleDateString('pt-BR');
  const openTimeStr = new Date(label.openDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const newExpDateStr = new Date(label.newExpirationDate).toLocaleDateString('pt-BR');
  const origExpDateStr = new Date(batch.expirationDate).toLocaleDateString('pt-BR');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-brand-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Etiqueta de Validade Fracionada</h2>
              <p className="text-xs text-brand-100 font-medium">Código: {label.labelCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Container */}
        <div className="p-6 space-y-5" id="printable-label">
          {/* Main Product Banner */}
          <div className="bg-brand-50 border-2 border-dashed border-brand-300 rounded-xl p-4 text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-brand-700 bg-brand-100 px-3 py-1 rounded-full inline-block mb-2">
              Alimento Aberto / Fracionado
            </span>
            <h3 className="text-xl font-black text-slate-900">{batch?.product?.name || 'Alimento'}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Lote de Origem: <strong className="text-slate-800">{batch?.batchNumber || 'LOTE'}</strong>
            </p>
          </div>

          {/* Expiration Highlight */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-xl p-4 shadow-md flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-brand-100 text-xs font-semibold uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4" />
                Nova Validade (1/3 Regra Padrão)
              </div>
              <div className="text-2xl font-black">{newExpDateStr}</div>
              <p className="text-[11px] text-brand-100/90 mt-0.5">
                Consumir até esta data após a abertura do lacre.
              </p>
            </div>
            <div className="text-right border-l border-white/20 pl-4">
              <span className="text-[10px] text-brand-200 block uppercase">Validade Original</span>
              <span className="text-xs font-bold text-white line-through">{origExpDateStr}</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Data de Abertura</span>
              <strong className="text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                {openDateStr} às {openTimeStr}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Responsável</span>
              <strong className="text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {label.printedBy || 'Nutrição/Cozinha'}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Quantidade Retirada</span>
              <strong className="text-brand-700 text-sm">
                {label.fractionedQuantity} {batch?.product?.defaultUnit || 'UN'}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Restante no Lote</span>
              <strong className="text-slate-800 text-sm">
                {label.remainingQuantity} {batch?.product?.defaultUnit || 'UN'}
              </strong>
            </div>
          </div>

          {/* Storage Instructions */}
          {batch?.product?.storageInstructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Instruções de Armazenamento:</strong>
                {batch.product.storageInstructions}
              </div>
            </div>
          )}

          {/* Barcode Mock */}
          <div className="pt-2 text-center">
            <div className="inline-block bg-slate-900 text-white font-mono text-[10px] tracking-widest px-6 py-2 rounded-md font-bold">
              ||| | |||| ||||| || ||| | ||| {label.labelCode}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Cole esta etiqueta no recipiente armazenado</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Etiqueta
          </button>
        </div>
      </div>
    </div>
  );
};
