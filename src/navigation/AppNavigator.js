import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Modal, View, Text, TextInput, Alert } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

import Colors from '../constants/colors'; 

import Checkin from '../screens/Checkin';
import ListaAlunos from '../screens/ListaAlunos';
import CadastroAluno from '../screens/CadastroAluno';

const Drawer = createDrawerNavigator();

const SENHA_ADMIN = '2503'; 

const MenuButton = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');

  const verificarSenha = () => {
    if (senhaDigitada === SENHA_ADMIN) {
      setSenhaDigitada('');
      setModalVisible(false);
      navigation.toggleDrawer();
    } else {
      Alert.alert('Acesso Negado', 'Senha incorreta. Tente novamente.');
      setSenhaDigitada('');
    }
  };

  const cancelar = () => {
    setSenhaDigitada('');
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)} 
        style={styles.menuButton}
      >
        <Icon name="menu" size={30} color={Colors.secondary} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cancelar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Acesso Restrito</Text>
            <Text style={styles.modalSubtitle}>Digite a senha do administrador</Text>
            
            <TextInput
              style={styles.inputSenha}
              secureTextEntry={true} 
              keyboardType="numeric" 
              value={senhaDigitada}
              onChangeText={setSenhaDigitada}
              placeholder="******"
              placeholderTextColor={Colors.textLight}
              maxLength={10}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.btnCancelar]} onPress={cancelar}>
                <Text style={styles.btnTextCancelar}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.btn, styles.btnConfirmar]} onPress={verificarSenha}>
                <Text style={styles.btnTextConfirmar}>Acessar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator 
        initialRouteName="Checkin"
        screenOptions={{
          swipeEnabled: false, 
          
          drawerStyle: {
            backgroundColor: Colors.surface, 
            width: 240,
          },
          headerShown: true, 
          headerTitle: 'Espaço Leviare',
          headerTintColor: Colors.secondary,
          headerStyle: {
            backgroundColor: Colors.primary,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    width: 320,
    padding: 25,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputSenha: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 15,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 5,
    marginBottom: 25,
    color: Colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnCancelar: {
    backgroundColor: Colors.disabled,
    marginRight: 10,
  },
  btnConfirmar: {
    backgroundColor: Colors.primary, 
    marginLeft: 10,
  },
  btnTextCancelar: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  btnTextConfirmar: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.secondary,
  }
});

export default AppNavigator;