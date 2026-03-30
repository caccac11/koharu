import { TextBlock } from '@/types'

type ImportPayload = {
  lines: string[]
}

const parseJsonPayload = (raw: string): ImportPayload => {
  const parsed = JSON.parse(raw) as unknown
  if (Array.isArray(parsed)) {
    return {
      lines: parsed.map((line) => String(line ?? '').trim()),
    }
  }
  if (parsed && typeof parsed === 'object') {
    const objectValue = parsed as Record<string, unknown>
    const fromTranslations = objectValue.translations
    if (Array.isArray(fromTranslations)) {
      return {
        lines: fromTranslations.map((line) => String(line ?? '').trim()),
      }
    }
  }
  throw new Error('Unsupported JSON format')
}

const parseTextPayload = (raw: string): ImportPayload => ({
  lines: raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0),
})

const sortedBlockIndices = (textBlocks: TextBlock[]): number[] =>
  textBlocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const yDelta = a.block.y - b.block.y
      if (Math.abs(yDelta) > 1) return yDelta
      return a.block.x - b.block.x
    })
    .map((entry) => entry.index)

export const importTranslations = (
  textBlocks: TextBlock[],
  raw: string,
  fileName: string,
): TextBlock[] => {
  const payload = fileName.toLowerCase().endsWith('.json')
    ? parseJsonPayload(raw)
    : parseTextPayload(raw)

  const nextBlocks = textBlocks.map((block) => ({ ...block }))
  const order = sortedBlockIndices(nextBlocks)
  order.forEach((blockIndex, lineIndex) => {
    const nextLine = payload.lines[lineIndex]
    if (nextLine === undefined) return
    nextBlocks[blockIndex].translation = nextLine
  })
  return nextBlocks
}
