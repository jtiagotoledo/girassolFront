import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { TextInputMask } from 'react-native-masked-text';
import db, { registrarCheckin } from '../database/Database';
import { verificarEExecutarBackupAutomatico } from '../services/BackupService';
import { imprimirTicketCheckin } from '../services/PrinterService';

// --- FUNÇÕES AUXILIARES ---
const verificarVencimento = (dataISO) => {
  if (!dataISO) return true; 
  const hoje = new Date();
  const dataPagto = new Date(dataISO + 'T00:00:00');
  const diffTime = Math.abs(hoje - dataPagto);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  console.log();
  
  return diffDays > 30; 
};

const obterAnoMesAtual = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
};

const Checkin = ({ navigation }) => {
  const [cpfDigitado, setCpfDigitado] = useState('');
  
  // Estados para o feedback do Totem
  const [modalVisivel, setModalVisivel] = useState(false);
  const [statusCheckin, setStatusCheckin] = useState(null); // 'sucesso' ou 'erro'
  const [mensagemFeedback, setMensagemFeedback] = useState({});

  const processarCheckin = () => {
  if (cpfDigitado.length !== 14) {
    Alert.alert("Ops!", "Por favor, digite o CPF completo.");
    return;
  }

  Keyboard.dismiss();

  db.transaction((tx) => {
    tx.executeSql(
      `SELECT a.id, a.nome, a.lim_aulas, a.ativo,
        -- Busca a data do último pagamento
        (SELECT data_pagamento FROM pagamentos WHERE aluno_id = a.id ORDER BY data_pagamento DESC LIMIT 1) as ultimo_pagamento,
        
        -- CONTAGEM INTELIGENTE: Conta check-ins apenas DEPOIS do último pagamento realizado
        (SELECT COUNT(*) FROM checkins 
         WHERE aluno_id = a.id 
         AND data_hora >= (SELECT data_pagamento FROM pagamentos WHERE aluno_id = a.id ORDER BY data_pagamento DESC LIMIT 1)
        ) as checkins_ciclo
       FROM alunos a 
       WHERE a.cpf = ?`,
      [cpfDigitado], 
      async (_tx, results) => {
        
        if (results.rows.length === 0) {
          setStatusCheckin('erro');
          setMensagemFeedback({
            titulo: "Aluno não encontrado",
            motivo: "Verifique se o CPF foi digitado corretamente."
          });
          setModalVisivel(true);
          return;
        }

        const aluno = results.rows.item(0);

        // REGRAS DE NEGÓCIO ATUALIZADAS
        const isAtivo = aluno.ativo === 1;
        const isPagtoOk = !verificarVencimento(aluno.ultimo_pagamento);
        // Agora usamos o checkins_ciclo que vem da query
        const isLimiteOk = aluno.checkins_ciclo < aluno.lim_aulas;

        if (isAtivo && isPagtoOk && isLimiteOk) {
          try {
            // 1. Salva no SQLite
            await registrarCheckin(aluno.id);
            
            // 2. Aciona o Backup invisível
            verificarEExecutarBackupAutomatico();
            
            // 3. DISPARA A IMPRESSORA! 🖨️
            // Passamos: Nome, Checkin atual (que é os antigos + 1) e o Limite.
            // Repare que NÃO usamos 'await' aqui. Assim a tela não trava esperando a impressora!
            imprimirTicketCheckin(aluno.nome, aluno.checkins_ciclo + 1, aluno.lim_aulas);

            // 4. Mostra a mensagem de sucesso na tela do tablet
            setStatusCheckin('sucesso');
            setMensagemFeedback({
              titulo: `Bem-vindo(a), ${aluno.nome.split(' ')[0]}!`,
              motivo: `Check-in confirmado. Boa aula!\n(${aluno.checkins_ciclo + 1} de ${aluno.lim_aulas} aulas no ciclo)`
            });
            setModalVisivel(true);
            
            // 5. Fecha o modal
            setTimeout(() => {
              setCpfDigitado('');
              setModalVisivel(false);
            }, 4000);

          } catch (error) {
            Alert.alert("Erro", "Falha técnica ao salvar entrada.");
          }
        }else {
          // Lógica de Bloqueio
          let motivoBloqueio = "";
          if (!isAtivo) motivoBloqueio = "Sua matrícula consta como Inativa.";
          else if (!isPagtoOk) motivoBloqueio = "Seu ciclo de 30 dias expirou. Pendência de renovação.";
          else if (!isLimiteOk) motivoBloqueio = `Você já utilizou suas ${aluno.lim_aulas} aulas deste ciclo.`;

          setStatusCheckin('erro');
          setMensagemFeedback({
            titulo: `Acesso Bloqueado`,
            motivo: `${motivoBloqueio}\nPor favor, dirija-se à recepção.`
          });
          setModalVisivel(true);
          
          setTimeout(() => {
            setCpfDigitado('');
            setModalVisivel(false);
          }, 5000);
        }
      },
      (_tx, error) => console.error("Erro no SQL do Checkin:", error)
    );
  });
};

  return (
    <View style={styles.container}>
      
      {/* CABEÇALHO DISCRETO */}
      <View style={styles.header}>
        {/* O botão do menu lateral continua aqui, mas bem discreto */}
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuArea}>
           <Icon name="menu" size={30} color="#E0E0E0" />
        </TouchableOpacity>
      </View>

      {/* ÁREA CENTRAL DO TOTEM */}
      <View style={styles.totemContainer}>
        
        <View style={styles.logoCircle}>
          <Icon name="sun" size={60} color="#FFD700" />
        </View>

        <Text style={styles.title}>Espaço Girassol</Text>
        <Text style={styles.subtitle}>Digite seu CPF para confirmar presença</Text>

        <TextInputMask
          type={'cpf'}
          style={styles.inputCpf}
          value={cpfDigitado}
          onChangeText={setCpfDigitado}
          placeholder="000.000.000-00"
          placeholderTextColor="#CCC"
          keyboardType="numeric"
          autoFocus={false} // Evita que o teclado abra sozinho toda hora
        />

        <TouchableOpacity 
          style={[styles.btnConfirmar, cpfDigitado.length === 14 ? styles.btnConfirmarAtivo : styles.btnConfirmarInativo]}
          onPress={processarCheckin}
          disabled={cpfDigitado.length !== 14}
        >
          <Text style={styles.btnConfirmarText}>FAZER CHECK-IN</Text>
        </TouchableOpacity>

      </View>

      {/* ========================================== */}
      {/* MODAL DE FEEDBACK (SUCESSO OU ERRO)        */}
      {/* ========================================== */}
      <Modal animationType="fade" transparent={true} visible={modalVisivel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={[styles.iconContainer, { backgroundColor: statusCheckin === 'sucesso' ? '#e6f4ea' : '#fce8e6' }]}>
              <Icon 
                name={statusCheckin === 'sucesso' ? "check-circle" : "x-circle"} 
                size={70} 
                color={statusCheckin === 'sucesso' ? "#28a745" : "#FF3B30"} 
              />
            </View>

            <Text style={[styles.modalTitle, { color: statusCheckin === 'sucesso' ? '#28a745' : '#FF3B30' }]}>
              {mensagemFeedback.titulo}
            </Text>

            <Text style={styles.modalSub}>
              {mensagemFeedback.motivo}
            </Text>

            {/* Se deu erro, colocamos um botão de fechar pro aluno não ficar preso. Se deu sucesso, some sozinho. */}
            {statusCheckin === 'erro' && (
              <TouchableOpacity style={styles.btnFecharErro} onPress={() => { setModalVisivel(false); setCpfDigitado(''); }}>
                <Text style={styles.btnFecharErroText}>VOLTAR</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
};

// --- ESTILOS PENSADOS PARA TELA CHEIA (TABLET) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  
  header: { padding: 15, alignItems: 'flex-start' },
  menuArea: { padding: 10, opacity: 0.5 }, // Deixei o botão do menu opaco para o aluno não ficar fuçando

  totemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -50, // Puxa um pouquinho pra cima pra compensar o header
  },
  
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000', // Preto com sol amarelo = Girassol
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5
  },

  title: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  subtitle: { fontSize: 18, color: '#666', marginBottom: 40 },

  inputCpf: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#F9F9F9',
    borderWidth: 2,
    borderColor: '#EEE',
    borderRadius: 15,
    padding: 20,
    fontSize: 28,
    color: '#000',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 30
  },

  btnConfirmar: {
    width: '80%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2
  },
  btnConfirmarAtivo: { backgroundColor: '#FFD700' }, // Amarelo
  btnConfirmarInativo: { backgroundColor: '#E0E0E0', elevation: 0 },
  btnConfirmarText: { color: '#000', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },

  // --- ESTILOS DO MODAL DE FEEDBACK ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    backgroundColor: '#FFF', 
    width: '80%', 
    maxWidth: 450, 
    borderRadius: 20, 
    padding: 40, 
    alignItems: 'center',
    elevation: 10 
  },
  iconContainer: { padding: 20, borderRadius: 50, marginBottom: 20 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalSub: { fontSize: 18, color: '#444', textAlign: 'center', lineHeight: 26 },
  
  btnFecharErro: { marginTop: 30, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, backgroundColor: '#333' },
  btnFecharErroText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default Checkin;