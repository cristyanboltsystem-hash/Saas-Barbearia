import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { Service, Barber } from '../../types';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Scissors, DollarSign } from 'lucide-react';

const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [currentUser, setCurrentUser] = useState<Barber | null>(null);
  
  const role = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');
  const isAdmin = role === 'ADMIN';

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setServices(storage.getServices().filter(s => s.type === 'service'));
    
    if (!isAdmin && userId) {
        const barbers = storage.getBarbers();
        const me = barbers.find(b => b.id === userId);
        setCurrentUser(me || null);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const calculateCommission = (service: Service) => {
      if (!currentUser) return 0;
      // If service has specific override, use it. Otherwise use barber's general service rate.
      const rate = (service.commissionRate !== undefined && service.commissionRate > 0) 
        ? service.commissionRate 
        : (currentUser.commissionRates?.service || 0);
      
      return (service.price * rate) / 100;
  };

  const handleSaveService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newService: Service = {
        id: editingService ? editingService.id : crypto.randomUUID(),
        name: formData.get('name') as string,
        price: Number(formData.get('price')),
        costPrice: 0,
        stock: 0, 
        durationMinutes: Number(formData.get('durationMinutes') || 30),
        description: formData.get('description') as string,
        imageUrl: formData.get('imageUrl') as string,
        type: 'service',
        commissionRate: Number(formData.get('commissionRate') || 0)
    };

    const allItems = storage.getServices();
    let updated = [...allItems];
    
    if (editingService) {
        updated = updated.map(s => s.id === newService.id ? newService : s);
    } else {
        updated.push(newService);
    }
    
    storage.saveServices(updated);
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteService = (id: string) => {
      if(window.confirm('Excluir este serviço?')) {
          const allItems = storage.getServices();
          const updated = allItems.filter(s => s.id !== id);
          storage.saveServices(updated);
          refreshData();
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Serviços</h2>
            <p className="text-zinc-400">
                {isAdmin ? 'Gerencie o catálogo de serviços da barbearia.' : 'Consulte os serviços e suas comissões.'}
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => { setEditingService(null); setIsModalOpen(true); }} className="bg-amber-500 hover:bg-amber-400 text-zinc-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                <Plus size={18}/> Novo Serviço
            </button>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {services.map(service => (
              <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-all">
                  <div className="h-48 bg-zinc-800 relative">
                      {service.imageUrl ? (
                          <img src={service.imageUrl} className="w-full h-full object-cover" alt={service.name}/>
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700"><Scissors size={48}/></div>
                      )}
                      {isAdmin && (
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingService(service); setIsModalOpen(true); }} className="p-2 bg-zinc-900/80 rounded-full text-white hover:text-amber-500"><Edit2 size={16}/></button>
                              <button onClick={() => handleDeleteService(service.id)} className="p-2 bg-zinc-900/80 rounded-full text-white hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-zinc-900/80 px-2 py-1 rounded text-xs text-white font-bold border border-zinc-700 flex items-center gap-1">
                          <Scissors size={12}/> {service.durationMinutes} min
                      </div>
                  </div>
                  <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-xl text-white">{service.name}</h3>
                          <span className="text-amber-500 font-bold text-lg">{formatMoney(service.price)}</span>
                      </div>
                      <p className="text-zinc-400 text-sm line-clamp-2 h-10">{service.description}</p>
                      
                      {/* Barber Commission View */}
                      {!isAdmin && currentUser && (
                          <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg">
                              <span className="text-xs text-zinc-500 uppercase font-bold">Sua Comissão</span>
                              <div className="flex flex-col items-end">
                                  <span className="text-green-500 font-bold">{formatMoney(calculateCommission(service))}</span>
                                  {service.commissionRate && service.commissionRate > 0 ? (
                                      <span className="text-[10px] text-zinc-600">Taxa Fixa: {service.commissionRate}%</span>
                                  ) : (
                                      <span className="text-[10px] text-zinc-600">Taxa Padrão: {currentUser.commissionRates.service}%</span>
                                  )}
                              </div>
                          </div>
                      )}

                      {/* Admin Commission Info */}
                      {isAdmin && service.commissionRate !== undefined && service.commissionRate > 0 && (
                          <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                              Comissão Personalizada: <span className="text-zinc-300">{service.commissionRate}%</span>
                          </div>
                      )}
                  </div>
              </div>
          ))}
          {services.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                  <Scissors size={48} className="mx-auto mb-4 opacity-50"/>
                  <p>Nenhum serviço cadastrado.</p>
              </div>
          )}
      </div>

      {/* Service Modal */}
      {isModalOpen && isAdmin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <form onSubmit={handleSaveService} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">{editingService ? 'Editar' : 'Novo'} Serviço</h2>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button>
                 </div>
                 <div className="space-y-4">
                     <div>
                         <label className="text-xs text-zinc-400 uppercase font-bold">Nome do Serviço</label>
                         <input name="name" required defaultValue={editingService?.name} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-amber-500 outline-none mt-1" placeholder="Ex: Corte Degrade"/>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-xs text-zinc-400 uppercase font-bold">Preço (R$)</label>
                             <input type="number" step="0.01" name="price" required defaultValue={editingService?.price} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-amber-500 outline-none mt-1"/>
                         </div>
                         <div>
                             <label className="text-xs text-zinc-400 uppercase font-bold">Duração (min)</label>
                             <input type="number" name="durationMinutes" required defaultValue={editingService?.durationMinutes || 30} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-amber-500 outline-none mt-1"/>
                         </div>
                     </div>

                     <div>
                         <label className="text-xs text-zinc-400 uppercase font-bold">URL da Imagem</label>
                         <div className="flex gap-2 mt-1">
                             <input name="imageUrl" defaultValue={editingService?.imageUrl} placeholder="https://..." className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-amber-500 outline-none"/>
                             <div className="p-3 bg-zinc-800 rounded border border-zinc-700 text-zinc-500"><ImageIcon size={20}/></div>
                         </div>
                     </div>
                     <div>
                         <label className="text-xs text-zinc-400 uppercase font-bold">Descrição</label>
                         <textarea name="description" defaultValue={editingService?.description} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-amber-500 outline-none mt-1 h-20 resize-none" placeholder="Detalhes do serviço..."/>
                     </div>
                     
                     <div>
                         <label className="text-xs text-zinc-400 uppercase font-bold">Comissão Específica (%) <span className="text-zinc-600 font-normal lowercase">(opcional)</span></label>
                         <input type="number" name="commissionRate" defaultValue={editingService?.commissionRate} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-amber-500 outline-none mt-1" placeholder="Deixe 0 para usar padrão do barbeiro"/>
                     </div>

                     <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold py-3 rounded-lg mt-2 transition-colors">Salvar Serviço</button>
                 </div>
            </form>
          </div>
      )}
    </div>
  );
};

export default AdminServices;