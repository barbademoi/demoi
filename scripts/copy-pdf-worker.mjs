import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const origem = join(
  process.cwd(),
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
)
const destino = join(process.cwd(), 'public/vendor/pdf.worker.min.mjs')

mkdirSync(dirname(destino), { recursive: true })
copyFileSync(origem, destino)
