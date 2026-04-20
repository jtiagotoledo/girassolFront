import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // IMPORTANDO O ÍCONE
import db, { deletarAluno } from '../database/Database'; // IMPORTANDO A FUNÇÃO NOVA

const ListaAlunos = ({ navigation }) => {
  const [alunos, setAlunos] = useState([]);

  const carregarAlunos = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM alunos ORDER BY nome ASC',
        [], 
        (_tx, results) => {
          let tempAlunos = [];
          for (let i = 0; i < results.rows.length; i++) {
            tempAlunos.push(results.rows.item(i));
          }
          setAlunos(tempAlunos);
        },
        (_tx, error) => console.error("Erro ao listar alunos:", error)
      );
    });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarAlunos();
    });
    return unsubscribe;
  }, [navigation]);

  // --- NOVA FUNÇÃO DE EXCLUIR COM ALERTA ---
  const confirmarExclusao = (id, nome) => {
    Alert.alert(
      "Excluir Aluno",
      `Tem certeza que deseja apagar o cadastro de ${nome}?`,
      [
        { text: "Cancelar", style: "cancel" }, // Botão que não faz nada
        { 
          text: "Sim, Excluir", 
          style: "destructive", // Fica vermelho no iOS
          onPress: async () => {
            try {
              await deletarAluno(id);
              carregarAlunos(); // Recarrega a lista na mesma hora
              Alert.alert("Sucesso", "Aluno excluído.");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o aluno.");
            }
          } 
        }
      ]
    );
  };

  // --- RENDER ITEM ATUALIZADO ---
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.subtext}>CPF: {item.cpf}</Text>
      </View>
      
      {/* Container para agrupar os botões */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.btnEdit} 
          onPress={() => navigation.navigate('Cadastro', { alunoEditavel: item })}
        >
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>

        {/* Botão de Excluir com Ícone */}
        <TouchableOpacity 
          style={styles.btnDelete} 
          onPress={() => confirmarExclusao(item.id, item.nome)}
        >
          <Icon name="trash-2" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestão de Alunos</Text>
        <TouchableOpacity style={styles.btnAdd} onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.btnAddText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alunos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum aluno cadastrado.</Text>}
      />

      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.navigate('Checkin')}>
        <Text style={styles.btnVoltarText}>Sair da Gestão</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- AJUSTES NOS ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', elevation: 4 },
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
  info: { flex: 1 }, // Faz o texto ocupar o espaço que sobrar
  nome: { fontSize: 18, fontWeight: '600', color: '#333' },
  subtext: { color: '#666', fontSize: 14 },
  
  actions: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  }, // Alinha os botões lado a lado
  btnEdit: { 
    backgroundColor: '#007bff', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 5,
    marginRight: 20 
  },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  btnDelete: {
    padding: 10,
  },
  
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  btnVoltar: { padding: 20, alignItems: 'center', backgroundColor: '#6c757d' },
  btnVoltarText: { color: '#FFF', fontWeight: 'bold' }
});

export default ListaAlunos;