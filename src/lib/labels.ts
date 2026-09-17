import type { AnswerField, Catalog, Explanation } from '@/engine'
import { da } from '@/i18n/da'
import { interpolate, joinList } from '@/lib/text'
import type { Appearance, Level, Range, StructureKey } from '@/schema'

/** Danish label for an answer id of the given tier field. */
export function answerLabel(field: AnswerField, id: string, catalog: Catalog): string {
  switch (field) {
    case 'climate':
      return da.climate[id as keyof typeof da.climate] ?? id
    case 'grapeId':
      return safe(() => catalog.grape(id).name, id)
    case 'countryId':
    case 'regionId':
      return safe(() => catalog.region(id).name, id)
    case 'styleId':
      return safe(() => catalog.style(id).name, id)
  }
}

/** Search text for autocomplete: name plus aliases for grapes. */
export function answerSearchText(field: AnswerField, id: string, catalog: Catalog): string {
  if (field === 'grapeId') {
    const grape = catalog.grape(id)
    return [grape.name, ...grape.aliases].join(' ')
  }
  return answerLabel(field, id, catalog)
}

export function levelLabel(attribute: StructureKey, level: Level): string {
  const scale = attribute === 'sweetness' ? da.sweetnessScale : da.scale
  return scale[level as keyof typeof scale] ?? String(level)
}

export function rangeLabel(attribute: StructureKey, range: Range): string {
  const [min, max] = range
  if (min === max) return levelLabel(attribute, min)
  return interpolate(da.result.explanation.rangeTo, {
    min: levelLabel(attribute, min),
    max: levelLabel(attribute, max),
  })
}

export function appearanceLabel(appearance: Appearance): string {
  return da.appearance[appearance]
}

/** Turns a structured explanation into one Danish sentence. */
export function explanationText(
  explanation: Explanation,
  correctName: string,
  guessedName: string,
  catalog: Catalog,
): string {
  switch (explanation.kind) {
    case 'attribute':
      return interpolate(da.result.explanation.attribute, {
        attribute: da.attribute[explanation.attribute],
        value: levelLabel(explanation.attribute, explanation.caseValue),
        correct: correctName,
        correctRange: rangeLabel(explanation.attribute, explanation.correctRange),
        guessed: guessedName,
        guessedRange: rangeLabel(explanation.attribute, explanation.guessedRange),
      })
    case 'appearance':
      return interpolate(da.result.explanation.appearance, {
        value: appearanceLabel(explanation.caseValue),
        guessed: guessedName,
        guessed_value: appearanceLabel(explanation.guessedAppearance),
      })
    case 'descriptors':
      return interpolate(da.result.explanation.descriptors, {
        list: joinList(
          explanation.descriptorIds.map((id) => catalog.descriptor(id).name.toLowerCase()),
          da.result.explanation.listAnd,
        ),
        guessed: guessedName,
      })
  }
}

function safe(lookup: () => string, fallback: string): string {
  try {
    return lookup()
  } catch {
    return fallback
  }
}
