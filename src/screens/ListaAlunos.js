import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Switch, Modal, ScrollView } from 'react-native'; // <-- Adicionamos Modal e ScrollView
import Icon from 'react-native-vector-icons/Feather'; 
import db, { deletarAluno } from '../database/Database'; 

const ListaAlunos = ({ navigation }) => {
  const [alunos, setAlunos] = useState([]);
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);
  
  const [busca, setBusca] = useState('');
  const [apenasAtivos, setApenasAtivos] = useState(true); 

  // --- NOVOS ESTADOS PARA O MODAL ---
  const [modalVisivel, setModalVisivel] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

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
      setBusca(''); 
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    let lista = alunos;
    if (apenasAtivos) {
      lista = lista.filter(aluno => aluno.ativo === 1);
    }
    if (busca !== '') {
      const textoBuscado = busca.toLowerCase();
      lista = lista.filter(aluno => 
        aluno.nome.toLowerCase().includes(textoBuscado) || 
        aluno.cpf.includes(textoBuscado)
      );
    }
    setAlunosFiltrados(lista);
  }, [busca, apenasAtivos, alunos]); 

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

  // --- FUNÇÃO PARA ABRIR O MODAL ---
  const abrirDetalhes = (aluno) => {
    setAlunoSelecionado(aluno);
    setModalVisivel(true);
  };

  const renderItem = ({ item }) => {
    const isInativo = item.ativo === 0;

    return (
      <View style={[styles.card, isInativo && styles.cardInativo]}>
        
        {/* --- AQUI: Transformamos a View da info em um botão clicável --- */}
        <TouchableOpacity style={styles.info} onPress={() => abrirDetalhes(item)}>
          <Text style={[styles.nome, isInativo && styles.textoInativo]}>
            {item.nome} {isInativo && <Text style={styles.tagInativo}>(Inativo)</Text>}
          </Text>
          <Text style={styles.subtext}>CPF: {item.cpf}</Text>
          <Text style={styles.dicaClique}>Toque para ver detalhes</Text>
        </TouchableOpacity>
        
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestão de Alunos</Text>
        <TouchableOpacity style={styles.btnAdd} onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.btnAddText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou CPF..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Icon name="x-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Ocultar alunos inativos</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#FFD700" }} 
          thumbColor={apenasAtivos ? "#000" : "#f4f3f4"} 
          onValueChange={setApenasAtivos}
          value={apenasAtivos}
        />
      </View>

      <FlatList
        data={alunosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {busca !== '' 
              ? 'Nenhum aluno encontrado na busca.' 
              : 'Nenhum aluno na lista atual.'}
          </Text>
        }
      />

      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.navigate('Checkin')}>
        <Text style={styles.btnVoltarText}>Sair da Gestão</Text>
      </TouchableOpacity>

      {/* ========================================== */}
      {/* --- INÍCIO DO MODAL DE DETALHES DO ALUNO --- */}
      {/* ========================================== */}
      <Modal
        animationType="slide" // Faz a janela subir suavemente
        transparent={true} // Permite ver o fundo escurecido
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)} // Fecha no botão "voltar" do Android
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Se houver um aluno selecionado, mostramos os dados */}
            {alunoSelecionado && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{alunoSelecionado.nome}</Text>
                  <Text style={[styles.modalStatus, { color: alunoSelecionado.ativo === 1 ? '#28a745' : '#FF3B30' }]}>
                    {alunoSelecionado.ativo === 1 ? '● ATIVO' : '● INATIVO'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>CPF</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.cpf}</Text>

                  <Text style={styles.modalLabel}>NASCIMENTO</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.data_nasc || 'Não informado'}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>CELULAR</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.celular || 'Não informado'}</Text>

                  <Text style={styles.modalLabel}>E-MAIL</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.email || 'Não informado'}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>ENDEREÇO</Text>
                  <Text style={styles.modalDado}>
                    {alunoSelecionado.logradouro ? `${alunoSelecionado.logradouro}, ${alunoSelecionado.numero}` : 'Não informado'}
                    {alunoSelecionado.complemento ? ` - ${alunoSelecionado.complemento}` : ''}
                  </Text>
                  <Text style={styles.modalDado}>
                    {alunoSelecionado.bairro ? `${alunoSelecionado.bairro} - ` : ''}
                    {alunoSelecionado.cidade ? `${alunoSelecionado.cidade}/${alunoSelecionado.uf}` : ''}
                  </Text>
                  <Text style={styles.modalDado}>
                    {alunoSelecionado.cep ? `CEP: ${alunoSelecionado.cep}` : ''}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>LIMITE DE AULAS (MENSAL)</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.lim_aulas} aulas</Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity 
              style={styles.modalBtnFechar} 
              onPress={() => setModalVisivel(false)}
            >
              <Text style={styles.modalBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ========================================== */}
      {/* --- FIM DO MODAL --- */}
      {/* ========================================== */}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', elevation: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  btnAdd: { backgroundColor: '#28a745', padding: 10, borderRadius: 8 },
  btnAddText: { color: '#FFF', fontWeight: 'bold' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 15, marginBottom: 5, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },

  switchContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 15, marginBottom: 5 },
  switchLabel: { fontSize: 14, color: '#666', marginRight: 10, fontWeight: '500' },

  list: { padding: 15 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  cardInativo: { backgroundColor: '#EFEFEF', opacity: 0.6, elevation: 0 },
  textoInativo: { color: '#888' },
  tagInativo: { fontSize: 12, color: '#FF3B30', fontWeight: 'bold' },
  
  info: { flex: 1 }, 
  nome: { fontSize: 18, fontWeight: '600', color: '#333' },
  subtext: { color: '#666', fontSize: 14, marginTop: 2 },
  dicaClique: { fontSize: 11, color: '#007bff', marginTop: 4, fontStyle: 'italic' }, // Dica visual para o usuário
  
  actions: { flexDirection: 'row', alignItems: 'center' }, 
  btnEdit: { backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5, marginRight: 10 },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  btnDelete: { padding: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  btnVoltar: { padding: 20, alignItems: 'center', backgroundColor: '#6c757d' },
  btnVoltarText: { color: '#FFF', fontWeight: 'bold' },

  // --- ESTILOS DO MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo escuro transparente
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: 500, // Limita a largura no tablet para não ficar gigante
    maxHeight: '80%', // Limita a altura para rolar se tiver muito dado
    borderRadius: 15,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  modalStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  modalSection: {
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalDado: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  modalBtnFechar: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalBtnText: {
    color: '#FFD700', // Texto Girassol
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default ListaAlunos;