export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export const categories: Category[] = [
  { id: 'animals',     name: 'בעלי חיים', emoji: '🐾' },
  { id: 'professions', name: 'מקצועות',   emoji: '💼' },
  { id: 'countries',   name: 'מדינות',    emoji: '🌍' },
  { id: 'foods',       name: 'אוכל',      emoji: '🍽️' },
  { id: 'sports',      name: 'ספורט',     emoji: '⚽' },
];
