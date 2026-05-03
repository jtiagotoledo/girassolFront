import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { TextInputMask } from 'react-native-masked-text';
import db, { registrarCheckin } from '../database/Database';
import { verificarEExecutarBackupAutomatico } from '../services/BackupService';
import { imprimirTicketCheckin } from '../services/PrinterService';
import { enviarMensagemWhatsapp } from '../services/WhatsappService';

// --- FUNÇÕES AUXILIARES ---
const verificarVencimento = (dataISO) => {
  if (!dataISO) return true;
  const hoje = new Date();
  const dataPagto = new Date(dataISO + 'T00:00:00');
  const diffTime = Math.abs(hoje - dataPagto);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 30; // Bloqueia se o último pagamento foi há mais de 30 dias
};

const Checkin = ({ navigation }) => {
  const [cpfDigitado, setCpfDigitado] = useState('');
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
        `SELECT a.id, a.nome, a.celular, a.lim_aulas, a.ativo,
        -- Busca a data do último pagamento
        (SELECT data_pagamento FROM pagamentos WHERE aluno_id = a.id ORDER BY data_pagamento DESC LIMIT 1) as ultimo_pagamento,
        -- Contagem de check-ins no ciclo atual (desde o último pagamento)
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
          const isAtivo = aluno.ativo === 1;
          const isPagtoOk = !verificarVencimento(aluno.ultimo_pagamento);
          const isLimiteOk = aluno.checkins_ciclo < aluno.lim_aulas;

          const dataPagtoFormatada = aluno.ultimo_pagamento
            ? aluno.ultimo_pagamento.split('-').reverse().join('/')
            : 'Não registrado';

          // --- CENÁRIO A: ACESSO LIBERADO ---
          if (isAtivo && isPagtoOk && isLimiteOk) {
            try {
              await registrarCheckin(aluno.id);
              
              // 1. Impressão do Ticket de Aula
              imprimirTicketCheckin(aluno.nome, aluno.checkins_ciclo + 1, aluno.lim_aulas);
              //verificarEExecutarBackupAutomatico()
              
              // 2. Notificação de Boas-vindas via WhatsApp
              const msgSucesso = `Olá ${aluno.nome.split(' ')[0]}! 🌻\n` +
                `Sua presença foi confirmada.\n` +
                `Aula: ${aluno.checkins_ciclo + 1}/${aluno.lim_aulas}\n` +
                `Último pagamento: ${dataPagtoFormatada}\n` +
                `Bom treino!`;

              if (aluno.celular) enviarMensagemWhatsapp(aluno.celular, msgSucesso);

              // 3. Feedback no Tablet
              setStatusCheckin('sucesso');
              setMensagemFeedback({
                titulo: `Bem-vindo(a), ${aluno.nome.split(' ')[0]}!`,
                motivo: `Check-in confirmado. Boa aula!\n(${aluno.checkins_ciclo + 1} de ${aluno.lim_aulas} aulas no ciclo)`
              });
              setModalVisivel(true);

              setTimeout(() => {
                setCpfDigitado('');
                setModalVisivel(false);
              }, 4000);

            } catch (error) {
              Alert.alert("Erro", "Falha técnica ao salvar entrada.");
            }
          } 
          // --- CENÁRIO B: ACESSO BLOQUEADO ---
          else {
            let motivoBloqueio = "";
            if (!isAtivo) motivoBloqueio = "Sua matrícula consta como Inativa.";
            else if (!isPagtoOk) motivoBloqueio = "Seu ciclo de 30 dias expirou. Pendência de renovação.";
            else if (!isLimiteOk) motivoBloqueio = `Você já utilizou suas ${aluno.lim_aulas} aulas deste ciclo.`;

            // 1. Notificação de Bloqueio via WhatsApp
            const msgBloqueio = `Olá ${aluno.nome.split(' ')[0]}, seu acesso foi bloqueado hoje.\n` +
              `Motivo: ${motivoBloqueio}\n` +
              `Por favor, procure a recepção para regularizar sua situação. 🌻`;
            
            if (aluno.celular) enviarMensagemWhatsapp(aluno.celular, msgBloqueio);

            // 2. Impressão de Ticket de Pendência para a Recepção
            imprimirTicketCheckin(`${aluno.nome} (BLOQUEADO)`, "ERRO", motivoBloqueio);

            // 3. Feedback Visual no Totem
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuArea}>
          <Icon name="menu" size={30} color="#E0E0E0" />
        </TouchableOpacity>
      </View>

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
        />

        <TouchableOpacity 
          style={[styles.btnConfirmar, cpfDigitado.length === 14 ? styles.btnConfirmarAtivo : styles.btnConfirmarInativo]}
          onPress={processarCheckin}
          disabled={cpfDigitado.length !== 14}
        >
          <Text style={styles.btnConfirmarText}>FAZER CHECK-IN</Text>
        </TouchableOpacity>
      </View>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 15, alignItems: 'flex-start' },
  menuArea: { padding: 10, opacity: 0.5 },
  totemContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginTop: -50 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  subtitle: { fontSize: 18, color: '#666', marginBottom: 40 },
  inputCpf: { width: '80%', maxWidth: 400, backgroundColor: '#F9F9F9', borderWidth: 2, borderColor: '#EEE', borderRadius: 15, padding: 20, fontSize: 28, color: '#000', textAlign: 'center', letterSpacing: 2, marginBottom: 30 },
  btnConfirmar: { width: '80%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2 },
  btnConfirmarAtivo: { backgroundColor: '#FFD700' },
  btnConfirmarInativo: { backgroundColor: '#E0E0E0', elevation: 0 },
  btnConfirmarText: { color: '#000', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', maxWidth: 450, borderRadius: 20, padding: 40, alignItems: 'center', elevation: 10 },
  iconContainer: { padding: 20, borderRadius: 50, marginBottom: 20 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalSub: { fontSize: 18, color: '#444', textAlign: 'center', lineHeight: 26 },
  btnFecharErro: { marginTop: 30, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, backgroundColor: '#333' },
  btnFecharErroText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default Checkin;