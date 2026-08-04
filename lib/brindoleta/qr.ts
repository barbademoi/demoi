// Gerador QR interno, sem chamadas a serviços externos.
// Adaptado do algoritmo QRCode.js de Kazuhiko Arase (licença MIT).

type Module = boolean | null

type RsBlock = {
  total: number
  data: number
}

const ERROR_LEVEL_M_BLOCKS: number[][] = [
  [1, 26, 16],
  [1, 44, 28],
  [1, 70, 44],
  [2, 50, 32],
  [2, 67, 43],
  [4, 43, 27],
  [4, 49, 31],
  [2, 60, 38, 2, 61, 39],
  [3, 58, 36, 2, 59, 37],
  [4, 69, 43, 1, 70, 44],
]

const ALIGNMENT_POSITIONS: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

const EXP_TABLE = new Array<number>(256)
const LOG_TABLE = new Array<number>(256).fill(0)

for (let index = 0; index < 8; index += 1) EXP_TABLE[index] = 1 << index
for (let index = 8; index < 256; index += 1) {
  EXP_TABLE[index] = EXP_TABLE[index - 4] ^ EXP_TABLE[index - 5] ^ EXP_TABLE[index - 6] ^ EXP_TABLE[index - 8]
}
for (let index = 0; index < 255; index += 1) LOG_TABLE[EXP_TABLE[index]] = index

function gfExp(value: number) {
  let normalized = value
  while (normalized < 0) normalized += 255
  while (normalized >= 256) normalized -= 255
  return EXP_TABLE[normalized]
}

function gfMultiply(left: number, right: number) {
  if (left === 0 || right === 0) return 0
  return gfExp(LOG_TABLE[left] + LOG_TABLE[right])
}

function multiplyPolynomials(left: number[], right: number[]) {
  const result = new Array<number>(left.length + right.length - 1).fill(0)
  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      result[leftIndex + rightIndex] ^= gfMultiply(left[leftIndex], right[rightIndex])
    }
  }
  return result
}

function errorCorrection(data: number[], length: number) {
  let generator = [1]
  for (let index = 0; index < length; index += 1) {
    generator = multiplyPolynomials(generator, [1, gfExp(index)])
  }

  const remainder = [...data, ...new Array<number>(length).fill(0)]
  for (let index = 0; index < data.length; index += 1) {
    const factor = remainder[index]
    if (factor === 0) continue
    for (let offset = 0; offset < generator.length; offset += 1) {
      remainder[index + offset] ^= gfMultiply(generator[offset], factor)
    }
  }
  return remainder.slice(remainder.length - length)
}

class BitBuffer {
  bytes: number[] = []

  length = 0

  put(value: number, length: number) {
    for (let index = 0; index < length; index += 1) {
      this.putBit(((value >>> (length - index - 1)) & 1) === 1)
    }
  }

  putBit(value: boolean) {
    const byteIndex = Math.floor(this.length / 8)
    if (this.bytes.length <= byteIndex) this.bytes.push(0)
    if (value) this.bytes[byteIndex] |= 0x80 >>> (this.length % 8)
    this.length += 1
  }
}

function rsBlocks(version: number) {
  const definition = ERROR_LEVEL_M_BLOCKS[version - 1]
  const blocks: RsBlock[] = []
  for (let index = 0; index < definition.length; index += 3) {
    const count = definition[index]
    for (let block = 0; block < count; block += 1) {
      blocks.push({ total: definition[index + 1], data: definition[index + 2] })
    }
  }
  return blocks
}

function chooseVersion(byteLength: number) {
  for (let version = 1; version <= 10; version += 1) {
    const capacity = rsBlocks(version).reduce((sum, block) => sum + block.data, 0) * 8
    const lengthBits = version < 10 ? 8 : 16
    if (4 + lengthBits + byteLength * 8 <= capacity) return version
  }
  throw new Error('O endereço é longo demais para o QR Code interno.')
}

function createCodewords(value: string, version: number) {
  const valueBytes = Array.from(new TextEncoder().encode(value))
  const blocks = rsBlocks(version)
  const totalDataBytes = blocks.reduce((sum, block) => sum + block.data, 0)
  const buffer = new BitBuffer()

  buffer.put(0b0100, 4)
  buffer.put(valueBytes.length, version < 10 ? 8 : 16)
  valueBytes.forEach((byte) => buffer.put(byte, 8))

  if (buffer.length + 4 <= totalDataBytes * 8) buffer.put(0, 4)
  while (buffer.length % 8 !== 0) buffer.putBit(false)

  let pad = true
  while (buffer.bytes.length < totalDataBytes) {
    buffer.bytes.push(pad ? 0xec : 0x11)
    pad = !pad
  }

  const dataBlocks: number[][] = []
  const correctionBlocks: number[][] = []
  let offset = 0
  let maxData = 0
  let maxCorrection = 0

  blocks.forEach((block) => {
    const data = buffer.bytes.slice(offset, offset + block.data)
    const correctionLength = block.total - block.data
    dataBlocks.push(data)
    correctionBlocks.push(errorCorrection(data, correctionLength))
    offset += block.data
    maxData = Math.max(maxData, block.data)
    maxCorrection = Math.max(maxCorrection, correctionLength)
  })

  const codewords: number[] = []
  for (let index = 0; index < maxData; index += 1) {
    dataBlocks.forEach((block) => {
      if (index < block.length) codewords.push(block[index])
    })
  }
  for (let index = 0; index < maxCorrection; index += 1) {
    correctionBlocks.forEach((block) => {
      if (index < block.length) codewords.push(block[index])
    })
  }
  return codewords
}

function bchDigit(value: number) {
  let digit = 0
  let current = value
  while (current !== 0) {
    digit += 1
    current >>>= 1
  }
  return digit
}

function formatBits(data: number) {
  const generator = 0x537
  let remainder = data << 10
  while (bchDigit(remainder) - bchDigit(generator) >= 0) {
    remainder ^= generator << (bchDigit(remainder) - bchDigit(generator))
  }
  return ((data << 10) | remainder) ^ 0x5412
}

function versionBits(version: number) {
  const generator = 0x1f25
  let remainder = version << 12
  while (bchDigit(remainder) - bchDigit(generator) >= 0) {
    remainder ^= generator << (bchDigit(remainder) - bchDigit(generator))
  }
  return (version << 12) | remainder
}

function maskApplies(mask: number, row: number, column: number) {
  switch (mask) {
    case 0: return (row + column) % 2 === 0
    case 1: return row % 2 === 0
    case 2: return column % 3 === 0
    case 3: return (row + column) % 3 === 0
    case 4: return (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0
    case 5: return (row * column) % 2 + (row * column) % 3 === 0
    case 6: return ((row * column) % 2 + (row * column) % 3) % 2 === 0
    case 7: return ((row * column) % 3 + (row + column) % 2) % 2 === 0
    default: return false
  }
}

function setupFinder(modules: Module[][], row: number, column: number) {
  const size = modules.length
  for (let rowOffset = -1; rowOffset <= 7; rowOffset += 1) {
    const targetRow = row + rowOffset
    if (targetRow < 0 || targetRow >= size) continue
    for (let columnOffset = -1; columnOffset <= 7; columnOffset += 1) {
      const targetColumn = column + columnOffset
      if (targetColumn < 0 || targetColumn >= size) continue
      modules[targetRow][targetColumn] = rowOffset >= 0 && rowOffset <= 6 && columnOffset >= 0 && columnOffset <= 6
        && (rowOffset === 0 || rowOffset === 6 || columnOffset === 0 || columnOffset === 6
          || (rowOffset >= 2 && rowOffset <= 4 && columnOffset >= 2 && columnOffset <= 4))
    }
  }
}

function setupAlignment(modules: Module[][], version: number) {
  const positions = ALIGNMENT_POSITIONS[version - 1]
  positions.forEach((row) => positions.forEach((column) => {
    if (modules[row][column] !== null) return
    for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
      for (let columnOffset = -2; columnOffset <= 2; columnOffset += 1) {
        modules[row + rowOffset][column + columnOffset] = Math.abs(rowOffset) === 2
          || Math.abs(columnOffset) === 2
          || (rowOffset === 0 && columnOffset === 0)
      }
    }
  }))
}

function setupTiming(modules: Module[][]) {
  const size = modules.length
  for (let index = 8; index < size - 8; index += 1) {
    if (modules[index][6] === null) modules[index][6] = index % 2 === 0
    if (modules[6][index] === null) modules[6][index] = index % 2 === 0
  }
}

function setupVersion(modules: Module[][], version: number, test: boolean) {
  if (version < 7) return
  const bits = versionBits(version)
  const size = modules.length
  for (let index = 0; index < 18; index += 1) {
    const dark = !test && ((bits >>> index) & 1) === 1
    modules[Math.floor(index / 3)][index % 3 + size - 11] = dark
    modules[index % 3 + size - 11][Math.floor(index / 3)] = dark
  }
}

