import React from 'react';
import {
  LayoutDashboard,
  Truck,
  ShoppingCart,
  ArrowDownLeft,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Package,
  Users,
  Sparkles,
  LogOut
} from 'lucide-react';
import { User } from '../types';

export type TabType =
  | 'dashboard'
  | 'fefo-dispatch'
  | 'returns'
  | 'purchases'
  | 'suppliers'
  | 'losses'
  | 'alerts'
  | 'products'
  | 'team';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  alertCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  currentUser?: User | null;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  alertCount,
  isMobileOpen,
  onCloseMobile,
  onLogout,
  currentUser
}) => {
  const allMenuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      highlight: false
    },
    {
      id: 'fefo-dispatch' as TabType,
      label: 'Retirada de Produtos',
      icon: ArrowDownLeft,
      highlight: true
    },
    {
      id: 'returns' as TabType,
      label: 'Devoluções de Estoque',
      icon: RotateCcw,
      highlight: true
    },
    {
      id: 'purchases' as TabType,
      label: 'Entrada de Compras',
      icon: ShoppingCart,
      highlight: false
    },
    {
      id: 'suppliers' as TabType,
      label: 'Fornecedores',
      icon: Truck,
      highlight: false
    },
    {
      id: 'team' as TabType,
      label: 'Setores & Equipe',
      icon: Users,
      highlight: false
    },
    {
      id: 'losses' as TabType,
      label: 'Controle de Perdas',
      icon: Trash2,
      highlight: false
    },
    {
      id: 'alerts' as TabType,
      label: 'Alertas de Validade',
      icon: AlertTriangle,
      count: alertCount,
      highlight: false
    },
    {
      id: 'products' as TabType,
      label: 'Catálogo de Alimentos',
      icon: Package,
      highlight: false
    }
  ];

  // Filter items for non-admin users (e.g. PROFESSOR)
  const isProfessor = currentUser?.role === 'PROFESSOR';
  const menuItems = isProfessor
    ? allMenuItems.filter((item) => item.id === 'fefo-dispatch' || item.id === 'returns')
    : allMenuItems;

  const handleSelect = (tab: TabType) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          {isProfessor ? 'Acesso do Solicitante / Professor' : 'Menu de Controle Escolar'}
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-sm transition-all ${
                isActive
                  ? item.highlight
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/20'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? item.highlight
                        ? 'text-white'
                        : 'text-brand-600'
                      : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 pt-2">
        {/* Helpful info box */}
        <div className="bg-gradient-to-br from-brand-50 to-indigo-100/60 rounded-xl p-3.5 border border-brand-200 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-brand-800 font-bold">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Validade & Fracionamento</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Retirada priorizada por <strong>vencimento mais próximo</strong>. Itens abertos calculam <strong>1/3 da validade</strong>.
          </p>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-4 shrink-0 flex-col justify-between min-h-[calc(100vh-4rem)]">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-16 left-0 bottom-0 w-72 bg-white border-r border-slate-200 p-4 z-50 md:hidden overflow-y-auto transition-transform duration-200 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
};
