// src/services/PrinterService.js
import ThermalPrinterModule from 'react-native-thermal-printer';

export const imprimirTicketCheckin = async (nomeCompleto, aulaAtual, limiteAulas) => {
  try {
    // 1. Pega a data e hora do exato momento do check-in
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 2. Pega apenas os dois primeiros nomes do aluno para não quebrar a linha do papel
    const nomeCurto = nomeCompleto.split(' ').slice(0, 2).join(' ');

    // 3. Monta o layout do recibo usando as tags da biblioteca
    const layoutRecibo = 
      '[C]<b>ESPAÇO GIRASSOL</b>\n' +
      '[C]--------------------------------\n' +
      '[C]<b>TICKET DE ENTRADA</b>\n' +
      '[L]\n' +
      `[L]Aluno(a): ${nomeCurto}\n` +
      `[L]Data: ${dataFormatada} as ${horaFormatada}\n` +
      `[L]Aula: ${aulaAtual} de ${limiteAulas}
      \n` +
      '[C]--------------------------------\n' +
      '[C]Bom treino!\n' +
      '[L] \n' +
      '[L] \n' +
      '[L] \n' +
      '[L] \n' +
      '[L] \n' +
      '[L] .\n'; // O famoso "empurrador" de papel

    // 4. Manda para a impressora
    await ThermalPrinterModule.printTcp({
      ip: '192.168.15.200', // O IP fixo que você configurou
      port: 9100,
      timeout: 5000,
      payload: layoutRecibo,
      autoCut: true, 
    });

    console.log("✅ Ticket impresso com sucesso!");
    return true;

  } catch (error) {
    console.error("❌ Erro ao imprimir ticket:", error);
    return false;
  }
};