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

## Importacao manual (CSV/TXT)

Para importar arquivos individuais com formatos variados (CSV/TXT), use o importador manual:

```bash
DATABASE_URL="postgresql://seu_usuario@localhost:5432/ramberg_osgood" \
  npm run db:import:manual -- \
  --file 01_ABS_BLACK.txt \
  --material ABS \
  --temperature 235 \
  --speed 60
```

Opcoes uteis:

- `--dry-run` para validar parsing sem gravar no banco.
- `--delimiter` para forcar separador (`,`, `;`, `tab`, `space`).
- `--columns` para arquivos sem cabecalho (ex.: `tempo_s,deformacao_mm_mm,tensao_mpa`).
- `--specimen-area` ou `--specimen-width/--specimen-thickness` para calcular tensao a partir da forca.
- `--temperature`, `--speed` e `--layer-height` sao opcionais e podem ficar vazios.

## Importacao via frontend

Acesse `/import` para enviar arquivos diretamente pelo navegador. O formulario permite:

- Importacao unica ou em lote (mesma configuracao para varios arquivos).
- Temperatura, velocidade e altura de camada sao opcionais.
- Ajuste de colunas/delimitador para arquivos sem cabecalho.
- Calculo de tensao/deformacao a partir da geometria do corpo de prova.

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

## Formatação de código

O projeto usa [Prettier](https://prettier.io/) para manter o código formatado e consistente.

### Comandos disponíveis

```bash
# Formatar todo o código
npm run format

# Verificar se o código está formatado (sem alterar)
npm run format:check
```

### Configuração

As regras de formatação estão em `.prettierrc`:

- Sem ponto e vírgula no final
- Aspas simples
- Indentação de 2 espaços
- Trailing comma em objetos/arrays
- Largura máxima de 100 caracteres

### Integração com VS Code

Instale a extensão **Prettier - Code formatter** e adicione ao seu `settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Scripts úteis

- `npm run db:schema` aplica o schema do PostgreSQL.
- `npm run db:import` importa os ensaios em `data/`.
- `npm run db:import:manual` importa arquivos CSV/TXT individuais.
- `npm run dev` inicia o Next.js em modo desenvolvimento.
- `npm run format` formata o código com Prettier.
- `npm run format:check` verifica formatação sem alterar.
