/**
 * Scraper Soccerdonna (football FÉMININ) — équivalent Transfermarkt pour les femmes.
 * Soccerdonna.de partage le gabarit Transfermarkt mais n'a pas de recherche GET
 * pratique → on trouve la fiche via un moteur (DuckDuckGo HTML puis Bing) en
 * ciblant `site:soccerdonna.de`, puis on scrape le profil.
 *
 * Actions :
 *   searchAndGet — recherche par nom (moteur) + scrape profil → infos perso
 *   getPlayer    — scrape un profil depuis une URL soccerdonna connue
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SD_BASE = "https://www.soccerdonna.de";

// Anti-SSRF : n'autorise que les URLs soccerdonna en https.
const isSdUrl = (u: string): boolean => {
  try { const x = new URL(u); return x.protocol === "https:" && (x.hostname === "soccerdonna.de" || x.hostname.endsWith(".soccerdonna.de")); }
  catch { return false; }
};

const PROFILE_RE = /https?:\/\/www\.soccerdonna\.de\/[a-z]{2}\/[^"'\s]*?\/profil\/spieler_(\d+)\.html/i;

const BROWSER_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

const fetchHtml = async (url: string, headers: HeadersInit = BROWSER_HEADERS): Promise<string> => {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000), redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
};

// ── Matcher d'identité (nom) ──────────────────────────────────────────────────
const STOP = new Set(["fc", "cf", "sc", "ac", "afc", "cd", "de", "the", "us", "ss", "as", "ud", "rc", "sv", "if", "fk", "ifk", "bk"]);
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

// ── Recherche du profil via moteur (DuckDuckGo HTML, fallback Bing) ────────────

const extractSdUrls = (html: string): string[] => {
  const out = new Set<string>();
  // Liens directs
  let m: RegExpExecArray | null;
  const reDirect = new RegExp(PROFILE_RE.source, "gi");
  while ((m = reDirect.exec(html)) !== null) out.add(m[0].split("?")[0]);
  // Liens encodés (DuckDuckGo : ...uddg=<urlencodé>...)
  const reEnc = /uddg=([^"&]+)/gi;
  while ((m = reEnc.exec(html)) !== null) {
    try { const u = decodeURIComponent(m[1]); const mm = u.match(PROFILE_RE); if (mm) out.add(mm[0].split("?")[0]); } catch { /* ignore */ }
  }
  return [...out];
};

