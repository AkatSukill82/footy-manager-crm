import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

/**
 * Appelle une fonction serverless Base44 et renvoie TOUJOURS le corps réel.
 *
 * Le SDK Base44 enveloppe parfois la réponse dans `{ data: <body> }` selon la
 * version / le transport. Lire `res.players` directement renvoyait alors
 * `undefined` (bug "aucun joueur trouvé"). Ce helper déballe systématiquement.
 *
 * Utilisez-le partout au lieu de `base44.functions.invoke(...)` pour les
 * fonctions qui renvoient du JSON applicatif.
 */
export async function invokeFn(name, payload = {}) {
  const res = await base44.functions.invoke(name, payload);
  if (res && typeof res === 'object' && 'data' in res && res.data && typeof res.data === 'object') {
    return res.data;
  }
  return res;
}
