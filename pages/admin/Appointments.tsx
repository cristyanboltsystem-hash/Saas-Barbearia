import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../utils/storage';
import { Appointment, Service, Barber, PaymentMethod, WaitlistEntry, BlockedTime } from '../../types';
import { 
  Check, X, Calendar, ChevronLeft, ChevronRight, 
  Lock, UserPlus, Search, Phone, DollarSign, Edit3, AlertCircle, Trash2, Clock, List,
  CreditCard, Banknote, QrCode, Plus, Minus, ShoppingBag, User, Ban, Repeat, ArrowRight, Scissors
} from 'lucide-react';

const generateDaySlots = () => {
  const slots = [];
  for (let h = 8; h < 21; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const formatDateToLocalISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const AdminAppointments: React.FC = () => {
  const role = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');
  const isAdmin = role === 'ADMIN';

  // --- Data State ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [services, setServices] = useState<Service[]>([]); 
  const [barbers, setBarbers] = useState<Barber[]>([]);
  
  // --- UI State ---
  const [viewMode, setViewMode] = useState<'calendar' | 'waitlist'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');

  // --- Booking Modal State ---
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    clientName: '', clientPhone: '', serviceId: '', barberId: '', time: ''
  });

  // --- Block Schedule Modal ---
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState<{
      type: 'single' | 'recurring';
      scope: 'day' | 'slot';
      barberId: string;
      startTime: string;
      endTime: string;
      reason: string;
  }>({
      type: 'single',
      scope: 'day',
      barberId: 'all',
      startTime: '08:00',
      endTime: '12:00',
      reason: ''
  });

  // --- Payment/Details Modal State ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [paymentData, setPaymentData] = useState({
    method: 'money' as PaymentMethod,
    discount: 0,
    tip: 0,
    extras: [] as Service[] 
  });

  useEffect(() => {
    if (!isAdmin && userId) setSelectedBarberId(userId);
    refreshData();
  }, [isAdmin, userId]);

  const refreshData = () => {
    setAppointments(storage.getAppointments());
    setWaitlist(storage.getWaitlist());
    setBlockedTimes(storage.getBlockedTimes());
    setServices(storage.getServices());
    setBarbers(storage.getBarbers());
  };

  // --- Derived Data ---
  const dateKey = formatDateToLocalISO(selectedDate);
  const weekDay = selectedDate.getDay(); // 0-6

  const dayAppointments = useMemo(() => {
    return appointments.filter(app => app.date === dateKey && app.status !== 'cancelled');
  }, [appointments, dateKey]);

  // Check if a specific slot/barber is blocked
  const getBlockRule = (time: string, barberId: string) => {
      // time format "HH:MM"
      const timeToMinutes = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
      };
      const slotMin = timeToMinutes(time);

      return blockedTimes.find(rule => {
          // 1. Check Barber
          if (rule.barberId !== 'all' && rule.barberId !== barberId) return false;

          // 2. Check Date/Recurrence
          let dateMatch = false;
          if (rule.type === 'single') dateMatch = rule.date === dateKey;
          else if (rule.type === 'recurring') dateMatch = rule.weekDay === weekDay;
          
          if (!dateMatch) return false;

          // 3. Check Scope
          if (rule.scope === 'day') return true;
          if (rule.scope === 'slot' && rule.startTime && rule.endTime) {
              const start = timeToMinutes(rule.startTime);
              const end = timeToMinutes(rule.endTime);
              // If slot start is within block range
              // We assume slot duration is 30m. Block if ANY part of slot overlaps.
              // For simplicity: Block if slot start >= rule start AND slot start < rule end
              return slotMin >= start && slotMin < end;
          }
          return false;
      });
  };

  // --- Actions: Navigation ---
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // --- Actions: Booking ---
  const openNewBooking = (time?: string, barberId?: string) => {
    setBookingData({
      clientName: '',
      clientPhone: '',
      serviceId: services.find(s => s.type === 'service')?.id || '',
      barberId: barberId || (selectedBarberId === 'all' ? (barbers[0]?.id || '') : selectedBarberId),
      time: time || '09:00'
    });
    setShowBookingModal(true);
  };

  const handleSaveBooking = () => {
    if (!bookingData.clientName || !bookingData.serviceId || !bookingData.barberId) return;
    const service = services.find(s => s.id === bookingData.serviceId);
    const newApp: Appointment = {
      id: crypto.randomUUID(),
      serviceId: bookingData.serviceId,
      barberId: bookingData.barberId,
      date: dateKey,
      time: bookingData.time,
      client: { name: bookingData.clientName, phone: bookingData.clientPhone },
      status: 'confirmed',
      totalPrice: service?.price || 0,
      createdAt: new Date().toISOString()
    };
    storage.saveAppointment(newApp);
    refreshData();
    setShowBookingModal(false);
  };

  // --- Actions: Blocking ---
  const handleCreateBlock = () => {
      const newBlock: BlockedTime = {
          id: crypto.randomUUID(),
          barberId: blockForm.barberId,
          type: blockForm.type,
          scope: blockForm.scope,
          date: blockForm.type === 'single' ? dateKey : undefined,
          weekDay: blockForm.type === 'recurring' ? weekDay : undefined,
          startTime: blockForm.scope === 'slot' ? blockForm.startTime : undefined,
          endTime: blockForm.scope === 'slot' ? blockForm.endTime : undefined,
          reason: blockForm.reason || 'Bloqueio'
      };
      storage.saveBlockedTime(newBlock);
      refreshData();
      setShowBlockModal(false);
  };

  const handleDeleteBlock = (id: string, isRecurring: boolean) => {
      const msg = isRecurring 
        ? "Este é um bloqueio recorrente. Deseja remover este bloqueio de TODOS os dias futuros?" 
        : "Desbloquear este horário?";
      
      if(window.confirm(msg)) {
          storage.removeBlockedTime(id);
          refreshData();
      }
  };

  // --- Actions: Payment / Details ---
  const openPaymentModal = (app: Appointment) => {
    setSelectedApp(app);
    setPaymentData({
      method: app.paymentMethod || 'money',
      discount: app.discount || 0,
      tip: app.tip || 0,
      extras: [] // Reset extras on open
    });
    setShowPaymentModal(true);
  };

  const handleAddExtra = (serviceId: string) => {
      const item = services.find(s => s.id === serviceId);
      if (item) setPaymentData(prev => ({ ...prev, extras: [...prev.extras, item] }));
  };

  const handleRemoveExtra = (index: number) => {
      setPaymentData(prev => ({ ...prev, extras: prev.extras.filter((_, i) => i !== index) }));
  };

  const calculateTotal = () => {
      if (!selectedApp) return 0;
      const basePrice = selectedApp.totalPrice;
      const extrasPrice = paymentData.extras.reduce((acc, item) => acc + item.price, 0);
      return Math.max(0, basePrice + extrasPrice - paymentData.discount) + paymentData.tip;
  };

  const handleCompletePayment = () => {
      if (!selectedApp) return;
      const total = calculateTotal();
      const extraNotes = paymentData.extras.length > 0 ? ` | Extras: ${paymentData.extras.map(e => e.name).join(', ')}` : '';

      const updatedApps = appointments.map(a => a.id === selectedApp.id ? {
          ...a,
          status: 'completed' as const,
          paymentMethod: paymentData.method,
          discount: paymentData.discount,
          tip: paymentData.tip,
          finalPrice: total,
          notes: (a.notes || '') + extraNotes
      } : a);

      storage.updateAppointments(updatedApps);
      if (selectedApp.clientId) storage.awardXpToClient(selectedApp.clientId);
      refreshData();
      setShowPaymentModal(false);
  };

  const handleCancelAppointment = () => {
      if (!selectedApp || !window.confirm('Cancelar este agendamento?')) return;
      const updatedApps = appointments.map(a => a.id === selectedApp.id ? { ...a, status: 'cancelled' as const } : a);
      storage.updateAppointments(updatedApps);
      
      // *** TRIGGER AUTOMATIC WAITLIST CHECK ***
      storage.checkWaitlistAfterCancellation(selectedApp);
      
      refreshData();
      setShowPaymentModal(false);
  };

  // --- Waitlist ---
  const handlePromoteWaitlist = (entry: WaitlistEntry) => {
      setBookingData({
          clientName: entry.clientName,
          clientPhone: entry.clientPhone,
          serviceId: entry.serviceId,
          barberId: entry.barberId === 'any' ? barbers[0]?.id : entry.barberId,
          time: '09:00'
      });
      setSelectedDate(new Date(entry.date + 'T00:00:00'));
      setViewMode('calendar');
      setShowBookingModal(true);
      storage.removeFromWaitlist(entry.id);
  };

  return (
    <div className="space-y-6 pb-24 select-none animate-fade-in">
      
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-zinc-950/95 backdrop-blur-xl z-30 py-4 -mx-4 px-4 md:mx-0 md:px-0 border-b md:border-none border-zinc-800/50">
        <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Agenda</h1>
            <p className="text-zinc-400 text-sm">Gerencie seus agendamentos e bloqueios.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => {
                    setBlockForm(prev => ({ ...prev, barberId: selectedBarberId === 'all' ? 'all' : selectedBarberId }));
                    setShowBlockModal(true);
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl border border-red-500/20 transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center gap-2 font-medium"
                title="Bloquear Horário/Dia"
            >
                <Lock size={18}/>
                <span className="hidden md:inline">Bloquear</span>
            </button>
            <div className="flex bg-zinc-900/50 rounded-xl p-1 border border-zinc-800/50 backdrop-blur-sm">
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-amber-500 text-zinc-900 font-bold shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Calendar size={18}/>
                    <span className="hidden md:inline">Calendário</span>
                </button>
                <button 
                    onClick={() => setViewMode('waitlist')}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'waitlist' ? 'bg-amber-500 text-zinc-900 font-bold shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <List size={18}/>
                    <span className="hidden md:inline">Lista de Espera</span>
                </button>
            </div>
        </div>
      </div>

      {viewMode === 'calendar' && (
          <>
            {/* Date Picker */}
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <button onClick={() => changeDate(-1)} className="p-4 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"><ChevronLeft/></button>
                <div className="flex flex-col items-center relative z-10">
                    <span className="text-white font-bold capitalize flex items-center gap-3 text-xl tracking-tight">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Calendar size={20} />
                        </div>
                        {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    {dateKey === formatDateToLocalISO(new Date()) && (
                        <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase mt-1 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Hoje</span>
                    )}
                </div>
                <button onClick={() => changeDate(1)} className="p-4 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"><ChevronRight/></button>
            </div>

            {/* Barber Filter (Horizontal Scroll) */}
            <div className="flex overflow-x-auto gap-4 py-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button
                    onClick={() => setSelectedBarberId('all')}
                    className={`flex flex-col items-center min-w-[80px] cursor-pointer transition-all group ${selectedBarberId === 'all' ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
                >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 mb-3 shadow-lg transition-all ${selectedBarberId === 'all' ? 'border-amber-500 bg-zinc-800 shadow-amber-500/20' : 'border-zinc-800 bg-zinc-900 group-hover:border-zinc-700'}`}>
                        <Search size={24} className={selectedBarberId === 'all' ? 'text-amber-500' : 'text-zinc-500'}/>
                    </div>
                    <span className={`text-xs font-bold transition-colors ${selectedBarberId === 'all' ? 'text-amber-500' : 'text-zinc-500'}`}>Todos</span>
                </button>
                {barbers.filter(b => b.active).map(b => (
                    <button
                        key={b.id}
                        onClick={() => setSelectedBarberId(b.id)}
                        className={`flex flex-col items-center min-w-[80px] cursor-pointer transition-all group ${selectedBarberId === b.id ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`relative w-16 h-16 rounded-2xl mb-3 shadow-lg transition-all p-0.5 ${selectedBarberId === b.id ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                            <img 
                                src={b.photoUrl} 
                                className="w-full h-full rounded-[14px] object-cover bg-zinc-900"
                            />
                        </div>
                        <span className={`text-xs font-bold transition-colors ${selectedBarberId === b.id ? 'text-amber-500' : 'text-zinc-500'}`}>{b.name.split(' ')[0]}</span>
                    </button>
                ))}
            </div>

            {/* Timeline / Slots */}
            <div className="space-y-4 mt-2">
                {generateDaySlots().map(slotTime => {
                    const slotApps = dayAppointments.filter(a => a.time === slotTime);
                    
                    // Logic for All Barbers
                    if (selectedBarberId === 'all') {
                        return (
                            <div key={slotTime} className="flex gap-4 group/slot">
                                <div className="w-16 text-sm font-mono text-zinc-600 pt-3 text-right group-hover/slot:text-amber-500 transition-colors">{slotTime}</div>
                                <div className="flex-1 space-y-3 pb-6 border-b border-zinc-800/30 relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-800/30 -ml-4 group-hover/slot:bg-amber-500/20 transition-colors"></div>
                                    
                                    {slotApps.length > 0 ? (
                                        slotApps.map(app => (
                                            <div key={app.id} onClick={() => openPaymentModal(app)} className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer shadow-md transition-all hover:scale-[1.01] ${app.status === 'completed' ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' : 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900/60'}`}>
                                                <div className="flex items-center gap-4">
                                                     <div className={`w-1.5 h-10 rounded-full ${app.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></div>
                                                     <div>
                                                         <div className="font-bold text-white text-base">{app.client.name}</div>
                                                         <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                                                            <div className="flex items-center gap-1 bg-zinc-800/50 px-2 py-0.5 rounded-md">
                                                                <User size={10}/> 
                                                                {barbers.find(b=>b.id===app.barberId)?.name.split(' ')[0]}
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-zinc-800/50 px-2 py-0.5 rounded-md">
                                                                <Scissors size={10}/>
                                                                {services.find(s=>s.id===app.serviceId)?.name}
                                                            </div>
                                                         </div>
                                                     </div>
                                                </div>
                                                {app.status === 'completed' && <div className="bg-green-500/10 p-2 rounded-full text-green-500"><Check size={16}/></div>}
                                            </div>
                                        ))
                                    ) : (
                                        <div onClick={() => openNewBooking(slotTime)} className="h-12 border border-dashed border-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-700 text-sm hover:bg-zinc-900/50 hover:text-zinc-400 hover:border-zinc-700 cursor-pointer transition-all group/add">
                                            <Plus size={16} className="mr-2 group-hover/add:scale-110 transition-transform"/> Disponível
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // Logic for Single Barber
                    const filteredApps = slotApps.filter(a => a.barberId === selectedBarberId);
                    const app = filteredApps[0];
                    const blockRule = getBlockRule(slotTime, selectedBarberId);

                    return (
                        <div key={slotTime} className="flex gap-4 group/slot">
                             <div className="w-16 text-sm font-mono text-zinc-600 pt-4 text-right group-hover/slot:text-amber-500 transition-colors">{slotTime}</div>
                             <div className="flex-1 relative">
                                 <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-800/30 -ml-4 group-hover/slot:bg-amber-500/20 transition-colors"></div>
                                 
                                 {blockRule ? (
                                     <div 
                                        onClick={() => handleDeleteBlock(blockRule.id, blockRule.type === 'recurring')}
                                        className="h-[70px] bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center justify-between px-6 cursor-pointer hover:bg-red-500/10 group transition-all"
                                     >
                                        <div className="flex items-center gap-3 text-red-400/80 group-hover:text-red-400">
                                            <div className="p-2 bg-red-500/10 rounded-lg">
                                                <Ban size={20}/>
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm block tracking-wide">Bloqueado</span>
                                                <span className="text-[10px] opacity-70 uppercase tracking-wider">{blockRule.reason} {blockRule.type === 'recurring' && '(Recorrente)'}</span>
                                            </div>
                                        </div>
                                        <div className="bg-red-500/10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                            <Trash2 size={18} className="text-red-400"/>
                                        </div>
                                     </div>
                                 ) : app ? (
                                     <div 
                                        onClick={() => openPaymentModal(app)}
                                        className={`p-5 rounded-2xl border flex justify-between items-center cursor-pointer shadow-lg transition-all hover:scale-[1.01] ${app.status === 'completed' ? 'bg-green-500/5 border-green-500/20' : 'bg-zinc-900/60 border-zinc-800 hover:border-amber-500/30'}`}
                                     >
                                         <div className="flex items-center gap-4">
                                             <div className={`w-1.5 h-10 rounded-full ${app.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></div>
                                             <div>
                                                 <div className={`text-lg font-bold ${app.status==='completed'?'text-green-500':'text-white'}`}>{app.client.name}</div>
                                                 <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                                                    <span className="bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-800">{services.find(s=>s.id===app.serviceId)?.name}</span>
                                                    <span className="text-zinc-600">•</span>
                                                    <span className="font-mono">{app.time}</span>
                                                 </div>
                                             </div>
                                         </div>
                                         {app.status === 'completed' ? (
                                             <div className="flex flex-col items-end">
                                                 <div className="bg-green-500/10 p-2 rounded-full text-green-500 mb-1"><Check size={20}/></div>
                                                 <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Pago</span>
                                             </div>
                                         ) : (
                                             <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500 border border-amber-500/20">
                                                 <DollarSign size={20}/>
                                             </div>
                                         )}
                                     </div>
                                 ) : (
                                     <div onClick={() => openNewBooking(slotTime, selectedBarberId)} className="h-[70px] bg-zinc-900/20 border border-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-700 hover:bg-zinc-900/50 hover:text-zinc-400 hover:border-zinc-700 cursor-pointer transition-all group/add">
                                         <Plus size={20} className="group-hover/add:scale-110 transition-transform"/>
                                     </div>
                                 )}
                             </div>
                        </div>
                    );
                })}
            </div>
          </>
      )}

      {viewMode === 'waitlist' && (
          <div className="space-y-4 animate-in fade-in">
              {waitlist.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
                      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                          <List size={32} className="opacity-30"/>
                      </div>
                      <p className="font-medium">Lista de espera vazia.</p>
                      <p className="text-xs opacity-50 mt-1">Novos clientes aparecerão aqui.</p>
                  </div>
              ) : (
                  waitlist.map((entry, idx) => (
                      <div key={entry.id} className="glass-card border border-zinc-800/50 p-6 rounded-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl -mr-5 -mt-5 transition-all group-hover:bg-amber-500/10"></div>
                          
                          <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-900 font-bold flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
                                      #{idx + 1}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-white text-lg">{entry.clientName}</h3>
                                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                                          <Phone size={14}/>
                                          {entry.clientPhone}
                                      </div>
                                  </div>
                              </div>
                              <span className="text-xs bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 rounded-lg text-zinc-300 font-mono flex items-center gap-2">
                                  <Calendar size={12} className="text-amber-500"/>
                                  {new Date(entry.date).toLocaleDateString()}
                              </span>
                          </div>
                          
                          <div className="flex gap-3 mt-6 ml-14 relative z-10">
                              <button 
                                onClick={() => {storage.removeFromWaitlist(entry.id); refreshData();}} 
                                className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 transition-colors"
                                title="Remover"
                              >
                                  <Trash2 size={18}/>
                              </button>
                              <button 
                                onClick={() => handlePromoteWaitlist(entry)} 
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                              >
                                  <Calendar size={16}/>
                                  Agendar Agora
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}

      {/* --- BLOCK SCHEDULE MODAL --- */}
      {showBlockModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
               <div className="bg-zinc-900 w-full max-w-md rounded-xl p-6 border border-zinc-700">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2"><Lock size={20} className="text-red-500"/> Bloquear Agenda</h3>
                      <button onClick={() => setShowBlockModal(false)}><X className="text-zinc-500"/></button>
                   </div>
                   
                   <div className="space-y-4">
                       {/* Barber Selection */}
                       <div>
                           <label className="text-xs text-zinc-500 font-bold uppercase mb-1">Profissional</label>
                           <select 
                                value={blockForm.barberId}
                                onChange={e => setBlockForm({...blockForm, barberId: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white"
                           >
                               <option value="all">Todos os Profissionais</option>
                               {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                           </select>
                       </div>

                       {/* Type: Single vs Recurring */}
                       <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                           <button 
                                onClick={() => setBlockForm({...blockForm, type: 'single'})}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${blockForm.type === 'single' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
                           >
                               Apenas Hoje
                           </button>
                           <button 
                                onClick={() => setBlockForm({...blockForm, type: 'recurring'})}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${blockForm.type === 'recurring' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
                           >
                               <Repeat size={14}/> Recorrente
                           </button>
                       </div>

                       <div className="text-center text-sm text-zinc-400">
                           {blockForm.type === 'single' 
                                ? `Para: ${selectedDate.toLocaleDateString('pt-BR')}`
                                : `Repetir toda: ${selectedDate.toLocaleDateString('pt-BR', {weekday: 'long'})}`
                           }
                       </div>

                       {/* Scope: Day vs Slot */}
                       <div>
                           <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Duração</label>
                           <div className="flex gap-4 items-center">
                               <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                        type="radio" 
                                        checked={blockForm.scope === 'day'} 
                                        onChange={() => setBlockForm({...blockForm, scope: 'day'})}
                                        className="text-red-500 bg-zinc-800 border-zinc-700"
                                   />
                                   <span className="text-white text-sm">Dia Inteiro</span>
                               </label>
                               <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                        type="radio" 
                                        checked={blockForm.scope === 'slot'} 
                                        onChange={() => setBlockForm({...blockForm, scope: 'slot'})}
                                        className="text-red-500 bg-zinc-800 border-zinc-700"
                                   />
                                   <span className="text-white text-sm">Horário Específico</span>
                               </label>
                           </div>
                       </div>

                       {/* Time Range Inputs (Only if scope is slot) */}
                       {blockForm.scope === 'slot' && (
                           <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                               <div className="flex-1">
                                   <label className="text-xs text-zinc-500 mb-1 block">Início</label>
                                   <input 
                                        type="time" 
                                        value={blockForm.startTime}
                                        onChange={e => setBlockForm({...blockForm, startTime: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white"
                                   />
                               </div>
                               <ArrowRight size={16} className="text-zinc-600 mt-4"/>
                               <div className="flex-1">
                                   <label className="text-xs text-zinc-500 mb-1 block">Fim</label>
                                   <input 
                                        type="time" 
                                        value={blockForm.endTime}
                                        onChange={e => setBlockForm({...blockForm, endTime: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white"
                                   />
                               </div>
                           </div>
                       )}

                       <div>
                           <label className="text-xs text-zinc-500 font-bold uppercase mb-1">Motivo (Opcional)</label>
                           <input 
                                value={blockForm.reason}
                                onChange={e => setBlockForm({...blockForm, reason: e.target.value})}
                                placeholder="Ex: Folga, Almoço, Feriado..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white"
                           />
                       </div>

                       <button 
                            onClick={handleCreateBlock}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-2"
                       >
                           Confirmar Bloqueio
                       </button>
                   </div>
               </div>
          </div>
      )}

      {/* --- BOOKING MODAL --- */}
      {showBookingModal && (
          <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
              <div className="bg-zinc-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border-t sm:border border-zinc-700 space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Novo Agendamento</h3>
                      <button onClick={() => setShowBookingModal(false)}><X className="text-zinc-500"/></button>
                  </div>
                  
                  <div className="space-y-3">
                      <input 
                        value={bookingData.clientName} 
                        onChange={e => setBookingData({...bookingData, clientName: e.target.value})} 
                        placeholder="Nome do Cliente" 
                        className="w-full bg-zinc-950 p-3 rounded-lg text-white border border-zinc-800 focus:border-amber-500 outline-none"
                      />
                      <input 
                        value={bookingData.clientPhone} 
                        onChange={e => setBookingData({...bookingData, clientPhone: e.target.value})} 
                        placeholder="Telefone" 
                        className="w-full bg-zinc-950 p-3 rounded-lg text-white border border-zinc-800 focus:border-amber-500 outline-none"
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                          <select 
                            value={bookingData.serviceId} 
                            onChange={e => setBookingData({...bookingData, serviceId: e.target.value})} 
                            className="w-full bg-zinc-950 p-3 rounded-lg text-white border border-zinc-800 focus:border-amber-500 outline-none"
                          >
                              {services.filter(s => s.type === 'service').map(s => (
                                  <option key={s.id} value={s.id}>{s.name} - {formatMoney(s.price)}</option>
                              ))}
                          </select>
                          <select 
                            value={bookingData.barberId} 
                            onChange={e => setBookingData({...bookingData, barberId: e.target.value})} 
                            className="w-full bg-zinc-950 p-3 rounded-lg text-white border border-zinc-800 focus:border-amber-500 outline-none"
                          >
                              {barbers.map(b => (
                                  <option key={b.id} value={b.id}>{b.name.split(' ')[0]}</option>
                              ))}
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-zinc-400 text-center text-sm">
                             {new Date(dateKey).toLocaleDateString('pt-BR')}
                         </div>
                         <input 
                            type="time" 
                            value={bookingData.time}
                            onChange={e => setBookingData({...bookingData, time: e.target.value})}
                            className="w-full bg-zinc-950 p-3 rounded-lg text-white border border-zinc-800 focus:border-amber-500 outline-none text-center"
                         />
                      </div>

                      <button onClick={handleSaveBooking} className="w-full bg-amber-500 text-zinc-900 font-bold py-4 rounded-xl mt-4">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- PAYMENT / DETAILS MODAL --- */}
      {showPaymentModal && selectedApp && (
          <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
               <div className="bg-zinc-900 w-full max-w-md h-[90vh] sm:h-auto rounded-t-2xl sm:rounded-2xl border-t sm:border border-zinc-700 flex flex-col">
                   
                   {/* Header */}
                   <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
                       <div>
                           <h3 className="text-xl font-bold text-white">{selectedApp.client.name}</h3>
                           <p className="text-sm text-zinc-500">
                               {services.find(s=>s.id===selectedApp.serviceId)?.name} • {selectedApp.time}
                           </p>
                       </div>
                       <button onClick={() => setShowPaymentModal(false)}><X className="text-zinc-500"/></button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-5 space-y-6">
                       
                       {/* Add Extras */}
                       <div>
                           <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Adicionar Itens</label>
                           <select 
                                onChange={(e) => {
                                    if(e.target.value) {
                                        handleAddExtra(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                className="w-full bg-zinc-950 p-3 rounded-lg text-white border border-zinc-800 mb-2"
                           >
                               <option value="">Selecione um produto ou serviço...</option>
                               {services.map(s => (
                                   <option key={s.id} value={s.id}>{s.name} (+{formatMoney(s.price)})</option>
                               ))}
                           </select>

                           {paymentData.extras.length > 0 && (
                               <div className="space-y-1">
                                   {paymentData.extras.map((item, idx) => (
                                       <div key={idx} className="flex justify-between items-center bg-zinc-800/50 px-3 py-2 rounded">
                                           <span className="text-sm text-zinc-300">{item.name}</span>
                                           <div className="flex items-center gap-3">
                                               <span className="text-sm text-white font-bold">{formatMoney(item.price)}</span>
                                               <button onClick={() => handleRemoveExtra(idx)} className="text-red-400"><X size={14}/></button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>

                       {/* Financials */}
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Desconto (R$)</label>
                               <div className="relative">
                                   <Minus size={14} className="absolute left-3 top-3.5 text-red-400"/>
                                   <input 
                                    type="number" 
                                    value={paymentData.discount}
                                    onChange={e => setPaymentData({...paymentData, discount: Number(e.target.value)})}
                                    className="w-full bg-zinc-950 p-3 pl-8 rounded-lg text-white border border-zinc-800"
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Gorjeta (R$)</label>
                               <div className="relative">
                                    <Plus size={14} className="absolute left-3 top-3.5 text-green-400"/>
                                   <input 
                                    type="number" 
                                    value={paymentData.tip}
                                    onChange={e => setPaymentData({...paymentData, tip: Number(e.target.value)})}
                                    className="w-full bg-zinc-950 p-3 pl-8 rounded-lg text-white border border-zinc-800"
                                   />
                               </div>
                           </div>
                       </div>

                       {/* Payment Method */}
                       <div>
                           <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Forma de Pagamento</label>
                           <div className="grid grid-cols-3 gap-2">
                               <button 
                                onClick={() => setPaymentData({...paymentData, method: 'money'})}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${paymentData.method === 'money' ? 'bg-green-600 text-white border-green-600' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                               >
                                   <Banknote size={20}/>
                                   <span className="text-xs font-bold">Dinheiro</span>
                               </button>
                               <button 
                                onClick={() => setPaymentData({...paymentData, method: 'pix'})}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${paymentData.method === 'pix' ? 'bg-green-600 text-white border-green-600' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                               >
                                   <QrCode size={20}/>
                                   <span className="text-xs font-bold">Pix</span>
                               </button>
                               <button 
                                onClick={() => setPaymentData({...paymentData, method: 'card'})}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${paymentData.method === 'card' ? 'bg-green-600 text-white border-green-600' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                               >
                                   <CreditCard size={20}/>
                                   <span className="text-xs font-bold">Cartão</span>
                               </button>
                           </div>
                       </div>
                   </div>

                   {/* Footer Actions */}
                   <div className="p-5 border-t border-zinc-800 bg-zinc-900/50">
                       <div className="flex justify-between items-center mb-4">
                           <span className="text-zinc-400">Total Final</span>
                           <span className="text-2xl font-bold text-white">{formatMoney(calculateTotal())}</span>
                       </div>
                       
                       <div className="flex gap-3">
                           <button 
                            onClick={handleCancelAppointment}
                            className="px-4 py-3 rounded-xl border border-red-900/50 text-red-500 font-bold hover:bg-red-900/10"
                           >
                               Cancelar
                           </button>
                           <button 
                            onClick={handleCompletePayment}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20"
                           >
                               Confirmar Pagamento
                           </button>
                       </div>
                   </div>

               </div>
          </div>
      )}
    </div>
  );
};

export default AdminAppointments;