// Google Apps Script per configurare ZANTARA Chat App
// Da eseguire in script.google.com

function configureChatApp() {
  const PROJECT_ID = 'involuted-box-469105-r0';
  const BOT_URL = 'https://224d3f4e1c3c.ngrok-free.app/chatbot';

  try {
    // Usa l'API Admin SDK per configurare l'app
    const chatConfig = {
      name: 'ZANTARA',
      description: 'AI Assistant for Bali Zero',
      avatarUrl: 'https://storage.googleapis.com/gweb-cloudblog-publish/images/google-chat.max-1000x1000.png',
      botUrl: BOT_URL,
      interactive: true
    };

    console.log('Configurazione ZANTARA:', chatConfig);
    console.log('Vai manualmente su: https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=' + PROJECT_ID);
    console.log('Bot URL da configurare:', BOT_URL);

    return {
      success: true,
      botUrl: BOT_URL,
      message: 'Configurazione preparata - richiede setup manuale'
    };

  } catch (error) {
    console.error('Errore configurazione:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}