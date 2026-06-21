import ThermalPrinterModule from 'react-native-thermal-printer';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    const duplicarTicket = await AsyncStorage.getItem('@imprimir_duplo');
    
    const vias = duplicarTicket === 'true' ? 2 : 1;

    for (let i = 0; i < vias; i++) {
      await ThermalPrinterModule.printTcp({
        ip: '192.168.15.200', 
        port: 9100,
        timeout: 5000,
        payload: layoutRecibo,
        autoCut: true, 
      });
      
      if (vias > 1 && i === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return true;

  } catch (error) {
    console.error("❌ Erro ao imprimir ticket:", error);
    return false;
  }
};

export const imprimirRelatorioDiario = async (dataFormatada, listaCheckins, total) => {
  try {
    let layoutRelatorio = 
      `[C]<b>ESPAÇO LEVIARE</b>\n` +
      `[C]--------------------------------\n` +
      `[C]<b>RELATORIO DE CHECK-INS</b>\n` +
      `[C]Data: ${dataFormatada}\n` +
      `[L]\n` +
      `[L]<b>HORA  | ALUNO</b>\n` +
      `[C]--------------------------------\n`;

    if (listaCheckins.length === 0) {
      layoutRelatorio += `[C]Nenhum check-in registrado\n`;
    } else {
      listaCheckins.forEach(item => {
        const horaStr = item.data_hora.split(' ')[1].substring(0, 5); 
        const nomeCurto = item.nome.split(' ').slice(0, 2).join(' ').substring(0, 22); 
        
        layoutRelatorio += `[L]${horaStr} | ${nomeCurto}\n`;
      });
    }

    layoutRelatorio += 
      `[C]--------------------------------\n` +
      `[L]\n` +
      `[C]<b>TOTAL DE ACESSOS: ${total}</b>\n` +
      `[L]\n` +
      `[L]\n` +
      `[L]\n` +
      `[L].\n`;

    await ThermalPrinterModule.printTcp({
      ip: '192.168.15.200', 
      port: 9100,
      timeout: 5000,
      payload: layoutRelatorio,
      autoCut: true, 
    });

    return true;

  } catch (error) {
    console.error("❌ Erro ao imprimir relatório:", error);
    return false;
  }
};