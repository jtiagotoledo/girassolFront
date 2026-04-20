import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  { name: 'girassol_pilates.db', location: 'default' },
  () => { console.log('Banco de dados conectado!'); },
  error => { console.log('Erro ao conectar: ', error); }
);

export const setupDatabase = () => {
  db.transaction((tx) => {
    // 1. Tabela de Alunos
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

    // 2. Tabela de Check-ins
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aluno_id INTEGER,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (aluno_id) REFERENCES alunos (id)
      );`
    );

    // 3. NOVA: Tabela de Histórico de Pagamentos
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS pagamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aluno_id INTEGER,
        data_pagamento TEXT NOT NULL,
        valor REAL, 
        FOREIGN KEY (aluno_id) REFERENCES alunos (id)
      );`
    );
  });
};

export default db;

export const cadastrarAluno = (aluno) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO alunos (
          nome, 
          cpf, 
          data_nasc, 
          email, 
          celular, 
          logradouro, 
          numero, 
          complemento, 
          bairro, 
          cidade, 
          uf, 
          cep, 
          lim_aulas,
          ativo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [
          aluno.nome,
          aluno.cpf,
          aluno.data_nasc,
          aluno.email,
          aluno.celular,
          aluno.logradouro,
          aluno.numero,
          aluno.complemento,
          aluno.bairro,
          aluno.cidade,
          aluno.uf,
          aluno.cep,
          aluno.lim_aulas,
          aluno.ativo !== undefined ? aluno.ativo : 1 
        ],
        (_, results) => {
          console.log("Resultado do Insert:", results);
          resolve(results);
        },
        (_, error) => {
          console.error("Erro no SQL:", error);
          reject(error);
        }
      );
    });
  });
};

export const atualizarAluno = (id, aluno) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE alunos SET 
          nome = ?, cpf = ?, data_nasc = ?, email = ?, celular = ?, 
          logradouro = ?, numero = ?, complemento = ?, bairro = ?, 
          cidade = ?, uf = ?, cep = ?, lim_aulas = ?, ativo = ? 
         WHERE id = ?`,
        [
          aluno.nome, aluno.cpf, aluno.data_nasc, aluno.email, aluno.celular,
          aluno.logradouro, aluno.numero, aluno.complemento, aluno.bairro,
          aluno.cidade, aluno.uf, aluno.cep, aluno.lim_aulas, 
          aluno.ativo, 
          id 
        ],
        (_, results) => {
          console.log("Resultado do Update:", results);
          resolve(results);
        },
        (_, error) => {
          console.error("Erro no Update SQL:", error);
          reject(error);
        }
      );
    });
  });
};

export const deletarAluno = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      // Dica de segurança futura: Em bancos relacionais, ao deletar o aluno, 
      // idealmente deletamos também os pagamentos e checkins dele. 
      // O SQLite faz isso automaticamente se "PRAGMA foreign_keys = ON" estiver ativado.
      tx.executeSql(
        'DELETE FROM alunos WHERE id = ?',
        [id],
        (_, results) => {
          console.log("Aluno deletado com sucesso");
          resolve(results);
        },
        (_, error) => {
          console.error("Erro ao deletar aluno:", error);
          reject(error);
        }
      );
    });
  });
};

// ==========================================
// --- NOVAS FUNÇÕES FINANCEIRAS ---
// ==========================================

export const registrarPagamento = (aluno_id, data_pagamento, valor = 0) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO pagamentos (aluno_id, data_pagamento, valor) VALUES (?, ?, ?)',
        [aluno_id, data_pagamento, valor],
        (_, results) => {
          console.log("Pagamento registrado com sucesso");
          resolve(results);
        },
        (_, error) => {
          console.error("Erro ao registrar pagamento:", error);
          reject(error);
        }
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
        (_, error) => {
          console.error("Erro ao buscar histórico financeiro:", error);
          reject(error);
        }
      );
    });
  });
};

export const registrarCheckin = (aluno_id) => {
  return new Promise((resolve, reject) => {
    // Pega a data/hora local exata do tablet (Brasil)
    const hoje = new Date();
    const offset = hoje.getTimezoneOffset() * 60000;
    const dataHoraLocal = (new Date(hoje - offset)).toISOString().slice(0, 19).replace('T', ' '); 

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO checkins (aluno_id, data_hora) VALUES (?, ?)',
        [aluno_id, dataHoraLocal],
        (_, results) => {
          console.log("Check-in registrado:", dataHoraLocal);
          resolve(results);
        },
        (_, error) => {
          console.error("Erro ao registrar check-in:", error);
          reject(error);
        }
      );
    });
  });
};