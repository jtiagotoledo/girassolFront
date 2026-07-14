import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs'; 
import { BACKUP_URL, BACKUP_SECRET } from '@env';

export const enviarBackupParaServidor = async () => {
  const dbName = 'girassol_pilates.db';
  const originalDbPath = `${RNFS.DocumentDirectoryPath}/../databases/${dbName}`;
  const tempDbPath = `${RNFS.CachesDirectoryPath}/backup_temp_girassol.db`;

  try {
    const existe = await RNFS.exists(originalDbPath);
    if (!existe) {
      return false; 
    }

    const tempExiste = await RNFS.exists(tempDbPath);
    if (tempExiste) {
      await RNFS.unlink(tempDbPath); 
    }

    await RNFS.copyFile(originalDbPath, tempDbPath);

    const uploadOptions = {
      toUrl: BACKUP_URL,
      files: [{
        name: 'backup', 
        filename: `backup_tablet_${Date.now()}.db`,
        filepath: tempDbPath, 
        filetype: 'application/octet-stream'
      }],
      method: 'POST',
      headers: {
        'Authorization': BACKUP_SECRET,
        'User-Agent': 'GirassolApp/1.0 Android'
      },
      begin: (uploadBegin) => {
      }
    };

    const response = await RNFS.uploadFiles(uploadOptions).promise;

    if (response.statusCode === 200) {
      
      await RNFS.unlink(tempDbPath);
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const verificarEExecutarBackupAutomatico = async () => {
  try {
    const ultimoBackup = await AsyncStorage.getItem('@ultimo_backup_girassol');
    const agora = new Date();

    if (!ultimoBackup) {
      await AsyncStorage.setItem('@ultimo_backup_girassol', agora.toISOString());
      return;
    }

    const dataUltimoBackup = new Date(ultimoBackup);
    const diffTime = Math.abs(agora - dataUltimoBackup);
    
    const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    const INTERVALO_DIAS = 5; 

    if (diffDias >= INTERVALO_DIAS) {
      
      const sucesso = await enviarBackupParaServidor(); 
      
      if (sucesso) {
        await AsyncStorage.setItem('@ultimo_backup_girassol', agora.toISOString());
      } else {
      }
    } else {
    }

  } catch (error) {
  }
};