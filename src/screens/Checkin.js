import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Keyboard, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { TextInputMask } from 'react-native-masked-text';
import db, { registrarCheckin } from '../database/Database';
import { imprimirTicketCheckin } from '../services/PrinterService';
import { enviarMensagemWhatsapp } from '../services/WhatsappService';
import { verificarEExecutarBackupAutomatico } from '../services/BackupService';

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
  
  const [carregando, setCarregando] = useState(false);
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const finalizarProcesso = () => {
    timeoutRef.current = setTimeout(() => { 
      setCpfDigitado(''); 
      setModalVisivel(false); 
      setCarregando(false); 
    }, 4000);
  };

  const processarCheckin = () => {
    if (cpfDigitado.length !== 14) {
      Alert.alert("Ops!", "Por favor, digite o CPF completo.");
      return;
    }

    Keyboard.dismiss();
    setCarregando(true); 

    db.transaction((tx) => {
      tx.executeSql(`SELECT id, nome, celular, lim_aulas, ativo FROM alunos WHERE cpf = ?`, [cpfDigitado], (_, resAluno) => {
        if (resAluno.rows.length === 0) {
          setStatusCheckin('erro');
          setMensagemFeedback({ titulo: "Erro", motivo: "CPF não encontrado." });
          setModalVisivel(true);
          finalizarProcesso();
          return;
        }

        const aluno = resAluno.rows.item(0);

        tx.executeSql(`SELECT data_pagamento FROM pagamentos WHERE aluno_id = ? ORDER BY id DESC LIMIT 1`, [aluno.id], (_tx, resPag) => {
          
          let timestampUltimoPagto = 0;
          let inicioDoCiclo = 0;

          if (resPag.rows.length > 0) {
            timestampUltimoPagto = extrairData(resPag.rows.item(0).data_pagamento);
            const dataBase = new Date(timestampUltimoPagto);
            inicioDoCiclo = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate()).getTime();
          }

          const ciclo = calcularCiclo(timestampUltimoPagto);

          tx.executeSql(`SELECT data_hora FROM checkins WHERE aluno_id = ?`, [aluno.id], async (_tx2, resChk) => {
            let aulasUsadas = 0;

            for (let i = 0; i < resChk.rows.length; i++) {
              const timeChk = extrairData(resChk.rows.item(i).data_hora);
              if (timeChk >= inicioDoCiclo && inicioDoCiclo > 0) {
                aulasUsadas++;
              }
            }

            const isAtivo = aluno.ativo === 1;
            const isNoPrazo = !ciclo.expirado;
            const temSaldo = aulasUsadas < aluno.lim_aulas;

            if (isAtivo && isNoPrazo && temSaldo) {
              try {
                await registrarCheckin(aluno.id);
                const aulaAtual = aulasUsadas + 1;

                verificarEExecutarBackupAutomatico();
                imprimirTicketCheckin(aluno.nome, `${aulaAtual} de ${aluno.lim_aulas}`, ciclo.dataFormatada);

                if (aluno.celular) {
                  enviarMensagemWhatsapp(
                    aluno.celular, 
                    `Olá, ${aluno.nome.split(' ')[0]}! O Espaço Leviare agradece sua presença. \n\n✅ Check-in confirmado: Aula ${aulaAtual} de ${aluno.lim_aulas}\n🗓️ Último pagamento: ${ciclo.dataFormatada}`
                  );
                }

                setStatusCheckin('sucesso');
                setMensagemFeedback({
                  titulo: `Olá, ${aluno.nome.split(' ')[0]}!`,
                  motivo: `Aula ${aulaAtual} de ${aluno.lim_aulas}.\nÚltimo pagamento: ${ciclo.dataFormatada}`
                });
              } catch (e) { 
                Alert.alert("Erro", "Falha ao gravar entrada."); 
              }
            } else {
              let motivo = !isAtivo ? "Matrícula Inativa." : !isNoPrazo ? `Pagamento em atraso, último pagamento: ${ciclo.dataFormatada}.` : `Limite de ${aluno.lim_aulas} aulas atingido.`;
              
              if (aluno.celular) {
                enviarMensagemWhatsapp(
                  aluno.celular, 
                  `Olá, ${aluno.nome.split(' ')[0]}!\n\nHouve um bloqueio ao tentar realizar o seu check-in no Espaço Leviare.\n\n *Motivo:* ${motivo}\n\nPor favor, procure a recepção para regularizar o seu acesso. `
                );
              }

              setStatusCheckin('erro');
              setMensagemFeedback({ titulo: "Acesso Bloqueado", motivo: `${motivo}\nProcure a recepção.` });
            }
            
            setModalVisivel(true);
            finalizarProcesso();
          });
        });
      }, (err) => {
        setCarregando(false);
      });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.totemContainer}>
        
        <Image source={require('../assets/logoLeviare.jpeg')} style={styles.logoImage} />
        <Text style={styles.title}>Espaço Leviare</Text>
        <Text style={styles.subtitle}>Digite seu CPF para fazer o checkin:</Text>

        <TextInputMask
          type={'cpf'}
          style={styles.inputCpf}
          value={cpfDigitado}
          onChangeText={setCpfDigitado}
          placeholder="000.000.000-00"
          placeholderTextColor="#CCC"
          keyboardType="numeric"
          editable={!carregando} 
        />

        <TouchableOpacity 
          style={[
            styles.btnConfirmar, 
            (cpfDigitado.length === 14 && !carregando) ? styles.btnConfirmarAtivo : styles.btnConfirmarInativo
          ]}
          onPress={processarCheckin}
          disabled={cpfDigitado.length !== 14 || carregando}
        >
          <Text style={styles.btnConfirmarText}>
            {carregando ? 'PROCESSANDO...' : 'CONFIRMAR ENTRADA'}
          </Text>
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
              <TouchableOpacity style={styles.btnFecharErro} onPress={() => { setModalVisivel(false); setCpfDigitado(''); setCarregando(false); }}>
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
  totemContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  logoImage: { width: 250, height: 250, resizeMode: 'contain', marginBottom: 30 },
  title: { fontSize: 46, fontWeight: 'bold', color: '#39624f', marginBottom: 10 },
  subtitle: { fontSize: 24, color: '#666', marginBottom: 50 },
  inputCpf: { 
    width: '85%', maxWidth: 500, backgroundColor: '#F9F9F9', 
    borderWidth: 2, borderColor: '#DDD', borderRadius: 15, 
    paddingVertical: 25, fontSize: 38, textAlign: 'center', marginBottom: 40 
  },
  btnConfirmar: { 
    width: '85%', maxWidth: 500, paddingVertical: 25, 
    borderRadius: 15, alignItems: 'center', elevation: 2 
  },
  btnConfirmarAtivo: { backgroundColor: '#39624f' },
  btnConfirmarInativo: { backgroundColor: '#E0E0E0' },
  btnConfirmarText: { fontWeight: 'bold', fontSize: 22, color: '#e3dbc6', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', maxWidth: 500, borderRadius: 20, padding: 50, alignItems: 'center' },
  iconContainer: { padding: 25, borderRadius: 60, marginBottom: 25 },
  modalTitle: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalSub: { fontSize: 22, color: '#444', textAlign: 'center', lineHeight: 32 },
  btnFecharErro: { marginTop: 40, paddingVertical: 20, paddingHorizontal: 50, borderRadius: 12, backgroundColor: '#333' },
  btnFecharErroText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});

export default Checkin;