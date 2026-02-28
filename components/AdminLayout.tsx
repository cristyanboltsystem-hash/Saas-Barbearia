import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Scissors, CalendarCheck, LogOut, Store, Settings, Package, Crown, UserCheck, Menu, X, Trophy } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const role = sessionStorage.getItem('userRole');
  const isAdmin = role === 'ADMIN';

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userId');
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/appointments', icon: CalendarCheck, label: 'Agendamentos' },
    { path: '/admin/services', icon: Scissors, label: 'Serviços' },
    { path: '/admin/products', icon: Package, label: 'Produtos' },
    { path: '/admin/packages', icon: Crown, label: 'Pacotes' },
    { path: '/admin/subscribers', icon: UserCheck, label: 'Assinantes' },
    
    ...(isAdmin ? [
        { path: '/admin/barbers', icon: Users, label: 'Barbeiros' },
        { path: '/admin/levels', icon: Trophy, label: 'Níveis & XP' },
        { path: '/admin/settings', icon: Settings, label: 'Backup & Config' }
    ] : []),
  ];

  const SidebarContent = () => (
    <>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-black font-bold shadow-lg shadow-amber-900/20">B</div>
          <div>
              <span className="font-serif font-bold text-xl text-white tracking-tight block">BarberPro</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">System</span>
          </div>
        </div>
        
        <div className="px-8 pb-4">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                {isAdmin ? 'Administrador' : 'Profissional'}
            </span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
                }`}
              >
                <item.icon size={20} className={`transition-colors ${isActive ? 'text-amber-500' : 'text-zinc-500 group-hover:text-white'}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2 mx-4 mb-4">
           <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <Store size={20} />
            <span className="text-sm font-medium">Ver Site</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
    </>
  );

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-zinc-950 border-r border-white/5 flex-col hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
        {/* Mobile Header */}
        <div className="md:hidden bg-zinc-950/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/5 z-20 sticky top-0">
           <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold">B</div>
                <span className="font-serif font-bold text-lg text-white">BarberPro</span>
           </div>
           <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
                {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
           </button>
        </div>

        {/* Mobile Sidebar Overlay & Menu */}
        {isMobileMenuOpen && (
            <div className="md:hidden absolute inset-0 z-30">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                {/* Drawer */}
                <div className="absolute top-0 left-0 bottom-0 w-72 bg-zinc-950 border-r border-white/10 flex flex-col animate-in slide-in-from-left-full duration-300 shadow-2xl">
                    <SidebarContent />
                </div>
            </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 max-w-7xl mx-auto w-full custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
