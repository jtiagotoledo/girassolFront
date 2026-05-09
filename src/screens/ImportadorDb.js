import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import db from '../database/Database'; // Confirme se o caminho do seu banco está correto aqui

const ALUNOS_CARGA_INICIAL = [
  {
    "nome": "Maria",
    "cpf": "000.000.000-01",
    "data_nasc": "1900-01-01",
    "email": "exemplo@gmail.com",
    "celular": 5511997000000,
    "logradouro": "Rua exemplo",
    "numero": 100,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-000",
    "lim_aulas": 8
  },
  {
    "nome": "Aline",
    "cpf": "000.000.000-02",
    "data_nasc": "1900-01-02",
    "email": "exemplo@gmail.com",
    "celular": 5511997000001,
    "logradouro": "Rua exemplo",
    "numero": 101,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-001",
    "lim_aulas": 8
  },
  {
    "nome": "João",
    "cpf": "000.000.000-03",
    "data_nasc": "1900-01-03",
    "email": "exemplo@gmail.com",
    "celular": 5511997000002,
    "logradouro": "Rua exemplo",
    "numero": 102,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-002",
    "lim_aulas": 8
  },
  {
    "nome": "Marcelo",
    "cpf": "000.000.000-04",
    "data_nasc": "1900-01-04",
    "email": "exemplo@gmail.com",
    "celular": 5511997000003,
    "logradouro": "Rua exemplo",
    "numero": 103,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-003",
    "lim_aulas": 8
  },
  {
    "nome": "Elias",
    "cpf": "000.000.000-05",
    "data_nasc": "1900-01-05",
    "email": "exemplo@gmail.com",
    "celular": 5511997000004,
    "logradouro": "Rua exemplo",
    "numero": 104,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-004",
    "lim_aulas": 8
  },
  {
    "nome": "Joelma",
    "cpf": "000.000.000-06",
    "data_nasc": "1900-01-06",
    "email": "exemplo@gmail.com",
    "celular": 5511997000005,
    "logradouro": "Rua exemplo",
    "numero": 105,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-005",
    "lim_aulas": 8
  },
  {
    "nome": "Mariana",
    "cpf": "000.000.000-07",
    "data_nasc": "1900-01-07",
    "email": "exemplo@gmail.com",
    "celular": 5511997000006,
    "logradouro": "Rua exemplo",
    "numero": 106,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-006",
    "lim_aulas": 8
  },
  {
    "nome": "Natalino",
    "cpf": "000.000.000-08",
    "data_nasc": "1900-01-08",
    "email": "exemplo@gmail.com",
    "celular": 5511997000007,
    "logradouro": "Rua exemplo",
    "numero": 107,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-007",
    "lim_aulas": 8
  },
  {
    "nome": "Yohanna",
    "cpf": "000.000.000-09",
    "data_nasc": "1900-01-09",
    "email": "exemplo@gmail.com",
    "celular": 5511997000008,
    "logradouro": "Rua exemplo",
    "numero": 108,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-008",
    "lim_aulas": 8
  },
  {
    "nome": "Mathias",
    "cpf": "000.000.000-10",
    "data_nasc": "1900-01-10",
    "email": "exemplo@gmail.com",
    "celular": 5511997000009,
    "logradouro": "Rua exemplo",
    "numero": 109,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-009",
    "lim_aulas": 8
  },
  {
    "nome": "Celso",
    "cpf": "000.000.000-11",
    "data_nasc": "1900-01-11",
    "email": "exemplo@gmail.com",
    "celular": 5511997000010,
    "logradouro": "Rua exemplo",
    "numero": 110,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-010",
    "lim_aulas": 8
  },
  {
    "nome": "Eliana",
    "cpf": "000.000.000-12",
    "data_nasc": "1900-01-12",
    "email": "exemplo@gmail.com",
    "celular": 5511997000011,
    "logradouro": "Rua exemplo",
    "numero": 111,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-011",
    "lim_aulas": 8
  },
  {
    "nome": "Bernadete",
    "cpf": "000.000.000-13",
    "data_nasc": "1900-01-13",
    "email": "exemplo@gmail.com",
    "celular": 5511997000012,
    "logradouro": "Rua exemplo",
    "numero": 112,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-012",
    "lim_aulas": 8
  },
  {
    "nome": "Elionora",
    "cpf": "000.000.000-14",
    "data_nasc": "1900-01-14",
    "email": "exemplo@gmail.com",
    "celular": 5511997000013,
    "logradouro": "Rua exemplo",
    "numero": 113,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-013",
    "lim_aulas": 8
  },
  {
    "nome": "Eulália",
    "cpf": "000.000.000-15",
    "data_nasc": "1900-01-15",
    "email": "exemplo@gmail.com",
    "celular": 5511997000014,
    "logradouro": "Rua exemplo",
    "numero": 114,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-014",
    "lim_aulas": 8
  },
  {
    "nome": "Rafael",
    "cpf": "000.000.000-16",
    "data_nasc": "1900-01-16",
    "email": "exemplo@gmail.com",
    "celular": 5511997000015,
    "logradouro": "Rua exemplo",
    "numero": 115,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-015",
    "lim_aulas": 8
  },
  {
    "nome": "Paulo",
    "cpf": "000.000.000-17",
    "data_nasc": "1900-01-17",
    "email": "exemplo@gmail.com",
    "celular": 5511997000016,
    "logradouro": "Rua exemplo",
    "numero": 116,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-016",
    "lim_aulas": 8
  },
  {
    "nome": "Paola",
    "cpf": "000.000.000-18",
    "data_nasc": "1900-01-18",
    "email": "exemplo@gmail.com",
    "celular": 5511997000017,
    "logradouro": "Rua exemplo",
    "numero": 117,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-017",
    "lim_aulas": 8
  },
  {
    "nome": "Fabiano",
    "cpf": "000.000.000-19",
    "data_nasc": "1900-01-19",
    "email": "exemplo@gmail.com",
    "celular": 5511997000018,
    "logradouro": "Rua exemplo",
    "numero": 118,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-018",
    "lim_aulas": 8
  },
  {
    "nome": "Ester",
    "cpf": "000.000.000-20",
    "data_nasc": "1900-01-20",
    "email": "exemplo@gmail.com",
    "celular": 5511997000019,
    "logradouro": "Rua exemplo",
    "numero": 119,
    "complemento": "casa",
    "bairro": "Centro",
    "cidade": "Sorocaba",
    "uf": "SP",
    "cep": "18000-019",
    "lim_aulas": 8
  }
];

