import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, saveSession } from '../_lib/kv.js';
import { pusher } from '../_lib/pusher.js';
import { validateCategorySettings } from '../_lib/sessionSettings.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    sessionCode,
    playerId,
    selectedCategoryIds,
    customCategories,
  } = req.body as {
    sessionCode?: string;
    playerId?: string;
    selectedCategoryIds?: string[];
    customCategories?: Array<{ id?: string; name?: string; emoji?: string; items?: string[] }>;
  };

  const session = await getSession(sessionCode ?? '');
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });
  if (session.phase !== 'lobby') return res.status(400).json({ error: 'אי אפשר לשנות הגדרות אחרי שהמשחק התחיל' });
  if (session.initiatorId !== playerId) return res.status(403).json({ error: 'רק מארגן המשחק יכול לשנות הגדרות' });

  const validation = validateCategorySettings(selectedCategoryIds, customCategories);
  if ('error' in validation) return res.status(400).json({ error: validation.error });

  session.availableCategories = validation.availableCategories;
  session.selectedCategoryIds = validation.selectedCategoryIds;
  await saveSession(session);

  await pusher.trigger(`presence-session-${session.code}`, 'SETTINGS_UPDATED', {
    availableCategories: session.availableCategories,
    selectedCategoryIds: session.selectedCategoryIds,
  });

  return res.status(200).json({
    ok: true,
    availableCategories: session.availableCategories,
    selectedCategoryIds: session.selectedCategoryIds,
  });
}
