import { useId, useState } from 'react'
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

/** Free-text answer with a filtered list. Selecting an item sets the answer; editing clears it. */
export function Autocomplete({ options, value, onChange, maxResults = 8 }: AutocompleteProps) {
  const listId = useId()
  const selected = options.find((o) => o.id === value) ?? null
  const [query, setQuery] = useState(selected?.label ?? '')

  const needle = normalize(query)
  const matches =
    needle.length === 0 || selected
      ? []
      : options.filter((o) => normalize(o.searchText).includes(needle)).slice(0, maxResults)

  return (
    <div className="space-y-2">
      <input
        type="text"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={da.autocomplete.placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (selected) onChange(null)
        }}
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
          {matches.map((option) => (
            <li key={option.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => {
                  setQuery(option.label)
                  onChange(option.id)
                }}
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
