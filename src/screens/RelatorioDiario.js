import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/colors';
import { buscarCheckinsPorData } from '../database/Database';
import { imprimirRelatorioDiario } from '../services/PrinterService';

const RelatorioDiario = ({ navigation }) => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [checkins, setCheckins] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const formatarDataBanco = (data) => {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };

  const formatarDataTela = (data) => {
    return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
  };

  const carregarDadosDoDia = async () => {
    const dataBanco = formatarDataBanco(dataAtual);
    try {
      const resultados = await buscarCheckinsPorData(dataBanco);
      setCheckins(resultados);
    } catch (e) {
      console.error("Erro ao carregar relatório:", e);
    }
  };

  useEffect(() => {
    carregarDadosDoDia();
  }, [dataAtual]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarDadosDoDia();
    });
    return unsubscribe;
  }, [navigation, dataAtual]);

  const alterarDia = (dias) => {
    const novaData = new Date(dataAtual);
    novaData.setDate(novaData.getDate() + dias);
    setDataAtual(novaData);
  };

  const mandarImprimir = async () => {
    setCarregando(true);
    
    try {
      const dataTela = formatarDataTela(dataAtual);
      const sucesso = await imprimirRelatorioDiario(dataTela, checkins, checkins.length);
      
      if (sucesso) {
        Alert.alert("Sucesso", "Relatório enviado para a impressora!");
      } else {
        Alert.alert("Erro", "Falha ao comunicar com a impressora.");
      }
    } catch (error) {
      console.error("Erro interno na tela de relatório:", error);
      Alert.alert("Erro Crítico", "Ocorreu um problema ao gerar o relatório.");
    } finally {
      setCarregando(false);
    }
  };

  const renderItem = ({ item }) => {
    const hora = item.data_hora.split(' ')[1].substring(0, 5);
    return (
      <View style={styles.card}>
        <Text style={styles.hora}>{hora}</Text>
        <Text style={styles.nome} numberOfLines={1}>{item.nome}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerDatas}>
        <TouchableOpacity onPress={() => alterarDia(-1)} style={styles.btnSeta}>
          <Icon name="chevron-left" size={30} color={Colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.dataCentral}>
          <Text style={styles.tituloData}>Data do Relatório</Text>
          <Text style={styles.valorData}>{formatarDataTela(dataAtual)}</Text>
        </View>

        <TouchableOpacity onPress={() => alterarDia(1)} style={styles.btnSeta}>
          <Icon name="chevron-right" size={30} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={checkins}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={<Text style={styles.textoVazio}>Nenhum check-in neste dia.</Text>}
      />

      <View style={styles.rodape}>
        <View style={styles.boxTotal}>
          <Text style={styles.textoTotal}>Total de Check-ins</Text>
          <Text style={styles.numeroTotal}>{checkins.length}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.btnImprimir, carregando && { opacity: 0.7 }]} 
          onPress={mandarImprimir}
          disabled={carregando}
        >
          <Icon name="printer" size={24} color={Colors.secondary} />
          <Text style={styles.btnImprimirTexto}>IMPRIMIR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerDatas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 20, elevation: 2 },
  btnSeta: { padding: 10, backgroundColor: Colors.surfaceLight, borderRadius: 50 },
  dataCentral: { alignItems: 'center' },
  tituloData: { fontSize: 14, color: Colors.textMuted },
  valorData: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  
  lista: { padding: 15, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', elevation: 1 },
  hora: { fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginRight: 15, width: 60 },
  nome: { fontSize: 18, color: Colors.textPrimary, flex: 1 },
  textoVazio: { textAlign: 'center', color: Colors.textMuted, marginTop: 50, fontSize: 16 },

  rodape: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, padding: 20, borderTopWidth: 1, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boxTotal: { flex: 1 },
  textoTotal: { fontSize: 14, color: Colors.textMuted },
  numeroTotal: { fontSize: 32, fontWeight: 'bold', color: Colors.textPrimary },
  btnImprimir: { flexDirection: 'row', backgroundColor: Colors.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center' },
  btnImprimirTexto: { color: Colors.secondary, fontWeight: 'bold', fontSize: 18, marginLeft: 10 }
});

export default RelatorioDiario;