import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles, School, AlertCircle, Database, CheckCircle2, RefreshCw } from 'lucide-react';
import { User as UserType } from '../types';

interface Props {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Database Connection Diagnostic State
  const [dbStatus, setDbStatus] = useState<{
    loading: boolean;
    connected: boolean;
    host?: string;
    dbName?: string;
    error?: string;
  }>({ loading: true, connected: false });

  // Login Form
  const [email, setEmail] = useState('admin@senai.br');
  const [password, setPassword] = useState('admin123');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'ADMIN' | 'NUTRICIONISTA' | 'COZINHA'>('ADMIN');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const checkDbConnection = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (res.ok && data.dbConnected) {
        setDbStatus({
          loading: false,
          connected: true,
          host: data.dbHost,
          dbName: data.dbName
        });
      } else {
        setDbStatus({
          loading: false,
          connected: false,
          host: data.dbHost,
          dbName: data.dbName,
          error: data.error || 'Não foi possível conectar ao MySQL.'
        });
      }
    } catch (err: any) {
      setDbStatus({
        loading: false,
        connected: false,
        error: 'Erro de comunicação HTTP com o servidor API.'
      });
    }
  };

  useEffect(() => {
    checkDbConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName || !regEmail || !regPassword) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar usuário.');
      }

      setSuccessMsg('Usuário cadastrado com sucesso! Faça login com as novas credenciais.');
      setIsRegisterMode(false);
      setEmail(regEmail);
      setPassword(regPassword);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-slate-50 to-red-100/60 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-brand-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top SENAI Banner Header */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-red-600 p-8 text-white text-center space-y-3 relative overflow-hidden">
          <div className="inline-block bg-white p-2.5 rounded-2xl shadow-lg border border-white/20 mb-1">
            <img
              src="https://www.sp.senai.br/images/senai.svg"
              alt="Logo SENAI"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div>
            <span className="bg-white/20 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <School className="w-3 h-3" /> Gestão Escolar de Alimentos
            </span>
            <h2 className="text-2xl font-black mt-1">NutriEstoque</h2>
            <p className="text-brand-100 text-xs mt-0.5">
              Controle de Compras, Estoque FEFO & Validade
            </p>
          </div>
        </div>

        {/* Card Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* MySQL Connection Status Diagnostic Banner */}
          <div className="rounded-xl border p-3 text-xs space-y-1 bg-slate-50 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                <Database className="w-3.5 h-3.5 text-brand-600" />
                <span>Status da Conexão MySQL:</span>
              </div>
              <button
                type="button"
                onClick={checkDbConnection}
                title="Testar Conexão Novamente"
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dbStatus.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {dbStatus.loading ? (
              <p className="text-[11px] text-slate-500 italic">Testando conexão com o MySQL no servidor...</p>
            ) : dbStatus.connected ? (
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>🟢 Conectado ao MySQL (`{dbStatus.host}/{dbStatus.dbName}`)</span>
              </div>
            ) : (
              <div className="space-y-1.5 text-red-700 font-bold text-[11px]">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>🔴 FALHA NA CONEXÃO MYSQL (`{dbStatus.host || 'desconhecido'}`)</span>
                </div>
                {dbStatus.error && (
                  <div className="bg-red-100/80 p-2 rounded-lg text-[10px] font-mono font-medium border border-red-200 text-red-950 break-words leading-relaxed">
                    {dbStatus.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isRegisterMode ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail de Acesso</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@senai.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 text-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">Criar Nova Conta de Usuário</h3>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Profa. Maria Oliveira"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="novo.usuario@senai.br"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Senha *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perfil de Acesso</label>
                <select
                  value={regRole}
                  onChange={(e: any) => setRegRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                  <option value="NUTRICIONISTA">Nutricionista / Gestão</option>
                  <option value="COZINHA">Operador de Cozinha / Retiradas</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow text-xs"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          )}

          {/* Switch Mode & Demo Shortcuts */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
              }}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              {isRegisterMode
                ? 'Já possui uma conta? Faça login aqui'
                : 'Não possui conta? Cadastrar novo usuário'}
            </button>

            {!isRegisterMode && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] space-y-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                  ⚡ Acesso Rápido de Teste (Demo)
                </span>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@senai.br', 'admin123')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold shadow-xs text-[11px]"
                  >
                    Admin (admin@senai.br)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('nutri@senai.br', 'senai123')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold shadow-xs text-[11px]"
                  >
                    Nutri (nutri@senai.br)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
