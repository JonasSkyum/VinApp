import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ChoiceGroup } from './ChoiceGroup'

function Harness() {
  const [value, setValue] = useState('b')
  return (
    <ChoiceGroup
      name="Niveau"
      items={[
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C', disabled: true },
        { id: 'd', label: 'D' },
      ]}
      value={value}
      onChange={setValue}
    />
  )
}

describe('ChoiceGroup', () => {
  it('moves with arrow keys, skipping disabled options and wrapping', async () => {
    const u = userEvent.setup()
    render(<Harness />)
    await u.tab()
    expect(screen.getByRole('radio', { name: 'B' })).toHaveFocus()
    await u.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'D' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'D' })).toHaveFocus()
    await u.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'A' })).toBeChecked()
    await u.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'D' })).toBeChecked()
    await u.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'B' })).toBeChecked()
  })
})
