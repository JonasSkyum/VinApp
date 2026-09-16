import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Autocomplete } from './Autocomplete'

const options = [
  { id: 'sancerre', label: 'Sancerre', searchText: 'sancerre sauvignon blanc' },
  { id: 'chablis', label: 'Chablis', searchText: 'chablis chardonnay' },
  { id: 'barolo', label: 'Barolo', searchText: 'barolo nebbiolo' },
]

function Harness({ onChange }: { onChange: (id: string | null) => void }) {
  const [value, setValue] = useState<string | null>(null)
  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(id) => {
        setValue(id)
        onChange(id)
      }}
    />
  )
}

describe('Autocomplete', () => {
  it('picks the highlighted match with arrow keys and Enter', async () => {
    const u = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = screen.getByRole('combobox')
    await u.type(input, 'a')
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.getByRole('option', { name: 'Sancerre' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await u.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('option', { name: 'Barolo' })).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Barolo' }).id,
    )
    await u.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('barolo')
    expect(input).toHaveValue('Barolo')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clears the answer when the text is edited again', async () => {
    const u = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await u.type(screen.getByRole('combobox'), 'chab')
    await u.click(screen.getByRole('button', { name: 'Chablis' }))
    expect(onChange).toHaveBeenLastCalledWith('chablis')
    await u.type(screen.getByRole('combobox'), 'x')
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
