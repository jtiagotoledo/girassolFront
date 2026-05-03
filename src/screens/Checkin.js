import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { TextInputMask } from 'react-native-masked-text';
import db, { registrarCheckin } from '../database/Database';
import { imprimirTicketCheckin } from '../services/PrinterService';
import { enviarMensagemWhatsapp } from '../services/WhatsappService';

// --- MOTOR DE DATAS INFALÍVEL ---
// Transforma qualquer formato do banco (DD/MM, YYYY-MM, com ou sem hora) em milissegundos reais
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
    if (!isNaN(str)) return Number(str);
    return new Date(str).getTime() || 0;
  } catch (e) {
    return 0;
  }
};

// Calcula a janela de 30 dias baseada no pagamento
const calcularCiclo = (timestampMaximo) => {
  if (!timestampMaximo || timestampMaximo === 0) {
    return { expirado: true, diasRestantes: 0, dataFormatada: 'Não registrado' };
  }
  
  const hoje = new Date();
  const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  
  const dataPagto = new Date(timestampMaximo);
  const pagtoZero = new Date(dataPagto.getFullYear(), dataPagto.getMonth(), dataPagto.getDate()).getTime();
  
  const diffDays = Math.floor((hojeZero - pagtoZero) / (1000 * 60 * 60 * 24));
  
  const dia = String(dataPagto.getDate()).padStart(2, '0');
  const mes = String(dataPagto.getMonth() + 1).padStart(2, '0');
  
  return {
    expirado: diffDays >= 30,
    diasRestantes: Math.max(0, 30 - diffDays),
    dataFormatada: `${dia}/${mes}/${dataPagto.getFullYear()}`
  };
};

