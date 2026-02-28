import JSZip from 'jszip';
import { storage } from './storage';

export const generateBackupZip = async () => {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().split('T')[0];
  
  // 1. Obter todos os dados brutos
  const rawData = storage.exportData();
  
  // 2. Adicionar arquivo JSON principal (Banco de Dados)
  zip.file(`barberpro_database_${dateStr}.json`, rawData);

  // 3. Criar um CSV de Agendamentos para Excel
  const appointments = storage.getAppointments();
  const services = storage.getServices();
  const barbers = storage.getBarbers();

  const csvHeader = "Data,Hora,Cliente,Telefone,Serviço,Profissional,Valor Total,Status,Pagamento\n";
  const csvRows = appointments.map(app => {
    const serviceName = services.find(s => s.id === app.serviceId)?.name || 'N/A';
    const barberName = barbers.find(b => b.id === app.barberId)?.name || 'N/A';
    const finalPrice = app.finalPrice ?? app.totalPrice;
    
    return [
      app.date,
      app.time,
      `"${app.client.name}"`, // Aspas para evitar quebra em nomes compostos
      app.client.phone,
      `"${serviceName}"`,
      `"${barberName}"`,
      finalPrice.toFixed(2),
      app.status,
      app.paymentMethod || '-'
    ].join(',');
  }).join('\n');

  zip.file(`relatorio_agendamentos_${dateStr}.csv`, csvHeader + csvRows);

  // 4. Arquivo de Leia-me
  const readme = `BACKUP DO SISTEMA BARBERPRO
Data: ${new Date().toLocaleString('pt-BR')}

CONTEÚDO:
1. barberpro_database_*.json: Contém todos os dados do sistema. Use este arquivo para restaurar o sistema se necessário.
2. relatorio_agendamentos_*.csv: Planilha com histórico de agendamentos que pode ser aberta no Excel ou Google Sheets.

IMPORTANTE:
Mantenha este arquivo seguro. Ele contém informações de clientes e financeiro.
`;
  zip.file('LEIA_ME.txt', readme);

  // 5. Gerar o arquivo final
  const content = await zip.generateAsync({ type: 'blob' });
  
  // 6. Trigger Download
  const url = window.URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Backup_BarberPro_${dateStr}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};