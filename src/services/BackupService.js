import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs'; // Importando a biblioteca que você já usava!
import { BACKUP_URL, BACKUP_SECRET } from '@env';

export const enviarBackupParaServidor = async () => {
  const dbName = 'girassol_pilates.db';
  const originalDbPath = `${RNFS.DocumentDirectoryPath}/../databases/${dbName}`;
  const tempDbPath = `${RNFS.CachesDirectoryPath}/backup_temp_girassol.db`;

  try {
    // 1. Verifica e copia o arquivo para o Cache (como fizemos antes)
    const existe = await RNFS.exists(originalDbPath);
    if (!existe) {
      console.log('❌ [Backup] Banco original não encontrado:', originalDbPath);
      return false; 
    }

    const tempExiste = await RNFS.exists(tempDbPath);
    if (tempExiste) {
      await RNFS.unlink(tempDbPath); 
    }

    await RNFS.copyFile(originalDbPath, tempDbPath);
    console.log('✅ [Backup] Arquivo copiado para o Cache. Montando upload nativo...');

    // 2. A MÁGICA: Usando o uploader nativo do RNFS em vez do fetch()
    const uploadOptions = {
      toUrl: BACKUP_URL,
      files: [{
        name: 'backup', // O nome do campo que o multer no Linux está esperando
        filename: `backup_tablet_${Date.now()}.db`,
        filepath: tempDbPath, // O RNFS não precisa do "file://" aqui, ele se vira sozinho!
        filetype: 'application/octet-stream'
      }],
      method: 'POST',
      headers: {
        'Authorization': BACKUP_SECRET,
        'User-Agent': 'GirassolApp/1.0 Android'
      },
      begin: (uploadBegin) => {
        console.log('⏳ [Backup] Iniciando envio do arquivo para a nuvem...');
      }
    };

    // 3. Executa o envio
    const response = await RNFS.uploadFiles(uploadOptions).promise;

    // O RNFS retorna "statusCode" em vez de "ok"
    if (response.statusCode === 200) {
      console.log('✅ [Backup] SUCESSO ABSOLUTO! Banco enviado para o seu Servidor Linux!');
      
      // Limpa a sujeira do cache
      await RNFS.unlink(tempDbPath);
      
      return true;
    } else {
      console.log('❌ [Backup] Erro no servidor. Status:', response.statusCode, 'Motivo:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ [Backup] Falha no uploader nativo:', error.message);
    return false;
  }
};
// ==========================================
// FUNÇÃO DO TIMER (O "CRON" DO APLICATIVO)
// ==========================================
export const verificarEExecutarBackupAutomatico = async () => {
  try {
    const ultimoBackup = await AsyncStorage.getItem('@ultimo_backup_girassol');
    const agora = new Date();

    if (!ultimoBackup) {
      await AsyncStorage.setItem('@ultimo_backup_girassol', agora.toISOString());
      console.log("[Backup] Primeira execução: data base registrada no app.");
      return;
    }

    const dataUltimoBackup = new Date(ultimoBackup);
    const diffTime = Math.abs(agora - dataUltimoBackup);
    
    // Para teste: 2 minutos
    const diffMinutos = Math.floor(diffTime / (1000 * 60)); 
    const INTERVALO_MINUTOS = 2; 

    if (diffMinutos >= INTERVALO_MINUTOS) {
      console.log(`[Backup] Iniciando upload automático (Passaram-se ${diffMinutos} min)...`);
      
      const sucesso = await enviarBackupParaServidor(); 
      
      if (sucesso) {
        await AsyncStorage.setItem('@ultimo_backup_girassol', agora.toISOString());
        console.log("[Backup] Timer resetado. Arquivo está seguro no Linux.");
      } else {
        console.log("[Backup] O envio falhou. O app tentará novamente no próximo Check-in.");
      }
    } else {
      console.log(`[Backup] Aguardando... Próximo envio em ${INTERVALO_MINUTOS - diffMinutos} minutos.`);
    }

  } catch (error) {
    console.error("[Backup] Erro na rotina automática de timer:", error);
  }
};