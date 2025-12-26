# ResistencIA

Aplicação web para previsão de curvas tensão‑deformação do PLA usando o modelo de Ramberg‑Osgood, com base em dados reais de ensaios de tração.

## Requisitos

- Node.js 18+
- PostgreSQL 13+

## Configuração do banco

1. Copie o arquivo `.env.example` para `.env` e ajuste o `DATABASE_URL`.
2. Crie o banco de dados local (exemplo):
   ```bash
   createdb ramberg_osgood
   ```
3. Aplique o schema:
   ```bash
   npm run db:schema
   ```
4. Importe os dados da pasta `data/`:
   ```bash
   npm run db:import
   ```
   Para validar sem gravar nada:
   ```bash
   node scripts/import-data.js --dry-run
   ```

## Rodar o projeto

```bash
npm install
npm run dev
```

O app estará em `http://localhost:3000`.

## Scripts úteis

- `npm run db:schema` aplica o schema do PostgreSQL.
- `npm run db:import` importa os ensaios em `data/`.
- `npm run dev` inicia o Next.js em modo desenvolvimento.
