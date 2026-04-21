import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const testarUploadDrive = async () => {
  try {
    // 1. Garante que o Google Play Services está disponível e faz o login
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signIn();
    
    // 2. Pega o Token de Acesso
    const tokens = await GoogleSignin.getTokens();
    const token = tokens.accessToken;
    console.log("Token obtido com sucesso!");

    // 3. Prepara o conteúdo do arquivo
    const conteudo = "Teste de integração - Girassol Pilates";
    const metadata = {
      name: 'Teste_Girassol.txt',
      mimeType: 'text/plain',
    };

    // 4. Monta o corpo da requisição
    const boundary = 'foo_bar_baz';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/plain\r\n\r\n` +
      `${conteudo}\r\n` +
      `--${boundary}--`;

    // 5. Envia para o Google
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    });

    const resultado = await response.json();

    // Se a API devolveu um ID, o arquivo foi criado!
    if (resultado.id) {
      console.log("Arquivo criado com ID:", resultado.id);
      return true; 
    } else {
      console.error("Erro na resposta da API:", resultado);
      return false;
    }

  } catch (error) {
    console.error("Erro no serviço do Google Drive:", error);
    return false;
  }
};