// server.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de CORS:
// Definimos as origens permitidas e habilitamos o preflight (OPTIONS)
const corsOptions = {
  origin: [
    'https://kanbanpcp.netlify.app',  // sua URL Netlify correta
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ]
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com PostgreSQL via variável DATABASE_URL do Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Rota para obter as atividades
app.get('/api/atividades', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM atividades
      ORDER BY CASE prioridade
        WHEN 'Critico' THEN 1
        WHEN 'Urgente' THEN 2
        WHEN 'Regular' THEN 3
        WHEN 'Normal' THEN 4
      END
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
});

// Rota para criar uma nova atividade
app.post('/api/atividades', async (req, res) => {
  try {
    const { cargo, nome, titulo, descricao, prioridade, status } = req.body;
    const result = await pool.query(
      'INSERT INTO atividades (cargo, nome, titulo, descricao, prioridade, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [cargo, nome, titulo, descricao, prioridade, status]
    );
    res.status(201).json({ id: result.rows[0].id, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar atividade' });
  }
});

// Rota para atualizar o status de uma atividade
app.put('/api/atividades/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    await pool.query('UPDATE atividades SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
