import { getDefaultCategories } from './categories.js';
import type { Category } from './types.js';

export interface CustomCategoryInput {
  id?: string;
  name?: string;
  emoji?: string;
  items?: string[];
}

const DEFAULT_CUSTOM_EMOJI = '✨';

function sanitizeText(value: string | undefined): string {
  return value?.trim() ?? '';
}

function ensureCustomCategoryId(inputId: string | undefined, index: number): string {
  const normalized = sanitizeText(inputId)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (normalized) return normalized.startsWith('custom-') ? normalized : `custom-${normalized}`;
  return `custom-${Date.now()}-${index}`;
}

export function buildAvailableCategories(customCategories: CustomCategoryInput[] = []): Category[] {
  const builtInCategories = getDefaultCategories();
  const normalizedCustomCategories = customCategories.map((category, index) => {
    const name = sanitizeText(category.name);
    const items = (category.items ?? [])
      .map(item => sanitizeText(item))
      .filter(Boolean);

    return {
      id: ensureCustomCategoryId(category.id, index),
      name,
      emoji: sanitizeText(category.emoji) || DEFAULT_CUSTOM_EMOJI,
      isCustom: true,
      items: items.map((itemName, itemIndex) => ({
        id: `custom-item-${index}-${itemIndex}-${itemName.toLowerCase().replace(/\s+/g, '-')}`,
        name: itemName,
      })),
    } satisfies Category;
  });

  return [...builtInCategories, ...normalizedCustomCategories];
}

export function validateCategorySettings(
  selectedCategoryIds: string[] | undefined,
  customCategories: CustomCategoryInput[] | undefined,
): { availableCategories: Category[]; selectedCategoryIds: string[] } | { error: string } {
  const availableCategories = buildAvailableCategories(customCategories ?? []);

  for (const category of availableCategories.filter(category => category.isCustom)) {
    if (!category.name) return { error: 'לכל קטגוריה מותאמת חייב להיות שם' };
    if (category.items.length === 0) return { error: `הקטגוריה "${category.name}" חייבת לכלול לפחות מילה אחת` };
  }

  const availableIds = new Set(availableCategories.map(category => category.id));
  const normalizedSelectedIds = (selectedCategoryIds ?? [])
    .map(id => sanitizeText(id))
    .filter(Boolean);
  const uniqueSelectedIds = [...new Set(normalizedSelectedIds)];

  if (uniqueSelectedIds.length === 0) return { error: 'צריך לבחור לפחות קטגוריה אחת למשחק' };
  if (uniqueSelectedIds.some(id => !availableIds.has(id))) return { error: 'נשלחו קטגוריות לא חוקיות' };

  return {
    availableCategories,
    selectedCategoryIds: uniqueSelectedIds,
  };
}
