import type { Style } from '@/schema'
import { content } from './index'
import { profileGap, validateContent, type ContentBundle } from './validate'

function bundle(patch: Partial<ContentBundle>): ContentBundle {
  return { ...content, ...patch }
}

function findStyle(id: string): Style {
  const style = content.styles.find((s) => s.id === id)
  if (!style) throw new Error(`missing fixture style ${id}`)
  return structuredClone(style)
}

function messagesFor(result: ReturnType<typeof validateContent>, where: string) {
  return result.errors.filter((e) => e.where === where).map((e) => e.message)
}

describe('validateContent', () => {
  it('reports schema violations with item id and path', () => {
    const broken = findStyle('barolo')
    broken.profile.acidity = [5, 1]
    const result = validateContent(
      bundle({ styles: [...content.styles, { ...broken, id: 'bad' }] }),
    )
    expect(messagesFor(result, 'style:bad')).toEqual([expect.stringContaining('profile.acidity')])
  })

  it('rejects duplicate ids', () => {
    const result = validateContent(bundle({ styles: [...content.styles, findStyle('barolo')] }))
    expect(messagesFor(result, 'style:barolo')).toContain('duplicate id')
  })

  it('rejects dangling references', () => {
    const broken = findStyle('barolo')
    broken.id = 'dangling'
    broken.grapeIds = ['nope']
    broken.regionId = 'nowhere'
    broken.descriptorIds = ['rose', 'tar', 'unicorn']
    const result = validateContent(bundle({ styles: [...content.styles, broken] }))
    expect(messagesFor(result, 'style:dangling')).toEqual(
      expect.arrayContaining([
        'unknown grape "nope"',
        'unknown region "nowhere"',
        'unknown descriptor "unicorn"',
      ]),
    )
  })

  it('requires tannin on reds and forbids it on whites', () => {
    const red = findStyle('barolo')
    red.id = 'red-no-tannin'
    red.profile.tannin = null
    const white = findStyle('sancerre')
    white.id = 'white-with-tannin'
    white.profile.tannin = [3, 3]
    const result = validateContent(bundle({ styles: [...content.styles, red, white] }))
    expect(messagesFor(result, 'style:red-no-tannin')).toContain(
      'red styles must have a tannin range',
    )
    expect(messagesFor(result, 'style:white-with-tannin')).toContain(
      'white styles must have tannin: null',
    )
  })

  it('rejects appearance/colour and grape/colour mismatches', () => {
    const broken = findStyle('sancerre')
    broken.id = 'mismatch'
    broken.profile.appearance = 'ruby'
    broken.grapeIds = ['pinot-noir']
    const result = validateContent(bundle({ styles: [...content.styles, broken] }))
    expect(messagesFor(result, 'style:mismatch')).toEqual(
      expect.arrayContaining([
        'appearance "ruby" does not match color "white"',
        'white style uses red grape "pinot-noir"',
      ]),
    )
  })

  it('rejects broken region hierarchies', () => {
    const regions = structuredClone(content.regions)
    const chablis = regions.find((r) => r.id === 'chablis')!
    chablis.parentId = 'barolo' // appellation under appellation
    regions.push({
      ...chablis,
      id: 'orphan',
      parentId: 'missing-parent',
    })
    const result = validateContent(bundle({ regions }))
    expect(messagesFor(result, 'region:chablis')).toContain(
      'parent "barolo" (appellation) must be above appellation',
    )
    expect(messagesFor(result, 'region:orphan')).toContain(
      'parentId "missing-parent" is not a known region',
    )
  })

  it('warns about near-identical styles instead of failing', () => {
    const twin = findStyle('barolo')
    twin.id = 'barolo-twin'
    const result = validateContent(bundle({ styles: [...content.styles, twin] }))
    expect(result.errors).toEqual([])
    expect(result.warnings).toContainEqual({
      where: 'style:barolo',
      message: expect.stringContaining('near-identical profile to "barolo-twin"'),
    })
  })

  it('counts verified items', () => {
    const result = validateContent(content)
    expect(result.stats.styles.total).toBe(content.styles.length)
    expect(result.stats.styles.verified).toBe(content.styles.filter((s) => s.verified).length)
  })
})

describe('profileGap', () => {
  it('is 0 for identical profiles and grows with endpoint differences', () => {
    const a = findStyle('barolo')
    const b = findStyle('barolo')
    expect(profileGap(a, b)).toBe(0)
    b.profile.acidity = [4, 5]
    expect(profileGap(a, b)).toBe(1)
    b.profile.appearance = 'ruby'
    expect(profileGap(a, b)).toBe(3)
  })

  it('is infinite when only one side has tannin', () => {
    const red = findStyle('barolo')
    const white = findStyle('sancerre')
    expect(profileGap(red, white)).toBe(Number.POSITIVE_INFINITY)
  })
})
