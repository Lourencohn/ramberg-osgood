# ResistencIA

Aplicação web para previsão de curvas tensão‑deformação do PLA usando o modelo de Ramberg‑Osgood, com base em dados reais de ensaios de tração.

## Requisitos

- Node.js 22.9+
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
4. Aplique o schema e importe os dados da pasta `data/`:
   ```bash
   npm run db:setup
   ```
   Os scripts de banco leem o `DATABASE_URL` do `.env`; uma variável definida no terminal tem
   prioridade sobre o arquivo. O comando pode ser repetido sem duplicar dados: o schema só cria o que
   falta e a importação substitui os ensaios já gravados.
   Para validar sem gravar nada (processa os 45 ensaios e mostra o resumo):
   ```bash
   npm run db:import -- --dry-run
   ```
   A importação lê os arquivos brutos da máquina (`data/T*/test_*/raw.txt`) e as dimensões medidas
   (`data/specimens.csv`), aplica o mesmo processamento da análise do TCC (`lib/tensile-processing.ts`)
   e grava a curva corrigida, as propriedades e o ajuste de Ramberg-Osgood de cada ensaio.
   Em `test_measurements` fica só a curva corrigida (origem e pontos do início do trecho linear
   até a ruptura); os registros brutos completos continuam em `data/`, referenciados em
   `test_runs.raw_file_path`.
   Detalhes sobre a origem e os problemas corrigidos nos dados estão em [`data/README.md`](data/README.md).

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

## Deploy

A aplicação roda na Vercel com banco PostgreSQL no Neon, no domínio `resistencia3d.com.br`.

1. Na Vercel, o projeto fica ligado a este repositório; todo push em `main` gera um deploy de
   produção. As funções rodam em São Paulo (`gru1`, definido em `vercel.json`).
2. Na aba Storage do projeto, o banco Neon conectado cria a variável `DATABASE_URL` (conexão com
   pooling), que é a lida pela aplicação.
3. Para criar ou atualizar as tabelas e os ensaios do banco de produção, coloque no `.env` local a
   conexão direta (`DATABASE_URL_UNPOOLED` no painel do banco) como `DATABASE_URL` e rode
   `npm run db:setup`.
4. O domínio é configurado em Settings > Domains na Vercel, com as entradas A e CNAME indicadas
   lá criadas na zona DNS do Registro.br.

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

## Análise dos dados (TCC)

Os resultados, tabelas e figuras do TCC são gerados a partir dos dados brutos com:

```bash
npm run analysis           # resultados em analysis/results/ e analysis/results-sem-A00-3/
npm run analysis:figures   # figuras em analysis/figures/ (Python 3 com numpy, pandas e matplotlib)
```

Veja [`analysis/README.md`](analysis/README.md) para as etapas e a descrição de cada arquivo.

## Scripts úteis

- `npm run db:setup` aplica o schema e importa os ensaios (os dois comandos abaixo, em sequência).
- `npm run db:schema` aplica o schema do PostgreSQL.
- `npm run db:import` importa os ensaios em `data/` (a partir dos arquivos brutos).
- `npm run analysis` e `npm run analysis:figures` reproduzem os resultados e as figuras do TCC.
- `npm run db:import:manual` importa arquivos CSV/TXT individuais.
- `npm run dev` inicia o Next.js em modo desenvolvimento.
- `npm run format` formata o código com Prettier.
- `npm run format:check` verifica formatação sem alterar.
