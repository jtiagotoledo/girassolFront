import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Switch, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { TextInputMask } from 'react-native-masked-text';

// Importações do Banco de Dados
import db, { 
  deletarAluno, 
  registrarPagamento, 
  buscarHistoricoPagamentos,
  deletarPagamento,    
  atualizarPagamento   
} from '../database/Database';

const formatarParaTela = (dataISO) => {
  if (!dataISO) return null;
  return dataISO.split('-').reverse().join('/');
};

const verificarVencimento = (dataISO) => {
  if (!dataISO) return true;
  const hoje = new Date();
  const dataPagto = new Date(dataISO + 'T00:00:00');
  const diffTime = Math.abs(hoje - dataPagto);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 30;
};

const obterDataHojeISO = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
};

const ListaAlunos = ({ navigation }) => {
  const [alunos, setAlunos] = useState([]);
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [apenasAtivos, setApenasAtivos] = useState(true);

  // Estados dos Modais
  const [modalVisivel, setModalVisivel] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [historicoPagamentos, setHistoricoPagamentos] = useState([]);
  const [modalPagamentoVisivel, setModalPagamentoVisivel] = useState(false);
  
  // Estados para Registro/Edição de Pagamento
  const [alunoPagamento, setAlunoPagamento] = useState(null);
  const [dataPagamentoInput, setDataPagamentoInput] = useState('');
  const [valorPagamentoInput, setValorPagamentoInput] = useState('0,00');
  const [idPagamentoEdicao, setIdPagamentoEdicao] = useState(null);

  const carregarAlunos = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT a.*, (SELECT data_pagamento FROM pagamentos WHERE aluno_id = a.id ORDER BY data_pagamento DESC LIMIT 1) as ultimo_pagamento
         FROM alunos a ORDER BY a.nome ASC`,
        [],
        (_tx, results) => {
          let tempAlunos = [];
          for (let i = 0; i < results.rows.length; i++) tempAlunos.push(results.rows.item(i));
          setAlunos(tempAlunos);
        }
      );
    });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', carregarAlunos);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    let lista = alunos.filter(a => (apenasAtivos ? a.ativo === 1 : true));
    if (busca) {
      lista = lista.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()) || a.cpf.includes(busca));
    }
    setAlunosFiltrados(lista);
  }, [busca, apenasAtivos, alunos]);

  // --- FUNÇÕES DE AÇÃO ---

  const confirmarExclusaoAluno = (id, nome) => {
    Alert.alert("Excluir Aluno", `Deseja apagar o cadastro de ${nome}?`, [
      { text: "Cancelar" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        await deletarAluno(id);
        carregarAlunos();
      }}
    ]);
  };

  const abrirModalPagamento = (aluno) => {
    setAlunoPagamento(aluno);
    setIdPagamentoEdicao(null);
    setDataPagamentoInput(formatarParaTela(obterDataHojeISO()));
    setValorPagamentoInput('0,00');
    setModalPagamentoVisivel(true);
  };

  const abrirModalEdicaoPagamento = (pag) => {
    setIdPagamentoEdicao(pag.id);
    setDataPagamentoInput(formatarParaTela(pag.data_pagamento));
    setValorPagamentoInput(pag.valor.toFixed(2).replace('.', ','));
    setModalPagamentoVisivel(true);
  };

  const salvarPagamento = async () => {
    const dataISO = dataPagamentoInput.split('/').reverse().join('-');
    const valorLimpo = valorPagamentoInput.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const valorNumerico = parseFloat(valorLimpo) || 0;

    try {
      if (idPagamentoEdicao) {
        await atualizarPagamento(idPagamentoEdicao, dataISO, valorNumerico);
      } else {
        await registrarPagamento(alunoPagamento.id, dataISO, valorNumerico);
      }
      carregarAlunos();
      if (alunoSelecionado) {
        const hist = await buscarHistoricoPagamentos(alunoSelecionado.id);
        setHistoricoPagamentos(hist);
      }
      setModalPagamentoVisivel(false);
      Alert.alert("Sucesso", "Pagamento processado!");
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar pagamento.");
    }
  };

  const abrirDetalhes = async (aluno) => {
    setAlunoSelecionado(aluno);
    setModalVisivel(true);
    const hist = await buscarHistoricoPagamentos(aluno.id);
    setHistoricoPagamentos(hist);
  };

  const confirmarExclusaoPagto = (id) => {
    Alert.alert("Excluir Pagamento", "Deseja apagar este registro?", [
      { text: "Cancelar" },
      { text: "Sim", style: "destructive", onPress: async () => {
        await deletarPagamento(id);
        const hist = await buscarHistoricoPagamentos(alunoSelecionado.id);
        setHistoricoPagamentos(hist);
        carregarAlunos();
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    const isVencido = verificarVencimento(item.ultimo_pagamento);
    return (
      <TouchableOpacity style={[styles.card, item.ativo === 0 && styles.cardInativo]} onPress={() => abrirDetalhes(item)}>
        <View style={styles.infoClicavel}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.subtext}>CPF: {item.cpf}</Text>
        </View>
        <View style={styles.actionsBox}>
          <TouchableOpacity 
            style={[styles.btnPagamento, isVencido ? styles.btnPagtoVencido : styles.btnPagtoEmDia]} 
            onPress={() => abrirModalPagamento(item)}
          >
            <Text style={styles.btnTextPagto}>{formatarParaTela(item.ultimo_pagamento) || 'Pagar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnEdit} onPress={() => navigation.navigate('Cadastro', { alunoEditavel: item })}>
            <Icon name="edit" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmarExclusaoAluno(item.id, item.nome)} style={styles.btnDelete}>
             <Icon name="trash-2" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
        <Icon name="search" size={20} color="#999" style={{marginLeft: 10}}/>
        <TextInput style={styles.searchInput} placeholder="Buscar por nome ou CPF..." value={busca} onChangeText={setBusca} />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Ocultar inativos</Text>
        <Switch value={apenasAtivos} onValueChange={setApenasAtivos} trackColor={{ true: "#FFD700" }} />
      </View>

      <FlatList data={alunosFiltrados} keyExtractor={item => item.id.toString()} renderItem={renderItem} contentContainerStyle={styles.list} />

      {/* MODAL REGISTRO/EDICAO PAGAMENTO */}
      <Modal visible={modalPagamentoVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>{idPagamentoEdicao ? 'Editar' : 'Novo'} Pagamento</Text>
            <Text style={styles.modalLabelInput}>Data</Text>
            <TextInputMask type='datetime' options={{format: 'DD/MM/YYYY'}} style={styles.modalInput} value={dataPagamentoInput} onChangeText={setDataPagamentoInput} />
            <Text style={styles.modalLabelInput}>Valor</Text>
            <TextInputMask type='money' style={styles.modalInput} value={valorPagamentoInput} onChangeText={setValorPagamentoInput} />
            <View style={styles.modalRowButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalPagamentoVisivel(false)}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={salvarPagamento}><Text style={{color:'#FFF'}}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DETALHES COMPLETO */}
      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {alunoSelecionado && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{alunoSelecionado.nome}</Text>
                  <Text style={[styles.modalStatus, { color: alunoSelecionado.ativo === 1 ? '#28a745' : '#FF3B30' }]}>
                    {alunoSelecionado.ativo === 1 ? '● ATIVO' : '● INATIVO'}
                  </Text>
                </View>

                {/* DADOS PESSOAIS */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>CPF</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.cpf}</Text>

                  <Text style={styles.modalLabel}>CELULAR / WHATSAPP</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.celular || 'Não informado'}</Text>

                  <Text style={styles.modalLabel}>E-MAIL</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.email || 'Não informado'}</Text>
                </View>

                {/* ENDEREÇO */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>ENDEREÇO</Text>
                  <Text style={styles.modalDado}>
                    {alunoSelecionado.logradouro ? `${alunoSelecionado.logradouro}, ${alunoSelecionado.numero}` : 'Não informado'}
                    {alunoSelecionado.complemento ? ` - ${alunoSelecionado.complemento}` : ''}
                  </Text>
                  {alunoSelecionado.bairro && (
                    <Text style={styles.modalDado}>{alunoSelecionado.bairro} - {alunoSelecionado.cidade}/{alunoSelecionado.uf}</Text>
                  )}
                </View>

                {/* PLANO */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>LIMITE DE AULAS</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.lim_aulas} aulas mensais</Text>
                </View>

                {/* HISTÓRICO FINANCEIRO EDITÁVEL */}
                <View style={styles.modalSectionDestacada}>
                  <Text style={[styles.modalLabel, { color: '#000' }]}>HISTÓRICO DE PAGAMENTOS</Text>
                  {historicoPagamentos.map((pag, i) => (
                    <View key={i} style={styles.linhaPagamento}>
                      <View style={{flex: 1}}>
                        <Text style={styles.modalDadoPagtoData}>{formatarParaTela(pag.data_pagamento)}</Text>
                        <Text style={styles.modalDadoPagtoValor}>R$ {pag.valor.toFixed(2).replace('.', ',')}</Text>
                      </View>
                      <View style={{flexDirection:'row'}}>
                        <TouchableOpacity onPress={() => abrirModalEdicaoPagamento(pag)} style={{padding: 10}}>
                          <Icon name="edit-2" size={20} color="#007bff"/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => confirmarExclusaoPagto(pag.id)} style={{padding: 10}}>
                          <Icon name="trash-2" size={20} color="#FF3B30"/>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.modalBtnFechar} onPress={() => setModalVisivel(false)}>
              <Text style={styles.modalBtnText}>FECHAR DETALHES</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold' },
  btnAdd: { backgroundColor: '#28a745', padding: 10, borderRadius: 8 },
  btnAddText: { color: '#FFF', fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 15, borderRadius: 10, elevation: 1 },
  searchInput: { flex: 1, padding: 15, fontSize: 16 },
  switchContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 20, marginBottom: 5 },
  switchLabel: { marginRight: 10, color: '#666' },
  list: { padding: 15 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardInativo: { opacity: 0.5 },
  nome: { fontSize: 20, fontWeight: 'bold' },
  subtext: { color: '#666' },
  actionsBox: { flexDirection: 'row', alignItems: 'center' },
  btnPagamento: { padding: 10, borderRadius: 8, marginRight: 8 },
  btnPagtoVencido: { backgroundColor: '#FF3B30' },
  btnPagtoEmDia: { backgroundColor: '#28a745' },
  btnTextPagto: { color: '#FFF', fontWeight: 'bold' },
  btnEdit: { backgroundColor: '#007bff', padding: 10, borderRadius: 8, marginRight: 8 },
  btnDelete: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', maxHeight: '80%', borderRadius: 15, padding: 20 },
  modalContentSmall: { backgroundColor: '#FFF', width: '85%', borderRadius: 15, padding: 20 },
  modalHeader: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  modalStatus: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  modalSection: { marginBottom: 15 },
  modalLabel: { fontSize: 12, color: '#666', fontWeight: 'bold', marginBottom: 2 },
  modalLabelInput: { fontWeight: 'bold', marginBottom: 5 },
  modalDado: { fontSize: 16, color: '#333', marginBottom: 8 },
  modalInput: { backgroundColor: '#F0F0F0', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 18 },
  modalRowButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtnSave: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, flex: 1, alignItems: 'center', marginLeft: 5 },
  modalBtnCancel: { backgroundColor: '#EEE', padding: 15, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 5 },
  modalSectionDestacada: { marginTop: 20, backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8 },
  linhaPagamento: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#EEE' },
  modalDadoPagtoData: { fontSize: 16, fontWeight: 'bold' },
  modalDadoPagtoValor: { color: '#28a745', fontWeight: 'bold' },
  modalBtnFechar: { backgroundColor: '#333', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  modalBtnText: { color: '#FFD700', fontWeight: 'bold' }
});

export default ListaAlunos;