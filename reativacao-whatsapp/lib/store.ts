import fs from 'fs'
import path from 'path'
import type { Cliente, Config } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const CLIENTES_PATH = path.join(DATA_DIR, 'clientes.json')
const CONFIG_PATH = path.join(DATA_DIR, 'config.json')

const CONFIG_PADRAO: Config = {
  instrucaoBase:
    'Tom amigável e informal de barbearia de bairro, como se o barbeiro estivesse mandando mensagem pra um cliente que conhece. ' +
    'Curto (2-3 frases), sem parecer robô nem propaganda. Convide a marcar um horário, sem pressionar.',
}

function garantirDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function lerClientes(): Cliente[] {
  garantirDataDir()
  if (!fs.existsSync(CLIENTES_PATH)) return []
  try {
    const conteudo = fs.readFileSync(CLIENTES_PATH, 'utf-8')
    return conteudo.trim() ? (JSON.parse(conteudo) as Cliente[]) : []
  } catch {
    return []
  }
}

export function salvarClientes(lista: Cliente[]) {
  garantirDataDir()
  fs.writeFileSync(CLIENTES_PATH, JSON.stringify(lista, null, 2), 'utf-8')
}

export function lerConfig(): Config {
  garantirDataDir()
  if (!fs.existsSync(CONFIG_PATH)) return CONFIG_PADRAO
  try {
    const conteudo = fs.readFileSync(CONFIG_PATH, 'utf-8')
    if (!conteudo.trim()) return CONFIG_PADRAO
    return { ...CONFIG_PADRAO, ...(JSON.parse(conteudo) as Partial<Config>) }
  } catch {
    return CONFIG_PADRAO
  }
}

export function salvarConfig(config: Config) {
  garantirDataDir()
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}
