/**
 * Contexte de groupe de l'utilisateur courant, mis en cache au niveau module.
 *
 * Modèle de partage : PARTAGE TOTAL dans le groupe. TOUT membre d'un groupe
 * partage ses données avec l'ensemble du groupe (création/modification visibles
 * par tous). Les règles RLS (read/update/delete) matchent sur organization_id,
 * donc chaque membre peut lire ET modifier les données du groupe.
 * → withOrg marque organization_id dès que l'utilisateur appartient à un groupe.
 *   Un utilisateur SANS groupe (_orgId null) reste privé (solo).
 *
 * Alimenté par useCurrentUser. (_isChef conservé pour l'UI « Mon organisation ».)
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
 * Ajoute organization_id à un payload de création pour TOUT membre du groupe
 * → la donnée est partagée avec l'ensemble du groupe. Sans groupe, reste null
 * (privé). Une valeur déjà présente dans `data` n'est pas écrasée.
 */
export function withOrg(data = {}) {
  return { organization_id: _orgId, ...data };
}
