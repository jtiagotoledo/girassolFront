import ThermalPrinterModule from 'react-native-thermal-printer';

export const testeSimplesImpressora = async () => {
  try {
    await ThermalPrinterModule.printTcp({
      ip: '192.168.15.200', // Seu IP
      port: 9100,
      timeout: 5000,
      
      payload: 
        '[C]<b>GIRASSOL PILATES</b>\n' +
        '[L]Teste de Avanco de Papel\n' +
        '[L]--------------------------------\n' +
        // ENGANANDO A BIBLIOTECA (Tag de alinhamento + 1 espaço + \n)
        '[L] \n' +
        '[L] \n' +
        '[L] \n' +
        '[L] \n' +
        '[L] \n' +
        '[L] .\n', // Um pontinho minúsculo na última linha garante o avanço final
        
      autoCut: true, 
    });

    return true;

  } catch (error) {
    console.error("❌ Erro:", error);
    return false;
  }
};