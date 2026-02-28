import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../utils/storage';
import { Subscriber, Package, Barber } from '../../types';
import { Plus, Edit2, Trash2, X, MessageCircle, UserCheck, Check, AlertTriangle, XCircle, Search, DollarSign, Users, TrendingUp, Clock, Crown } from 'lucide-react';

const AdminSubscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const role = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');
  const isAdmin = role === 'ADMIN';

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);

  // --- Form States for Edit ---
  const [editStatus, setEditStatus] = useState<Subscriber['status']>('active');
  const [editAmount, setEditAmount] = useState<number>(0);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setSubscribers(storage.getSubscribers());
    setPackages(storage.getPackages());
    setBarbers(storage.getBarbers());
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- Derived Data: Filter Subscribers for Barbers ---
  // If Admin: See All. If Barber: See Only Linked.
  const visibleSubscribers = useMemo(() => {
      if (isAdmin) return subscribers;
      return subscribers.filter(s => s.barberId === userId);
  }, [subscribers, isAdmin, userId]);

  // --- Statistics Logic (Based on Visible Subscribers) ---
  const stats = useMemo(() => {
    const activeSubs = visibleSubscribers.filter(s => s.status === 'active');
    const inactiveSubs = visibleSubscribers.filter(s => s.status === 'inactive' || s.status === 'overdue');
    const pendingSubs = visibleSubscribers.filter(s => s.status === 'pending' || s.status === 'expiring');

    // Revenue Calculation
    let totalRevenue = 0;
    let potentialRevenue = 0; // Value to receive (pending/overdue/expiring)
    
    // Revenue Breakdown by Barber (For Admin view mostly)
    const barberRevenue: Record<string, number> = {};

    visibleSubscribers.forEach(sub => {
        const pkg = packages.find(p => p.id === sub.packageId);
        const price = pkg?.price || 0;
        
        // Initialize barber revenue entry
        if (!barberRevenue[sub.barberId]) barberRevenue[sub.barberId] = 0;

        if (sub.status === 'active') {
            totalRevenue += price;
            barberRevenue[sub.barberId] += price;
        } else {
            potentialRevenue += price;
        }
    });

    const avgTicket = activeSubs.length > 0 ? totalRevenue / activeSubs.length : 0;

    return {
        activeCount: activeSubs.length,
        inactiveCount: inactiveSubs.length,
        pendingCount: pendingSubs.length,
        totalRevenue,
        potentialRevenue,
        avgTicket,
        barberRevenue
    };
  }, [visibleSubscribers, packages]);


  // --- Status Colors & Labels ---
  const getStatusConfig = (status: string) => {
      switch(status) {
          case 'active': return { label: 'Pago (Ativo)', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: Check };
          case 'expiring': return { label: 'Vencendo', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertTriangle };
          case 'overdue': return { label: 'Vencido', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle };
          case 'pending': return { label: 'Aguardando', color: 'bg-zinc-800 text-zinc-300 border-zinc-700', icon: Clock };
          case 'inactive': return { label: 'Inativo', color: 'bg-zinc-900 text-zinc-600 border-zinc-800', icon: UserCheck };
          default: return { label: status, color: 'bg-zinc-800', icon: UserCheck };
      }
  };

  // --- WhatsApp Link Generator ---
  const generateWhatsAppLink = (sub: Subscriber) => {
      const pkg = packages.find(p => p.id === sub.packageId);
      const today = new Date();
      const nextDueDate = new Date(today.getFullYear(), today.getMonth(), sub.dueDay);
      if (today.getDate() > sub.dueDay) {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      let message = `Olá ${sub.name}, aqui é da BarberPro. `;
      
      if (sub.status === 'overdue') {
          message += `Consta em nosso sistema que sua assinatura do pacote ${pkg?.name} venceu dia ${sub.dueDay}. Gostaria de renovar?`;
      } else if (sub.status === 'expiring') {
          message += `Lembrete: Sua assinatura vence dia ${sub.dueDay}.`;
      } else if (sub.status === 'active') {
          message += `Sua assinatura está em dia! Obrigado pela preferência.`;
      } else if (sub.status === 'pending') {
          message += `Gostaria de confirmar a ativação do seu plano ${pkg?.name}?`;
      } else {
          message += `Temos novidades nos pacotes, vamos reativar sua assinatura?`;
      }
      
      const encoded = encodeURIComponent(message);
      return `https://wa.me/55${sub.phone.replace(/\D/g, '')}?text=${encoded}`;
  };

  // --- Handlers ---

  const handleCreateSubscriber = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      const isPaid = formData.get('isPaid') === 'on';
      const pkgId = formData.get('packageId') as string;
      const pkg = packages.find(p => p.id === pkgId);
      
      // If barber, force their ID. If admin, use selected.
      const selectedBarberId = isAdmin ? (formData.get('barberId') as string) : (userId || 'any');

      const newSub: Subscriber = {
          id: crypto.randomUUID(),
          name: formData.get('name') as string,
          phone: formData.get('phone') as string,
          packageId: pkgId,
          barberId: selectedBarberId,
          startDate: new Date().toISOString().split('T')[0],
          dueDay: Number(formData.get('dueDay') as string),
          status: isPaid ? 'active' : 'pending',
          lastPaymentAmount: isPaid ? (pkg?.price || 0) : 0,
          lastPaymentDate: isPaid ? new Date().toISOString() : undefined
      };

      const updated = [...subscribers, newSub];
      storage.saveSubscribers(updated);
      refreshData();
      setIsAddModalOpen(false);
  };

  const handleUpdateStatus = () => {
      if (!selectedSubscriber) return;

      const updated = subscribers.map(s => {
          if (s.id === selectedSubscriber.id) {
              return {
                  ...s,
                  status: editStatus,
                  lastPaymentAmount: editStatus === 'active' ? editAmount : s.lastPaymentAmount,
                  lastPaymentDate: editStatus === 'active' ? new Date().toISOString() : s.lastPaymentDate
              };
          }
          return s;
      });

      storage.saveSubscribers(updated);
      refreshData();
      setIsEditModalOpen(false);
  };

  const openEditModal = (sub: Subscriber) => {
      const pkg = packages.find(p => p.id === sub.packageId);
      setSelectedSubscriber(sub);
      setEditStatus(sub.status);
      setEditAmount(pkg ? pkg.price : 0);
      setIsEditModalOpen(true);
  };

  const handleDeleteSubscriber = (id: string) => {
      if(window.confirm('Remover assinante do sistema?')) {
          const updated = subscribers.filter(s => s.id !== id);
          storage.saveSubscribers(updated);
          refreshData();
      }
  };

  // Filter Logic (Search)
  const filteredSubscribers = visibleSubscribers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.phone.includes(searchTerm)
  );

  return (
      <div className="space-y-6">
          <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-white">Assinantes</h2>
                <p className="text-zinc-400">
                    {isAdmin ? 'Gerencie planos recorrentes e pagamentos mensais.' : 'Gerencie seus clientes de assinatura.'}
                </p>
              </div>
          </div>

          {/* --- DASHBOARD --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active/Inactive */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold text-zinc-500 uppercase">Base de Clientes</span>
                       <Users size={20} className="text-blue-500"/>
                  </div>
                  <div>
                      <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-white">{visibleSubscribers.length}</span>
                          <span className="text-xs text-zinc-500 mb-1.5">Total</span>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs">
                          <span className="text-green-500 font-bold">{stats.activeCount} Ativos</span>
                          <span className="text-zinc-500">{stats.inactiveCount} Inativos</span>
                      </div>
                  </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold text-zinc-500 uppercase">
                           {isAdmin ? 'Faturamento (Ativos)' : 'Seu Faturamento (Ativos)'}
                       </span>
                       <DollarSign size={20} className="text-green-500"/>
                  </div>
                  <div>
                      <span className="text-3xl font-bold text-white">{formatMoney(stats.totalRevenue)}</span>
                      <p className="text-xs text-zinc-500 mt-1">Recorrente Mensal</p>
                  </div>
              </div>

              {/* To Receive */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-4 opacity-5"><AlertTriangle size={80}/></div>
                  <div className="flex justify-between items-start mb-2 relative z-10">
                       <span className="text-xs font-bold text-zinc-500 uppercase">A Receber</span>
                       <Clock size={20} className="text-amber-500"/>
                  </div>
                  <div className="relative z-10">
                      <span className="text-3xl font-bold text-amber-500">{formatMoney(stats.potentialRevenue)}</span>
                      <p className="text-xs text-zinc-500 mt-1">{stats.pendingCount} clientes pendentes</p>
                  </div>
              </div>

               {/* LTV / Breakdown */}
               <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col">
                   <div className="flex justify-between items-start mb-3">
                       <span className="text-xs font-bold text-zinc-500 uppercase">Ticket Médio</span>
                       <TrendingUp size={20} className="text-purple-500"/>
                  </div>
                  <div className="mb-4">
                      <span className="text-2xl font-bold text-white">{formatMoney(stats.avgTicket)}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex-1 overflow-y-auto max-h-[60px] space-y-1 custom-scrollbar pr-2">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Por Barbeiro (Ativos)</p>
                        {Object.entries(stats.barberRevenue).map(([id, amount]) => {
                            const numericAmount = amount as number;
                            const name = id === 'any' ? 'Qualquer' : barbers.find(b => b.id === id)?.name.split(' ')[0] || 'Desc.';
                            if (numericAmount === 0) return null;
                            return (
                                <div key={id} className="flex justify-between text-xs text-zinc-400">
                                    <span>{name}</span>
                                    <span className="text-white">{formatMoney(numericAmount)}</span>
                                </div>
                            )
                        })}
                    </div>
                  )}
              </div>
          </div>

          {/* --- SEARCH & ACTIONS --- */}
          <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar assinante por nome ou telefone..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                />
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap shadow-lg shadow-blue-900/20">
                    <Plus size={20}/> <span className="hidden md:inline">Novo Assinante</span>
                </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in duration-500">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500">
                      <tr>
                          <th className="p-4 font-bold">Cliente</th>
                          <th className="p-4 font-bold">Pacote / Profissional</th>
                          <th className="p-4 font-bold text-center">Dia Venc.</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 font-bold text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                      {filteredSubscribers.map(sub => {
                          const statusConfig = getStatusConfig(sub.status);
                          const pkg = packages.find(p => p.id === sub.packageId);
                          const barberName = sub.barberId === 'any' ? 'Qualquer Profissional' : barbers.find(b => b.id === sub.barberId)?.name;
                          
                          return (
                              <tr 
                                key={sub.id} 
                                className="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                                onClick={() => openEditModal(sub)}
                              >
                                  <td className="p-4">
                                      <div className="font-bold text-white text-base group-hover:text-amber-500 transition-colors">{sub.name}</div>
                                      <div className="text-xs text-zinc-500">{sub.phone}</div>
                                  </td>
                                  <td className="p-4">
                                      <div className="text-sm text-zinc-300 font-bold flex items-center gap-1">
                                          <Crown size={14} className="text-purple-500"/> {pkg?.name}
                                      </div>
                                      <div className="text-xs text-zinc-500 mt-0.5">{barberName}</div>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className="bg-zinc-950 border border-zinc-800 px-3 py-1 rounded text-zinc-400 font-mono font-bold text-sm">
                                          {sub.dueDay}
                                      </span>
                                  </td>
                                  <td className="p-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1.5 w-fit ${statusConfig.color}`}>
                                          <statusConfig.icon size={12}/>
                                          {statusConfig.label}
                                      </span>
                                  </td>
                                  <td className="p-4 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                      <a 
                                        href={generateWhatsAppLink(sub)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-2 bg-green-600/10 text-green-500 border border-green-600/20 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                        title="Enviar mensagem no WhatsApp"
                                      >
                                          <MessageCircle size={18}/>
                                      </a>
                                      {isAdmin && (
                                            <button onClick={() => handleDeleteSubscriber(sub.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                      )}
                                  </td>
                              </tr>
                          );
                      })}
                      {filteredSubscribers.length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-8 text-center text-zinc-500">
                                  <UserCheck size={48} className="mx-auto mb-4 opacity-50"/>
                                  Nenhum assinante encontrado.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* ADD SUBSCRIBER MODAL */}
          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <form onSubmit={handleCreateSubscriber} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Novo Assinante</h2>
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button>
                    </div>
                    
                    <div className="space-y-4">
                         <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase">Nome do Cliente</label>
                            <input name="name" required className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 focus:border-blue-500 outline-none"/>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase">Telefone / WhatsApp</label>
                            <input name="phone" required placeholder="(00) 00000-0000" className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 focus:border-blue-500 outline-none"/>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-500 font-bold uppercase">Pacote</label>
                                <select name="packageId" required className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 focus:border-blue-500 outline-none text-sm">
                                    {packages.map(p => <option key={p.id} value={p.id}>{p.name} - {formatMoney(p.price)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 font-bold uppercase">Dia Vencimento</label>
                                <select name="dueDay" required className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 focus:border-blue-500 outline-none font-mono text-sm">
                                    {Array.from({length: 30}, (_, i) => i + 1).map(day => (
                                        <option key={day} value={day}>Dia {day}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase">Profissional Vinculado</label>
                            <select 
                                name="barberId" 
                                required 
                                defaultValue={!isAdmin && userId ? userId : 'any'}
                                disabled={!isAdmin}
                                className={`w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 focus:border-blue-500 outline-none text-sm ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="any">Qualquer Profissional</option>
                                {barbers.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            {!isAdmin && <input type="hidden" name="barberId" value={userId || 'any'} />}
                        </div>

                        <div className="pt-2">
                             <label className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                                 <input type="checkbox" name="isPaid" className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-green-500 focus:ring-green-500" />
                                 <div className="flex flex-col">
                                     <span className="text-sm font-bold text-white">Marcar como Pago</span>
                                     <span className="text-xs text-zinc-500">O status mudará para Ativo imediatamente.</span>
                                 </div>
                             </label>
                        </div>
                        
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 transition-colors">Cadastrar Assinante</button>
                    </div>
                </form>
            </div>
          )}

          {/* EDIT STATUS / PAYMENT MODAL */}
          {isEditModalOpen && selectedSubscriber && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">{selectedSubscriber.name}</h2>
                            <p className="text-zinc-400 text-sm">Gerenciar Assinatura</p>
                        </div>
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button>
                    </div>

                    <div className="space-y-6">
                        {/* Status Selector */}
                        <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Alterar Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setEditStatus('active')}
                                    className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 ${editStatus === 'active' ? 'bg-green-500 text-zinc-900 border-green-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                                >
                                    <Check size={16}/> Pago
                                </button>
                                <button 
                                    onClick={() => setEditStatus('pending')}
                                    className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 ${editStatus === 'pending' ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                                >
                                    <Clock size={16}/> Aguardando
                                </button>
                                <button 
                                    onClick={() => setEditStatus('expiring')}
                                    className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 ${editStatus === 'expiring' ? 'bg-amber-500 text-zinc-900 border-amber-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                                >
                                    <AlertTriangle size={16}/> Vencendo
                                </button>
                                <button 
                                    onClick={() => setEditStatus('overdue')}
                                    className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 ${editStatus === 'overdue' ? 'bg-red-500 text-white border-red-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                                >
                                    <XCircle size={16}/> Vencido
                                </button>
                            </div>
                            <button 
                                onClick={() => setEditStatus('inactive')}
                                className={`w-full mt-2 p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 ${editStatus === 'inactive' ? 'bg-zinc-600 text-white border-zinc-600' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                            >
                                <UserCheck size={14}/> Marcar como Inativo / Cancelado
                            </button>
                        </div>

                        {/* Payment Amount Input - Only if setting to Active */}
                        {editStatus === 'active' && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Valor Recebido</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-zinc-500 text-sm">R$</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(Number(e.target.value))}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 pl-10 text-white text-lg font-bold focus:border-green-500 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    Confirmar o recebimento atualiza a cor para Verde.
                                </p>
                            </div>
                        )}

                        <button 
                            onClick={handleUpdateStatus}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold py-3 rounded-lg mt-2 transition-colors"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
          )}
      </div>
  );
};

export default AdminSubscribers;