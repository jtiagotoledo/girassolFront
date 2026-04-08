import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { cadastrarAluno } from '../database/Database';
import Colors from '../style/Colors';

const CadastroAluno = () => {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    data_nasc: '',
    endereco: '',
    email: '',
    celular: '',
    lim_aulas: '8',
  });

  const salvar = async () => {
    if (!form.nome || form.cpf.length < 14 || form.celular.length < 14) {
      Alert.alert("Atenção", "Preencha Nome, CPF e Celular corretamente.");
      return;
    }

    try {
      await cadastrarAluno(form);
      Alert.alert("Sucesso!", "Aluno cadastrado com sucesso.");
      setForm({ nome: '', cpf: '', data_nasc: '', endereco: '', email: '', celular: '', lim_aulas: '8' });
    } catch (error) {
      if (error.message.includes("UNIQUE constraint failed")) {
        Alert.alert("Erro", "Este CPF já está cadastrado.");
      } else {
        Alert.alert("Erro", "Falha ao salvar no banco de dados.");
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Novo Aluno</Text>

        {/* Card Identificação */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identificação</Text>
          
          <Text style={styles.label}>NOME COMPLETO</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Nome do aluno"
            placeholderTextColor="#999"
            value={form.nome}
            onChangeText={(val) => setForm({...form, nome: val})} 
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>CPF</Text>
              <TextInputMask
                type={'cpf'}
                style={styles.input}
                value={form.cpf}
                placeholder="000.000.000-00"
                placeholderTextColor="#999"
                onChangeText={(val) => setForm({...form, cpf: val})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>NASCIMENTO</Text>
              <TextInputMask
                type={'datetime'}
                options={{ format: 'DD/MM/YYYY' }}
                style={styles.input}
                value={form.data_nasc}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#999"
                onChangeText={(val) => setForm({...form, data_nasc: val})}
              />
            </View>
          </View>
        </View>

        {/* Card Contato */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contato e Localização</Text>

          <Text style={styles.label}>CELULAR / WHATSAPP</Text>
          <TextInputMask
            type={'cel-phone'}
            options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
            style={styles.input}
            value={form.celular}
            placeholder="(00) 00000-0000"
            placeholderTextColor="#999"
            onChangeText={(val) => setForm({...form, celular: val})}
          />

          <Text style={styles.label}>E-MAIL</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="aluno@email.com"
            placeholderTextColor="#999"
            value={form.email}
            onChangeText={(val) => setForm({...form, email: val})} 
          />

          <Text style={styles.label}>ENDEREÇO</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Rua, número e bairro"
            placeholderTextColor="#999"
            value={form.endereco}
            onChangeText={(val) => setForm({...form, endereco: val})} 
          />
        </View>

        {/* Card Plano */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Configuração do Plano</Text>
          <Text style={styles.label}>LIMITE DE AULAS POR MÊS</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric"
            value={form.lim_aulas}
            onChangeText={(val) => setForm({...form, lim_aulas: val})} 
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={salvar}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>FINALIZAR CADASTRO</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' // Fundo cinza suave
  },
  contentContainer: { 
    padding: 20,
    paddingBottom: 40
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#000', 
    textAlign: 'center', 
    marginVertical: 20 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 20,
    // Removidas bordas e sombras que causavam artefatos
  },
  sectionTitle: {
    color: Colors.primary, // Dourado
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'uppercase',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingLeft: 10
  },
  label: { 
    fontSize: 11, 
    color: '#666', 
    marginBottom: 4, 
    fontWeight: '700' 
  },
  input: { 
    backgroundColor: '#F9F9F9', // Fundo levemente cinza no input
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, 
    fontSize: 16, 
    marginBottom: 15, 
    color: '#000',
    // Sem bordas (borderWidth: 0) para evitar o erro visual da imagem
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  button: { 
    backgroundColor: '#000', 
    padding: 18, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10 
  },
  buttonText: { 
    color: Colors.primary, 
    fontSize: 16, 
    fontWeight: 'bold',
    letterSpacing: 1
  }
});

export default CadastroAluno;