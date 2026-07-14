// src/services/PrinterService.js
import ThermalPrinterModule from 'react-native-thermal-printer';

export const imprimirTicketCheckin = async (nomeCompleto, infoPrincipal, dadoAdicional) => {
  try {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const nomeSeguro = nomeCompleto || "Aluno";
    const nomeCurto = nomeSeguro.split(' ').slice(0, 2).join(' ');

    // Detecta se é erro/bloqueio pela string enviada no checkin
    const infoStr = String(infoPrincipal);
    const isErro = infoStr.includes("PAGTO:") || infoStr === "ERRO";

    const layoutRecibo = 
      `[C]<b>ESPAÇO LEVIARE</b>\n` +
      `[C]--------------------------------\n` +
      `[C]<b>${isErro ? 'PENDÊNCIA DE ACESSO' : 'TICKET DE ENTRADA'}</b>\n` +
      `[L]\n` +
      `[L]Aluno(a): ${nomeCurto}\n` +
      `[L]Data: ${dataFormatada} as ${horaFormatada}\n` +
      `[L]${isErro ? infoStr : 'Aula: ' + infoStr}\n` +
      `[L]${isErro ? '<b>Motivo: ' + dadoAdicional + '</b>' : 'Ult. Pagamento: ' + dadoAdicional}\n` +
      `\n` +
      `[C]--------------------------------\n` +
      `[L]\n` +
      `[L]\n` +
      `[L]\n` +
      `[L].\n`;

    // --- INÍCIO DO SISTEMA DE AUTO-RETRY ---
    let tentativas = 0;
    let sucesso = false;

    while (tentativas < 2 && !sucesso) {
      try {
        tentativas++;
        console.log(`Tentativa de impressão do ticket: ${tentativas}...`);
        
        await ThermalPrinterModule.printTcp({
          ip: '192.168.15.200', 
          port: 9100,
          timeout: 8000, // Tempo de espera estendido para 8 segundos
          payload: layoutRecibo,
          autoCut: true, 
        });
        
        sucesso = true; 
        console.log("✅ Ticket impresso com sucesso!");

      } catch (error) {
        console.error(`❌ Falha na tentativa ${tentativas} (Rede/Timeout):`, error);
        
        if (tentativas >= 2) {
          console.error("A impressora não respondeu após as tentativas.");
          return false; 
        }
        
        // Pausa de meio segundo para a rede "acordar" antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return sucesso;

  } catch (error) {
    console.error("❌ Erro geral ao processar ticket:", error);
    return false;
  }
};