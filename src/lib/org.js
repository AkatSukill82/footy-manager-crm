/**
 * organization_id (= id du groupe) de l'utilisateur courant, mis en cache au
 * niveau module pour que les créations d'entités le rattachent automatiquement
 * au groupe (partage en temps réel). Alimenté par useCurrentUser.
 */
let _orgId = null;

export function setCurrentOrgId(id) { _orgId = id ?? null; }
export function getCurrentOrgId() { return _orgId; }

/**
 * Ajoute organization_id (du groupe) à un payload de création.
 * Si l'utilisateur n'est dans aucun groupe → organization_id reste null (privé).
 * Une valeur déjà présente dans `data` n'est pas écrasée.
 */
export function withOrg(data = {}) {
  return { organization_id: _orgId, ...data };
}
