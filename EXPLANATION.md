# Estrutura de Autenticação e Segurança

Este documento descreve o propósito de colunas importantes na tabela de usuários (`users`) relacionadas à segurança e autenticação.

## password_hash

A coluna `password_hash` armazena a versão criptografada da senha do usuário.

**Por que não armazenar a senha em texto plano?**
Armazenar senhas em texto plano é extremamente inseguro. Se o banco de dados for comprometido, atacantes teriam acesso imediato às senhas de todos os usuários.

**Como funciona:**
Quando um usuário cria uma conta, o sistema gera um "salt" (valor aleatório) único para esse usuário (armazenado em `password_salt`) e o combina com a senha fornecida. O resultado é processado por uma função de hash criptográfica (neste projeto, `scrypt`). O resultado final é armazenado em `password_hash`.

Para verificar a senha no login:
1. O sistema busca o usuário pelo e-mail.
2. Recupera o `password_salt` e o `password_hash` armazenados.
3. Aplica a mesma função de hash à senha fornecida no login usando o `password_salt` recuperado.
4. Compara o novo hash gerado com o `password_hash` armazenado. Se forem idênticos, a senha está correta.

## session_token_hash

A coluna `session_token_hash` é usada para gerenciar sessões de usuário de forma segura.

**Como funciona:**
1. Quando o usuário faz login com sucesso, o sistema gera um token de sessão aleatório.
2. Este token é enviado ao navegador do usuário e armazenado em um cookie seguro (`httpOnly`).
3. O sistema calcula o hash (SHA-256) deste token e o armazena na coluna `session_token_hash` no banco de dados.

**Por que armazenar o hash do token?**
Semelhante às senhas, armazenar o token de sessão original no banco de dados representa um risco. Se um atacante obtiver acesso de leitura ao banco de dados (por exemplo, via SQL Injection), ele poderia roubar os tokens de sessão ativos e se passar pelos usuários (session hijacking).

Ao armazenar apenas o hash do token:
- O servidor pode verificar a validade do token enviado pelo cookie (calculando seu hash e comparando com o banco).
- Se o banco for vazado, os atacantes obtêm apenas os hashes, que não podem ser usados para autenticação direta, pois o servidor espera o token original (que está apenas no cookie do usuário).

Isso adiciona uma camada extra de defesa em profundidade à aplicação.
