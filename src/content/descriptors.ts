import type { Descriptor } from '@/schema'

/**
 * Controlled aroma/flavour vocabulary. Ids are English kebab-case, names are Danish UI labels.
 * Clusters follow the WSET Level 3 aroma lattice loosely.
 */
export const descriptors: Descriptor[] = [
  // Citrus
  { id: 'lemon', name: 'Citron', cluster: 'citrus', stage: 'primary' },
  { id: 'lime', name: 'Lime', cluster: 'citrus', stage: 'primary' },
  { id: 'grapefruit', name: 'Grapefrugt', cluster: 'citrus', stage: 'primary' },
  { id: 'orange-peel', name: 'Appelsinskal', cluster: 'citrus', stage: 'primary' },

  // Green fruit
  { id: 'green-apple', name: 'Grønt æble', cluster: 'green-fruit', stage: 'primary' },
  { id: 'pear', name: 'Pære', cluster: 'green-fruit', stage: 'primary' },
  { id: 'gooseberry', name: 'Stikkelsbær', cluster: 'green-fruit', stage: 'primary' },
  { id: 'grape', name: 'Drue', cluster: 'green-fruit', stage: 'primary' },
  { id: 'quince', name: 'Kvæde', cluster: 'green-fruit', stage: 'primary' },

  // Stone fruit
  { id: 'peach', name: 'Fersken', cluster: 'stone-fruit', stage: 'primary' },
  { id: 'apricot', name: 'Abrikos', cluster: 'stone-fruit', stage: 'primary' },
  { id: 'nectarine', name: 'Nektarin', cluster: 'stone-fruit', stage: 'primary' },

  // Tropical
  { id: 'pineapple', name: 'Ananas', cluster: 'tropical', stage: 'primary' },
  { id: 'mango', name: 'Mango', cluster: 'tropical', stage: 'primary' },
  { id: 'passion-fruit', name: 'Passionsfrugt', cluster: 'tropical', stage: 'primary' },
  { id: 'melon', name: 'Melon', cluster: 'tropical', stage: 'primary' },
  { id: 'banana', name: 'Banan', cluster: 'tropical', stage: 'primary' },
  { id: 'lychee', name: 'Litchi', cluster: 'tropical', stage: 'primary' },

  // Red fruit
  { id: 'strawberry', name: 'Jordbær', cluster: 'red-fruit', stage: 'primary' },
  { id: 'raspberry', name: 'Hindbær', cluster: 'red-fruit', stage: 'primary' },
  { id: 'red-cherry', name: 'Rødt kirsebær', cluster: 'red-fruit', stage: 'primary' },
  { id: 'cranberry', name: 'Tranebær', cluster: 'red-fruit', stage: 'primary' },
  { id: 'red-plum', name: 'Rød blomme', cluster: 'red-fruit', stage: 'primary' },
  { id: 'redcurrant', name: 'Ribs', cluster: 'red-fruit', stage: 'primary' },

  // Black fruit
  { id: 'blackcurrant', name: 'Solbær', cluster: 'black-fruit', stage: 'primary' },
  { id: 'blackberry', name: 'Brombær', cluster: 'black-fruit', stage: 'primary' },
  { id: 'black-cherry', name: 'Sort kirsebær', cluster: 'black-fruit', stage: 'primary' },
  { id: 'black-plum', name: 'Sort blomme', cluster: 'black-fruit', stage: 'primary' },
  { id: 'blueberry', name: 'Blåbær', cluster: 'black-fruit', stage: 'primary' },

  // Floral
  { id: 'rose', name: 'Rose', cluster: 'floral', stage: 'primary' },
  { id: 'violet', name: 'Viol', cluster: 'floral', stage: 'primary' },
  { id: 'elderflower', name: 'Hyldeblomst', cluster: 'floral', stage: 'primary' },
  { id: 'orange-blossom', name: 'Appelsinblomst', cluster: 'floral', stage: 'primary' },
  { id: 'honeysuckle', name: 'Kaprifolie', cluster: 'floral', stage: 'primary' },
  { id: 'acacia', name: 'Akacie', cluster: 'floral', stage: 'primary' },

  // Herbal / green
  { id: 'green-bell-pepper', name: 'Grøn peberfrugt', cluster: 'herbal', stage: 'primary' },
  { id: 'grass', name: 'Nyslået græs', cluster: 'herbal', stage: 'primary' },
  { id: 'mint', name: 'Mynte', cluster: 'herbal', stage: 'primary' },
  { id: 'eucalyptus', name: 'Eukalyptus', cluster: 'herbal', stage: 'primary' },
  { id: 'tomato-leaf', name: 'Tomatblad', cluster: 'herbal', stage: 'primary' },
  { id: 'dried-herbs', name: 'Tørrede krydderurter', cluster: 'herbal', stage: 'primary' },
  { id: 'thyme', name: 'Timian', cluster: 'herbal', stage: 'primary' },
  { id: 'dill', name: 'Dild', cluster: 'herbal', stage: 'secondary' },
  { id: 'fennel', name: 'Fennikel', cluster: 'herbal', stage: 'primary' },

  // Spice
  { id: 'black-pepper', name: 'Sort peber', cluster: 'spice', stage: 'primary' },
  { id: 'white-pepper', name: 'Hvid peber', cluster: 'spice', stage: 'primary' },
  { id: 'liquorice', name: 'Lakrids', cluster: 'spice', stage: 'primary' },
  { id: 'ginger', name: 'Ingefær', cluster: 'spice', stage: 'primary' },
  { id: 'clove', name: 'Nellike', cluster: 'spice', stage: 'secondary' },
  { id: 'cinnamon', name: 'Kanel', cluster: 'spice', stage: 'secondary' },

  // Oak (secondary)
  { id: 'vanilla', name: 'Vanilje', cluster: 'oak', stage: 'secondary' },
  { id: 'toast', name: 'Ristet brød', cluster: 'oak', stage: 'secondary' },
  { id: 'smoke', name: 'Røg', cluster: 'oak', stage: 'secondary' },
  { id: 'coconut', name: 'Kokos', cluster: 'oak', stage: 'secondary' },
  { id: 'cedar', name: 'Ceder', cluster: 'oak', stage: 'secondary' },
  { id: 'chocolate', name: 'Chokolade', cluster: 'oak', stage: 'secondary' },
  { id: 'coffee', name: 'Kaffe', cluster: 'oak', stage: 'secondary' },

  // Earth (tertiary)
  { id: 'forest-floor', name: 'Skovbund', cluster: 'earth', stage: 'tertiary' },
  { id: 'mushroom', name: 'Svamp', cluster: 'earth', stage: 'tertiary' },
  { id: 'leather', name: 'Læder', cluster: 'earth', stage: 'tertiary' },
  { id: 'tobacco', name: 'Tobak', cluster: 'earth', stage: 'tertiary' },
  { id: 'tar', name: 'Tjære', cluster: 'earth', stage: 'tertiary' },

  // Mineral
  { id: 'flint', name: 'Flint', cluster: 'mineral', stage: 'primary' },
  { id: 'wet-stone', name: 'Våd sten', cluster: 'mineral', stage: 'primary' },
  { id: 'chalk', name: 'Kridt', cluster: 'mineral', stage: 'primary' },
  { id: 'saline', name: 'Salt / hav', cluster: 'mineral', stage: 'primary' },
  { id: 'petrol', name: 'Petroleum', cluster: 'mineral', stage: 'tertiary' },

  // Other
  { id: 'butter', name: 'Smør', cluster: 'other', stage: 'secondary' },
  { id: 'brioche', name: 'Brioche', cluster: 'other', stage: 'secondary' },
  { id: 'honey', name: 'Honning', cluster: 'other', stage: 'tertiary' },
  { id: 'nuts', name: 'Nødder', cluster: 'other', stage: 'tertiary' },
  { id: 'almond', name: 'Mandel', cluster: 'other', stage: 'primary' },
  { id: 'bacon', name: 'Bacon', cluster: 'other', stage: 'primary' },
  { id: 'dried-fruit', name: 'Tørret frugt', cluster: 'other', stage: 'tertiary' },
  { id: 'wax', name: 'Voks', cluster: 'other', stage: 'tertiary' },
]
