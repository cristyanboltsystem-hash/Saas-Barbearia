import React, { useState, useMemo, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle, User, Scissors, 
    ArrowLeft, Trophy, Star, LogOut, X, Lock, MapPin, Phone, MessageCircle, 
    ChevronLeft, Crown, Bell, List, Menu
} from 'lucide-react';
import { Service, Barber, Appointment, ClientAccount, Review, WaitlistEntry } from '../types';
import { storage } from '../utils/storage';
import { Link, useNavigate } from 'react-router-dom';

const HOURS = [
    { day: 'Domingo', time: 'Fechado' },
    { day: 'Segunda-feira', time: '08:30 - 20:00' },
    { day: 'Terça-feira', time: '08:30 - 20:00' },
    { day: 'Quarta-feira', time: '08:30 - 20:00' },
    { day: 'Quinta-feira', time: '08:30 - 20:00' },
    { day: 'Sexta-feira', time: '08:30 - 20:00' },
    { day: 'Sábado', time: '08:30 - 17:00' },
];

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  // --- Data & State ---
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentClient, setCurrentClient] = useState<ClientAccount | null>(null);
  
  // UI State
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  
  // Booking Flow State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<number>(1); // 1: Barber, 2: Date/Time, 3: Confirm
  const [clientForm, setClientForm] = useState({ name: '', phone: '' });

  // Init
  useEffect(() => {
      setServices(storage.getServices().filter(s => s.type === 'service'));
      setReviews(storage.getReviews());
      
      const session = sessionStorage.getItem('clientSession');
      if(session) {
          const client = JSON.parse(session);
          setCurrentClient(storage.getClients().find(c => c.id === client.id) || null);
          setClientForm({ name: client.name, phone: client.phone });
      }
  }, []);

  // Review Auto-Scroll
  useEffect(() => {
      if (reviews.length === 0) return;
      const interval = setInterval(() => {
          setActiveReviewIndex(prev => (prev + 1) % reviews.length);
      }, 5000); // 5 seconds
      return () => clearInterval(interval);
  }, [reviews]);

  // --- Helpers ---
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const nextDays = useMemo(() => {
      const days = [];
      const today = new Date();
      for(let i=0; i<14; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          days.push(d);
      }
      return days;
  }, []);

  const timeSlots = useMemo(() => {
      if (!selectedBarber || !selectedDate || !selectedService) return [];
      const slots = [];
      const startHour = 8;
      const endHour = 20;
      const now = new Date();
      const isToday = selectedDate === now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      for (let h = startHour; h < endHour; h++) {
          for (let m = 0; m < 60; m += 30) {
              if (isToday && (h < currentHour || (h === currentHour && m <= currentMinutes))) continue;
              
              const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              if (storage.isTimeSlotAvailable(selectedBarber.id, selectedDate, timeString, selectedService.durationMinutes)) {
                  slots.push(timeString);
              }
          }
      }
      return slots;
  }, [selectedBarber, selectedDate, selectedService]);

  // --- Handlers ---
  const openBooking = (service: Service) => {
      setSelectedService(service);
      setBookingStep(1);
      setSelectedBarber(null);
      setSelectedTime('');
      setBookingModalOpen(true);
  };

  const handleBookingSubmit = () => {
      if(!selectedService || !selectedBarber) return;
      
      const app: Appointment = {
          id: crypto.randomUUID(),
          serviceId: selectedService.id,
          barberId: selectedBarber.id,
          date: selectedDate,
          time: selectedTime,
          client: clientForm,
          clientId: currentClient?.id,
          status: 'pending',
          totalPrice: selectedService.price,
          createdAt: new Date().toISOString()
      };
      
      storage.saveAppointment(app);
      
      // Local Notification Simulation
      if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Agendamento Confirmado', { body: `Seu horário para ${selectedService.name} foi reservado!` });
      }
      
      alert('Agendamento realizado com sucesso!');
      setBookingModalOpen(false);
  };

  const handleJoinWaitlist = () => {
      if(!clientForm.name || !clientForm.phone || !selectedService) {
          alert('Preencha seus dados para entrar na lista.');
          return;
      }
      const entry: WaitlistEntry = {
          id: crypto.randomUUID(),
          clientName: clientForm.name,
          clientPhone: clientForm.phone,
          serviceId: selectedService.id,
          barberId: selectedBarber?.id || 'any',
          date: selectedDate,
          createdAt: new Date().toISOString()
      };
      storage.addToWaitlist(entry);
      alert('Você está na fila! Se surgir uma vaga neste dia, seu agendamento será confirmado automaticamente.');
      setWaitlistModalOpen(false);
      setBookingModalOpen(false);
  };

  // --- Render Sections ---

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 selection:bg-amber-500/30">
      
      {/* Hero Header */}
      <header className="relative h-[40vh] min-h-[300px] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-zinc-950/80 to-zinc-950 z-10"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale"></div>
          
          <div className="relative z-20 text-center px-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-black/50">
                  <Scissors size={28} className="text-amber-500"/>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-2 tracking-tight">
                  THE <span className="text-amber-500 italic">FORGE</span>
              </h1>
              <p className="text-zinc-400 text-sm md:text-base tracking-widest uppercase font-medium">Barbearia Premium</p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent z-20"></div>
      </header>

      {/* Quick Actions */}
      <div className="px-4 -mt-8 relative z-30 mb-12">
          <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
              <button className="glass-card py-4 rounded-2xl flex flex-col items-center justify-center gap-2 group">
                  <CalendarIcon size={20} className="text-zinc-400 group-hover:text-amber-500 transition-colors"/>
                  <span className="text-xs font-medium text-zinc-300">Agenda</span>
              </button>
              <button className="glass-card py-4 rounded-2xl flex flex-col items-center justify-center gap-2 group">
                  <MapPin size={20} className="text-zinc-400 group-hover:text-amber-500 transition-colors"/>
                  <span className="text-xs font-medium text-zinc-300">Local</span>
              </button>
              <button className="glass-card py-4 rounded-2xl flex flex-col items-center justify-center gap-2 group">
                  <Phone size={20} className="text-zinc-400 group-hover:text-amber-500 transition-colors"/>
                  <span className="text-xs font-medium text-zinc-300">Contato</span>
              </button>
          </div>
      </div>

      {/* Services Section */}
      <section className="max-w-md mx-auto px-4 mb-16 animate-fade-in delay-100">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-white">Nossos Serviços</h2>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Premium Cuts</span>
          </div>
          
          <div className="space-y-4">
              {services.map((service, idx) => (
                  <div 
                    key={service.id} 
                    onClick={() => openBooking(service)}
                    className="group relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-white/5 p-4 cursor-pointer hover:bg-zinc-900/60 transition-all duration-300 hover:border-amber-500/30"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                      <div className="flex justify-between items-start relative z-10">
                          <div className="flex-1 pr-4">
                              <h3 className="font-bold text-lg text-white group-hover:text-amber-500 transition-colors">{service.name}</h3>
                              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{service.description}</p>
                              <div className="mt-3 flex items-center gap-3 text-xs font-medium text-zinc-400">
                                  <span className="flex items-center gap-1"><Clock size={12}/> {service.durationMinutes} min</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                  <span className="text-amber-500/80">Detalhes</span>
                              </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                              <span className="text-xl font-serif font-bold text-white">{formatMoney(service.price)}</span>
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                                  <ChevronRight size={16}/>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </section>

      {/* Subscription Banner */}
      <section className="max-w-md mx-auto px-4 mb-16 animate-fade-in delay-200">
          <div className="relative rounded-2xl overflow-hidden p-6 border border-amber-500/20 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-black z-0"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                  <div>
                      <div className="flex items-center gap-2 mb-2">
                          <Crown size={18} className="text-amber-500 fill-amber-500"/>
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">VIP Member</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">Assinatura Mensal</h3>
                      <p className="text-sm text-zinc-400">Cortes ilimitados e prioridade na agenda.</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                      <ChevronRight size={20}/>
                  </div>
              </div>
          </div>
      </section>

      {/* Operating Hours */}
      <section className="max-w-md mx-auto px-4 mb-16 animate-fade-in delay-300">
          <h2 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-zinc-600"/> Horários
          </h2>
          <div className="bg-zinc-900/30 rounded-2xl p-6 border border-white/5 space-y-3 backdrop-blur-sm">
              {HOURS.map((h, idx) => {
                  const isToday = new Date().getDay() === idx; 
                  return (
                      <div key={h.day} className={`flex justify-between items-center text-sm ${isToday ? 'text-amber-500 font-medium' : 'text-zinc-500'}`}>
                          <span className="flex items-center gap-2">
                              {h.day}
                              {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                          </span>
                          <span className="font-mono text-zinc-400">{h.time}</span>
                      </div>
                  );
              })}
          </div>
      </section>

      {/* Reviews */}
      <section className="max-w-md mx-auto px-4 mb-20 animate-fade-in delay-300">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-white">Avaliações</h2>
              <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-500 fill-amber-500"/>
                  <span className="text-white font-bold">5.0</span>
                  <span className="text-zinc-600 text-xs">({reviews.length})</span>
              </div>
          </div>

          <div className="relative min-h-[160px]">
              {reviews.length > 0 && (
                  <div className="glass-card p-6 rounded-2xl relative">
                      <div className="absolute -top-3 -left-2 text-6xl font-serif text-white/5">"</div>
                      <p className="text-zinc-300 text-sm italic leading-relaxed mb-4 relative z-10">
                          {reviews[activeReviewIndex].comment}
                      </p>
                      <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                              {reviews[activeReviewIndex].clientName.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                              <p className="font-bold text-white text-sm">{reviews[activeReviewIndex].clientName}</p>
                              <div className="flex gap-0.5">
                                  {Array.from({length: reviews[activeReviewIndex].rating}).map((_, i) => (
                                      <Star key={i} size={8} className="text-amber-500 fill-amber-500"/>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}
              
              <div className="flex justify-center gap-1.5 mt-4">
                  {reviews.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeReviewIndex ? 'bg-amber-500 w-4' : 'bg-zinc-800'}`}
                      />
                  ))}
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-white/5 bg-zinc-950">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
              <Scissors size={16} className="text-zinc-400"/>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">The Forge</span>
          </div>
          <p className="text-zinc-600 text-xs">© 2026 BarberPro System. All rights reserved.</p>
          
          <Link to="/admin/login" className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs hover:text-white hover:border-zinc-700 transition-colors">
              <Lock size={12}/> Acesso Profissional
          </Link>
      </footer>

      {/* --- BOOKING MODAL --- */}
      {bookingModalOpen && selectedService && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setBookingModalOpen(false)}></div>
              
              <div className="relative bg-zinc-900 w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 flex flex-col shadow-2xl shadow-black animate-in slide-in-from-bottom-10 duration-300">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md rounded-t-3xl sticky top-0 z-10">
                      <div className="flex items-center gap-4">
                          {bookingStep > 1 && (
                              <button onClick={() => setBookingStep(s => s - 1)} className="p-2 rounded-full hover:bg-white/5 transition-colors"><ChevronLeft size={20} className="text-zinc-400"/></button>
                          )}
                          <div>
                              <h3 className="font-serif font-bold text-white text-xl">
                                  {bookingStep === 1 ? 'Profissional' : bookingStep === 2 ? 'Data e Hora' : 'Confirmação'}
                              </h3>
                              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">Passo {bookingStep} de 3</p>
                          </div>
                      </div>
                      <button onClick={() => setBookingModalOpen(false)} className="p-2 rounded-full hover:bg-white/5 transition-colors"><X size={20} className="text-zinc-400"/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      {/* Step 1: Barbers */}
                      {bookingStep === 1 && (
                          <div className="space-y-3">
                              <div 
                                onClick={() => { setSelectedBarber({ id: 'any', name: 'Qualquer Profissional', photoUrl: '', active: true, phone: '', commissionRates: {service:0, product:0, subscription:0} }); setBookingStep(2); }}
                                className="group bg-zinc-950/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4 cursor-pointer hover:border-amber-500/50 hover:bg-zinc-900 transition-all"
                              >
                                  <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                                      <User size={24}/>
                                  </div>
                                  <div>
                                      <span className="font-bold text-white text-lg block mb-1">Qualquer Profissional</span>
                                      <span className="text-xs text-zinc-500">Maior disponibilidade de horários</span>
                                  </div>
                                  <ChevronRight className="ml-auto text-zinc-600 group-hover:text-amber-500"/>
                              </div>
                              
                              {storage.getBarbers().map(barber => (
                                  <div 
                                    key={barber.id}
                                    onClick={() => { setSelectedBarber(barber); setBookingStep(2); }}
                                    className="group bg-zinc-950/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4 cursor-pointer hover:border-amber-500/50 hover:bg-zinc-900 transition-all"
                                  >
                                      <img src={barber.photoUrl} className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-amber-500 transition-colors"/>
                                      <div>
                                          <h4 className="font-bold text-white text-lg block mb-1">{barber.name}</h4>
                                          <p className="text-xs text-zinc-500">Barbeiro Especialista</p>
                                      </div>
                                      <ChevronRight className="ml-auto text-zinc-600 group-hover:text-amber-500"/>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* Step 2: Date & Time */}
                      {bookingStep === 2 && (
                          <div className="space-y-8">
                              {/* Horizontal Calendar */}
                              <div>
                                  <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Selecione o Dia</h4>
                                  <div className="flex overflow-x-auto gap-3 pb-4 -mx-6 px-6 scrollbar-hide">
                                      {nextDays.map(d => {
                                          const dStr = d.toISOString().split('T')[0];
                                          const isSelected = selectedDate === dStr;
                                          return (
                                              <div 
                                                key={dStr}
                                                onClick={() => { setSelectedDate(dStr); setSelectedTime(''); }}
                                                className={`min-w-[4.5rem] py-4 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                              >
                                                  <span className="text-[10px] uppercase font-bold tracking-wider mb-1">{d.toLocaleDateString('pt-BR', {weekday: 'short'}).replace('.','')}</span>
                                                  <span className="text-2xl font-bold font-serif">{d.getDate()}</span>
                                              </div>
                                          )
                                      })}
                                  </div>
                              </div>

                              {/* Slots */}
                              <div>
                                  <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Horários Disponíveis</h4>
                                  {timeSlots.length === 0 ? (
                                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30">
                                          <Clock size={32} className="mx-auto text-zinc-700 mb-4"/>
                                          <p className="text-zinc-400 mb-6 font-medium">Agenda cheia para esta data.</p>
                                          <button 
                                            onClick={() => setWaitlistModalOpen(true)}
                                            className="bg-zinc-800 text-white font-medium px-6 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all"
                                          >
                                              Entrar na Fila de Espera
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="grid grid-cols-4 gap-3">
                                          {timeSlots.map(t => (
                                              <button 
                                                key={t}
                                                onClick={() => { setSelectedTime(t); setBookingStep(3); }}
                                                className="py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 font-medium hover:border-amber-500 hover:text-amber-500 hover:bg-zinc-900 transition-all active:scale-95"
                                              >
                                                  {t}
                                              </button>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {/* Step 3: Confirm */}
                      {bookingStep === 3 && (
                          <div className="space-y-6">
                              <div className="bg-zinc-950/50 p-6 rounded-2xl border border-white/5 space-y-4">
                                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                      <span className="text-zinc-500 text-sm">Serviço</span>
                                      <span className="text-white font-bold text-lg">{selectedService.name}</span>
                                  </div>
                                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                      <span className="text-zinc-500 text-sm">Profissional</span>
                                      <span className="text-white font-medium">{selectedBarber?.name}</span>
                                  </div>
                                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                      <span className="text-zinc-500 text-sm">Data e Hora</span>
                                      <span className="text-white font-medium">{new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2">
                                      <span className="text-zinc-500 text-sm">Total a Pagar</span>
                                      <span className="text-amber-500 font-serif font-bold text-2xl">{formatMoney(selectedService.price)}</span>
                                  </div>
                              </div>

                              {!currentClient && (
                                  <div className="space-y-4">
                                      <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Seus Dados</h4>
                                      <div className="space-y-3">
                                          <input 
                                            placeholder="Seu Nome Completo" 
                                            value={clientForm.name}
                                            onChange={e => setClientForm({...clientForm, name: e.target.value})}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
                                          />
                                          <input 
                                            placeholder="Seu Telefone (WhatsApp)" 
                                            value={clientForm.phone}
                                            onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
                                          />
                                      </div>
                                  </div>
                              )}

                              <button 
                                onClick={handleBookingSubmit}
                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-amber-900/20 transform active:scale-[0.98] transition-all mt-4"
                              >
                                  Confirmar Agendamento
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* WAITLIST MODAL */}
      {waitlistModalOpen && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <List className="text-amber-500" size={24}/>
                  </div>
                  
                  <h3 className="text-white font-serif font-bold text-2xl text-center mb-2">Lista de Espera</h3>
                  <p className="text-zinc-400 text-sm text-center mb-6 leading-relaxed">
                      Não há horários para <strong>{selectedService?.name}</strong> em <strong>{new Date(selectedDate).toLocaleDateString('pt-BR')}</strong>.
                  </p>
                  
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl mb-6 text-xs text-zinc-400 leading-relaxed">
                      <strong className="text-amber-500 block mb-1 uppercase tracking-wider">Como funciona</strong>
                      Ao confirmar, você entra na fila. Se alguém cancelar um horário compatível, seu agendamento será realizado automaticamente.
                  </div>
                  
                  {!currentClient && (
                      <div className="space-y-3 mb-6">
                          <input 
                            placeholder="Seu Nome" 
                            value={clientForm.name}
                            onChange={e => setClientForm({...clientForm, name: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 placeholder:text-zinc-600"
                          />
                          <input 
                            placeholder="Telefone" 
                            value={clientForm.phone}
                            onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 placeholder:text-zinc-600"
                          />
                      </div>
                  )}

                  <div className="flex gap-3">
                      <button onClick={() => setWaitlistModalOpen(false)} className="flex-1 py-3 text-zinc-500 hover:text-white font-medium transition-colors">Cancelar</button>
                      <button onClick={handleJoinWaitlist} className="flex-[2] bg-amber-500 text-black font-bold rounded-xl py-3 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">Entrar na Fila</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default BookingPage;
