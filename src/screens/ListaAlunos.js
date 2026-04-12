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
    email: '',
    celular: '',
    // Novos campos de endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    lim_aulas: '8',
  });

  const salvar = async () => {
    // Validação mínima: Nome e CPF
    if (!form.nome || form.cpf.length < 14) {
      Alert.alert("Atenção", "Preencha ao menos o Nome e o CPF corretamente.");
      return;
    }

    try {
      await cadastrarAluno(form);
      Alert.alert("Sucesso!", "Aluno cadastrado com sucesso.");
      setForm({ 
        nome: '', cpf: '', data_nasc: '', email: '', celular: '',
        cep: '', logradouro: '', numero: '', complemento: '', 
        bairro: '', cidade: '', uf: '', lim_aulas: '8' 
      });
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

        {/* Card Contato e Endereço */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contato e Localização</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
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
            </View>
            <View style={{ flex: 1 }}>
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
            </View>
          </View>

          {/* Linha: CEP e UF */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>CEP</Text>
              <TextInputMask
                type={'zip-code'}
                style={styles.input}
                value={form.cep}
                placeholder="00000-000"
                placeholderTextColor="#999"
                onChangeText={(val) => setForm({...form, cep: val})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>UF (ESTADO)</Text>
              <TextInput 
                style={[styles.input, { textTransform: 'uppercase' }]} 
                placeholder="Ex: SP"
                placeholderTextColor="#999"
                maxLength={2}
                value={form.uf}
                onChangeText={(val) => setForm({...form, uf: val})} 
              />
            </View>
          </View>

          {/* Linha: Logradouro e Número */}
          <View style={styles.row}>
            <View style={{ flex: 3, marginRight: 10 }}>
              <Text style={styles.label}>NOME DO LOGRADOURO (RUA/AV)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Rua..."
                placeholderTextColor="#999"
                value={form.logradouro}
                onChangeText={(val) => setForm({...form, logradouro: val})} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>NÚMERO</Text>
              <TextInput 
                style={styles.input} 
                placeholder="123 ou S/N"
                placeholderTextColor="#999"
                value={form.numero}
                onChangeText={(val) => setForm({...form, numero: val})} 
              />
            </View>
          </View>

          <Text style={styles.label}>COMPLEMENTO (OPCIONAL)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Apto, Bloco, Casa 2..."
            placeholderTextColor="#999"
            value={form.complemento}
            onChangeText={(val) => setForm({...form, complemento: val})} 
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>BAIRRO</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Bairro"
                placeholderTextColor="#999"
                value={form.bairro}
                onChangeText={(val) => setForm({...form, bairro: val})} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>LOCALIDADE (CIDADE)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Cidade"
                placeholderTextColor="#999"
                value={form.cidade}
                onChangeText={(val) => setForm({...form, cidade: val})} 
              />
            </View>
          </View>
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
    backgroundColor: '#F5F5F5' 
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
  },
  sectionTitle: {
    color: Colors.primary, 
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
    backgroundColor: '#F9F9F9', 
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, 
    fontSize: 15, 
    marginBottom: 15, 
    color: '#000',
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