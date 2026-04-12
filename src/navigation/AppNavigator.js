import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import Checkin from '../screens/Checkin';
import CadastroAluno from '../screens/CadastroAluno';
import ListaAlunos from '../screens/ListaAlunos';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Checkin"
        screenOptions={{
          headerShown: false 
        }}
      >
        <Stack.Screen name="Checkin" component={Checkin} />
        <Stack.Screen name="Cadastro" component={CadastroAluno} />
        <Stack.Screen name="ListaAlunos" component={ListaAlunos} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;