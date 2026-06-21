/**
 * Contexte de groupe de l'utilisateur courant, mis en cache au niveau module.
 *
 * Modèle de partage : SEUL le CEO (chef = créateur du groupe) partage ses
 * données avec le groupe. Les données des membres restent PRIVÉES.
 * → withOrg ne marque organization_id QUE si l'utilisateur est le chef.
 *
 * Alimenté par useCurrentUser.
 */
let _orgId = null;
let _isChef = false;

export function setCurrentOrg(orgId, isChef) {
  _orgId = orgId ?? null;
  _isChef = !!isChef;
}
export function getCurrentOrgId() { return _orgId; }
export function isCurrentChef() { return _isChef; }

/**
 * Ajoute organization_id à un payload de création — UNIQUEMENT pour le chef
 * (CEO). Pour un membre, organization_id reste null → donnée privée.
 * Une valeur déjà présente dans `data` n'est pas écrasée.
 */
export function withOrg(data = {}) {
  return { organization_id: _isChef ? _orgId : null, ...data };
}