const findProfileUrl = async (name: string): Promise<{ url: string; confidence: number } | null> => {
  const query = `${name} site:soccerdonna.de profil`;
  let urls: string[] = [];

  // 1) DuckDuckGo HTML
  try {
    const html = await fetchHtml(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    urls = extractSdUrls(html);
  } catch { /* fallback Bing */ }

  // 2) Bing (fallback)
  if (urls.length === 0) {
    try {
      const html = await fetchHtml(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`);
      urls = extractSdUrls(html);
    } catch { /* rien trouvé */ }
  }

  if (urls.length === 0) return null;

  // Scoring par le slug de l'URL (contient le nom du joueur)
  let best: string | null = null, bestSim = -1;
  for (const u of urls) {
    const slugM = u.match(/soccerdonna\.de\/[a-z]{2}\/([^/]+)\/profil/i);
    const slug = slugM ? slugM[1].replace(/-/g, " ") : "";
    const sim = overlap(slug, name);
    if (sim > bestSim) { bestSim = sim; best = u; }
  }
  if (!best) best = urls[0];
  const confidence = bestSim >= 0.5 ? Math.min(1, 0.55 + bestSim * 0.4) : 0.3;
  return { url: best, confidence: Math.round(confidence * 100) / 100 };
};

// ── Parse du profil ───────────────────────────────────────────────────────────

const POSTE_MAP: [RegExp, string][] = [
  [/goalkeeper|keeper|gardien/i, "Gardien"],
  [/(centre|center|central)[ -]?back|central defender|défenseur central/i, "Défenseur central"],
  [/right[ -]?back|latéral droit/i, "Latéral droit"],
  [/left[ -]?back|latéral gauche/i, "Latéral gauche"],
  [/defensive midfield|milieu défensif/i, "Milieu défensif"],
  [/attacking midfield|milieu offensif/i, "Milieu offensif"],
  [/(central|centre) midfield|milieu central/i, "Milieu central"],
  [/right (winger|midfield)|ailier droit/i, "Ailier droit"],
  [/left (winger|midfield)|ailier gauche/i, "Ailier gauche"],
  [/(centre|center)[ -]?forward|striker|attaquant|forward/i, "Attaquant"],
];

const parseProfile = (html: string, url: string): Record<string, any> => {
  const d: Record<string, any> = {};

  const clean = (s: string | null | undefined): string | null =>
    s ? s.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim() || null : null;

  // Valeur d'un libellé "Label:" → contenu textuel de la cellule/élément suivant.
  const fieldVal = (label: string): string | null => {
    const re = new RegExp(label + ":?\\s*<\\/[^>]+>\\s*(?:<[^>]+>\\s*)*([^<]{1,60})", "i");
    const m = html.match(re);
    return m ? clean(m[1]) : null;
  };

  // Nom (h1 — peut préfixer un numéro de maillot)
  d.nom = (clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) || "")
    .replace(/^\s*(?:#|n[°ºo.]?\s*)?\d{1,3}\s+(?=\D)/i, "").trim() || null;

  // Date de naissance : DD.MM.YYYY
  const dob = fieldVal("Date of birth") || fieldVal("Geburtsdatum") || html;
  const bM = dob.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (bM) d.date_naissance = `${bM[3]}-${bM[2].padStart(2, "0")}-${bM[1].padStart(2, "0")}`;

  // Nationalité (premier pays)
  const nat = fieldVal("Nationality") || fieldVal("Nationalität");
  if (nat) d.nationalite = nat.split(/[,/]/)[0].trim().slice(0, 40) || null;

  // Taille : "1,70" → 170 cm
  const hRaw = fieldVal("Height") || fieldVal("Größe") || "";
  const hM = hRaw.match(/1[,.](\d{2})/) || hRaw.match(/\b(1\d{2})\b/);
  if (hM) d.taille = hM[1].length === 2 ? parseInt("1" + hM[1]) : parseInt(hM[1]);

  // Poste (mappé EN→FR si possible)
  const posRaw = fieldVal("Position") || "";
  if (posRaw) {
    const hit = POSTE_MAP.find(([re]) => re.test(posRaw));
    d.poste = hit ? hit[1] : null;
    d.poste_raw = posRaw;
  }

  // Pied fort
  const footRaw = (fieldVal("Foot") || fieldVal("Fuß") || "").toLowerCase();
  if (footRaw.includes("right") || footRaw.includes("rechts")) d.pied_fort = "Droit";
  else if (footRaw.includes("left") || footRaw.includes("links")) d.pied_fort = "Gauche";
  else if (footRaw.includes("both") || footRaw.includes("beide")) d.pied_fort = "Les deux";

  // Club actuel : libellé ou lien /verein_<id>.html
  let club = fieldVal("Current club") || fieldVal("Last club") || fieldVal("Aktueller Verein");
  if (!club) {
    const cM = html.match(/\/verein_\d+\.html"[^>]*>\s*(?:<[^>]+>\s*)*([^<]{2,40})/i) ||
               html.match(/title="([^"]{2,40})"[^>]*>\s*<img[^>]+wappen/i);
    if (cM) club = clean(cM[1]);
  }
  if (club && !/^current|^last|^aktuel/i.test(club)) d.club_actuel = club;

  // Valeur marchande : "€100k" / "€1.20m" (valeurs féminines souvent en k)
  const mvM = html.match(/€\s*([\d.,]+)\s*(k|m|th\.?|mio)?/i);
  if (mvM) {
    let v = parseFloat(mvM[1].replace(/\./g, "").replace(",", "."));
    const unit = (mvM[2] || "").toLowerCase();
    if (unit.startsWith("k") || unit.startsWith("th")) v /= 1000;
    if (!isNaN(v) && v > 0 && v < 100) d.valeur_marchande = Math.round(v * 100) / 100;
  }

  // Fin de contrat : "Contract until/expires" → DD.MM.YYYY
  const contRaw = fieldVal("Contract until") || fieldVal("Contract expires") || fieldVal("Vertrag bis");
  const cM2 = (contRaw || "").match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (cM2 && parseInt(cM2[3]) >= 2024) d.contrat_fin = `${cM2[3]}-${cM2[2].padStart(2, "0")}-${cM2[1].padStart(2, "0")}`;

  // Photo (CDN soccerdonna)
  const photoM = html.match(/https?:\/\/www\.soccerdonna\.de\/static\/bilder_sd\/spielerfotos\/[^"'\s>]+\.(?:jpg|png|webp)/i);
  if (photoM) d.photo_url = photoM[0];

  // ID soccerdonna depuis l'URL
  const idM = url.match(/spieler_(\d+)\.html/);
  if (idM) d.soccerdonna_id = idM[1];

  d.soccerdonna_url = url;
  d.sexe = "Féminin";
  return d;
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { action, query, soccerdonna_url } = await req.json();

    if (action === "searchAndGet") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const hit = await findProfileUrl(query.trim());
      if (!hit) return Response.json({ ok: false, error: "Joueuse non trouvée sur Soccerdonna." });
      const html = await fetchHtml(hit.url);
      const player = parseProfile(html, hit.url);
      if (!player.nom) return Response.json({ ok: false, error: "Profil illisible." });
      return Response.json({ ok: true, player, confidence: hit.confidence });
    }

    if (action === "getPlayer") {
      if (!soccerdonna_url || !isSdUrl(soccerdonna_url)) return Response.json({ ok: false, error: "URL Soccerdonna non autorisée" });
      const html = await fetchHtml(soccerdonna_url);
      const player = parseProfile(html, soccerdonna_url);
      return Response.json({ ok: true, player });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("soccerdonnaProxy:", err?.message);
    return Response.json({ ok: false, error: err?.message }, { status: 200 });
  }
});
