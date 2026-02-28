import React, { useState } from 'react';
import { Download, Upload, Database, AlertTriangle, FileJson, FileSpreadsheet, Archive } from 'lucide-react';
import { storage } from '../../utils/storage';
import { generateBackupZip } from '../../utils/backup';

const AdminSettings: React.FC = () => {
  const [isRestoring, setIsRestoring] = useState(false);
  const isAdmin = sessionStorage.getItem('userRole') === 'ADMIN';

  // Stats for preview
  const appCount = storage.getAppointments().length;
  const barberCount = storage.getBarbers().length;
  const serviceCount = storage.getServices().length;

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        // Basic validation
        const data = JSON.parse(json);
        if (!data.services && !data.barbers) {
            throw new Error("Formato inválido");
        }
        
        if (window.confirm('ATENÇÃO: Isso irá substituir TODOS os dados atuais pelos do backup. Deseja continuar?')) {
            const success = storage.importData(json);
            if (success) {
                alert('Sistema restaurado com sucesso! A página será recarregada.');
                window.location.reload();
            } else {
                alert('Erro ao processar o arquivo de backup.');
            }
        }
      } catch (err) {
        alert('O arquivo selecionado não é um backup válido do BarberPro (JSON). Se você baixou o ZIP, extraia o arquivo .json de dentro dele primeiro.');
      }
      // Reset input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  if (!isAdmin) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500">
              <AlertTriangle size={48} className="mb-4 text-amber-500"/>
              <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
              <p>Apenas administradores podem acessar as configurações de sistema.</p>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Configurações do Sistema</h1>
      <p className="text-zinc-400 mb-8">Gerencie backups e dados da sua barbearia.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backup Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Archive size={120} className="text-amber-500"/>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Download className="text-amber-500" size={24}/> Backup Completo
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
                Baixe um arquivo <strong>.zip</strong> contendo todo o estado atual do sistema.
                Isso inclui:
            </p>
            <ul className="text-sm text-zinc-500 space-y-2 mb-6">
                <li className="flex items-center gap-2"><Database size={14}/> {appCount} Agendamentos registrados</li>
                <li className="flex items-center gap-2"><FileSpreadsheet size={14}/> Relatório em CSV (Excel)</li>
                <li className="flex items-center gap-2"><FileJson size={14}/> Banco de Dados completo (JSON)</li>
            </ul>

            <button 
                onClick={generateBackupZip}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
                <Download size={20}/> Baixar Backup (.zip)
            </button>
            <p className="text-xs text-zinc-600 mt-3 text-center">
                Faça isso regularmente para garantir a segurança dos seus dados.
            </p>
        </div>

        {/* Restore Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Upload size={120} className="text-blue-500"/>
            </div>

            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="text-blue-500" size={24}/> Restaurar Dados
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
                Tem um backup salvo? Restaure o sistema para um estado anterior.
            </p>
            
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mb-6">
                <p className="text-red-400 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={14}/> CUIDADO
                </p>
                <p className="text-red-400/80 text-xs mt-1">
                    Esta ação apagará todos os dados atuais e os substituirá pelos dados do arquivo.
                </p>
            </div>

            <label className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-zinc-700">
                <Upload size={20}/> 
                <span>Selecionar Arquivo (.json)</span>
                <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleRestore}
                />
            </label>
            <p className="text-xs text-zinc-600 mt-3 text-center">
                Se você baixou um .zip, extraia-o e selecione o arquivo <strong>database.json</strong>.
            </p>
        </div>

        {/* System Info */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Resumo do Sistema</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
                    <span className="text-zinc-500 text-xs uppercase font-bold">Barbeiros</span>
                    <p className="text-2xl font-bold text-white">{barberCount}</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
                    <span className="text-zinc-500 text-xs uppercase font-bold">Serviços/Produtos</span>
                    <p className="text-2xl font-bold text-white">{serviceCount}</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
                    <span className="text-zinc-500 text-xs uppercase font-bold">Agendamentos</span>
                    <p className="text-2xl font-bold text-white">{appCount}</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
                    <span className="text-zinc-500 text-xs uppercase font-bold">Versão</span>
                    <p className="text-2xl font-bold text-amber-500">v1.0.5</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;