const ImportadorDB = () => {
  const [carregando, setCarregando] = useState(false);

  const injetarDados = () => {
    if (ALUNOS_CARGA_INICIAL.length === 0) {
      Alert.alert("Atenção", "O array de alunos está vazio. Cole o JSON primeiro.");
      return;
    }

    Alert.alert(
      "Confirmar Carga",
      `Deseja injetar ${ALUNOS_CARGA_INICIAL.length} alunos no banco de dados agora?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Injetar", 
          onPress: () => processarInjecao() 
        }
      ]
    );
  };

  const processarInjecao = () => {
    setCarregando(true);

    db.transaction((tx) => {
      ALUNOS_CARGA_INICIAL.forEach((aluno) => {
        
        // Ignora caso exista alguma linha em branco perdida no JSON
        if (!aluno.cpf) return;

        tx.executeSql(
          `INSERT INTO alunos (nome, cpf, data_nasc, email, celular, logradouro, numero, complemento, bairro, cidade, uf, cep, lim_aulas, ativo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            aluno.nome || '', 
            aluno.cpf || '', 
            aluno.data_nasc || null, 
            aluno.email || null, 
            aluno.celular || null, 
            aluno.logradouro || null, 
            aluno.numero || null, 
            aluno.complemento || null, 
            aluno.bairro || null, 
            aluno.cidade || null, 
            aluno.uf || null, 
            aluno.cep || null, 
            parseInt(aluno.lim_aulas) || 0
          ],
          () => { /* Sucesso silencioso para não travar o loop */ },
          (_, err) => { console.log(`Erro ao inserir ${aluno.nome}:`, err.message); }
        );
      });
    }, 
    (error) => {
      setCarregando(false);
      Alert.alert("Erro fatal", "A transação falhou: " + error.message);
    }, 
    () => {
      // Callback de Sucesso Geral da Transação
      setCarregando(false);
      Alert.alert(
        "Missão Cumprida! 🚀", 
        `Todos os ${ALUNOS_CARGA_INICIAL.length} alunos foram processados com sucesso.\n\nO banco SQLite já está populado. Você já pode fechar esta tela e acessar a Gestão de Alunos.`,
        [{ text: "OK" }]
      );
    });
  };

  return (
    <View style={styles.container}>
      <Icon name="database" size={80} color="#007bff" style={{ marginBottom: 20 }} />
      <Text style={styles.title}>Carga Inicial do Sistema</Text>
      <Text style={styles.subtitle}>
        Este módulo lerá o array de JSON embutido no código e fará o INSERT no SQLite em uma única transação de alta velocidade.
      </Text>

      {carregando ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 30 }} />
      ) : (
        <TouchableOpacity style={styles.btnInjetar} onPress={injetarDados}>
          <Text style={styles.btnText}>INJETAR DADOS AGORA</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.warning}>
        Após a mensagem de sucesso, desvincule esta tela do seu App.js.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  btnInjetar: {
    backgroundColor: '#FF3B30', // Vermelho para dar cara de "ação irreversível"
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 4,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  warning: {
    marginTop: 40,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  }
});

export default ImportadorDB;