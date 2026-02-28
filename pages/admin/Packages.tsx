import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { Package, Service, Barber } from '../../types';
import { Plus, Edit2, Trash2, X, Crown, Scissors } from 'lucide-react';

const AdminPackages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentUser, setCurrentUser] = useState<Barber | null>(null);
  
  const role = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');
  const isAdmin = role === 'ADMIN';

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setPackages(storage.getPackages());
    setServices(storage.getServices().filter(s => s.type === 'service'));

    if (!isAdmin && userId) {
        const barbers = storage.getBarbers();
        const me = barbers.find(b => b.id === userId);
        setCurrentUser(me || null);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const calculateCommission = (price: number) => {
      if (!currentUser) return 0;
      const rate = currentUser.commissionRates?.subscription || 0;
      return (price * rate) / 100;
  };

  const handleSavePackage = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const serviceIds = Array.from(formData.getAll('serviceIds') as string[]);

      const newPkg: Package = {
          id: editingPackage ? editingPackage.id : crypto.randomUUID(),
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          price: Number(formData.get('price')),
          monthlyLimit: Number(formData.get('monthlyLimit')),
          serviceIds: serviceIds
      };

      let updated = [...packages];
      if (editingPackage) {
          updated = updated.map(p => p.id === newPkg.id ? newPkg : p);
      } else {
          updated.push(newPkg);
      }
      storage.savePackages(updated);
      refreshData();
      setIsModalOpen(false);
  };

   const handleDeletePackage = (id: string) => {
      if(window.confirm('Excluir pacote? Isso pode afetar assinantes ativos.')) {
          const updated = packages.filter(p => p.id !== id);
          storage.savePackages(updated);
          refreshData();
      }
  };

  return (
      <div>
          <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">Pacotes</h2>
                <p className="text-zinc-400">
                    {isAdmin ? 'Gerencie planos de assinatura e combos.' : 'Confira os pacotes e suas comissões mensais.'}
                </p>
              </div>
              {isAdmin && <button onClick={() => { setEditingPackage(null); setIsModalOpen(true); }} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"><Plus size={18}/> Novo Pacote</button>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {packages.map(pkg => (
                  <div key={pkg.id} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative group transition-all shadow-lg flex flex-col ${isAdmin ? 'hover:border-purple-500/50' : ''}`}>
                      {isAdmin && (
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingPackage(pkg); setIsModalOpen(true); }} className="p-2 bg-zinc-800 rounded-full text-white hover:text-amber-500"><Edit2 size={16}/></button>
                                <button onClick={() => handleDeletePackage(pkg.id)} className="p-2 bg-zinc-800 rounded-full text-white hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                              <Crown size={24}/>
                          </div>
                          <div>
                              <h3 className="font-bold text-white text-lg">{pkg.name}</h3>
                              <p className="text-zinc-500 text-xs font-bold bg-zinc-800 px-2 py-0.5 rounded w-fit mt-1">{pkg.monthlyLimit} utilizações/mês</p>
                          </div>
                      </div>
                      <p className="text-zinc-400 text-sm mb-4 min-h-[40px]">{pkg.description}</p>
                      
                      <div className="space-y-2 mb-6">
                          <p className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1"><Scissors size={12}/> Serviços Inclusos:</p>
                          <div className="flex flex-wrap gap-2">
                              {pkg.serviceIds.map(sid => {
                                  const s = services.find(srv => srv.id === sid);
                                  return s ? <span key={sid} className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300 border border-zinc-700">{s.name}</span> : null;
                              })}
                          </div>
                      </div>
                      
                      {/* Barber Commission View */}
                      {!isAdmin && currentUser && (
                          <div className="mt-auto mb-4 pt-3 border-t border-zinc-800 flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg">
                              <span className="text-xs text-zinc-500 uppercase font-bold">Sua Comissão</span>
                              <div className="flex flex-col items-end">
                                  <span className="text-green-500 font-bold">{formatMoney(calculateCommission(pkg.price))}</span>
                                  <span className="text-[10px] text-zinc-600">
                                      {currentUser.commissionRates?.subscription || 0}% recorrente
                                  </span>
                              </div>
                          </div>
                      )}

                      <div className={`pt-4 border-t border-zinc-800 flex justify-between items-center ${isAdmin ? 'mt-auto' : ''}`}>
                          <span className="text-zinc-500 text-sm">Valor Mensal</span>
                          <span className="text-2xl font-bold text-white">{formatMoney(pkg.price)}</span>
                      </div>
                  </div>
              ))}
               {packages.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500">
                    <Crown size={48} className="mx-auto mb-4 opacity-50"/>
                    <p>Nenhum pacote cadastrado.</p>
                </div>
              )}
          </div>

          {/* Package Modal */}
        {isModalOpen && isAdmin && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <form onSubmit={handleSavePackage} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">{editingPackage ? 'Editar' : 'Novo'} Pacote</h2>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-400 uppercase font-bold">Nome do Pacote</label>
                            <input name="name" required defaultValue={editingPackage?.name} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 focus:border-purple-500 outline-none"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-400 uppercase font-bold">Preço Mensal</label>
                                <input type="number" step="0.01" name="price" required defaultValue={editingPackage?.price} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 focus:border-purple-500 outline-none"/>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 uppercase font-bold">Limite de Uso (Mensal)</label>
                                <input type="number" name="monthlyLimit" required defaultValue={editingPackage?.monthlyLimit} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 focus:border-purple-500 outline-none"/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 uppercase font-bold mb-2 block">Serviços Inclusos</label>
                            <div className="bg-zinc-950 border border-zinc-700 rounded p-3 max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                                {services.map(s => (
                                    <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900 p-1 rounded">
                                        <input 
                                            type="checkbox" 
                                            name="serviceIds" 
                                            value={s.id} 
                                            defaultChecked={editingPackage?.serviceIds.includes(s.id)}
                                            className="rounded border-zinc-700 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="text-zinc-300 text-sm">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 uppercase font-bold">Descrição</label>
                            <textarea name="description" defaultValue={editingPackage?.description} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white mt-1 h-20 resize-none focus:border-purple-500 outline-none"/>
                        </div>
                        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg mt-2 transition-colors">Salvar Pacote</button>
                    </div>
                </form>
            </div>
        )}
      </div>
  );
};

export default AdminPackages;