import { 
  EVOLUTION_API_URL, 
  EVOLUTION_API_KEY, 
  EVOLUTION_INSTANCE_NAME 
} from '@env'; 

/**
 * Envia mensagem de texto via WhatsApp
 * @param {string} number - Número no formato 5515999999999
 * @param {string} message - Conteúdo da mensagem
 */
export const enviarMensagemWhatsapp = async (number, message) => {
  try {
    let formattedNumber = number.replace(/\D/g, '');
    
    if (!formattedNumber.startsWith('55')) {
        formattedNumber = `55${formattedNumber}`;
    }
    console.log(formattedNumber,message);
    
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: formattedNumber,
        text: message,
        delay: 1200,
        linkPreview: true
      })
    });


    const data = await response.json();
    console.log(data);
    
    return data;
  } catch (error) {
    console.error('Erro no WhatsApp Service:', error);
  }
};