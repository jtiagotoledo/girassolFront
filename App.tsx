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
      try {
        console.log(" Heartbeat GLOBAL: Mantendo a rota da impressora ativa...");
        await fetch('http://192.168.0.200', { 
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
      } catch (error) {
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