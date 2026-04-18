import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import db from '../database/Database'; 

const ListaAlunos = ({ navigation }) => {
  const [alunos, setAlunos] = useState([]);

  const carregarAlunos = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM alunos ORDER BY nome ASC',
        [], 
        (_tx, results) => {
          let tempAlunos = [];
          let len = results.rows.length;
          
          for (let i = 0; i < len; i++) {
            tempAlunos.push(results.rows.item(i));
          }
          
          setAlunos(tempAlunos);
        },
        (_tx, error) => {
          console.error("Erro ao listar alunos:", error);
        }
      );
    });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarAlunos();
    });
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.subtext}>CPF: {item.cpf}</Text>
      </View>
      <TouchableOpacity 
        style={styles.btnEdit} 
        onPress={() => Alert.alert('Aviso', 'Função de edição em breve!')}
      >
        <Text style={styles.btnText}>Editar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestão de Alunos</Text>
        <TouchableOpacity 
          style={styles.btnAdd} 
          onPress={() => navigation.navigate('Cadastro')}
        >
          <Text style={styles.btnAddText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alunos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum aluno cadastrado.</Text>
        }
      />

      <TouchableOpacity 
        style={styles.btnVoltar} 
        onPress={() => navigation.navigate('Checkin')}
      >
        <Text style={styles.btnVoltarText}>Sair da Gestão</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF',
    elevation: 4 
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  btnAdd: { backgroundColor: '#28a745', padding: 10, borderRadius: 8 },
  btnAddText: { color: '#FFF', fontWeight: 'bold' },
  list: { padding: 15 },
  card: { 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2
  },
  nome: { fontSize: 18, fontWeight: '600', color: '#333' },
  subtext: { color: '#666', fontSize: 14 },
  btnEdit: { backgroundColor: '#007bff', padding: 8, borderRadius: 5 },
  btnText: { color: '#FFF', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  btnVoltar: { 
    padding: 20, 
    alignItems: 'center', 
    backgroundColor: '#6c757d' 
  },
  btnVoltarText: { color: '#FFF', fontWeight: 'bold' }
});

export default ListaAlunos;