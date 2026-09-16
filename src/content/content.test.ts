import { content } from './index'
import { validateContent } from './validate'

describe('content', () => {
  const result = validateContent(content)

  it('has no validation errors', () => {
    expect(result.errors).toEqual([])
  })

  it('covers every grape with at least one style', () => {
    const unused = result.warnings.filter((w) => w.message === 'not used by any style')
    expect(unused).toEqual([])
  })
})
