import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  { name: 'girassol_pilates.db', location: 'default' },
  () => { console.log('Banco de dados conectado!'); },
  error => { console.log('Erro ao conectar: ', error); }
);

export const setupDatabase = () => {
  // 1. LIGAR AS CHAVES ESTRANGEIRAS (Precisa rodar fora da transaction normal)
  db.executeSql('PRAGMA foreign_keys = ON;', [], () => {
    console.log('Chaves Estrangeiras (Cascade) ATIVADAS!');
  });

  db.transaction((tx) => {
    // Tabela de Alunos (Pai)
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS alunos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT UNIQUE NOT NULL,
        data_nasc TEXT,
        email TEXT,
        celular TEXT,
        logradouro TEXT,
        numero TEXT,
        complemento TEXT,
        bairro TEXT,
        cidade TEXT,
        uf TEXT,
        cep TEXT,
        lim_aulas INTEGER NOT NULL,
        ativo INTEGER DEFAULT 1
      );`
    );

    // Tabela de Check-ins (Filha) - COM CASCADE
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aluno_id INTEGER,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (aluno_id) REFERENCES alunos (id) ON DELETE CASCADE
      );`
    );

    // Tabela de Pagamentos (Filha) - COM CASCADE
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS pagamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aluno_id INTEGER,
        data_pagamento TEXT NOT NULL,
        valor REAL, 
        FOREIGN KEY (aluno_id) REFERENCES alunos (id) ON DELETE CASCADE
      );`
    );
  });
};

export default db;

export const cadastrarAluno = (aluno) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      // 1. Bloco de Execução
      (tx) => {
        tx.executeSql(
          `INSERT INTO alunos (
            nome, cpf, data_nasc, email, celular, logradouro, numero, complemento, bairro, cidade, uf, cep, lim_aulas, ativo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [
            aluno.nome, aluno.cpf, aluno.data_nasc, aluno.email, aluno.celular, aluno.logradouro,
            aluno.numero, aluno.complemento, aluno.bairro, aluno.cidade, aluno.uf, aluno.cep,
            aluno.lim_aulas, aluno.ativo !== undefined ? aluno.ativo : 1 
          ],
          // SUCESSO
          (_, results) => { 
            resolve(results); 
          },
          // ERRO NA QUERY
          (txObj, erroSql) => { 
            // Algumas versões passam o erro no txObj, outras no erroSql. Vamos capturar os dois!
            const erroReal = erroSql || txObj;
            console.log("❌ Erro capturado no executeSql:", erroReal);
            reject(erroReal); 
            return true; // Cancela a transação
          }
        );
      },
      // 2. Erro na Transação (Fallback de segurança)
      (erroTransacao) => {
        console.log("❌ Erro capturado na Transação:", erroTransacao);
        if (erroTransacao) reject(erroTransacao);
      }
    );
  });
};

export const atualizarAluno = (id, aluno) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE alunos SET 
          nome = ?, cpf = ?, data_nasc = ?, email = ?, celular = ?, logradouro = ?, numero = ?, 
          complemento = ?, bairro = ?, cidade = ?, uf = ?, cep = ?, lim_aulas = ?, ativo = ? 
         WHERE id = ?`,
        [
          aluno.nome, aluno.cpf, aluno.data_nasc, aluno.email, aluno.celular, aluno.logradouro,
          aluno.numero, aluno.complemento, aluno.bairro, aluno.cidade, aluno.uf, aluno.cep,
          aluno.lim_aulas, aluno.ativo, id 
        ],
        (_, results) => { resolve(results); },
        (_, error) => { reject(error); }
      );
    });
  });
};

// 2. FUNÇÃO DE DELETAR LIMPA (O Banco faz o resto)
export const deletarAluno = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      // Basta deletar o aluno. O 'ON DELETE CASCADE' vai apagar os checkins e pagamentos dele sozinho!
      tx.executeSql(
        'DELETE FROM alunos WHERE id = ?',
        [id],
        (_, results) => {
          console.log("Aluno e todo o seu histórico deletados com sucesso via CASCADE.");
          resolve(results);
        },
        (_, error) => { reject(error); }
      );
    });
  });
};

// ==========================================
// --- FUNÇÕES FINANCEIRAS ---
// ==========================================

export const registrarPagamento = (aluno_id, data_pagamento, valor = 0) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO pagamentos (aluno_id, data_pagamento, valor) VALUES (?, ?, ?)',
        [aluno_id, data_pagamento, valor],
        (_, results) => { resolve(results); },
        (_, error) => { reject(error); }
      );
    });
  });
};

export const buscarHistoricoPagamentos = (aluno_id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM pagamentos WHERE aluno_id = ? ORDER BY data_pagamento DESC',
        [aluno_id],
        (_, results) => {
          let pagamentos = [];
          for (let i = 0; i < results.rows.length; i++) {
            pagamentos.push(results.rows.item(i));
          }
          resolve(pagamentos);
        },
        (_, error) => { reject(error); }
      );
    });
  });
};

export const registrarCheckin = (aluno_id) => {
  return new Promise((resolve, reject) => {
    const hoje = new Date();
    const offset = hoje.getTimezoneOffset() * 60000;
    const dataHoraLocal = (new Date(hoje - offset)).toISOString().slice(0, 19).replace('T', ' '); 

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO checkins (aluno_id, data_hora) VALUES (?, ?)',
        [aluno_id, dataHoraLocal],
        (_, results) => { resolve(results); },
        (_, error) => { reject(error); }
      );
    });
  });
};