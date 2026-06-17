/**
 * Cache local (localStorage) pour les recherches et profils joueurs.
 *
 * Objectifs :
 *  - Recherche instantanée pour un joueur déjà consulté.
 *  - Résilience : si une source tombe (403/500/timeout), on ressert la
 *    dernière donnée connue ("stale") au lieu d'échouer.
 *
 * Chaque entrée stocke { ts, data }. `fresh` = moins de TTL_MS.
 */

const PREFIX = "fdm_cache_";
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours
const MAX_ENTRIES = 200;               // garde-fou contre le quota localStorage

const key = (k) => PREFIX + k;

/** Retourne { data, fresh } ou null si absent / illisible. */
export function getCache(k) {
  try {
    const raw = localStorage.getItem(key(k));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== "number") return null;
    return { data: parsed.data, fresh: Date.now() - parsed.ts < TTL_MS };
  } catch {
    return null;
  }
}

/** Enregistre une entrée. Échec silencieux si quota dépassé (on purge alors). */
export function setCache(k, data) {
  try {
    localStorage.setItem(key(k), JSON.stringify({ ts: Date.now(), data }));
    pruneIfNeeded();
  } catch {
    // Quota plein → purge agressive puis nouvelle tentative unique
    try {
      purgeOldest(Math.floor(MAX_ENTRIES / 2));
      localStorage.setItem(key(k), JSON.stringify({ ts: Date.now(), data }));
    } catch {
      /* on abandonne silencieusement — le cache est un bonus, pas un requis */
    }
  }
}

function allCacheKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const sk = localStorage.key(i);
    if (sk && sk.startsWith(PREFIX)) keys.push(sk);
  }
  return keys;
}

function pruneIfNeeded() {
  const keys = allCacheKeys();
  if (keys.length > MAX_ENTRIES) purgeOldest(keys.length - MAX_ENTRIES);
}

/** Supprime les `n` entrées les plus anciennes. */
function purgeOldest(n) {
  const entries = allCacheKeys()
    .map((sk) => {
      let ts = 0;
      try { ts = JSON.parse(localStorage.getItem(sk)).ts || 0; } catch { /* ignore */ }
      return { sk, ts };
    })
    .sort((a, b) => a.ts - b.ts);
  entries.slice(0, n).forEach((e) => localStorage.removeItem(e.sk));
}

/** Normalise une requête en clé stable (minuscules, espaces réduits). */
export function normalizeQuery(q) {
  return (q || "").trim().toLowerCase().replace(/\s+/g, " ");
}
