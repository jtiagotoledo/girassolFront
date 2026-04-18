import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

import Colors from '../style/Colors'; 

import Checkin from '../screens/Checkin';
import ListaAlunos from '../screens/ListaAlunos';
import CadastroAluno from '../screens/CadastroAluno';

const Drawer = createDrawerNavigator();

const MenuButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity 
      onPress={() => navigation.toggleDrawer()}
      style={styles.menuButton}
    >
      <Icon name="menu" size={30} color={Colors.secondary} />
    </TouchableOpacity>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator 
        initialRouteName="Checkin"
        screenOptions={{
          drawerStyle: {
            backgroundColor: Colors.surface, 
            width: 240,
          },
          headerShown: true, 
          headerTitle: 'Girassol Pilates',
          headerTintColor: Colors.secondary,
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          
          drawerActiveTintColor: Colors.secondary, 
          drawerActiveBackgroundColor: Colors.primary, 
          drawerInactiveTintColor: Colors.textLight, 
          
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
  }
});

export default AppNavigator;