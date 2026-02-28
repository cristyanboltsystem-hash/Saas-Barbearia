import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { storage } from '../../utils/storage';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Check Admin Hardcoded
    if (username === 'admin' && password === 'admin') {
      sessionStorage.setItem('userRole', 'ADMIN');
      sessionStorage.removeItem('userId');
      navigate('/admin/dashboard');
      return;
    }

    // 2. Check Barbers
    const barbers = storage.getBarbers();
    const barber = barbers.find(b => 
      b.username === username && 
      b.password === password && 
      b.active // Only active barbers can login
    );

    if (barber) {
      sessionStorage.setItem('userRole', 'BARBER');
      sessionStorage.setItem('userId', barber.id);
      navigate('/admin/dashboard');
      return;
    }

    setError('Credenciais inválidas.');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b7f30a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-black shadow-2xl shadow-amber-900/40 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <ShieldCheck size={32} strokeWidth={2.5}/>
            </div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight mb-2">BarberPro <span className="text-amber-500 italic">System</span></h1>
            <p className="text-zinc-500 text-sm tracking-wide uppercase font-medium">Acesso Restrito</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Usuário</label>
                <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:bg-zinc-900 focus:outline-none transition-all placeholder:text-zinc-700"
                placeholder="Digite seu usuário"
                />
            </div>
            <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Senha</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:bg-zinc-900 focus:outline-none transition-all placeholder:text-zinc-700"
                placeholder="••••••••"
                />
            </div>
            
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium animate-pulse">
                    {error}
                </div>
            )}

            <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 group"
            >
                Entrar no Sistema <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </button>
            </form>
            
            <div className="mt-8 text-center">
                <p className="text-zinc-600 text-xs">
                    Esqueceu sua senha? Contate o administrador.
                </p>
            </div>
        </div>
        
        <div className="mt-8 text-center opacity-30 hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Secure Environment • 256-bit Encryption</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
