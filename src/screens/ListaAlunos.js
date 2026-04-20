import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; 
import db, { deletarAluno } from '../database/Database'; 

const ListaAlunos = ({ navigation }) => {
  const [alunos, setAlunos] = useState([]);
  
  // --- NOVOS ESTADOS PARA A BUSCA ---
  const [busca, setBusca] = useState('');
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);

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
          setAlunosFiltrados(tempAlunos); // Preenche a lista filtrada também ao carregar
        },
        (_tx, error) => console.error("Erro ao listar alunos:", error)
      );
    });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarAlunos();
      setBusca(''); // Limpa a busca sempre que a tela abrir
    });
    return unsubscribe;
  }, [navigation]);

  // --- LÓGICA DE FILTRAGEM (Em Tempo Real) ---
  useEffect(() => {
    if (busca === '') {
      setAlunosFiltrados(alunos);
    } else {
      const textoBuscado = busca.toLowerCase();
      const filtro = alunos.filter(aluno => 
        aluno.nome.toLowerCase().includes(textoBuscado) || 
        aluno.cpf.includes(textoBuscado)
      );
      setAlunosFiltrados(filtro);
    }
  }, [busca, alunos]); // Roda essa função sempre que você digitar algo

  const confirmarExclusao = (id, nome) => {
    Alert.alert(
      "Excluir Aluno",
      `Tem certeza que deseja apagar o cadastro de ${nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await deletarAluno(id);
              carregarAlunos(); 
              Alert.alert("Sucesso", "Aluno excluído.");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o aluno.");
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.subtext}>CPF: {item.cpf}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.btnEdit} 
          onPress={() => navigation.navigate('Cadastro', { alunoEditavel: item })}
        >
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>

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

      {/* --- NOVA BARRA DE BUSCA --- */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou CPF..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        {/* Botão para limpar a busca caso tenha algo digitado */}
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Icon name="x-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={alunosFiltrados} // Atenção: Agora a FlatList usa a lista filtrada!
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {busca !== '' ? 'Nenhum aluno encontrado na busca.' : 'Nenhum aluno cadastrado.'}
          </Text>
        }
      />

      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.navigate('Checkin')}>
        <Text style={styles.btnVoltarText}>Sair da Gestão</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', elevation: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  btnAdd: { backgroundColor: '#28a745', padding: 10, borderRadius: 8 },
  btnAddText: { color: '#FFF', fontWeight: 'bold' },
  
  // --- ESTILOS DA BUSCA ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 15,
    marginBottom: 0,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },

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
  info: { flex: 1 }, 
  nome: { fontSize: 18, fontWeight: '600', color: '#333' },
  subtext: { color: '#666', fontSize: 14 },
  actions: { flexDirection: 'row', alignItems: 'center' }, 
  btnEdit: { 
    backgroundColor: '#007bff', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 5,
    marginRight: 10 
  },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  btnDelete: { padding: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  btnVoltar: { padding: 20, alignItems: 'center', backgroundColor: '#6c757d' },
  btnVoltarText: { color: '#FFF', fontWeight: 'bold' }
});

export default ListaAlunos;