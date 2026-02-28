import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { Barber } from '../../types';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Key, User, Scissors, Package, Crown } from 'lucide-react';

const AdminBarbers: React.FC = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const [formData, setFormData] = useState<Partial<Barber>>({
    name: '',
    description: '',
    phone: '',
    photoUrl: 'https://picsum.photos/200',
    commissionRates: { service: 50, product: 15, subscription: 10 },
    active: true,
    username: '',
    password: ''
  });

  useEffect(() => {
    setBarbers(storage.getBarbers());
  }, []);

  const handleOpenModal = (barber?: Barber) => {
    if (barber) {
      setEditingBarber(barber);
      // Ensure commissionRates exists for legacy data
      const safeRates = barber.commissionRates || { service: 50, product: 15, subscription: 10 };
      setFormData({ ...barber, commissionRates: safeRates });
    } else {
      setEditingBarber(null);
      setFormData({ 
        name: '', 
        description: '',
        phone: '', 
        photoUrl: `https://picsum.photos/seed/${Date.now()}/200`,
        commissionRates: { service: 50, product: 15, subscription: 10 }, 
        active: true,
        username: '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;

    let updatedBarbers = [...barbers];
    if (editingBarber) {
      updatedBarbers = barbers.map(b => b.id === editingBarber.id ? { ...b, ...formData } as Barber : b);
    } else {
      updatedBarbers.push({
        id: crypto.randomUUID(),
        ...formData
      } as Barber);
    }

    storage.saveBarbers(updatedBarbers);
    setBarbers(updatedBarbers);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza? Isso pode afetar relatórios passados.')) {
      const updated = barbers.filter(b => b.id !== id);
      storage.saveBarbers(updated);
      setBarbers(updated);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Profissionais</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Barbeiro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {barbers.map(barber => (
          <div key={barber.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center relative group">
             <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(barber)} className="p-2 bg-zinc-800 rounded-full hover:text-white text-zinc-400">
                    <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(barber.id)} className="p-2 bg-zinc-800 rounded-full hover:text-red-400 text-zinc-400">
                    <Trash2 size={16} />
                </button>
             </div>

             <img 
               src={barber.photoUrl} 
               alt={barber.name} 
               className="w-24 h-24 rounded-full object-cover border-4 border-zinc-800 mb-4"
             />
             <h3 className="text-xl font-bold text-white">{barber.name}</h3>
             <p className="text-zinc-500 text-sm mb-2">{barber.phone}</p>
             {barber.description && (
                 <p className="text-zinc-400 text-xs text-center mb-4 italic line-clamp-2 px-4">"{barber.description}"</p>
             )}
             
             <div className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mb-4">
                 <p className="text-xs text-zinc-500 font-bold uppercase mb-2 text-center">Comissões</p>
                 <div className="flex justify-between text-center divide-x divide-zinc-800">
                     <div className="flex-1 px-1">
                         <Scissors size={14} className="mx-auto mb-1 text-blue-400"/>
                         <span className="text-sm font-bold text-white">{barber.commissionRates?.service}%</span>
                     </div>
                     <div className="flex-1 px-1">
                         <Crown size={14} className="mx-auto mb-1 text-purple-400"/>
                         <span className="text-sm font-bold text-white">{barber.commissionRates?.subscription}%</span>
                     </div>
                     <div className="flex-1 px-1">
                         <Package size={14} className="mx-auto mb-1 text-green-400"/>
                         <span className="text-sm font-bold text-white">{barber.commissionRates?.product}%</span>
                     </div>
                 </div>
             </div>

             <div className="w-full flex justify-between items-center border-t border-zinc-800 pt-3 mt-auto">
                 <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${barber.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                     <span className="text-xs text-zinc-500">{barber.active ? 'Ativo' : 'Inativo'}</span>
                 </div>
                 {barber.username && (
                    <div className="text-xs text-zinc-600 flex items-center gap-1">
                        <User size={12}/> {barber.username}
                    </div>
                 )}
             </div>
          </div>
        ))}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingBarber ? 'Editar' : 'Novo'} Profissional</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                 <img src={formData.photoUrl} className="w-20 h-20 rounded-full bg-zinc-800 object-cover border-2 border-zinc-700" />
              </div>
              
              {/* Personal Info */}
              <div className="space-y-4 pb-4 border-b border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Dados Pessoais</h3>
                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Nome Completo</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Descrição / Bio</label>
                    <textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none resize-none h-20"
                        placeholder="Breve descrição sobre o profissional..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-400 text-sm mb-1">Telefone</label>
                        <input 
                            type="text" 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 text-sm mb-1">URL da Foto</label>
                        <div className="flex gap-2">
                            <input 
                            type="text" 
                            value={formData.photoUrl}
                            onChange={e => setFormData({...formData, photoUrl: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none text-xs"
                            />
                            <button type="button" onClick={() => setFormData({...formData, photoUrl: `https://picsum.photos/seed/${Date.now()}/200`})} className="bg-zinc-800 p-2 rounded text-zinc-400 hover:text-white"><ImageIcon size={18} /></button>
                        </div>
                      </div>
                  </div>
              </div>

              {/* Commissions */}
              <div className="space-y-4 pb-4 border-b border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Comissões (%)</h3>
                  <div className="grid grid-cols-3 gap-4">
                      <div>
                          <label className="block text-blue-400 text-xs font-bold mb-1 flex items-center gap-1"><Scissors size={12}/> Serviços</label>
                          <input 
                            type="number" max="100" min="0"
                            value={formData.commissionRates?.service}
                            onChange={e => setFormData({
                                ...formData, 
                                commissionRates: { ...formData.commissionRates!, service: Number(e.target.value) }
                            })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none text-center font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-purple-400 text-xs font-bold mb-1 flex items-center gap-1"><Crown size={12}/> Assinaturas</label>
                          <input 
                            type="number" max="100" min="0"
                            value={formData.commissionRates?.subscription}
                            onChange={e => setFormData({
                                ...formData, 
                                commissionRates: { ...formData.commissionRates!, subscription: Number(e.target.value) }
                            })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none text-center font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-green-400 text-xs font-bold mb-1 flex items-center gap-1"><Package size={12}/> Produtos</label>
                          <input 
                            type="number" max="100" min="0"
                            value={formData.commissionRates?.product}
                            onChange={e => setFormData({
                                ...formData, 
                                commissionRates: { ...formData.commissionRates!, product: Number(e.target.value) }
                            })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-green-500 focus:outline-none text-center font-bold"
                          />
                      </div>
                  </div>
              </div>

              {/* Login Info */}
              <div className="space-y-4 pb-4 border-b border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Key size={14}/> Acesso ao Sistema
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-400 text-sm mb-1">Login</label>
                        <input 
                            type="text" 
                            value={formData.username || ''}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
                            placeholder="ex: joao"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 text-sm mb-1">Senha</label>
                        <input 
                            type="password" 
                            value={formData.password || ''}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
                            placeholder="******"
                        />
                      </div>
                  </div>
              </div>

              {/* Settings */}
              <div className="flex items-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-3 rounded-lg border border-zinc-800 w-full">
                        <input 
                          type="checkbox" 
                          checked={formData.active}
                          onChange={e => setFormData({...formData, active: e.target.checked})}
                          className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-zinc-300 font-medium">Profissional Ativo (Aparece no agendamento)</span>
                    </label>
              </div>
              
              <button 
                onClick={handleSave}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold py-4 rounded-lg mt-4 transition-colors"
              >
                Salvar Profissional
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBarbers;