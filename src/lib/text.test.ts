import { interpolate, joinList, normalize } from './text'

describe('interpolate', () => {
  it('replaces known keys and leaves unknown ones', () => {
    expect(interpolate('{a} og {b} og {c}', { a: 1, b: 'to' })).toBe('1 og to og {c}')
  })
})

describe('normalize', () => {
  it('strips accents and case', () => {
    expect(normalize('  Rías Baixas ')).toBe('rias baixas')
    expect(normalize('Gewürztraminer')).toBe('gewurztraminer')
  })
})

describe('joinList', () => {
  it('joins with commas and a final conjunction', () => {
    expect(joinList([], 'og')).toBe('')
    expect(joinList(['a'], 'og')).toBe('a')
    expect(joinList(['a', 'b'], 'og')).toBe('a og b')
    expect(joinList(['a', 'b', 'c'], 'og')).toBe('a, b og c')
  })
})
