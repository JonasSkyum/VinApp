import { useId, useState, type KeyboardEvent } from 'react'
import { da } from '@/i18n/da'
import { normalize } from '@/lib/text'

export interface AutocompleteOption {
  id: string
  label: string
  /** Extra text matched by search, e.g. grape aliases. */
  searchText: string
}

interface AutocompleteProps {
  options: AutocompleteOption[]
  value: string | null
  onChange: (id: string | null) => void
  maxResults?: number
}

/**
 * Free-text answer with a filtered list. Selecting an item sets the answer; editing clears it.
 * Arrow keys move through the list and Enter picks the highlighted item.
 */
export function Autocomplete({ options, value, onChange, maxResults = 8 }: AutocompleteProps) {
  const listId = useId()
  const selected = options.find((o) => o.id === value) ?? null
  const [query, setQuery] = useState(selected?.label ?? '')
  const [active, setActive] = useState(0)

  const needle = normalize(query)
  const matches =
    needle.length === 0 || selected
      ? []
      : options.filter((o) => normalize(o.searchText).includes(needle)).slice(0, maxResults)
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1))
  const optionId = (i: number) => `${listId}-${i}`

  const choose = (option: AutocompleteOption) => {
    setQuery(option.label)
    onChange(option.id)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (matches.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((activeIndex + 1) % matches.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((activeIndex - 1 + matches.length) % matches.length)
        break
      case 'Enter':
        e.preventDefault()
        choose(matches[activeIndex]!)
        break
      case 'Escape':
        setQuery('')
        break
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={matches.length > 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        placeholder={da.autocomplete.placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          if (selected) onChange(null)
        }}
        onKeyDown={onKeyDown}
        className="border-wine-300 focus:border-wine-600 w-full rounded-lg border bg-white px-3 py-3 text-base outline-none"
      />
      {needle.length > 0 && !selected && (
        <ul
          id={listId}
          role="listbox"
          className="border-wine-200 divide-wine-100 divide-y rounded-lg border bg-white"
        >
          {matches.length === 0 && (
            <li className="text-wine-900/70 px-3 py-2 text-sm">{da.autocomplete.noMatches}</li>
          )}
          {matches.map((option, i) => (
            <li
              key={option.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'bg-wine-100' : ''}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => choose(option)}
                onMouseEnter={() => setActive(i)}
                className="hover:bg-wine-50 w-full px-3 py-2 text-left"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
