import React from 'react';
import { UtensilsCrossed, Bell, ShieldAlert, School, Calendar, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface Props {
  alertCount: number;
  onNavigateAlerts: () => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Header: React.FC<Props> = ({
  alertCount,
  onNavigateAlerts,
  isMobileMenuOpen,
  onToggleMobileMenu,
  currentUser,
  onLogout
}) => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with SENAI Logo & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Abrir Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-brand-600" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
            <img
              src="https://www.sp.senai.br/images/senai.svg"
              alt="Logo SENAI"
              className="h-8 w-auto object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">NutriEstoque</h1>
              <span className="hidden sm:flex bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-200 items-center gap-1">
                <School className="w-3 h-3" /> Gestão Escolar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Controle de Compras & Validade de Alimentos</p>
          </div>
        </div>

        {/* Right Info, User Profile & Alerts */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-slate-800 font-bold">{currentUser.name}</span>
              <span className="text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded uppercase font-extrabold">
                {currentUser.role}
              </span>
            </div>
          )}

          <button
            onClick={onNavigateAlerts}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              alertCount > 0
                ? 'bg-brand-50 text-brand-700 border border-brand-300 hover:bg-brand-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bell className={`w-4 h-4 ${alertCount > 0 ? 'text-brand-600 animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Alertas</span>
            {alertCount > 0 && (
              <span className="bg-brand-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                {alertCount}
              </span>
            )}
          </button>

          {currentUser && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="hidden sm:inline text-red-700">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
