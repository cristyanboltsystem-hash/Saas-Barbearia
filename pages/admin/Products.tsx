import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../utils/storage';
import { Service, Barber } from '../../types';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Package, DollarSign, TrendingUp } from 'lucide-react';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Service[]>([]);
  const [currentUser, setCurrentUser] = useState<Barber | null>(null);

  const role = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');
  const isAdmin = role === 'ADMIN';

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Service | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(storage.getServices().filter(s => s.type === 'product'));
    if (!isAdmin && userId) {
        const barbers = storage.getBarbers();
        const me = barbers.find(b => b.id === userId);
        setCurrentUser(me || null);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- Logic: Financial Stats ---
  const productStats = useMemo(() => {
      const totalStockCost = products.reduce((acc, p) => acc + ((p.costPrice || 0) * (p.stock || 0)), 0);
      const potentialRevenue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
      const potentialProfit = potentialRevenue - totalStockCost;
      return { totalStockCost, potentialRevenue, potentialProfit };
  }, [products]);

  const calculateCommission = (product: Service) => {
      if (!currentUser) return 0;
      // If product has specific override, use it. Otherwise use barber's general product rate.
      const rate = (product.commissionRate !== undefined && product.commissionRate > 0) 
        ? product.commissionRate 
        : (currentUser.commissionRates?.product || 0);
      
      return (product.price * rate) / 100;
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProduct: Service = {
        id: editingProduct ? editingProduct.id : crypto.randomUUID(),
        name: formData.get('name') as string,
        price: Number(formData.get('price')),
        costPrice: Number(formData.get('costPrice') || 0),
        stock: Number(formData.get('stock') || 0),
        durationMinutes: 0,
        description: formData.get('description') as string,
        imageUrl: formData.get('imageUrl') as string,
        type: 'product',
        commissionRate: Number(formData.get('commissionRate') || 0)
    };

    const allItems = storage.getServices();
    let updated = [...allItems];
    
    if (editingProduct) {
        updated = updated.map(s => s.id === newProduct.id ? newProduct : s);
    } else {
        updated.push(newProduct);
    }
    
    storage.saveServices(updated);
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
      if(window.confirm('Excluir este produto?')) {
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
                <h2 className="text-3xl font-bold text-white">Produtos</h2>
                <p className="text-zinc-400">
                    {isAdmin ? 'Controle de estoque e venda de produtos.' : 'Catálogo de produtos e comissões de venda.'}
                </p>
            </div>
            {isAdmin && (
                <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                    <Plus size={18}/> Novo Produto
                </button>
            )}
        </div>

        {/* Stats Grid - Only for Admin to check stock value */}
        {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><DollarSign size={24}/></div>
                    <div>
                        <p className="text-zinc-500 text-xs uppercase font-bold">Custo em Estoque</p>
                        <p className="text-2xl font-bold text-white">{formatMoney(productStats.totalStockCost)}</p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><DollarSign size={24}/></div>
                    <div>
                        <p className="text-zinc-500 text-xs uppercase font-bold">Potencial de Venda</p>
                        <p className="text-2xl font-bold text-white">{formatMoney(productStats.potentialRevenue)}</p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><TrendingUp size={24}/></div>
                    <div>
                        <p className="text-zinc-500 text-xs uppercase font-bold">Lucro Projetado</p>
                        <p className="text-2xl font-bold text-green-500">{formatMoney(productStats.potentialProfit)}</p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {products.map(product => (
                <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-all">
                        <div className="h-40 bg-zinc-800 relative">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name}/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700"><Package size={48}/></div>
                        )}
                        {isAdmin && (
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-2 bg-zinc-900/80 rounded-full text-white hover:text-amber-500"><Edit2 size={16}/></button>
                                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-zinc-900/80 rounded-full text-white hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        )}
                        <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-bold border ${product.stock && product.stock > 5 ? 'bg-zinc-900/80 text-white border-zinc-700' : 'bg-red-900/90 text-red-200 border-red-700'}`}>
                            Estoque: {product.stock}
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-white mb-1 truncate">{product.name}</h3>
                        
                        {/* Admin View: Profit Margin */}
                        {isAdmin && (
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Venda</span>
                                    <span className="text-green-500 font-bold text-lg">{formatMoney(product.price)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Lucro Unit.</span>
                                    <span className="text-zinc-300 font-mono text-xs">
                                        {formatMoney(product.price - (product.costPrice || 0))}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Barber View: Commission */}
                        {!isAdmin && currentUser && (
                            <div className="mt-2 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-zinc-400">Preço Venda</span>
                                    <span className="text-white font-bold">{formatMoney(product.price)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                                    <span className="text-xs text-zinc-500 uppercase font-bold">Sua Comissão</span>
                                    <span className="text-green-500 font-bold">{formatMoney(calculateCommission(product))}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500">
                  <Package size={48} className="mx-auto mb-4 opacity-50"/>
                  <p>Nenhum produto cadastrado.</p>
              </div>
            )}
        </div>

        {/* Product Modal */}
        {isModalOpen && isAdmin && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <form onSubmit={handleSaveProduct} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">{editingProduct ? 'Editar' : 'Novo'} Produto</h2>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-400 uppercase font-bold">Nome do Produto</label>
                            <input name="name" required defaultValue={editingProduct?.name} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-green-500 outline-none mt-1" placeholder="Ex: Pomada Matte"/>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-400 uppercase font-bold">Preço de Venda</label>
                                <input type="number" step="0.01" name="price" required defaultValue={editingProduct?.price} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-green-500 outline-none mt-1"/>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 uppercase font-bold">Custo de Compra</label>
                                <input type="number" step="0.01" name="costPrice" defaultValue={editingProduct?.costPrice} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-red-500 outline-none mt-1"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs text-zinc-400 uppercase font-bold">Estoque Atual</label>
                                 <input type="number" name="stock" defaultValue={editingProduct?.stock} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-blue-500 outline-none mt-1"/>
                             </div>
                             <div>
                                <label className="text-xs text-zinc-400 uppercase font-bold">Comissão Venda (%)</label>
                                <input type="number" name="commissionRate" defaultValue={editingProduct?.commissionRate} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-green-500 outline-none mt-1"/>
                             </div>
                        </div>

                        <div>
                            <label className="text-xs text-zinc-400 uppercase font-bold">URL da Imagem</label>
                            <div className="flex gap-2 mt-1">
                                <input name="imageUrl" defaultValue={editingProduct?.imageUrl} placeholder="https://..." className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-green-500 outline-none"/>
                                <div className="p-3 bg-zinc-800 rounded border border-zinc-700 text-zinc-500"><ImageIcon size={20}/></div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 uppercase font-bold">Descrição</label>
                            <textarea name="description" defaultValue={editingProduct?.description} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-green-500 outline-none mt-1 h-20 resize-none"/>
                        </div>

                        <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg mt-2 transition-colors">Salvar Produto</button>
                    </div>
            </form>
            </div>
        )}
    </div>
  );
};

export default AdminProducts;