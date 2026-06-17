/**
 * Scraper Transfermarkt — infos personnelles joueur uniquement.
 * Scraping HTML SSR avec headers navigateur.
 * Note : Transfermarkt a une protection Cloudflare, ce proxy peut échouer
 * selon la région/IP du serveur — le frontend gère l'échec avec un fallback BeSoccer.
 *
 * Actions :
 *   searchAndGet  — recherche par nom + scrape profil
 *   getPlayer     — scrape profil depuis une URL TM connue
 */

const TM_BASE = "https://www.transfermarkt.com";

const TM_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Cache-Control": "max-age=0",
};

const fetchHtml = async (url: string): Promise<string> => {
  const res = await fetch(url, {
    headers: TM_HEADERS,
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Transfermarkt HTTP ${res.status}`);
  const html = await res.text();
  // Détecter un blocage Cloudflare
  if (html.includes("Just a moment") || html.includes("cf-browser-verification")) {
    throw new Error("Transfermarkt bloqué par Cloudflare.");
  }
  return html;
};

// ── Matcher d'identité : nom + club ───────────────────────────────────────────

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

// ── Recherche → meilleure URL joueur (scoring nom + club) ─────────────────────

const searchPlayer = async (name: string, club?: string): Promise<string | null> => {
  const url = `${TM_BASE}/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`;
  const html = await fetchHtml(url);

  // Collecter tous les candidats : lien profil + nom (texte de l'ancre) + une
  // fenêtre de HTML suivant le lien pour détecter le club (lien /verein/).
  const re = /href="(\/[^"]+\/profil\/spieler\/(\d+))"[^>]*>([^<]*)</gi;
  const cands: { path: string; name: string; window: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    cands.push({ path: m[1], name: m[3].trim(), window: html.slice(m.index, m.index + 600) });
    if (cands.length >= 15) break;
  }
  if (cands.length === 0) return null;

  let best: typeof cands[0] | null = null, bestScore = -1;
  for (const c of cands) {
    const nameSim = overlap(c.name, name);
    if (nameSim < 0.5) continue;                        // le nom DOIT correspondre
    let score = nameSim * 4;
    if (club) {
      const clubM = c.window.match(/\/verein\/\d+"[^>]*(?:title="([^"]+)"|>\s*([^<]{2,40}))/i);
      const clubName = clubM ? (clubM[1] ?? clubM[2] ?? "") : "";
      if (clubName) score += overlap(clubName, club) * 3;
    }
    if (score > bestScore) { bestScore = score; best = c; }
  }
  // Fallback : si aucun nom ne passe le seuil mais qu'il y a des candidats,
  // on garde le premier (l'ancien comportement) plutôt que d'échouer.
  const chosen = best ?? cands[0];
  return `${TM_BASE}${chosen.path}`;
};

// ── Parse profil joueur ───────────────────────────────────────────────────────

const MONTHS_DE: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const parseProfile = (html: string, url: string): Record<string, any> => {
  const d: Record<string, any> = {};

  const grab = (re: RegExp): string | null => {
    const m = html.match(re);
    return m ? (m[1] ?? "").replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, " ").trim() || null : null;
  };

  // Nom
  d.nom = grab(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  // Valeur marchande : "€150.00m" ou "€500k"
  const mvM = html.match(/€\s*([\d,.]+)\s*([km]?)\b/i);
  if (mvM) {
    let v = parseFloat(mvM[1].replace(/,/g, "."));
    if (mvM[2]?.toLowerCase() === "k") v /= 1000;
    if (v > 0) d.valeur_marchande = Math.round(v * 100) / 100;
  }

  // Date naissance : "Dec 20, 1998" ou "20.12.1998"
  const birthM = html.match(/(\w{3})\s+(\d{1,2}),?\s+(\d{4})/i) ||
                 html.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (birthM) {
    if (MONTHS_DE[birthM[1]?.toLowerCase()]) {
      const mm = MONTHS_DE[birthM[1].toLowerCase()];
      d.date_naissance = `${birthM[3]}-${mm}-${birthM[2].padStart(2, "0")}`;
    } else if (birthM[3]) {
      d.date_naissance = `${birthM[3]}-${birthM[2].padStart(2, "0")}-${birthM[1].padStart(2, "0")}`;
    }
  }

  // Taille : "1,80 m" ou "180 cm"
  const hM = html.match(/1[,.](\d{2})\s*m\b/i) || html.match(/(\d{3})\s*cm/i);
  if (hM) {
    if (hM[0].includes("m") && !hM[0].includes("cm")) {
      d.taille = parseInt("1" + hM[1]);
    } else {
      d.taille = parseInt(hM[1]);
    }
  }

  // Pied fort
  const footM = html.match(/(?:foot|pied|Fuß)[^>]*[:\s]*(?:<[^>]+>)*\s*(right|left|both|droit|gauche)/i);
  if (footM) {
    const f = footM[1].toLowerCase();
    d.pied_fort = f === "right" ? "Droit" : f === "left" ? "Gauche" : "Les deux";
  }

  // Agent
  const agentM = html.match(/(?:agent|player agent)[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
  if (agentM) {
    const ag = agentM[1].replace(/<[^>]+>/g, "").trim();
    if (ag && ag.length > 2) d.agent = ag;
  }

  // Fin contrat : "Jun 30, 2029" ou "30.06.2029"
  const contM = html.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (contM && parseInt(contM[3]) > 2024) {
    d.contrat_fin = `${contM[3]}-${contM[2].padStart(2, "0")}-${contM[1].padStart(2, "0")}`;
  }

  // Club actuel (lien /verein/ ou /club/)
  const clubM = html.match(/href="\/[^"]+\/(?:verein|club)\/\d+"[^>]*>\s*(?:<[^>]+>)*\s*([A-Z][^<\n]{2,40}?)\s*(?:<|$)/im);
  if (clubM) d.club_actuel = clubM[1].replace(/<[^>]+>/g, "").trim();

  // Photo — cherche l'URL portrait TM (format CDN fiable)
  const photoM = html.match(/https:\/\/img\.a\.transfermarkt\.technology\/portrait\/(?:medium|big)\/[^"'\s>]+\.jpg/i) ||
                 html.match(/https:\/\/img\.a\.transfermarkt\.technology\/portrait\/[^"'\s>]+\.jpg/i) ||
                 html.match(/(https:\/\/[^"']+transfermarkt[^"']+(?:portrait|spieler)[^"'\s>]+\.(?:jpg|png|webp))/i);
  if (photoM) d.photo_url = photoM[0] || photoM[1];

  // ID Transfermarkt depuis l'URL
  const idM = url.match(/\/spieler\/(\d+)/);
  if (idM) d.transfermarkt_id = idM[1];

  d.transfermarkt_url = url;
  return d;
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { action, query, club, transfermarkt_url } = await req.json();

    if (action === "searchAndGet") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const profileUrl = await searchPlayer(query.trim(), club);
      if (!profileUrl) return Response.json({ ok: false, error: "Joueur non trouvé sur Transfermarkt." });
      const html   = await fetchHtml(profileUrl);
      const player = parseProfile(html, profileUrl);
      return Response.json({ ok: true, player });
    }

    if (action === "getPlayer") {
      if (!transfermarkt_url) return Response.json({ ok: false, error: "transfermarkt_url requis" });
      const html   = await fetchHtml(transfermarkt_url);
      const player = parseProfile(html, transfermarkt_url);
      return Response.json({ ok: true, player });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("transfermarktProxy:", err.message);
    // Retourne ok: false pour que le frontend utilise BeSoccer en fallback
    return Response.json({ ok: false, error: err.message }, { status: 200 });
  }
});
