import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { cadastrarAluno } from '../database/Database'; // ajuste o caminho se necessário

const CadastroAluno = () => {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    data_nasc: '',
    endereco: '',
    email: '',
    celular: '',
    lim_aulas: '8', // valor padrão comum
  });

  const salvar = async () => {
    if (!form.nome || !form.cpf) {
      Alert.alert("Erro", "Nome e CPF são obrigatórios");
      return;
    }

    try {
      await cadastrarAluno(form);
      Alert.alert("Sucesso", "Aluno cadastrado com sucesso!");
      // Limpar formulário se desejar
    } catch (error) {
      Alert.alert("Erro ao salvar", error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Novo Aluno</Text>
      
      <Text>Nome Completo</Text>
      <TextInput 
        style={styles.input} 
        onChangeText={(val) => setForm({...form, nome: val})} 
      />

      <Text>CPF</Text>
      <TextInput 
        style={styles.input} 
        keyboardType="numeric"
        onChangeText={(val) => setForm({...form, cpf: val})} 
      />

      <Text>Celular</Text>
      <TextInput 
        style={styles.input} 
        keyboardType="phone-pad"
        onChangeText={(val) => setForm({...form, celular: val})} 
      />

      {/* Repita para os outros campos: email, endereco, etc */}

      <Text>Limite de Aulas Mensais</Text>
      <TextInput 
        style={styles.input} 
        keyboardType="numeric"
        onChangeText={(val) => setForm({...form, lim_aulas: val})} 
      />

      <Button title="Salvar Aluno" onPress={salvar} color="#2e7d32" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 15 }
});

export default CadastroAluno;