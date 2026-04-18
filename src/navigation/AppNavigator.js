import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native'; // Importamos o useNavigation

import Checkin from '../screens/Checkin';
import ListaAlunos from '../screens/ListaAlunos';
import CadastroAluno from '../screens/CadastroAluno';

const Drawer = createDrawerNavigator();

// --- 1. COMPONENTE 100% INDEPENDENTE ---
// Ele usa o próprio hook para saber quem é a navegação, sem depender de "props" do pai
const MenuButton = () => {
  const navigation = useNavigation(); // O segredo está aqui!

  return (
    <TouchableOpacity 
      onPress={() => navigation.toggleDrawer()}
      style={styles.menuButton}
    >
      <Text style={styles.menuText}>MENU</Text>
    </TouchableOpacity>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator 
        initialRouteName="Checkin"
        // --- 2. SEM FUNÇÕES DE SETA (ARROW FUNCTIONS) ---
        // Passamos as opções como um objeto fixo, não como uma função
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#fff',
            width: 240,
          },
          headerShown: true, 
          headerTitle: 'Girassol Pilates',
          drawerActiveTintColor: '#28a745',
          
          // --- 3. PASSAGEM POR REFERÊNCIA DIRETA ---
          // Sem "() =>". Apenas o nome do componente!
          headerLeft: MenuButton, 
        }}
      >
        <Drawer.Screen 
          name="Checkin" 
          component={Checkin} 
          options={{ title: 'Área de Check-in' }}
        />
        <Drawer.Screen 
          name="ListaAlunos" 
          component={ListaAlunos} 
          options={{ title: 'Gestão de Alunos' }}
        />
        <Drawer.Screen 
          name="Cadastro" 
          component={CadastroAluno} 
          options={{ title: 'Cadastrar Novo' }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    marginLeft: 15,
    padding: 10,
  },
  menuText: {
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#28a745'
  }
});

export default AppNavigator;