const Checkin = ({ navigation }) => {
  const [cpfDigitado, setCpfDigitado] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [statusCheckin, setStatusCheckin] = useState(null);
  const [mensagemFeedback, setMensagemFeedback] = useState({});

  const processarCheckin = () => {
    if (cpfDigitado.length !== 14) {
      Alert.alert("Ops!", "Por favor, digite o CPF completo.");
      return;
    }

    Keyboard.dismiss();

    db.transaction((tx) => {
      tx.executeSql(`SELECT id, nome, celular, lim_aulas, ativo FROM alunos WHERE cpf = ?`, [cpfDigitado], (_, resAluno) => {
        if (resAluno.rows.length === 0) {
          setStatusCheckin('erro');
          setMensagemFeedback({ titulo: "Erro", motivo: "CPF não encontrado." });
          setModalVisivel(true);
          return;
        }

        const aluno = resAluno.rows.item(0);

        // Pega APENAS o último pagamento registrado (pelo ID, para garantir a ordem cronológica)
        tx.executeSql(`SELECT data_pagamento FROM pagamentos WHERE aluno_id = ? ORDER BY id DESC LIMIT 1`, [aluno.id], (_, resPag) => {
          
          let rawPagamento = '';
          let timestampUltimoPagto = 0;
          let inicioDoCiclo = 0;

          if (resPag.rows.length > 0) {
            rawPagamento = resPag.rows.item(0).data_pagamento;
            timestampUltimoPagto = extrairData(rawPagamento);
            
            // Garantimos que a hora do pagamento zere, para que check-ins da manhã no dia do pagamento contem.
            const dataBase = new Date(timestampUltimoPagto);
            inicioDoCiclo = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate()).getTime();
          }

          const ciclo = calcularCiclo(timestampUltimoPagto);

          tx.executeSql(`SELECT data_hora FROM checkins WHERE aluno_id = ?`, [aluno.id], async (_, resChk) => {
            let aulasUsadas = 0;

            console.log("\n====== RAIO-X DO CHECKIN ======");
            console.log(`Aluno: ${aluno.nome.split(' ')[0]} | Limite: ${aluno.lim_aulas}`);
            console.log(`Último Pagamento RAW do Banco: "${rawPagamento}"`);
            console.log(`Pagamento convertido (Timestamp): ${timestampUltimoPagto}`);
            console.log(`Marco inicial do ciclo: ${new Date(inicioDoCiclo).toLocaleString()}`);
            console.log("-------------------------------");

            for (let i = 0; i < resChk.rows.length; i++) {
              const rawChk = resChk.rows.item(i).data_hora;
              const timeChk = extrairData(rawChk);
              
              let status = "Ignorado (Fora do Ciclo)";
              // Se a data do check-in for maior ou igual ao início do dia do pagamento, ele conta!
              if (timeChk >= inicioDoCiclo && inicioDoCiclo > 0) {
                aulasUsadas++;
                status = "CONTADO!";
              }

              console.log(`[Checkin ${i}] Banco: "${rawChk}" -> JS: ${new Date(timeChk).toLocaleString()} -> Ação: ${status}`);
            }
            console.log(`Total Apurado de Aulas Usadas: ${aulasUsadas}`);
            console.log("===============================\n");

            // --- AVALIAÇÃO DE ACESSO ---
            const isAtivo = aluno.ativo === 1;
            const isNoPrazo = !ciclo.expirado;
            const temSaldo = aulasUsadas < aluno.lim_aulas;

            if (isAtivo && isNoPrazo && temSaldo) {
              try {
                await registrarCheckin(aluno.id);
                const aulaAtual = aulasUsadas + 1;

                imprimirTicketCheckin(aluno.nome, `${aulaAtual} de ${aluno.lim_aulas}`, ciclo.dataFormatada);
                
                if (aluno.celular) {
                  enviarMensagemWhatsapp(aluno.celular, `Olá ${aluno.nome.split(' ')[0]}! 🌻\nPresença confirmada: ${aulaAtual}/${aluno.lim_aulas}.\nSeu plano vence em ${ciclo.diasRestantes} dias.`);
                }

                setStatusCheckin('sucesso');
                setMensagemFeedback({
                  titulo: `Olá, ${aluno.nome.split(' ')[0]}!`,
                  motivo: `Aula ${aulaAtual} de ${aluno.lim_aulas}.\nPlano válido por mais ${ciclo.diasRestantes} dias.`
                });
              } catch (e) { Alert.alert("Erro", "Falha ao gravar entrada."); }
            } else {
              let motivo = !isAtivo ? "Matrícula Inativa." : !isNoPrazo ? `Ciclo expirou em ${ciclo.dataFormatada}.` : `Limite de ${aluno.lim_aulas} aulas atingido.`;
              
              imprimirTicketCheckin(aluno.nome, "BLOQUEADO", motivo);
              setStatusCheckin('erro');
              setMensagemFeedback({ titulo: "Acesso Bloqueado", motivo: `${motivo}\nProcure a recepção.` });
            }
            
            setModalVisivel(true);
            setTimeout(() => { setCpfDigitado(''); setModalVisivel(false); }, 4000);
          });
        });
      }, (err) => console.log("Erro SQL:", err));
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
        <View style={styles.logoCircle}><Icon name="sun" size={60} color="#FFD700" /></View>
        <Text style={styles.title}>Espaço Girassol</Text>
        <Text style={styles.subtitle}>Digite seu CPF para entrar</Text>

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
          <Text style={styles.btnConfirmarText}>CONFIRMAR ENTRADA</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent={true} visible={modalVisivel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.iconContainer, { backgroundColor: statusCheckin === 'sucesso' ? '#e6f4ea' : '#fce8e6' }]}>
              <Icon name={statusCheckin === 'sucesso' ? "check-circle" : "x-circle"} size={70} color={statusCheckin === 'sucesso' ? "#28a745" : "#FF3B30"} />
            </View>
            <Text style={[styles.modalTitle, { color: statusCheckin === 'sucesso' ? '#28a745' : '#FF3B30' }]}>{mensagemFeedback.titulo}</Text>
            <Text style={styles.modalSub}>{mensagemFeedback.motivo}</Text>
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
  header: { padding: 15 },
  menuArea: { padding: 10, opacity: 0.5 },
  totemContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginTop: -50 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 18, color: '#666', marginBottom: 40 },
  inputCpf: { width: '85%', maxWidth: 400, backgroundColor: '#F9F9F9', borderWidth: 2, borderColor: '#EEE', borderRadius: 15, padding: 20, fontSize: 28, textAlign: 'center', marginBottom: 30 },
  btnConfirmar: { width: '85%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center' },
  btnConfirmarAtivo: { backgroundColor: '#FFD700' },
  btnConfirmarInativo: { backgroundColor: '#E0E0E0' },
  btnConfirmarText: { fontWeight: 'bold', fontSize: 18, color: '#000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', maxWidth: 450, borderRadius: 20, padding: 40, alignItems: 'center' },
  iconContainer: { padding: 20, borderRadius: 50, marginBottom: 20 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalSub: { fontSize: 18, color: '#444', textAlign: 'center', lineHeight: 26 },
  btnFecharErro: { marginTop: 30, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, backgroundColor: '#333' },
  btnFecharErroText: { color: '#FFF', fontWeight: 'bold' }
});

export default Checkin;