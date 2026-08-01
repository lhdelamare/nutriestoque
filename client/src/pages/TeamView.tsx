import React, { useState, useEffect } from 'react';
import { Users, School, Plus, Trash2, Edit3, ShieldCheck, CheckCircle2, XCircle, Phone, Lock, Mail } from 'lucide-react';
import { Department, Requester, User } from '../types';

interface Props {
  departments: Department[];
  requesters: Requester[];
  onRefresh: () => void;
}

export const TeamView: React.FC<Props> = ({ departments, requesters, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'requesters' | 'departments' | 'users'>('requesters');
  const [showInactive, setShowInactive] = useState(false);

  // System Users state
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  // Requester Edit / Create Modal State
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingRequester, setEditingRequester] = useState<Requester | null>(null);
  const [reqName, setReqName] = useState('');
  const [reqRole, setReqRole] = useState<'PROFESSOR' | 'MERENDEIRA' | 'INSPETOR' | 'DIRECAO' | 'OUTRO'>('PROFESSOR');
  const [reqDepartmentId, setReqDepartmentId] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqStatus, setReqStatus] = useState('ACTIVE');

  // Department Edit / Create Modal State
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [depName, setDepName] = useState('');
  const [depDescription, setDepDescription] = useState('');
  const [depStatus, setDepStatus] = useState('ACTIVE');

  // System User Edit / Create Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'NUTRICIONISTA' | 'COZINHA'>('ADMIN');
  const [userStatus, setUserStatus] = useState('ACTIVE');

  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) setSystemUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- REQUESTER HANDLERS ---
  const openNewReqModal = () => {
    setEditingRequester(null);
    setReqName('');
    setReqRole('PROFESSOR');
    setReqDepartmentId(departments[0]?.id || '');
    setReqPhone('');
    setReqStatus('ACTIVE');
    setErrorMsg('');
    setIsReqModalOpen(true);
  };

  const openEditReqModal = (req: Requester) => {
    setEditingRequester(req);
    setReqName(req.name);
    setReqRole(req.role);
    setReqDepartmentId(req.departmentId || '');
    setReqPhone(req.phone || '');
    setReqStatus(req.status || 'ACTIVE');
    setErrorMsg('');
    setIsReqModalOpen(true);
  };

  const handleSaveRequester = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!reqName.trim()) return setErrorMsg('Nome é obrigatório.');

    try {
      const payload = {
        name: reqName,
        role: reqRole,
        departmentId: reqDepartmentId || undefined,
        phone: reqPhone,
        status: reqStatus
      };

      let res;
      if (editingRequester) {
        res = await fetch(`/api/requesters/${editingRequester.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/requesters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Erro ao salvar colaborador.');

      setIsReqModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleInactivateRequester = async (id: string) => {
    if (!confirm('Deseja inativar este colaborador? O registro será mantido para integridade dos dados.')) return;
    try {
      await fetch(`/api/requesters/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      alert('Erro ao inativar colaborador.');
    }
  };

  // --- DEPARTMENT HANDLERS ---
  const openNewDepModal = () => {
    setEditingDepartment(null);
    setDepName('');
    setDepDescription('');
    setDepStatus('ACTIVE');
    setErrorMsg('');
    setIsDepModalOpen(true);
  };

  const openEditDepModal = (dep: Department) => {
    setEditingDepartment(dep);
    setDepName(dep.name);
    setDepDescription(dep.description || '');
    setDepStatus(dep.status || 'ACTIVE');
    setErrorMsg('');
    setIsDepModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!depName.trim()) return setErrorMsg('Nome do setor é obrigatório.');

    try {
      const payload = { name: depName, description: depDescription, status: depStatus };

      let res;
      if (editingDepartment) {
        res = await fetch(`/api/departments/${editingDepartment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Erro ao salvar setor.');

      setIsDepModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleInactivateDepartment = async (id: string) => {
    if (!confirm('Deseja inativar este setor? O histórico será preservado.')) return;
    try {
      await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      alert('Erro ao inativar setor.');
    }
  };

  // --- SYSTEM USER HANDLERS ---
  const openNewUserModal = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('ADMIN');
    setUserStatus('ACTIVE');
    setErrorMsg('');
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword(user.password || ''); // User password edit option
    setUserRole(user.role);
    setUserStatus(user.status || 'ACTIVE');
    setErrorMsg('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!userName || !userEmail) return setErrorMsg('Nome e E-mail são obrigatórios.');

    try {
      const payload: any = {
        name: userName,
        email: userEmail,
        role: userRole,
        status: userStatus
      };
      if (userPassword) payload.password = userPassword;

      let res;
      if (editingUser) {
        res = await fetch(`/api/auth/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        if (!userPassword) return setErrorMsg('Senha é obrigatória para novo usuário.');
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar usuário.');
      }

      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleInactivateUser = async (id: string) => {
    if (!confirm('Deseja inativar este usuário? O login será desabilitado mas o cadastro permanece mantido.')) return;
    try {
      await fetch(`/api/auth/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      alert('Erro ao inativar usuário.');
    }
  };

  // Reactivate handlers
  const handleReactivateRequester = async (req: Requester) => {
    try {
      await fetch(`/api/requesters/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...req, status: 'ACTIVE' })
      });
      onRefresh();
    } catch (err) {
      alert('Erro ao reativar colaborador.');
    }
  };

  const handleReactivateDepartment = async (dep: Department) => {
    try {
      await fetch(`/api/departments/${dep.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dep, status: 'ACTIVE' })
      });
      onRefresh();
    } catch (err) {
      alert('Erro ao reativar setor.');
    }
  };

  const handleReactivateUser = async (user: User) => {
    try {
      await fetch(`/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, status: 'ACTIVE' })
      });
      fetchUsers();
    } catch (err) {
      alert('Erro ao reativar usuário.');
    }
  };

  const filteredRequesters = requesters.filter((r) => showInactive || r.status !== 'INACTIVE');
  const filteredDepartments = departments.filter((d) => showInactive || d.status !== 'INACTIVE');
  const filteredUsers = systemUsers.filter((u) => showInactive || u.status !== 'INACTIVE');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Gestão de Setores, Equipe & Usuários</h2>
          <p className="text-xs text-slate-500">
            Cadastre e edite os setores da escola, professores/colaboradores e usuários de acesso ao sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'requesters' && (
            <button
              onClick={openNewReqModal}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Colaborador</span>
            </button>
          )}

          {activeTab === 'departments' && (
            <button
              onClick={openNewDepModal}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Setor</span>
            </button>
          )}

          {activeTab === 'users' && (
            <button
              onClick={openNewUserModal}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário do Sistema</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('requesters')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
              activeTab === 'requesters'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Professores & Colaboradores ({filteredRequesters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
              activeTab === 'departments'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Setores da Escola ({filteredDepartments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
              activeTab === 'users'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Usuários do Sistema ({filteredUsers.length})</span>
          </button>
        </div>

        {/* Show Inactive Checkbox */}
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
          />
          <span>Mostrar Inativos</span>
        </label>
      </div>

      {/* Content Tab 1: Requesters */}
      {activeTab === 'requesters' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Nome do Colaborador / Professor</th>
                  <th className="p-4">Cargo / Função</th>
                  <th className="p-4">Setor de Atuação</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRequesters.map((req) => (
                  <tr key={req.id} className={`transition-colors ${req.status === 'INACTIVE' ? 'bg-slate-100/50 opacity-70' : 'hover:bg-slate-50/80'}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {req.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{req.name}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          req.role === 'PROFESSOR'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : req.role === 'MERENDEIRA'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : req.role === 'DIRECAO'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {req.role}
                      </span>
                    </td>

                    <td className="p-4">
                      {req.department ? (
                        <span className="font-semibold text-slate-800">{req.department.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Geral / Não vinculado</span>
                      )}
                    </td>

                    <td className="p-4 text-slate-600">
                      {req.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {req.phone}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status !== 'INACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {req.status !== 'INACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {req.status !== 'INACTIVE' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditReqModal(req)}
                          className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {req.status !== 'INACTIVE' ? (
                          <button
                            onClick={() => handleInactivateRequester(req.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Inativar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateRequester(req)}
                            className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-[10px] font-bold"
                            title="Reativar Colaborador"
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRequesters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Nenhum professor ou colaborador encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Tab 2: Departments */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dep) => (
            <div
              key={dep.id}
              className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 ${dep.status === 'INACTIVE' ? 'opacity-60 bg-slate-50' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <School className="w-5 h-5 text-brand-600" />
                    <h3 className="font-extrabold text-slate-900 text-base">{dep.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditDepModal(dep)}
                      className="text-slate-500 hover:text-brand-600 p-1 rounded-lg"
                      title="Editar Setor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {dep.status !== 'INACTIVE' ? (
                      <button
                        onClick={() => handleInactivateDepartment(dep.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg"
                        title="Inativar Setor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivateDepartment(dep)}
                        className="px-2 py-0.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded text-[10px] font-bold"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                </div>

                {dep.description && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {dep.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Status: <strong className={dep.status !== 'INACTIVE' ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>{dep.status !== 'INACTIVE' ? 'Ativo' : 'Inativo'}</strong></span>
                <strong className="text-slate-800 font-bold">{dep._count?.requesters || 0} pessoa(s)</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Tab 3: System Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Nome do Usuário</th>
                  <th className="p-4">E-mail de Acesso</th>
                  <th className="p-4">Senha</th>
                  <th className="p-4">Perfil / Permissão</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`transition-colors ${u.status === 'INACTIVE' ? 'bg-slate-100/50 opacity-70' : 'hover:bg-slate-50/80'}`}>
                    <td className="p-4 font-bold text-slate-900 text-sm flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">{u.email}</td>

                    <td className="p-4 font-mono text-slate-500">
                      {u.password ? '••••••••' : '-'}
                    </td>

                    <td className="p-4">
                      <span className="bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                        {u.role}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.status !== 'INACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.status !== 'INACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.status !== 'INACTIVE' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Editar Usuário"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {u.status !== 'INACTIVE' ? (
                          <button
                            onClick={() => handleInactivateUser(u.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Inativar Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateUser(u)}
                            className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-[10px] font-bold"
                            title="Reativar Usuário"
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição de Colaborador */}
      {isReqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-400" />
                {editingRequester ? 'Editar Colaborador' : 'Cadastrar Colaborador'}
              </h3>
              <button onClick={() => setIsReqModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRequester} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Profa. Ana Paula Souza"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Função / Cargo *</label>
                <select
                  value={reqRole}
                  onChange={(e: any) => setReqRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="PROFESSOR">Professor(a)</option>
                  <option value="MERENDEIRA">Merendeira / Cozinha</option>
                  <option value="INSPETOR">Inspetor(a) de Alunos</option>
                  <option value="DIRECAO">Direção / Coordenação</option>
                  <option value="OUTRO">Outro Colaborador</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Setor de Atuação</label>
                <select
                  value={reqDepartmentId}
                  onChange={(e) => setReqDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="">Selecione o Setor...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone / Celular</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={reqPhone}
                  onChange={(e) => setReqPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={reqStatus}
                  onChange={(e) => setReqStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReqModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  {editingRequester ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição de Setor */}
      {isDepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <School className="w-5 h-5 text-brand-400" />
                {editingDepartment ? 'Editar Setor' : 'Cadastrar Setor'}
              </h3>
              <button onClick={() => setIsDepModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Setor / Turma *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Berçário 1 e 2, Refeitório"
                  value={depName}
                  onChange={(e) => setDepName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Atendimento às crianças de 0 a 2 anos"
                  value={depDescription}
                  onChange={(e) => setDepDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={depStatus}
                  onChange={(e) => setDepStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDepModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md"
                >
                  {editingDepartment ? 'Salvar Alterações' : 'Cadastrar Setor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição de Usuário do Sistema */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                {editingUser ? 'Editar Usuário do Sistema' : 'Cadastrar Usuário do Sistema'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Profa. Maria Oliveira"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail de Acesso *</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@senai.br"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Senha {editingUser && '(Deixe em branco se não quiser alterar)'} *
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder="••••••••"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perfil / Permissão</label>
                <select
                  value={userRole}
                  onChange={(e: any) => setUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                  <option value="NUTRICIONISTA">Nutricionista / Gestão</option>
                  <option value="COZINHA">Operador de Cozinha / Retiradas</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar Conta de Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
