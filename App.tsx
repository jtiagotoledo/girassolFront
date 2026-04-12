import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // 1. Importe isso
import { setupDatabase } from './src/database/Database';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  useEffect(() => {
    setupDatabase();
  }, []);

  return (
    // 2. Envolva tudo com o GestureHandlerRootView e dê um flex: 1
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;