function setupFormat(modules: Module[][], mask: number, test: boolean) {
  // Nível de correção M usa o valor 0 nos dois bits de nível.
  const bits = formatBits(mask)
  const size = modules.length
  for (let index = 0; index < 15; index += 1) {
    const dark = !test && ((bits >>> index) & 1) === 1
    if (index < 6) modules[index][8] = dark
    else if (index < 8) modules[index + 1][8] = dark
    else modules[size - 15 + index][8] = dark

    if (index < 8) modules[8][size - index - 1] = dark
    else if (index < 9) modules[8][15 - index] = dark
    else modules[8][15 - index - 1] = dark
  }
  modules[size - 8][8] = !test
}

function mapData(modules: Module[][], codewords: number[], mask: number) {
  const size = modules.length
  let direction = -1
  let row = size - 1
  let byteIndex = 0
  let bitIndex = 7

  for (let column = size - 1; column > 0; column -= 2) {
    if (column === 6) column -= 1
    while (true) {
      for (let offset = 0; offset < 2; offset += 1) {
        const targetColumn = column - offset
        if (modules[row][targetColumn] !== null) continue
        let dark = byteIndex < codewords.length && ((codewords[byteIndex] >>> bitIndex) & 1) === 1
        if (maskApplies(mask, row, targetColumn)) dark = !dark
        modules[row][targetColumn] = dark
        bitIndex -= 1
        if (bitIndex < 0) {
          byteIndex += 1
          bitIndex = 7
        }
      }
      row += direction
      if (row < 0 || row >= size) {
        row -= direction
        direction = -direction
        break
      }
    }
  }
}

function makeMatrix(version: number, codewords: number[], mask: number, test: boolean) {
  const size = version * 4 + 17
  const modules = Array.from({ length: size }, () => new Array<Module>(size).fill(null))
  setupFinder(modules, 0, 0)
  setupFinder(modules, size - 7, 0)
  setupFinder(modules, 0, size - 7)
  setupAlignment(modules, version)
  setupTiming(modules)
  setupFormat(modules, mask, test)
  setupVersion(modules, version, test)
  mapData(modules, codewords, mask)
  return modules.map((row) => row.map(Boolean))
}

function lostPoint(modules: boolean[][]) {
  const size = modules.length
  let score = 0

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let sameCount = 0
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        const targetRow = row + rowOffset
        if (targetRow < 0 || targetRow >= size) continue
        for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
          const targetColumn = column + columnOffset
          if ((rowOffset === 0 && columnOffset === 0) || targetColumn < 0 || targetColumn >= size) continue
          if (modules[row][column] === modules[targetRow][targetColumn]) sameCount += 1
        }
      }
      if (sameCount > 5) score += 3 + sameCount - 5
    }
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let column = 0; column < size - 1; column += 1) {
      const count = Number(modules[row][column]) + Number(modules[row + 1][column])
        + Number(modules[row][column + 1]) + Number(modules[row + 1][column + 1])
      if (count === 0 || count === 4) score += 3
    }
  }

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size - 6; column += 1) {
      if (modules[row][column] && !modules[row][column + 1] && modules[row][column + 2]
        && modules[row][column + 3] && modules[row][column + 4] && !modules[row][column + 5]
        && modules[row][column + 6]) score += 40
    }
  }
  for (let column = 0; column < size; column += 1) {
    for (let row = 0; row < size - 6; row += 1) {
      if (modules[row][column] && !modules[row + 1][column] && modules[row + 2][column]
        && modules[row + 3][column] && modules[row + 4][column] && !modules[row + 5][column]
        && modules[row + 6][column]) score += 40
    }
  }

  const dark = modules.reduce((total, row) => total + row.filter(Boolean).length, 0)
  score += Math.floor(Math.abs(100 * dark / (size * size) - 50) / 5) * 10
  return score
}

export function createQrMatrix(value: string, maskOverride?: number) {
  const normalized = value.trim()
  if (!normalized) throw new Error('O QR Code precisa de um endereço válido.')
  const bytes = new TextEncoder().encode(normalized)
  const version = chooseVersion(bytes.length)
  const codewords = createCodewords(normalized, version)
  if (maskOverride !== undefined) {
    if (!Number.isInteger(maskOverride) || maskOverride < 0 || maskOverride > 7) {
      throw new Error('Máscara de QR Code inválida.')
    }
    return makeMatrix(version, codewords, maskOverride, false)
  }
  let bestMask = 0
  let bestScore = Number.POSITIVE_INFINITY

  for (let mask = 0; mask < 8; mask += 1) {
    const score = lostPoint(makeMatrix(version, codewords, mask, true))
    if (score < bestScore) {
      bestMask = mask
      bestScore = score
    }
  }
  return makeMatrix(version, codewords, bestMask, false)
}
