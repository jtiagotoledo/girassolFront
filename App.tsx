import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // 1. Importe isso
import { setupDatabase } from './src/database/Database';
import AppNavigator from './src/navigation/AppNavigator';
//import ImportadorDB from './src/screens/ImportadorDb';
//import { GoogleSignin } from '@react-native-google-signin/google-signin';
//import { GOOGLE_WEB_CLIENT_ID } from '@env';

const App = () => {
  useEffect(() => {
    setupDatabase();
    /* try {
      GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });

      // O LOG DE SUCESSO AQUI:
      console.log("✅ Google Sign-In configurado com a chave do Girassol Pilates!");

    } catch (error) {
      // O LOG DE ERRO AQUI:
      console.error("❌ Erro grave ao configurar o Google Sign-In:", error);
    } */

  }, []);

  return (
    // 2. Envolva tudo com o GestureHandlerRootView e dê um flex: 1
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
        {/* <ImportadorDB/> */}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;