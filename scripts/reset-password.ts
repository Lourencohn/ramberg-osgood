import { Client } from 'pg'
import { MIN_PASSWORD_LENGTH, createPasswordHash, normalizeEmail } from '@/lib/credentials'

let pipedLines: string[] | null = null

async function readPipedLine() {
  if (!pipedLines) {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
    pipedLines = Buffer.concat(chunks).toString('utf8').split(/\r?\n/)
  }
  return pipedLines.shift() ?? ''
}

function readHiddenLine(): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    let value = ''
    const finish = () => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
      process.stdout.write('\n')
    }
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          finish()
          resolve(value)
          return
        }
        if (char === '\u0003') {
          finish()
          reject(new Error('Operação cancelada.'))
          return
        }
        value = char === '\u007f' || char === '\b' ? value.slice(0, -1) : value + char
      }
    }
    stdin.setRawMode(true)
    stdin.setEncoding('utf8')
    stdin.resume()
    stdin.on('data', onData)
  })
}

async function askPassword(prompt: string) {
  process.stdout.write(prompt)
  if (process.stdin.isTTY) return readHiddenLine()
  const line = await readPipedLine()
  process.stdout.write('\n')
  return line
}

async function main() {
  const emailArgument = process.argv[2]
  if (!emailArgument) {
    console.error('Uso: npm run user:reset-password -- email@exemplo.com')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('Defina DATABASE_URL no .env ou no ambiente antes de redefinir a senha.')
    process.exit(1)
  }

  const email = normalizeEmail(emailArgument)
  const password = await askPassword('Nova senha: ')
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    process.exit(1)
  }
  if ((await askPassword('Repita a nova senha: ')) !== password) {
    console.error('As senhas não conferem.')
    process.exit(1)
  }

  const { salt, hash } = createPasswordHash(password)
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    const { rows } = await client.query(
      `UPDATE users
       SET password_salt = $1, password_hash = $2, session_token_hash = NULL, session_expires_at = NULL
       WHERE email = $3
       RETURNING name`,
      [salt, hash, email]
    )
    if (!rows.length) {
      console.error(`Nenhum usuário cadastrado com o e-mail ${email}.`)
      process.exitCode = 1
      return
    }
    console.log(
      `Senha redefinida para ${rows[0].name} (${email}). As sessões abertas foram encerradas.`
    )
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Falha ao redefinir a senha:', error.message ?? error)
  process.exit(1)
})
