// src/services/PrinterService.js
import ThermalPrinterModule from 'react-native-thermal-printer';

export const imprimirTicketCheckin = async (nomeCompleto, infoPrincipal, dadoAdicional) => {
  try {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const nomeSeguro = nomeCompleto || "Aluno";
    const nomeCurto = nomeSeguro.split(' ').slice(0, 2).join(' ');

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

    let tentativas = 0;
    let conectou = false;

    // 1. Tenta estabelecer a conexão e imprimir a PRIMEIRA VIA
    while (tentativas < 2 && !conectou) {
      try {
        tentativas++;
        console.log(`Imprimindo VIA 1 (Tentativa ${tentativas})...`);
        
        await ThermalPrinterModule.printTcp({
          ip: '192.168.0.200', 
          port: 9100,
          timeout: 8000, 
          payload: layoutRecibo,
          autoCut: true, 
        });
        
        conectou = true; 
        console.log("✅ Primeira via impressa!");

      } catch (error) {
        console.error(`❌ Falha na Via 1, tentativa ${tentativas}:`, error);
        if (tentativas >= 2) return false; // Desiste se falhar 2 vezes
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 2. Imprime a SEGUNDA VIA (Agora que a rede já está acordada!)
    if (conectou) {
      try {
        // Uma pausa minúscula (1 segundo) para a impressora cortar o papel da Via 1
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Imprimindo VIA 2...`);
        await ThermalPrinterModule.printTcp({
          ip: '192.168.0.200', 
          port: 9100,
          timeout: 3000, // Timeout bem menor, pois a rede já está rápida
          payload: layoutRecibo,
          autoCut: true, 
        });
        console.log("✅ Segunda via impressa!");
        
      } catch (error) {
        console.error("❌ Falha ao imprimir a segunda via:", error);
      }
    }

    return conectou;

  } catch (error) {
    console.error("❌ Erro geral ao processar ticket:", error);
    return false;
  }
};