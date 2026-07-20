import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { setupDatabase } from './src/database/Database';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  useEffect(() => {
    setupDatabase();

    const pingRoteador = async () => {
      const controller = new AbortController();
      
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);

      try {
        console.log("💓 Heartbeat: Disparando requisição...");
        
        await fetch('http://192.168.0.200', { 
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        console.log("✅ O pacote chegou! (A impressora respondeu)");

      } catch (error) {
        console.log("⚠️ Executado e liberado pelo Android! (Timeout normal porque não achou a impressora).");
      }
    };

    pingRoteador();

    const intervaloKeepAlive = setInterval(pingRoteador, 180000);

    return () => clearInterval(intervaloKeepAlive);
  }, []); 

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <AppNavigator/>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;