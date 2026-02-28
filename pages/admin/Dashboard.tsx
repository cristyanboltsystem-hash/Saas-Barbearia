import React, { useMemo } from 'react';
import { storage } from '../../utils/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Calendar, Users, TrendingUp, Scissors, Package, Crown, ChevronRight, ArrowUpRight } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const role = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');
  const isAdmin = role === 'ADMIN';

  const appointments = storage.getAppointments();
  const services = storage.getServices();
  const allBarbers = storage.getBarbers();

  // --- Helpers for Date Logic ---
  const isToday = (dateString: string) => {
    const today = new Date();
    const d = new Date(dateString + 'T00:00:00'); // Fix timezone offset issues
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (dateString: string) => {
    const d = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return d >= firstDay && d <= lastDay;
  };

  const isThisMonth = (dateString: string) => {
    const today = new Date();
    const d = new Date(dateString + 'T00:00:00');
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const stats = useMemo(() => {
    // 1. FILTER DATA BASED ON ROLE
    // If Admin, use all. If Barber, filter everything by userId.
    let relevantApps = appointments;
    let relevantBarbers = allBarbers;

    if (!isAdmin && userId) {
        relevantApps = appointments.filter(a => a.barberId === userId);
        relevantBarbers = allBarbers.filter(b => b.id === userId);
    }

    // Only consider completed/paid appointments for revenue
    const completedApps = relevantApps.filter(a => a.status === 'completed');
    // Consider pending+confirmed+completed for appointment counts
    const allActiveApps = relevantApps.filter(a => a.status !== 'cancelled' && a.status !== 'blocked');

    // 2. Revenue Today & Breakdown
    const todayApps = completedApps.filter(a => isToday(a.date));
    const revenueTodayTotal = todayApps.reduce((acc, curr) => acc + (curr.finalPrice ?? curr.totalPrice), 0);
    
    // For admin, breakdown by barber. For barber, it's just them.
    const revenueTodayByBarber = relevantBarbers.map(b => {
      const bApps = todayApps.filter(a => a.barberId === b.id);
      const total = bApps.reduce((acc, curr) => acc + (curr.finalPrice ?? curr.totalPrice), 0);
      return { id: b.id, name: b.name, total };
    }).sort((a, b) => b.total - a.total);

    // 3. Appointment Counts (Volume)
    const countToday = allActiveApps.filter(a => isToday(a.date)).length;
    const countWeek = allActiveApps.filter(a => isThisWeek(a.date)).length;
    const countMonth = allActiveApps.filter(a => isThisMonth(a.date)).length;

    const countMonthByBarber = relevantBarbers.map(b => {
      const count = allActiveApps.filter(a => a.barberId === b.id && isThisMonth(a.date)).length;
      return { id: b.id, name: b.name, count };
    }).sort((a, b) => b.count - a.count);

    // 4. Revenue Sources (Based on filtered apps)
    const revenueSources = {
      service: 0,
      product: 0,
      subscription: 0
    };
    
    completedApps.forEach(app => {
      const service = services.find(s => s.id === app.serviceId);
      const val = app.finalPrice ?? app.totalPrice;
      if (service?.type) {
        revenueSources[service.type] += val;
      }
    });

    const sourceData = [
      { name: 'Serviços', value: revenueSources.service, color: '#f59e0b' },
      { name: 'Produtos', value: revenueSources.product, color: '#10b981' },
      { name: 'Assinaturas', value: revenueSources.subscription, color: '#8b5cf6' },
    ];

    const totalRevenueAllTime = revenueSources.service + revenueSources.product + revenueSources.subscription;

    // 5. Monthly Commissions Calculation
    const monthlyCommissions = relevantBarbers.filter(b => b.active).map(b => {
        // Filter completed apps for this barber in this month
        // (Note: relevantApps is already filtered by barber if !isAdmin, but good to be explicit here)
        const bAppsMonth = completedApps.filter(a => a.barberId === b.id && isThisMonth(a.date));
        
        let totalCommission = 0;
        let totalSales = 0;

        // Breakdown for Barber View
        const breakdown = { service: 0, product: 0, subscription: 0 };

        bAppsMonth.forEach(app => {
            const service = services.find(s => s.id === app.serviceId);
            const price = app.finalPrice ?? app.totalPrice;
            totalSales += price;

            const type = service?.type || 'service';
            
            // Commission Logic
            const barberCategoryRate = b.commissionRates ? b.commissionRates[type] : 0;
            const rate = (service?.commissionRate !== undefined && service.commissionRate !== null) 
                         ? service.commissionRate 
                         : barberCategoryRate;
            
            const commVal = (price * rate) / 100;
            totalCommission += commVal;
            breakdown[type] += commVal;
        });

        return {
            ...b,
            monthSales: totalSales,
            monthCommission: totalCommission,
            breakdown,
            appsCount: bAppsMonth.length
        };
    });

    return {
      revenueTodayTotal,
      revenueTodayByBarber,
      countToday,
      countWeek,
      countMonth,
      countMonthByBarber,
      sourceData,
      totalRevenueAllTime,
      monthlyCommissions
    };
  }, [appointments, allBarbers, services, isAdmin, userId]);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Visão geral de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-amber-500/50 transition-colors">
                Exportar Relatório
            </button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Revenue Today */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <DollarSign size={120} className="text-amber-500"/>
           </div>
           
           <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p className="text-zinc-500 font-medium text-xs uppercase tracking-widest mb-2">Faturamento Hoje</p>
                     <h2 className="text-5xl font-serif font-bold text-white tracking-tight">{formatMoney(stats.revenueTodayTotal)}</h2>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <TrendingUp size={24} />
                  </div>
               </div>
               
               <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-wider">
                      {isAdmin ? 'Performance por Profissional' : 'Sua Performance'}
                  </p>
                  <div className="space-y-3">
                      {stats.revenueTodayByBarber.map(b => (
                          <div key={b.id} className="flex justify-between items-center text-sm group/item">
                              <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover/item:bg-amber-500 transition-colors"></div>
                                  <span className="text-zinc-400 group-hover/item:text-white transition-colors">{b.name}</span>
                              </div>
                              <span className="text-white font-mono font-medium">{formatMoney(b.total)}</span>
                          </div>
                      ))}
                      {stats.revenueTodayByBarber.length === 0 && <p className="text-zinc-600 text-xs italic">Nenhum faturamento registrado hoje.</p>}
                  </div>
               </div>
           </div>
        </div>

        {/* Card 2: Appointments Volume */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <Calendar size={120} className="text-blue-500"/>
           </div>

           <div className="relative z-10">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <p className="text-zinc-500 font-medium text-xs uppercase tracking-widest mb-2">Volume de Agendamentos</p>
                     <div className="flex items-baseline gap-1">
                         <span className="text-5xl font-serif font-bold text-white tracking-tight">{stats.countToday}</span>
                         <span className="text-zinc-500 text-sm font-medium">hoje</span>
                     </div>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                      <Users size={24} />
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-4 mb-6">
                   <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                       <span className="block text-2xl font-bold text-white mb-1">{stats.countWeek}</span>
                       <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Semana</span>
                   </div>
                   <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                       <span className="block text-2xl font-bold text-amber-500 mb-1">{stats.countMonth}</span>
                       <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Mês</span>
                   </div>
                   <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                       <ArrowUpRight size={20}/>
                   </div>
               </div>

               <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-wider">
                       {isAdmin ? 'Top Profissionais (Mês)' : 'Seus Atendimentos (Mês)'}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {stats.countMonthByBarber.map(b => (
                          <div key={b.id} className="flex-shrink-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2 min-w-[120px]">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <div>
                                  <span className="block text-xs text-zinc-300 font-bold">{b.count}</span>
                                  <span className="block text-[10px] text-zinc-500 truncate max-w-[80px]">{b.name}</span>
                              </div>
                          </div>
                      ))}
                  </div>
               </div>
           </div>
        </div>
      </div>

      {/* Row 2: Revenue Sources & Commissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Sources Chart */}
          <div className="lg:col-span-1 glass-card rounded-2xl p-6 flex flex-col">
              <h3 className="text-white font-bold font-serif text-lg mb-1 flex items-center gap-2">
                  Fontes de Receita
              </h3>
              <p className="text-xs text-zinc-500 mb-6">
                  {isAdmin ? 'Distribuição total acumulada' : 'Sua distribuição acumulada'}
              </p>
              
              <div className="h-[220px] w-full relative mb-6">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.sourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                        >
                            {stats.sourceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => formatMoney(value)}
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                            cursor={false}
                        />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Total */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</span>
                     <span className="text-sm font-bold text-white">{formatMoney(stats.totalRevenueAllTime)}</span>
                 </div>
              </div>

              <div className="space-y-3 mt-auto">
                  {stats.sourceData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}`}}></div>
                              <span className="text-zinc-300 flex items-center gap-2 font-medium">
                                  {item.name === 'Serviços' && <Scissors size={14} className="text-zinc-500"/>}
                                  {item.name === 'Produtos' && <Package size={14} className="text-zinc-500"/>}
                                  {item.name === 'Assinaturas' && <Crown size={14} className="text-zinc-500"/>}
                                  {item.name}
                              </span>
                          </div>
                          <span className="font-mono text-white font-bold">{formatMoney(item.value)}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Active Professionals & Commissions Table */}
          <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/5 bg-zinc-900/30">
                  <div className="flex justify-between items-center">
                      <div>
                          <h3 className="text-white font-bold font-serif text-lg flex items-center gap-2">
                              {isAdmin ? 'Comissões do Mês' : 'Suas Comissões'}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1">
                              Referência: <span className="text-amber-500 font-medium">{new Date().toLocaleDateString('pt-BR', { month: 'long' })}</span>
                          </p>
                      </div>
                      <button className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors">
                          Ver Detalhes <ChevronRight size={14}/>
                      </button>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-zinc-950/50 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                              <th className="p-5 font-bold">Profissional</th>
                              <th className="p-5 font-bold text-center">Qtd.</th>
                              <th className="p-5 font-bold text-right">Vendas</th>
                              {!isAdmin && <th className="p-5 font-bold text-right">Detalhamento</th>}
                              <th className="p-5 font-bold text-right text-amber-500">Comissão</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                          {stats.monthlyCommissions.map((barber) => (
                              <tr key={barber.id} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="p-5">
                                      <div className="flex items-center gap-4">
                                          <div className="relative">
                                              <img src={barber.photoUrl} alt="" className="w-10 h-10 rounded-full border border-zinc-700 object-cover group-hover:border-amber-500 transition-colors"/>
                                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center">
                                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                              </div>
                                          </div>
                                          <div>
                                              <p className="font-bold text-white group-hover:text-amber-500 transition-colors">{barber.name}</p>
                                              {isAdmin && (
                                                <div className="flex gap-2 text-[10px] text-zinc-500 mt-0.5 font-mono">
                                                    <span title="Serviço">S:{barber.commissionRates?.service}%</span>
                                                    <span title="Assinatura">A:{barber.commissionRates?.subscription}%</span>
                                                    <span title="Produto">P:{barber.commissionRates?.product}%</span>
                                                </div>
                                              )}
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-5 text-center">
                                      <span className="bg-zinc-800/50 border border-white/5 text-zinc-300 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                                          {barber.appsCount}
                                      </span>
                                  </td>
                                  <td className="p-5 text-right text-zinc-400 font-mono font-medium">
                                      {formatMoney(barber.monthSales)}
                                  </td>
                                  
                                  {!isAdmin && (
                                      <td className="p-5 text-right">
                                          <div className="flex flex-col text-[10px] text-zinc-500 font-mono gap-1">
                                              <span className="flex justify-end gap-2">S: <span className="text-zinc-300">{formatMoney(barber.breakdown.service)}</span></span>
                                              <span className="flex justify-end gap-2">A: <span className="text-zinc-300">{formatMoney(barber.breakdown.subscription)}</span></span>
                                              <span className="flex justify-end gap-2">P: <span className="text-zinc-300">{formatMoney(barber.breakdown.product)}</span></span>
                                          </div>
                                      </td>
                                  )}

                                  <td className="p-5 text-right">
                                      <div className="flex flex-col items-end">
                                          <span className="text-lg font-bold text-green-500 font-serif tracking-tight">{formatMoney(barber.monthCommission)}</span>
                                          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Previsto</span>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          {stats.monthlyCommissions.length === 0 && (
                              <tr>
                                  <td colSpan={isAdmin ? 4 : 5} className="p-12 text-center text-zinc-500 italic">
                                      Nenhum dado disponível para este período.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
