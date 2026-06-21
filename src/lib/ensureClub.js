import { base44, invokeFn } from "@/api/base44Client";
import { withOrg } from "./org";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/**
 * S'assure qu'un club existe en base pour le nom donné. S'il n'existe pas, le
 * crée avec un enrichissement web (Transfermarkt / FotMob / site officiel).
 *
 * Le champ `pays` est REQUIS par l'entité Club : si l'enrichissement ne le
 * trouve pas, on n'invente pas → on ne crée pas (le club restera à ajouter
 * manuellement). Best-effort, non bloquant pour l'ajout du joueur.
 *
 * @returns le club (existant ou créé) ou null.
 */
export async function ensureClubForPlayer(clubName) {
  const name = (clubName || "").trim();
  if (!name) return null;

  // 1) Déjà présent ? (exact puis insensible à la casse/accents)
  try {
    const exact = await base44.entities.Club.filter({ nom: name });
    if (exact && exact.length) return exact[0];
    const all = await base44.entities.Club.list("-created_date", 500);
    const hit = (all || []).find((c) => norm(c.nom) === norm(name));
    if (hit) return hit;
  } catch {
    // on tentera quand même la création
  }

  // 2) Enrichissement (pays requis + infos clés)
  let info = {};
  try {
    info = (await base44.integrations.Core.InvokeLLM({
      prompt: `Informations factuelles sur le club de football "${name}".
Sources fiables : Transfermarkt, site officiel, Wikipédia. Ne retourne que ce qui est certain, sinon null. N'invente jamais.
- pays : pays du club, NOM COMPLET en français (ex: "Espagne") — pas un code
- ville, stade, capacite_stade (number), annee_fondation (number)
- entraineur : entraîneur principal actuel
- valeur_effectif : valeur de l'effectif en M€ selon Transfermarkt (number)
- categorie : "Elite" | "Premier plan" | "Intermédiaire" | "En développement"
- palmares : palmarès majeur (titres séparés par virgules)
- historique : description courte`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          pays:            { type: "string" },
          ville:           { type: "string" },
          stade:           { type: "string" },
          capacite_stade:  { type: "number" },
          annee_fondation: { type: "number" },
          entraineur:      { type: "string" },
          valeur_effectif: { type: "number" },
          categorie:       { type: "string", enum: ["Elite", "Premier plan", "Intermédiaire", "En développement"] },
          palmares:        { type: "string" },
          historique:      { type: "string" },
        },
      },
    })) || {};
  } catch {
    // best effort
  }

  // 3) Logo (+ pays de secours) via FotMob
  let logo_url = null;
  try {
    const res = await invokeFn("fotmobProxy", { action: "searchTeam", query: name });
    const team = res?.teams?.[0];
    if (team) logo_url = team.logo || null;
  } catch {
    // ignore
  }

  if (!info.pays) return null; // pays requis — on ne crée pas un club incomplet

  const payload = Object.fromEntries(
    Object.entries({
      nom:             name,
      pays:            info.pays,
      ville:           info.ville,
      stade:           info.stade,
      capacite_stade:  info.capacite_stade,
      annee_fondation: info.annee_fondation,
      entraineur:      info.entraineur,
      valeur_effectif: info.valeur_effectif,
      categorie:       info.categorie,
      palmares:        info.palmares,
      historique:      info.historique,
      logo_url,
    }).filter(([, v]) => v != null && v !== "")
  );

  try {
    return await base44.entities.Club.create(withOrg(payload));
  } catch {
    return null;
  }
}
