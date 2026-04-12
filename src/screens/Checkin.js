import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../style/Colors';

const Checkin = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* O Ícone Discreto para Gestão */}
      <TouchableOpacity 
        style={styles.adminButton} 
        onPress={() => navigation.navigate('ListaAlunos')} // Ou Cadastro
      >
        <Text style={{ fontSize: 20 }}>⚙️</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo ao Girassol Pilates</Text>
        <Text style={styles.subtitle}>Digite seu CPF para o check-in</Text>
        
        {/* Aqui virá o campo de CPF e o botão de Check-in que faremos a seguir */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  adminButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    opacity: 0.3, // Fica quase invisível para o aluno
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.secondary },
  subtitle: { fontSize: 18, color: '#666', marginTop: 10 }
});

export default Checkin;