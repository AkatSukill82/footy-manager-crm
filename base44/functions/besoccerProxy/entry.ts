/**
 * Scraper BeSoccer — première page profil joueur uniquement.
 * Pas d'API, scraping SSR de besoccer.com avec headers navigateur.
 *
 * Actions :
 *   searchPlayer        — résultats de /search/{query}
 *   getPlayer           — profil de /player/{slug}-{id}
 *   searchAndGetPlayer  — searchPlayer + getPlayer en 1 appel (pour SyncPlayerButton)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Anti-SSRF : n'autorise que les URLs BeSoccer en https.
const isBesoccerUrl = (u: string): boolean => {
  try { const x = new URL(u); return x.protocol === "https:" && (x.hostname === "besoccer.com" || x.hostname.endsWith(".besoccer.com")); }
  catch { return false; }
};

const HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Cache-Control": "no-cache",
};

const BASE = "https://www.besoccer.com";
const CDN  = "https://cdn.resfu.com";

const fetchHtml = async (url: string): Promise<string> => {
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`BeSoccer HTTP ${res.status}`);
  return res.text();
};

// ── Position : abréviation → libellé entité Player ────────────────────────────

const POS: Record<string, string> = {
  GK: "Gardien",
  CB: "Défenseur central", LCB: "Défenseur central", RCB: "Défenseur central",
  LB: "Latéral gauche",   LWB: "Latéral gauche",
  RB: "Latéral droit",    RWB: "Latéral droit",
  CDM: "Milieu défensif", DM: "Milieu défensif",
  CM: "Milieu central",   LCM: "Milieu central",  RCM: "Milieu central",
  CAM: "Milieu offensif", AM: "Milieu offensif",
  LW: "Ailier gauche",    LM: "Ailier gauche",
  RW: "Ailier droit",     RM: "Ailier droit",
  SS: "Attaquant", CF: "Attaquant", ST: "Attaquant", FW: "Attaquant",
  DF: "Défenseur central", MF: "Milieu central",
  GOALKEEPER: "Gardien",   GOALIE: "Gardien",
  DEFENDER: "Défenseur central",
  MIDFIELDER: "Milieu central",
  ATTACKER: "Attaquant",   FORWARD: "Attaquant",  STRIKER: "Attaquant",
  "LEFT WINGER": "Ailier gauche",  "RIGHT WINGER": "Ailier droit",
  "CENTRE-BACK": "Défenseur central", "FULL-BACK": "Latéral droit",
  "LEFT BACK": "Latéral gauche",   "RIGHT BACK": "Latéral droit",
  "CENTRE FORWARD": "Attaquant",   "ATTACKING MIDFIELDER": "Milieu offensif",
  "DEFENSIVE MIDFIELDER": "Milieu défensif",
};
const mapPos = (s: string): string | null => POS[s.trim().toUpperCase()] ?? null;

// ── Matcher d'identité : score nom + club + nationalité + âge ──────────────────

const STOP = new Set(["fc", "cf", "sc", "ac", "afc", "cd", "club", "de", "the", "us", "ss", "as", "ud", "rc", "sv", "if"]);
const norm = (s: string): string =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const toks = (s: string): Set<string> =>
  new Set(norm(s).split(" ").filter((t) => t.length > 1 && !STOP.has(t)));
const overlap = (a: string, b: string): number => {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return n / Math.min(A.size, B.size);
};

interface Hint { name: string; club?: string; nationality?: string; age?: number; }

const pickBest = (cands: any[], hint: Hint): { cand: any; confidence: number } | null => {
  let best: any = null, bestScore = -1, bestNameSim = 0;
  for (const c of cands) {
    const nameSim = overlap(c.nom ?? "", hint.name);
    if (nameSim < 0.5) continue;                        // le nom DOIT correspondre
    let score = nameSim * 4;
    if (hint.club && c.club_actuel) score += overlap(c.club_actuel, hint.club) * 3;
    if (hint.nationality && c.nationalite &&
        norm(c.nationalite) === norm(hint.nationality)) score += 1;
    if (hint.age && c.age && Math.abs(c.age - hint.age) <= 1) score += 2;
    if (score > bestScore) { bestScore = score; best = c; bestNameSim = nameSim; }
  }
  if (!best) return null;
  const confidence = Math.min(1, bestNameSim * 0.6 + (bestScore - bestNameSim * 4) / 6 * 0.4 + 0.1);
  return { cand: best, confidence: Math.round(confidence * 100) / 100 };
};

// ── Code pays → nationalité (adjectif) ───────────────────────────────────────

const NATIONS: Record<string, string> = {
  fr: "Français",      es: "Espagnol",     de: "Allemand",    gb: "Anglais",
  gb_eng: "Anglais",   gb_sct: "Écossais", gb_wls: "Gallois",
  it: "Italien",       pt: "Portugais",    br: "Brésilien",   ar: "Argentin",
  nl: "Néerlandais",   be: "Belge",        hr: "Croate",      sn: "Sénégalais",
  ng: "Nigérian",      cm: "Camerounais",  eg: "Égyptien",    ma: "Marocain",
  dz: "Algérien",      tn: "Tunisien",     gh: "Ghanéen",     ci: "Ivoirien",
  us: "Américain",     mx: "Mexicain",     co: "Colombien",   uy: "Uruguayen",
  cl: "Chilien",       pe: "Péruvien",     ec: "Équatorien",  pl: "Polonais",
  rs: "Serbe",         tr: "Turc",         dk: "Danois",      no: "Norvégien",
  se: "Suédois",       at: "Autrichien",   ch: "Suisse",      cz: "Tchèque",
  sk: "Slovaque",      hu: "Hongrois",     ro: "Roumain",     gr: "Grec",
  ua: "Ukrainien",     ru: "Russe",        jp: "Japonais",    kr: "Sud-Coréen",
  cn: "Chinois",       au: "Australien",   za: "Sud-Africain",
  ml: "Malien",        gn: "Guinéen",      bi: "Burundais",   cd: "Congolais",
  sl: "Sierra-Léonais", ke: "Kényan",      tz: "Tanzanien",   et: "Éthiopien",
};
const mapNat = (code: string): string => NATIONS[code.toLowerCase()] ?? code.toUpperCase();

// ── Parse page de recherche (/search/{query}) ─────────────────────────────────

const parseSearch = (html: string): any[] => {
  const results: any[] = [];
  const seen = new Set<string>();

  // Chaque carte joueur = <a href="/player/{slug}-{id}">...</a>
  // L'ID est le dernier segment numérique dans le slug
  const cardRe = /<a[^>]+href="(\/player\/[^"#?]+?-(\d{4,8}))"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = cardRe.exec(html)) !== null) {
    const path = m[1];
    const id   = m[2];
    const body = m[3];

    if (seen.has(path)) continue;
    seen.add(path);

    // Nom depuis <strong>
    const nameM = body.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
    if (!nameM) continue;
    const nom = nameM[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    if (!nom || nom.length < 2) continue;

    // Filtre les entrées placeholder
    if (/hidden|deleted|unknown/i.test(nom)) continue;

    // Spans → age (15-50), poste (abbr connu), club (texte restant)
    const spans = [...body.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
      .map(s => s[1].replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, " ").trim())
      .filter(Boolean);

    let age: number | null = null;
    let poste_abbr: string | null = null;
    let club_actuel: string | null = null;

    for (const s of spans) {
      const n = parseInt(s);
      if (!isNaN(n) && n >= 15 && n <= 50 && age === null) { age = n; continue; }
      if (POS[s.toUpperCase()]) { poste_abbr = s.toUpperCase(); continue; }
      if (s.length > 2 && !/^\d+$/.test(s) && !club_actuel) club_actuel = s;
    }

    // Nationalité depuis l'URL du drapeau
    const flagM = body.match(/flags\/(?:[^/]+\/)?([a-z_]+)\.[a-z]+/i);
    const nationalite = flagM ? mapNat(flagM[1]) : null;

    results.push({
      besoccer_url:  `${BASE}${path}`,
      besoccer_id:   id,
      nom,
      age:           (age && age >= 15 && age <= 50) ? age : null,
      nationalite,
      poste:         mapPos(poste_abbr ?? "") ?? poste_abbr ?? null,
      club_actuel:   club_actuel ?? null,
      photo_url:     `${CDN}/img_data/players/medium/${id}.jpg`,
    });

    if (results.length >= 10) break;
  }

  return results;
};

// ── Parse profil joueur (/player/{slug}-{id}) ─────────────────────────────────

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
};

const parseProfile = (html: string, url: string, id: string): Record<string, any> => {
  const d: Record<string, any> = {};

  const grab = (re: RegExp): string | null => {
    const m = html.match(re);
    return m ? (m[1] ?? "").replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, " ").trim() || null : null;
  };
  const grabInt = (re: RegExp): number | null => {
    const s = grab(re); if (!s) return null;
    const n = parseInt(s.replace(/[^\d]/g, ""));
    return isNaN(n) ? null : n;
  };
  const grabFloat = (re: RegExp): number | null => {
    const s = grab(re); if (!s) return null;
    const n = parseFloat(s.replace(/[^\d.]/g, ""));
    return isNaN(n) ? null : n;
  };

  // Nom (h1 = nom court ; retire un éventuel numéro de maillot en tête)
  d.nom = (grab(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || "")
    .replace(/^\s*(?:#|n[°ºo.]?\s*)?\d{1,3}\s+(?=\D)/i, "").trim() || null;

  // Nom complet
  const fullM = html.match(/<p[^>]*>\s*([A-Z][a-záàâäéèêëíìîïóòôöúùûü''\- ]{8,60}?)\s*<\/p>/i) ||
                html.match(/full\s*name[^>]*>?:?\s*([\w\s.'\-]{8,60}?)(?:<|\n)/i);
  if (fullM) {
    const fn = fullM[1].replace(/<[^>]+>/g, "").trim();
    if (fn && fn !== d.nom && fn.split(" ").length >= 2) d.nom_complet = fn;
  }

  // Age
  const ageM = html.match(/(\d{1,2})\s+years?\b/i);
  if (ageM) { const a = parseInt(ageM[1]); if (a >= 14 && a <= 50) d.age = a; }

  // Date de naissance : "20 December 1998" → "1998-12-20"
  const birthM = html.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
  if (birthM) {
    const mm = MONTHS[birthM[2].toLowerCase()];
    d.date_naissance = `${birthM[3]}-${mm}-${birthM[1].padStart(2, "0")}`;
  }

  // Lieu de naissance : "in París"
  const placeM = html.match(/\bin\s+([A-ZÀ-Ý][a-zA-ZÀ-ÿ\s\-]{2,30}?)(?:<|,|\(|\d)/);
  if (placeM) d.lieu_naissance = placeM[1].trim();

  // Nationalités (2 drapeaux max)
  const flagCodes: string[] = [];
  const flagRe = /flags\/(?:[^/]+\/)?([a-z_]+)\.[a-z]+/gi;
  let fm: RegExpExecArray | null;
  while ((fm = flagRe.exec(html)) !== null) {
    const c = fm[1];
    if (!flagCodes.includes(c) && c.length <= 8 && c !== "world") flagCodes.push(c);
    if (flagCodes.length >= 2) break;
  }
  if (flagCodes[0]) d.nationalite             = mapNat(flagCodes[0]);
  if (flagCodes[1]) d.nationalite_secondaire   = mapNat(flagCodes[1]);

  // Physique
  const hM = html.match(/(\d{3})\s*cms?\b/i); if (hM) d.taille = parseInt(hM[1]);
  const wM = html.match(/(\d{2,3})\s*kgs?\b/i); if (wM) d.poids = parseInt(wM[1]);
  const footM = html.match(/(Right|Left)\s+foot/i);
  if (footM) d.pied_fort = footM[1] === "Right" ? "Droit" : "Gauche";

  // Club (lien /team/)
  const clubLinkM = html.match(/href="\/team\/([^"]+)"[^>]*>\s*(?:<[^>]+>)*\s*([A-Z][^<\n]{2,40}?)\s*(?:<|$)/im);
  if (clubLinkM) d.club_actuel = clubLinkM[2].replace(/<[^>]+>/g, "").trim();

  // Ligue (lien /competition/)
  const leagM = html.match(/href="\/competition\/[^"]*"[^>]*>\s*(?:<[^>]+>)*\s*([A-Z][^<\n]{2,40}?)\s*(?:<|$)/im);
  if (leagM) d.ligue = leagM[1].replace(/<[^>]+>/g, "").trim();

  // Poste — abbrev d'abord, puis libellé anglais
  const posAbbrM = html.match(/\b(GK|CB|LB|RB|CDM|CM|CAM|LW|RW|CF|ST|DM|AM|LM|RM|LWB|RWB|LCB|RCB|FW)\b/);
  if (posAbbrM) d.poste = mapPos(posAbbrM[1]) ?? posAbbrM[1];
  if (!d.poste) {
    const posFullM = html.match(/\b(Goalkeeper|Defender|Midfielder|Attacker|Forward|Striker|Left winger|Right winger|Centre-back|Centre forward|Attacking midfielder|Defensive midfielder)\b/i);
    if (posFullM) d.poste = mapPos(posFullM[1]) ?? posFullM[1];
  }

  // Numéro de maillot (chiffre 1–99 précédé/suivi d'un label pertinent)
  const numM = html.match(/(?:shirt|jersey|dorsal|n[uú]mero|number)[^>]*[:\s]*>?\s*(\d{1,2})\b/i);
  if (numM) d.numero_maillot = parseInt(numM[1]);

  // Valeur marchande : "221.87 M.€" OU "€221.87 Million"
  const mvM = html.match(/(\d+(?:[.,]\d+)?)\s*M\.?€/i) ||
              html.match(/€\s*(\d+(?:[.,]\d+)?)\s*[Mm]illion/i);
  if (mvM) d.valeur_marchande = parseFloat(mvM[1].replace(",", "."));

  // Fin de contrat (DD/MM/YYYY)
  const contratM = html.match(/(?:Contract\s*End|expiry|Fin\s*contrat)[^>]*?(\d{1,2})\/(\d{1,2})\/(\d{4})/i) ||
                   html.match(/(\d{1,2})\/06\/(\d{4})/i); // contrats footballeurs : fin juin
  if (contratM) {
    if (contratM[3]) {
      // DD/MM/YYYY format
      d.contrat_fin = `${contratM[3]}-${contratM[2].padStart(2,"0")}-${contratM[1].padStart(2,"0")}`;
    } else {
      // DD/06/YYYY match
      d.contrat_fin = `${contratM[2]}-06-${contratM[1].padStart(2,"0")}`;
    }
  }

  // ── Stats saison ─────────────────────────────────────────────────────────────

  // Matchs : "44 Official Matches" ou "44 Matches"
  const matchM = html.match(/(\d{1,3})\s+(?:Official\s+)?Matches?\b/i);
  if (matchM) d.matchs_joues = parseInt(matchM[1]);

  // Minutes : "3,622'" ou "3622'"
  const minsM = html.match(/([\d,]{3,})['']/);
  if (minsM) {
    const mins = parseInt(minsM[1].replace(/,/g, ""));
    if (mins >= 90 && mins <= 10000) d.minutes_jouees = mins;
  }

  // Buts, passes, cartons — labelisés
  const goalsM = html.match(/(\d{1,3})\s+Goals?\b/i);
  if (goalsM) d.buts = parseInt(goalsM[1]);

  const assistM = html.match(/(\d{1,3})\s+Assists?\b/i);
  if (assistM) d.passes_decisives = parseInt(assistM[1]);

  // Cartons : "6/0" = jaunes/rouges
  const cardsM = html.match(/\b(\d{1,2})\/(\d)\b(?!\.\d)/);
  if (cardsM) {
    d.cartons_jaunes = parseInt(cardsM[1]);
    d.cartons_rouges = parseInt(cardsM[2]);
  }

  // ELO BeSoccer
  const eloM = html.match(/BeSoccer\s*ELO[^>]*>?[\s:]*(\d{2,3})\b/i) ||
               html.match(/ELO[^>]*>?[\s:]*(\d{2,3})\b/i);
  if (eloM) { const e = parseInt(eloM[1]); if (e >= 50 && e <= 100) d.besoccer_elo = e; }

  // ── Liens ─────────────────────────────────────────────────────────────────────
  d.photo_url     = `${CDN}/img_data/players/medium/${id}.jpg`;
  d.besoccer_url  = url;

  const searchName = (d.nom_complet || d.nom || "").trim();
  d.transfermarkt_search_url = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(searchName)}`;

  return d;
};

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { action, query, club, nationality, age, besoccer_url, besoccer_id } = await req.json();

    // ── Recherche joueurs
    if (action === "searchPlayer") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const url  = `${BASE}/search/${encodeURIComponent(query.trim())}`;
      const html = await fetchHtml(url);
      const players = parseSearch(html);
      return Response.json({ ok: true, total: players.length, players });
    }

    // ── Profil première page
    if (action === "getPlayer") {
      if (!besoccer_url) return Response.json({ ok: false, error: "besoccer_url requis" });
      if (!isBesoccerUrl(besoccer_url)) return Response.json({ ok: false, error: "URL BeSoccer non autorisée" });
      const idM = besoccer_url.match(/-(\d{4,8})(?:$|\/)/);
      const id  = idM ? idM[1] : (besoccer_id ?? "0");
      const html   = await fetchHtml(besoccer_url);
      const player = parseProfile(html, besoccer_url, id);
      return Response.json({ ok: true, player });
    }

    // ── Recherche + profil en un seul appel (pour SyncPlayerButton)
    if (action === "searchAndGetPlayer") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const searchUrl = `${BASE}/search/${encodeURIComponent(query.trim())}`;
      const searchHtml = await fetchHtml(searchUrl);
      const players    = parseSearch(searchHtml);
      if (players.length === 0) return Response.json({ ok: false, error: "Joueur non trouvé sur BeSoccer." });

      // Choisir le meilleur candidat (nom + club + nationalité + âge), pas le 1er
      const best = pickBest(players, { name: query.trim(), club, nationality, age });
      if (!best) return Response.json({ ok: false, error: "Aucun candidat fiable sur BeSoccer." });
      const chosen = best.cand;

      const profHtml  = await fetchHtml(chosen.besoccer_url);
      const player = parseProfile(profHtml, chosen.besoccer_url, chosen.besoccer_id);

      // Fusionner les données de recherche (nationalité, poste) si absentes du profil
      if (!player.nationalite && chosen.nationalite) player.nationalite = chosen.nationalite;
      if (!player.poste && chosen.poste)             player.poste       = chosen.poste;
      if (!player.club_actuel && chosen.club_actuel) player.club_actuel = chosen.club_actuel;
      player.besoccer_id = chosen.besoccer_id;
      player.saison = "saison en cours, toutes compétitions"; // périmètre des stats scrapées

      return Response.json({ ok: true, player, confidence: best.confidence, candidates: players });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("besoccerProxy:", err.message);
    // HTTP 200 obligatoire : le SDK Base44 throw sur tout status >= 400,
    // ce qui masque le vrai message d'erreur côté client.
    return Response.json({ ok: false, error: err.message });
  }
});
