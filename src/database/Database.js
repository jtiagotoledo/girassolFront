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
        endereco TEXT,
        email TEXT,
        celular TEXT,
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
                `INSERT INTO alunos (nome, cpf, data_nasc, endereco, email, celular, lim_aulas) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    aluno.nome,
                    aluno.cpf,
                    aluno.data_nasc,
                    aluno.endereco,
                    aluno.email,
                    aluno.celular,
                    aluno.lim_aulas
                ],
                (_, results) => {
                    console.log("Resultado do Insert:", results);
                    resolve(results);
                },
                (_, error) => reject(error)
            );
        });
    });
};