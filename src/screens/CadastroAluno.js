import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { cadastrarAluno, atualizarAluno } from '../database/Database';
import Colors from '../constants/colors';

const CadastroAluno = ({ route, navigation }) => {
  const [form, setForm] = useState({
    nome: '', cpf: '', data_nasc: '', email: '', celular: '',
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', uf: '', lim_aulas: '8', ativo: 1,
  });

  const alunoEditavel = route?.params?.alunoEditavel;

  useEffect(() => {
    if (alunoEditavel) {
      setForm({
        nome: alunoEditavel.nome || '',
        cpf: alunoEditavel.cpf || '',
        data_nasc: alunoEditavel.data_nasc || '',
        email: alunoEditavel.email || '',
        celular: alunoEditavel.celular || '',
        cep: alunoEditavel.cep || '',
        logradouro: alunoEditavel.logradouro || '',
        numero: String(alunoEditavel.numero || ''),
        complemento: alunoEditavel.complemento || '',
        bairro: alunoEditavel.bairro || '',
        cidade: alunoEditavel.cidade || '',
        uf: alunoEditavel.uf || '',
        lim_aulas: alunoEditavel.lim_aulas ? String(alunoEditavel.lim_aulas) : '8',
        ativo: alunoEditavel.ativo !== undefined ? alunoEditavel.ativo : 1,
      });
    } else {
      setForm({
        nome: '', cpf: '', data_nasc: '', email: '', celular: '',
        cep: '', logradouro: '', numero: '', complemento: '',
        bairro: '', cidade: '', uf: '', lim_aulas: '8', ativo: 1,
      });
    }
  }, [alunoEditavel]);

  const salvar = async () => {
    if (!form.nome || form.cpf.length < 14) {
      Alert.alert("Atenção", "Preencha ao menos o Nome e o CPF corretamente.");
      return;
    }

    // CORREÇÃO: Removida a limpeza de máscara. 
    // Voltamos a enviar o 'form' diretamente para o banco para garantir
    // que o CPF seja salvo com os pontos e traço (necessário para o Checkin.js).
    try {
      if (alunoEditavel) {
        await atualizarAluno(alunoEditavel.id, form);
        Alert.alert("Sucesso!", "Dados do aluno atualizados.");
      } else {
        await cadastrarAluno(form);
        Alert.alert("Sucesso!", "Aluno cadastrado com sucesso.");
      }

      setForm({
        nome: '', cpf: '', data_nasc: '', email: '', celular: '',
        cep: '', logradouro: '', numero: '', complemento: '',
        bairro: '', cidade: '', uf: '', lim_aulas: '8', ativo: 1
      });

      navigation.setParams({ alunoEditavel: undefined });
      navigation.navigate('ListaAlunos');

    } catch (error) {
      const mensagemErro = error?.message || String(error) || "";
      if (mensagemErro.toLowerCase().includes("unique") || mensagemErro.toLowerCase().includes("cpf")) {
        Alert.alert("Atenção", "Este CPF já está cadastrado no sistema.");
      } else {
        Alert.alert("Erro", "Falha ao salvar no banco de dados.");
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{alunoEditavel ? 'Editar Aluno' : 'Novo Aluno'}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identificação</Text>
          <Text style={styles.label}>NOME COMPLETO</Text>
          <TextInput
            style={styles.input} placeholder="Nome do aluno" placeholderTextColor={Colors.textLight}
            value={form.nome} onChangeText={(val) => setForm({ ...form, nome: val })}
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>CPF</Text>
              <TextInputMask
                type={'cpf'} style={styles.input} value={form.cpf}
                placeholder="000.000.000-00" placeholderTextColor={Colors.textLight}
                onChangeText={(val) => setForm({ ...form, cpf: val })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>NASCIMENTO</Text>
              <TextInputMask
                type={'datetime'} options={{ format: 'DD/MM/YYYY' }} style={styles.input}
                value={form.data_nasc} placeholder="DD/MM/AAAA" placeholderTextColor={Colors.textLight}
                onChangeText={(val) => setForm({ ...form, data_nasc: val })}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contato e Localização</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>CELULAR / WHATSAPP</Text>
              <TextInputMask
                type={'cel-phone'} options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
                style={styles.input} value={form.celular} placeholder="(00) 00000-0000"
                placeholderTextColor={Colors.textLight} onChangeText={(val) => setForm({ ...form, celular: val })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>E-MAIL</Text>
              <TextInput
                style={styles.input} keyboardType="email-address" autoCapitalize="none"
                placeholder="aluno@email.com" placeholderTextColor={Colors.textLight}
                value={form.email} onChangeText={(val) => setForm({ ...form, email: val })}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>CEP</Text>
              <TextInputMask
                type={'zip-code'} style={styles.input} value={form.cep}
                placeholder="00000-000" placeholderTextColor={Colors.textLight}
                onChangeText={(val) => setForm({ ...form, cep: val })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>UF (ESTADO)</Text>
              <TextInput
                style={[styles.input, { textTransform: 'uppercase' }]} placeholder="Ex: SP"
                placeholderTextColor={Colors.textLight} maxLength={2} value={form.uf}
                onChangeText={(val) => setForm({ ...form, uf: val })}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 3, marginRight: 10 }}>
              <Text style={styles.label}>NOME DO LOGRADOURO (RUA/AV)</Text>
              <TextInput
                style={styles.input} placeholder="Rua..." placeholderTextColor={Colors.textLight}
                value={form.logradouro} onChangeText={(val) => setForm({ ...form, logradouro: val })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>NÚMERO</Text>
              <TextInput
                style={styles.input} placeholder="123 ou S/N" placeholderTextColor={Colors.textLight}
                value={form.numero} onChangeText={(val) => setForm({ ...form, numero: val })}
              />
            </View>
          </View>
          <Text style={styles.label}>COMPLEMENTO (OPCIONAL)</Text>
          <TextInput
            style={styles.input} placeholder="Apto, Bloco, Casa 2..." placeholderTextColor={Colors.textLight}
            value={form.complemento} onChangeText={(val) => setForm({ ...form, complemento: val })}
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>BAIRRO</Text>
              <TextInput
                style={styles.input} placeholder="Bairro" placeholderTextColor={Colors.textLight}
                value={form.bairro} onChangeText={(val) => setForm({ ...form, bairro: val })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>LOCALIDADE (CIDADE)</Text>
              <TextInput
                style={styles.input} placeholder="Cidade" placeholderTextColor={Colors.textLight}
                value={form.cidade} onChangeText={(val) => setForm({ ...form, cidade: val })}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Configuração do Plano</Text>
          <Text style={styles.label}>LIMITE DE AULAS POR MÊS</Text>
          <TextInput
            style={styles.input} keyboardType="numeric" value={form.lim_aulas}
            onChangeText={(val) => setForm({ ...form, lim_aulas: val })}
          />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.statusLabel}>STATUS DO ALUNO</Text>
              <Text style={[styles.statusText, { color: form.ativo ? Colors.success : Colors.textLight }]}>
                {form.ativo ? 'ATIVO (PODE FAZER CHECK-IN)' : 'INATIVO (BLOQUEADO)'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: Colors.disabled, true: Colors.primary }}
              thumbColor={form.ativo === 1 ? Colors.secondary : Colors.surface} 
              ios_backgroundColor={Colors.disabled}
              onValueChange={(val) => setForm({ ...form, ativo: val ? 1 : 0 })}
              value={form.ativo === 1} 
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={salvar} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{alunoEditavel ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR CADASTRO'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', marginVertical: 20 },
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  sectionTitle: { color: Colors.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', borderLeftWidth: 4, borderLeftColor: Colors.primary, paddingLeft: 10 },
  label: { fontSize: 11, color: Colors.textMuted, marginBottom: 4, fontWeight: '700' },
  input: { backgroundColor: Colors.surfaceLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 15, marginBottom: 15, color: Colors.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { backgroundColor: Colors.primary, padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: Colors.secondary, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: Colors.border },
  statusLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', marginBottom: 2 },
  statusText: { fontSize: 14, fontWeight: 'bold' }
});

export default CadastroAluno;