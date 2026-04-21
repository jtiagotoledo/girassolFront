import { GoogleSignin } from '@react-native-google-signin/google-signin';
import RNFS from 'react-native-fs';

// FUNÇÃO AUXILIAR: Busca ou cria a pasta "backupGirassolPilates"
const obterOuCriarPastaBackup = async (accessToken) => {
  const nomePasta = 'backupGirassolPilates';
  
  try {
    // 1. Procura se a pasta já existe
    const responseBusca = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${nomePasta}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const dataBusca = await responseBusca.json();

    if (dataBusca.files && dataBusca.files.length > 0) {
      return dataBusca.files[0].id; // Retorna o ID da pasta existente
    }

    // 2. Se não existir, cria a pasta
    const responseCriar = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: nomePasta,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    const novaPasta = await responseCriar.json();
    return novaPasta.id;
  } catch (error) {
    console.error("Erro ao gerenciar pasta no Drive:", error);
    return null;
  }
};

export const realizarBackupBancoDados = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signInSilently();
    const { accessToken } = await GoogleSignin.getTokens();

    // Busca o ID da pasta específica
    const folderId = await obterOuCriarPastaBackup(accessToken);
    if (!folderId) throw new Error("Não foi possível definir a pasta de destino.");

    const dbName = 'girassol_pilates.db';
    const dbPath = `${RNFS.DocumentDirectoryPath}/../databases/${dbName}`;
    
    if (!(await RNFS.exists(dbPath))) return false;

    const base64File = await RNFS.readFile(dbPath, 'base64');
    const dataAtual = new Date().toISOString().split('T')[0];

    // IMPORTANTE: Adicionamos o 'parents' no metadata para salvar na pasta
    const metadata = {
      name: `Backup_Girassol_${dataAtual}.db`,
      mimeType: 'application/octet-stream',
      parents: [folderId], // <--- Aqui o Google entende onde salvar
    };

    const boundary = 'foo_bar_baz';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/octet-stream\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      `${base64File}\r\n` +
      `--${boundary}--`;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    });

    const resultado = await response.json();
    return !!resultado.id;

  } catch (error) {
    console.error("Erro no backup:", error);
    return false;
  }
};