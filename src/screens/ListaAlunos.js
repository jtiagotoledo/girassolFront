import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Switch, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { TextInputMask } from 'react-native-masked-text';
// ATENÇÃO: Importamos a função buscarHistoricoPagamentos
import db, { deletarAluno, registrarPagamento, buscarHistoricoPagamentos } from '../database/Database';
import { realizarBackupBancoDados } from '../services/GoogleDriveService';
import { testeSimplesImpressora } from '../testes/testeImpressao';

// --- FUNÇÕES AUXILIARES DE DATA E MOEDA ---
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
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const ListaAlunos = ({ navigation }) => {
  const [alunos, setAlunos] = useState([]);
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [apenasAtivos, setApenasAtivos] = useState(true);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [historicoPagamentos, setHistoricoPagamentos] = useState([]); // NOVO: Guarda a lista de pagamentos do modal

  const [modalPagamentoVisivel, setModalPagamentoVisivel] = useState(false);
  const [alunoPagamento, setAlunoPagamento] = useState(null);
  const [dataPagamentoInput, setDataPagamentoInput] = useState('');
  const [valorPagamentoInput, setValorPagamentoInput] = useState('0,00');

  const carregarAlunos = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT a.*, 
          (SELECT data_pagamento FROM pagamentos WHERE aluno_id = a.id ORDER BY data_pagamento DESC LIMIT 1) as ultimo_pagamento
         FROM alunos a ORDER BY a.nome ASC`,
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

  const executarTesteDrive = async () => {
    // Chama o serviço que criamos
    const sucesso = await realizarBackupBancoDados();

    if (sucesso) {
      Alert.alert("Sucesso!", "O arquivo 'Teste_Girassol.txt' foi salvo no seu Drive!");
    } else {
      Alert.alert("Erro", "Falha ao criar o arquivo. Verifique o console do Metro Bundler.");
    }
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
          text: "Sim, Excluir", style: "destructive",
          onPress: async () => {
            try {
              await deletarAluno(id);
              carregarAlunos();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  };

  const abrirModalPagamento = (aluno) => {
    setAlunoPagamento(aluno);
    setDataPagamentoInput(formatarParaTela(obterDataHojeISO()));
    setValorPagamentoInput('0,00');
    setModalPagamentoVisivel(true);
  };

  const salvarPagamento = async () => {
    if (dataPagamentoInput.length !== 10) {
      Alert.alert("Atenção", "Preencha a data completa (DD/MM/AAAA)");
      return;
    }
    const dataISO = dataPagamentoInput.split('/').reverse().join('-');
    let valorNumerico = 0;
    if (valorPagamentoInput) {
      const valorLimpo = valorPagamentoInput.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      valorNumerico = parseFloat(valorLimpo) || 0;
    }
    try {
      await registrarPagamento(alunoPagamento.id, dataISO, valorNumerico);
      carregarAlunos();
      setModalPagamentoVisivel(false);
      Alert.alert("Sucesso", "Pagamento registrado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível registrar o pagamento.");
    }
  };

  // --- NOVA FUNÇÃO: ABRE DETALHES E BUSCA HISTÓRICO ---
  const abrirDetalhes = async (aluno) => {
    setAlunoSelecionado(aluno);
    setHistoricoPagamentos([]); // Limpa o anterior enquanto carrega
    setModalVisivel(true);

    try {
      const historico = await buscarHistoricoPagamentos(aluno.id);
      setHistoricoPagamentos(historico);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };

  const renderItem = ({ item }) => {
    const isInativo = item.ativo === 0;
    const isVencido = verificarVencimento(item.ultimo_pagamento);
    const dataFormatada = formatarParaTela(item.ultimo_pagamento);

    return (
      // O CARTÃO INTEIRO AGORA É CLICÁVEL
      <TouchableOpacity
        style={[styles.card, isInativo && styles.cardInativo]}
        onPress={() => abrirDetalhes(item)}
        activeOpacity={0.7}
      >

        <View style={styles.infoClicavel}>
          {/* NOME E CPF MAIORES */}
          <Text style={[styles.nome, isInativo && styles.textoInativo]}>
            {item.nome} {isInativo && <Text style={styles.tagInativo}>(Inativo)</Text>}
          </Text>
          <Text style={styles.subtext}>CPF: {item.cpf}</Text>
          {/* O texto "Ver detalhes" foi removido daqui! */}
        </View>

        <View style={styles.acoesContainer}>
          <View style={styles.actionsBox}>

            <TouchableOpacity
              style={[styles.btnPagamento, isVencido ? styles.btnPagtoVencido : styles.btnPagtoEmDia]}
              onPress={() => abrirModalPagamento(item)}
              disabled={isInativo}
            >
              <Icon name={isVencido ? "alert-circle" : "check-circle"} size={14} color="#FFF" />
              <Text style={styles.btnTextPagto}>
                {dataFormatada ? dataFormatada : 'Pagto'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnEdit}
              onPress={() => navigation.navigate('Cadastro', { alunoEditavel: item })}
            >
              <Text style={styles.btnText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnDelete} onPress={() => confirmarExclusao(item.id, item.nome)}>
              <Icon name="trash-2" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
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
        <View style={styles.container}>

          {/* <TouchableOpacity style={styles.botaoTeste} onPress={executarTesteDrive}>
            <Text style={styles.textoBotaoTeste}>☁️ Testar Backup no Drive</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.botaoTeste} onPress={testeSimplesImpressora}>
            <Text style={styles.textoBotaoTeste}>Testar Impressão</Text>
          </TouchableOpacity>

        </View>
      </View>


      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Buscar por nome ou CPF..." placeholderTextColor="#999" value={busca} onChangeText={setBusca} />
        {busca.length > 0 && <TouchableOpacity onPress={() => setBusca('')}><Icon name="x-circle" size={20} color="#999" /></TouchableOpacity>}
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Ocultar alunos inativos</Text>
        <Switch trackColor={{ false: "#767577", true: "#FFD700" }} thumbColor={apenasAtivos ? "#000" : "#f4f3f4"} onValueChange={setApenasAtivos} value={apenasAtivos} />
      </View>

      <FlatList
        data={alunosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum aluno encontrado.</Text>}
      />

      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.navigate('Checkin')}>
        <Text style={styles.btnVoltarText}>Sair da Gestão</Text>
      </TouchableOpacity>

      {/* MODAL DE PAGAMENTO MANTIDO */}
      <Modal animationType="fade" transparent={true} visible={modalPagamentoVisivel} onRequestClose={() => setModalPagamentoVisivel(false)}>
        {/* ... (Conteúdo idêntico ao anterior) ... */}
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>Registrar Pagamento</Text>
            {alunoPagamento && <Text style={styles.modalSubtitle}>Aluno(a): {alunoPagamento.nome}</Text>}
            <Text style={styles.modalLabelInput}>Data do Pagamento</Text>
            <TextInputMask type={'datetime'} options={{ format: 'DD/MM/YYYY' }} style={styles.modalInput} value={dataPagamentoInput} onChangeText={setDataPagamentoInput} placeholder="DD/MM/AAAA" />
            <Text style={styles.modalLabelInput}>Valor (R$)</Text>
            <TextInputMask type={'money'} options={{ precision: 2, separator: ',', delimiter: '.', unit: 'R$ ', suffixUnit: '' }} style={styles.modalInput} value={valorPagamentoInput} onChangeText={setValorPagamentoInput} keyboardType="numeric" />
            <View style={styles.modalRowButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalPagamentoVisivel(false)}><Text style={styles.modalBtnCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={salvarPagamento}><Text style={styles.modalBtnSaveText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* MODAL DE DETALHES COMPLETO E COM HISTÓRICO */}
      {/* ========================================== */}
      <Modal animationType="slide" transparent={true} visible={modalVisivel} onRequestClose={() => setModalVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {alunoSelecionado && (
              <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{alunoSelecionado.nome}</Text>
                  <Text style={[styles.modalStatus, { color: alunoSelecionado.ativo === 1 ? '#28a745' : '#FF3B30' }]}>{alunoSelecionado.ativo === 1 ? '● ATIVO' : '● INATIVO'}</Text>
                </View>

                {/* SESSÃO 1: DADOS PESSOAIS */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>CPF</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.cpf}</Text>

                  <Text style={styles.modalLabel}>NASCIMENTO</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.data_nasc || 'Não informado'}</Text>

                  <Text style={styles.modalLabel}>CELULAR / WHATSAPP</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.celular || 'Não informado'}</Text>

                  <Text style={styles.modalLabel}>E-MAIL</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.email || 'Não informado'}</Text>
                </View>

                {/* SESSÃO 2: ENDEREÇO */}
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
                  {alunoSelecionado.cep && <Text style={styles.modalDado}>CEP: {alunoSelecionado.cep}</Text>}
                </View>

                {/* SESSÃO 3: PLANO */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>LIMITE DE AULAS</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.lim_aulas} aulas mensais</Text>
                </View>

                {/* SESSÃO 4: HISTÓRICO FINANCEIRO */}
                <View style={styles.modalSectionDestacada}>
                  <Text style={[styles.modalLabel, { color: '#000' }]}>HISTÓRICO DE PAGAMENTOS</Text>

                  {historicoPagamentos.length > 0 ? (
                    historicoPagamentos.map((pag, index) => (
                      <View key={index} style={styles.linhaPagamento}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon name="check-circle" size={16} color="#28a745" style={{ marginRight: 8 }} />
                          <Text style={styles.modalDadoPagtoData}>{formatarParaTela(pag.data_pagamento)}</Text>
                        </View>
                        <Text style={styles.modalDadoPagtoValor}>
                          R$ {pag.valor ? pag.valor.toFixed(2).replace('.', ',') : '0,00'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.modalDado, { fontStyle: 'italic', color: '#999' }]}>
                      Nenhum pagamento registrado no sistema.
                    </Text>
                  )}
                </View>

              </ScrollView>
            )}
            <TouchableOpacity style={styles.modalBtnFechar} onPress={() => setModalVisivel(false)}><Text style={styles.modalBtnText}>FECHAR DETALHES</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

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

  // O Card não é mais View, é TouchableOpacity, mas os estilos são os mesmos
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  cardInativo: { backgroundColor: '#EFEFEF', opacity: 0.6, elevation: 0 },

  infoClicavel: { flex: 1 },
  acoesContainer: { flex: 1.5, alignItems: 'flex-end' },
  actionsBox: { flexDirection: 'row', alignItems: 'center' },

  textoInativo: { color: '#888' },
  tagInativo: { fontSize: 12, color: '#FF3B30', fontWeight: 'bold' },

  // --- MUDANÇA NAS FONTES DO CARTÃO ---
  nome: { fontSize: 21, fontWeight: '800', color: '#222' }, // MAIOR E MAIS ESCURO
  subtext: { color: '#555', fontSize: 15, marginTop: 4, fontWeight: '500' }, // MAIOR

  btnPagamento: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  btnPagtoVencido: { backgroundColor: '#FF3B30' },
  btnPagtoEmDia: { backgroundColor: '#28a745' },
  btnTextPagto: { color: '#FFF', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },

  btnEdit: { backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  btnDelete: { padding: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  btnVoltar: { padding: 20, alignItems: 'center', backgroundColor: '#6c757d' },
  btnVoltarText: { color: '#FFF', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 500, maxHeight: '80%', borderRadius: 15, padding: 20, elevation: 10 },
  modalHeader: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 15, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  modalStatus: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  modalSection: { marginBottom: 15 },
  modalLabel: { fontSize: 11, color: '#666', fontWeight: 'bold', marginBottom: 2 },
  modalDado: { fontSize: 16, color: '#333', marginBottom: 8 },

  // --- ESTILOS DO HISTÓRICO DE PAGAMENTO ---
  modalSectionDestacada: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginTop: 10, marginBottom: 10 },
  linhaPagamento: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 10 },
  modalDadoPagtoData: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  modalDadoPagtoValor: { fontSize: 16, fontWeight: 'bold', color: '#28a745' },

  modalBtnFechar: { backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  modalBtnText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },

  modalContentSmall: { backgroundColor: '#FFF', width: '100%', maxWidth: 350, borderRadius: 15, padding: 20, elevation: 10 },
  modalLabelInput: { fontSize: 12, color: '#333', fontWeight: 'bold', marginBottom: 5 },
  modalInput: { backgroundColor: '#F0F0F0', borderRadius: 8, padding: 15, fontSize: 18, color: '#000', textAlign: 'center', marginBottom: 20 },
  modalRowButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtnCancel: { flex: 1, backgroundColor: '#EEE', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  modalBtnCancelText: { color: '#333', fontWeight: 'bold' },
  modalBtnSave: { flex: 1, backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  modalBtnSaveText: { color: '#FFF', fontWeight: 'bold' },
  botaoTeste: {
    backgroundColor: '#4285F4', // Azul do Google
    padding: 15,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3, // Sombrinha no Android
  },
  textoBotaoTeste: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ListaAlunos;