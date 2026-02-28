import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { LevelConfig } from '../../types';
import { Trophy, Save, Zap, AlertCircle } from 'lucide-react';

const LEVEL_NAMES = [
    'Iniciante', 'Bronze', 'Prata', 'Ouro', 'Platina', 
    'Esmeralda', 'Safira', 'Rubi', 'Diamante', 'Lenda'
];

const BORDER_COLORS = [
    'border-zinc-700', // 1
    'border-orange-700', // 2
    'border-zinc-400', // 3
    'border-yellow-500', // 4
    'border-cyan-300', // 5
    'border-emerald-500', // 6
    'border-blue-500', // 7
    'border-red-600', // 8
    'border-indigo-500', // 9
    'border-purple-600' // 10
];

const AdminLevels: React.FC = () => {
  const [config, setConfig] = useState<LevelConfig>({ xpPerService: 100, levels: [] });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setConfig(storage.getLevelConfig());
  }, []);

  const handleSave = () => {
    storage.saveLevelConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleLevelChange = (index: number, value: string) => {
      const newLevels = [...config.levels];
      newLevels[index] = Number(value);
      setConfig({ ...config, levels: newLevels });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Trophy className="text-amber-500" /> Níveis de Fidelidade
            </h2>
            <p className="text-zinc-400">
                Configure o sistema de gamificação e recompensas por XP.
            </p>
          </div>
          <button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-900/20"
          >
            {isSaved ? 'Salvo!' : <><Save size={20}/> Salvar Configuração</>}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* General Config */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="text-yellow-500" size={20}/> Recompensa Base
              </h3>
              <div>
                  <label className="text-sm text-zinc-400 font-bold uppercase mb-2 block">XP por Serviço Confirmado</label>
                  <input 
                    type="number" 
                    value={config.xpPerService}
                    onChange={(e) => setConfig({...config, xpPerService: Number(e.target.value)})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none font-bold text-lg"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                      Sempre que um agendamento for finalizado como "Pago/Atendido", o cliente ganhará esta quantia de experiência.
                  </p>
              </div>
          </div>

          {/* Level Thresholds */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Requisitos de Nível</h3>
              <p className="text-sm text-zinc-400 mb-6 flex items-center gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <AlertCircle size={16}/> Defina quanto XP total o cliente precisa acumular para atingir cada nível.
              </p>

              <div className="space-y-4">
                  <div className="flex items-center gap-4 opacity-50 pb-4 border-b border-zinc-800">
                       <div className="w-12 h-12 rounded-full border-4 border-zinc-700 bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">1</div>
                       <div className="flex-1">
                           <span className="font-bold text-white">Nível 1 (Iniciante)</span>
                           <p className="text-xs text-zinc-500">Todos começam aqui.</p>
                       </div>
                       <div className="font-mono text-zinc-500 font-bold">0 XP</div>
                  </div>

                  {config.levels.map((xp, index) => {
                      const levelNum = index + 2;
                      const label = LEVEL_NAMES[levelNum - 1] || `Nível ${levelNum}`;
                      const color = BORDER_COLORS[levelNum - 1] || 'border-zinc-500';
                      
                      return (
                          <div key={index} className="flex items-center gap-4 animate-in slide-in-from-bottom-2" style={{animationDelay: `${index * 50}ms`}}>
                               <div className={`w-12 h-12 rounded-full border-4 ${color} bg-zinc-800 flex items-center justify-center font-bold text-white shadow-lg`}>
                                   {levelNum}
                               </div>
                               <div className="flex-1">
                                   <span className="font-bold text-white">{label}</span>
                               </div>
                               <div className="w-32">
                                   <div className="relative">
                                       <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">XP</span>
                                       <input 
                                            type="number"
                                            value={xp}
                                            onChange={(e) => handleLevelChange(index, e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 pl-8 text-white text-right font-mono focus:border-amber-500 outline-none"
                                       />
                                   </div>
                               </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminLevels;