import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Switch, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { TextInputMask } from 'react-native-masked-text';

import Colors from '../constants/colors';

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

const obterDataHoraAtualBanco = () => {
  const hoje = new Date();
  const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  const hora = `${String(hoje.getHours()).padStart(2, '0')}:${String(hoje.getMinutes()).padStart(2, '0')}:${String(hoje.getSeconds()).padStart(2, '0')}`;
  return `${data} ${hora}`;
};

const extrairData = (valorBanco) => {
  if (!valorBanco) return 0;
  const str = String(valorBanco).trim();
  try {
    if (str.includes('/')) {
      const partes = str.split(/[\s/:]+/); 
      return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
    }
    if (str.includes('-')) {
      const partes = str.split(/[\s-:]+/);
      return new Date(partes[0], partes[1] - 1, partes[2]).getTime();
    }
    return new Date(str).getTime() || 0;
  } catch (e) {
    return 0;
  }
};

const ListaAlunos = ({ navigation }) => {
  const [alunos, setAlunos] = useState([]);
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [apenasAtivos, setApenasAtivos] = useState(true);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [historicoPagamentos, setHistoricoPagamentos] = useState([]);
  const [modalPagamentoVisivel, setModalPagamentoVisivel] = useState(false);
  
  const [alunoPagamento, setAlunoPagamento] = useState(null);
  const [dataPagamentoInput, setDataPagamentoInput] = useState('');
  const [valorPagamentoInput, setValorPagamentoInput] = useState('0,00');
  const [idPagamentoEdicao, setIdPagamentoEdicao] = useState(null);

  const [aulasUsadas, setAulasUsadas] = useState(0);
  const [checkinsCicloAtual, setCheckinsCicloAtual] = useState([]);
  const [modalAjusteVisivel, setModalAjusteVisivel] = useState(false);
  const [inputAulas, setInputAulas] = useState('0');

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

  const carregarAulasDoCiclo = (alunoId) => {
    db.transaction(tx => {
      tx.executeSql(`SELECT data_pagamento FROM pagamentos WHERE aluno_id = ? ORDER BY id DESC LIMIT 1`, [alunoId], (_, resPag) => {
        let timestampUltimoPagto = 0;
        if (resPag.rows.length > 0) {
          const dataBase = new Date(extrairData(resPag.rows.item(0).data_pagamento));
          timestampUltimoPagto = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate()).getTime();
        }

        tx.executeSql(`SELECT id, data_hora FROM checkins WHERE aluno_id = ?`, [alunoId], (_tx2, resChk) => {
          let contagem = 0;
          let checkins = [];
          for (let i = 0; i < resChk.rows.length; i++) {
            const chk = resChk.rows.item(i);
            const timeChk = extrairData(chk.data_hora);
            if (timeChk >= timestampUltimoPagto && timestampUltimoPagto > 0) {
              contagem++;
              checkins.push(chk);
            }
          }
          checkins.sort((a, b) => extrairData(b.data_hora) - extrairData(a.data_hora));
          
          setAulasUsadas(contagem);
          setCheckinsCicloAtual(checkins);
        });
      });
    });
  };

  const salvarAjusteAulas = () => {
    const novoValor = parseInt(inputAulas, 10);
    if (isNaN(novoValor) || novoValor < 0) {
      Alert.alert("Ops!", "Digite um número válido.");
      return;
    }

    const diferenca = novoValor - aulasUsadas;
    if (diferenca === 0) {
      setModalAjusteVisivel(false);
      return;
    }

    db.transaction(tx => {
      if (diferenca > 0) {
        const agora = obterDataHoraAtualBanco();
        for (let i = 0; i < diferenca; i++) {
          tx.executeSql(`INSERT INTO checkins (aluno_id, data_hora) VALUES (?, ?)`, [alunoSelecionado.id, agora]);
        }
      } else {
        const qtdRemover = Math.abs(diferenca);
        for (let i = 0; i < qtdRemover; i++) {
          if (checkinsCicloAtual[i]) {
            tx.executeSql(`DELETE FROM checkins WHERE id = ?`, [checkinsCicloAtual[i].id]);
          }
        }
      }
    }, (error) => {
      Alert.alert("Erro", "Falha ao ajustar as aulas.");
    }, () => {
      setModalAjusteVisivel(false);
      carregarAulasDoCiclo(alunoSelecionado.id);
    });
  };

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
        carregarAulasDoCiclo(alunoSelecionado.id); 
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
    carregarAulasDoCiclo(aluno.id);
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
        carregarAulasDoCiclo(alunoSelecionado.id); 
        carregarAlunos();
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    const isVencido = verificarVencimento(item.ultimo_pagamento);
    return (
      <TouchableOpacity style={[styles.card, item.ativo === 0 && styles.cardInativo]} onPress={() => abrirDetalhes(item)}>
        <View style={styles.infoClicavel}>
          <Text style={styles.nome} numberOfLines={1} ellipsizeMode="tail">{item.nome}</Text>
          <Text style={styles.subtext}>CPF: {item.cpf}</Text>
        </View>
        <View style={styles.actionsBox}>
          <TouchableOpacity 
            style={[styles.btnPagamento, isVencido ? styles.btnPagtoVencido : styles.btnPagtoEmDia]} 
            onPress={() => abrirModalPagamento(item)}
          >
            <Text style={styles.btnTextPagto}>{formatarParaTela(item.ultimo_pagamento) || 'Pagamento'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnEdit} onPress={() => navigation.navigate('Cadastro', { alunoEditavel: item })}>
            <Icon name="edit" size={20} color={Colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmarExclusaoAluno(item.id, item.nome)} style={styles.btnDelete}>
             <Icon name="trash-2" size={24} color={Colors.danger} />
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
        <Icon name="search" size={20} color={Colors.textMuted} style={{marginLeft: 10}}/>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Buscar por nome ou CPF..." 
          placeholderTextColor={Colors.textLight}
          value={busca} 
          onChangeText={setBusca} 
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Ocultar inativos</Text>
        <Switch 
          value={apenasAtivos} 
          onValueChange={setApenasAtivos} 
          trackColor={{ true: Colors.primary, false: Colors.disabled }} 
          thumbColor={Colors.surface}
        />
      </View>

      <FlatList data={alunosFiltrados} keyExtractor={item => item.id.toString()} renderItem={renderItem} contentContainerStyle={styles.list} />

      <Modal visible={modalPagamentoVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>{idPagamentoEdicao ? 'Editar' : 'Novo'} Pagamento</Text>
            <Text style={styles.modalLabelInput}>Data</Text>
            <TextInputMask type='datetime' options={{format: 'DD/MM/YYYY'}} style={styles.modalInput} value={dataPagamentoInput} onChangeText={setDataPagamentoInput} />
            <Text style={styles.modalLabelInput}>Valor</Text>
            <TextInputMask type='money' style={styles.modalInput} value={valorPagamentoInput} onChangeText={setValorPagamentoInput} />
            <View style={styles.modalRowButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalPagamentoVisivel(false)}><Text style={styles.textBtnCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={salvarPagamento}><Text style={styles.textBtnSave}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalAjusteVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>Ajustar Aulas</Text>
            <Text style={styles.modalSub}>{alunoSelecionado?.nome}</Text>
            <Text style={styles.modalLabelInput}>Aulas já realizadas neste ciclo:</Text>
            
            <TextInput 
              style={styles.modalInput} 
              value={inputAulas} 
              onChangeText={setInputAulas} 
              keyboardType="numeric" 
              selectTextOnFocus
            />
            
            <View style={styles.modalRowButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalAjusteVisivel(false)}><Text style={styles.textBtnCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={salvarAjusteAulas}><Text style={styles.textBtnSave}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {alunoSelecionado && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{alunoSelecionado.nome}</Text>
                  <Text style={[styles.modalStatus, { color: alunoSelecionado.ativo === 1 ? Colors.success : Colors.danger }]}>
                    {alunoSelecionado.ativo === 1 ? '● ATIVO' : '● INATIVO'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>CPF</Text>
                  <Text style={styles.modalDado}>{alunoSelecionado.cpf}</Text>

                  <Text style={styles.modalLabel}>CELULAR / WHATSAPP</Text>
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
                  {alunoSelecionado.bairro && (
                    <Text style={styles.modalDado}>{alunoSelecionado.bairro} - {alunoSelecionado.cidade}/{alunoSelecionado.uf}</Text>
                  )}
                  {alunoSelecionado.cep && (
                    <Text style={styles.modalDado}>CEP: {alunoSelecionado.cep}</Text>
                  )}
                </View>

                <View style={styles.modalSectionDestacada}>
                  <Text style={[styles.modalLabel, { color: Colors.warning }]}>CONSUMO DO PLANO ATUAL</Text>
                  <View style={styles.linhaAulas}>
                    <View>
                      <Text style={styles.textoAulasDestaque}>{aulasUsadas} / {alunoSelecionado.lim_aulas}</Text>
                      <Text style={styles.subtextoAulas}>aulas realizadas</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.btnAjustarAulas} 
                      onPress={() => {
                        setInputAulas(String(aulasUsadas));
                        setModalAjusteVisivel(true);
                      }}
                    >
                      <Icon name="edit-3" size={20} color={Colors.secondary} />
                      <Text style={styles.btnAjustarAulasTexto}>Ajustar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalSectionDestacada}>
                  <Text style={[styles.modalLabel, { color: Colors.textPrimary }]}>HISTÓRICO DE PAGAMENTOS</Text>
                  {historicoPagamentos.map((pag, i) => (
                    <View key={i} style={styles.linhaPagamento}>
                      <View style={{flex: 1}}>
                        <Text style={styles.modalDadoPagtoData}>{formatarParaTela(pag.data_pagamento)}</Text>
                        <Text style={styles.modalDadoPagtoValor}>R$ {pag.valor.toFixed(2).replace('.', ',')}</Text>
                      </View>
                      <View style={{flexDirection:'row'}}>
                        <TouchableOpacity onPress={() => abrirModalEdicaoPagamento(pag)} style={{padding: 10}}>
                          <Icon name="edit-2" size={20} color={Colors.info}/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => confirmarExclusaoPagto(pag.id)} style={{padding: 10}}>
                          <Icon name="trash-2" size={20} color={Colors.danger}/>
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: Colors.surface, elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  btnAdd: { backgroundColor: Colors.primary, padding: 10, borderRadius: 8 },
  btnAddText: { color: Colors.secondary, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, margin: 15, borderRadius: 10, elevation: 1 },
  searchInput: { flex: 1, padding: 15, fontSize: 16, color: Colors.textPrimary },
  switchContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 20, marginBottom: 5 },
  switchLabel: { marginRight: 10, color: Colors.textMuted },
  list: { padding: 15 },
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardInativo: { opacity: 0.5 },
  
  infoClicavel: { flex: 1, marginRight: 10 },
  
  nome: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  subtext: { color: Colors.textMuted },
  actionsBox: { flexDirection: 'row', alignItems: 'center' },
  btnPagamento: { padding: 10, borderRadius: 8, marginRight: 8 },
  btnPagtoVencido: { backgroundColor: Colors.danger },
  btnPagtoEmDia: { backgroundColor: Colors.success },
  btnTextPagto: { color: Colors.textWhite, fontWeight: 'bold' },
  btnEdit: { backgroundColor: Colors.info, padding: 10, borderRadius: 8, marginRight: 8 },
  btnDelete: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.surface, width: '90%', maxHeight: '80%', borderRadius: 15, padding: 20 },
  modalContentSmall: { backgroundColor: Colors.surface, width: '85%', borderRadius: 15, padding: 20 },
  modalHeader: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 10, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  modalSub: { fontSize: 16, color: Colors.textMuted, marginBottom: 15 },
  modalStatus: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  modalSection: { marginBottom: 15 },
  modalLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: 'bold', marginBottom: 2 },
  modalLabelInput: { fontWeight: 'bold', marginBottom: 5, color: Colors.textPrimary },
  modalDado: { fontSize: 16, color: Colors.textSecondary, marginBottom: 8 },
  modalInput: { backgroundColor: Colors.inputBackground, color: Colors.textPrimary, padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 18 },
  modalRowButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtnSave: { backgroundColor: Colors.primary, padding: 15, borderRadius: 8, flex: 1, alignItems: 'center', marginLeft: 5 },
  modalBtnCancel: { backgroundColor: Colors.disabled, padding: 15, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 5 },
  textBtnSave: { color: Colors.secondary, fontWeight: 'bold' },
  textBtnCancel: { color: Colors.textSecondary, fontWeight: 'bold' },
  
  modalSectionDestacada: { marginTop: 15, backgroundColor: Colors.warningLight, padding: 15, borderRadius: 8 },
  linhaAulas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  textoAulasDestaque: { fontSize: 28, fontWeight: 'bold', color: Colors.warning },
  subtextoAulas: { fontSize: 14, color: Colors.warning },
  
  btnAjustarAulas: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnAjustarAulasTexto: { fontWeight: 'bold', marginLeft: 5, color: Colors.secondary },
  
  linhaPagamento: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.border },
  modalDadoPagtoData: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  modalDadoPagtoValor: { color: Colors.success, fontWeight: 'bold' },
  
  modalBtnFechar: { backgroundColor: Colors.primary, padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  modalBtnText: { color: Colors.secondary, fontWeight: 'bold', fontSize: 16 }
});

export default ListaAlunos;