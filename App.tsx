import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { setupDatabase } from './src/database/Database';
import CadastroAluno from './src/screens/CadastroAluno';

const App = () => {
  useEffect(() => {
    setupDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <CadastroAluno />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;