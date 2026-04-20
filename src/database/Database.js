import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
    { name: 'girassol_pilates.db', location: 'default' },
    () => { console.log('Banco de dados conectado!'); },
    error => { console.log('Erro ao conectar: ', error); }
);

export const setupDatabase = () => {
    db.transaction((tx) => {
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

        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aluno_id INTEGER,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
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
          lim_aulas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          aluno.lim_aulas
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
          cidade = ?, uf = ?, cep = ?, lim_aulas = ?
         WHERE id = ?`,
        [
          aluno.nome, aluno.cpf, aluno.data_nasc, aluno.email, aluno.celular,
          aluno.logradouro, aluno.numero, aluno.complemento, aluno.bairro,
          aluno.cidade, aluno.uf, aluno.cep, aluno.lim_aulas, 
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