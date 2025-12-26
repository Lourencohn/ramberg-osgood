# ResistencIA

Aplicação web para previsão de curvas tensão‑deformação do PLA usando o modelo de Ramberg‑Osgood, com base em dados reais de ensaios de tração.

## Requisitos

- Node.js 18+
- PostgreSQL 13+

## Configuração do banco

1. Instale dependências:
   ```bash
   npm install
   ```
2. Copie o arquivo `.env.example` para `.env` e ajuste o `DATABASE_URL`.
   Formato:
   ```
   postgresql://usuario:senha@host:porta/nome_do_banco
   ```
   Exemplo local:
   ```
   postgresql://seu_usuario@localhost:5432/ramberg_osgood
   ```
3. Crie o banco de dados local (exemplo):
   ```bash
   createdb ramberg_osgood
   ```
4. Aplique o schema:
   ```bash
   DATABASE_URL="postgresql://seu_usuario@localhost:5432/ramberg_osgood" npm run db:schema
   ```
5. Importe os dados da pasta `data/`:
   ```bash
   DATABASE_URL="postgresql://seu_usuario@localhost:5432/ramberg_osgood" npm run db:import
   ```
   Para validar sem gravar nada:
   ```bash
   DATABASE_URL="postgresql://seu_usuario@localhost:5432/ramberg_osgood" node scripts/import-data.js --dry-run
   ```

## Rodar o projeto

```bash
npm run dev
```

O app estará em `http://localhost:3000`.

## Acessar o banco pelo terminal (psql)

```bash
psql "$DATABASE_URL"
```

Comandos úteis dentro do `psql`:

```
\dt
SELECT COUNT(*) FROM test_runs;
SELECT * FROM v_measurements_export LIMIT 5;
```

## Acessar no DBeaver

1. Criar nova conexão PostgreSQL.
2. Preencher:
   - Host: `localhost`
   - Porta: `5432`
   - Banco: `ramberg_osgood`
   - Usuário: seu usuário local do sistema
   - Senha: em branco, se não foi definida
3. Testar conexão e salvar.

## Credenciais do banco (local)

- Por padrão local, o PostgreSQL usa seu usuário do sistema (ex.: `lourencohn`) e pode não exigir senha.
- Se você definiu senha no Postgres, use a mesma no `DATABASE_URL` e no DBeaver.

## Scripts úteis

- `npm run db:schema` aplica o schema do PostgreSQL.
- `npm run db:import` importa os ensaios em `data/`.
- `npm run dev` inicia o Next.js em modo desenvolvimento.
