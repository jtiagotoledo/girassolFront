import AsyncStorage from '@react-native-async-storage/async-storage';
// Importamos a função real que fizemos no outro arquivo
import { realizarBackupBancoDados } from './GoogleDriveService';

export const verificarEExecutarBackupAutomatico = async () => {
  try {
    const ultimoBackup = await AsyncStorage.getItem('@ultimo_backup_girassol');
    const agora = new Date();

    // Se nunca foi feito, marca agora como a primeira data e encerra
    if (!ultimoBackup) {
      await AsyncStorage.setItem('@ultimo_backup_girassol', agora.toISOString());
      console.log("[Backup] Primeira execução: data base registrada.");
      return;
    }

    const dataUltimoBackup = new Date(ultimoBackup);
    const diffTime = Math.abs(agora - dataUltimoBackup);
    
    // --- LÓGICA DE TEMPO ---
    // Para teste: 2 minutos. Para produção: 7 dias (1000 * 60 * 60 * 24 * 7)
    const diffMinutos = Math.floor(diffTime / (1000 * 60)); 
    const INTERVALO_MINUTOS = 2; 

    if (diffMinutos >= INTERVALO_MINUTOS) {
      console.log(`[Backup] Iniciando backup automático (Passaram-se ${diffMinutos} min)...`);
      
      // Executa o upload real para o Drive
      const sucesso = await realizarBackupBancoDados(); 
      
      if (sucesso) {
        await AsyncStorage.setItem('@ultimo_backup_girassol', agora.toISOString());
        console.log("[Backup] Backup automático concluído com sucesso!");
      }
    } else {
      console.log(`[Backup] Próximo backup em ${INTERVALO_MINUTOS - diffMinutos} minutos.`);
    }

  } catch (error) {
    console.error("[Backup] Erro na rotina automática:", error);
  }
};