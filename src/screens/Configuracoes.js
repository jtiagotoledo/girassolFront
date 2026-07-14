import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/colors';

const Configuracoes = () => {
  const [imprimirDuplo, setImprimirDuplo] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const valor = await AsyncStorage.getItem('@imprimir_duplo');
      if (valor === 'true') {
        setImprimirDuplo(true);
      }
    } catch (e) {
      console.error("Erro ao carregar configurações", e);
    }
  };

  const alterarImpressaoDupla = async (valor) => {
    setImprimirDuplo(valor);
    try {
      await AsyncStorage.setItem('@imprimir_duplo', valor ? 'true' : 'false');
    } catch (e) {
      console.error("Erro ao salvar configuração", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações do Sistema</Text>
      
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.textContainer}>
            <Text style={styles.settingLabel}>Ticket Duplicado</Text>
            <Text style={styles.settingSub}>Imprime duas vias do recibo no check-in</Text>
          </View>
          <Switch
            value={imprimirDuplo}
            onValueChange={alterarImpressaoDupla}
            trackColor={{ true: Colors.primary, false: Colors.disabled }}
            thumbColor={Colors.surface}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 20 },
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 12, elevation: 2 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textContainer: { flex: 1, paddingRight: 10 },
  settingLabel: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  settingSub: { fontSize: 14, color: Colors.textMuted, marginTop: 4 }
});

export default Configuracoes;