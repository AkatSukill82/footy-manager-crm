/**
 * Scraper Transfermarkt — infos personnelles joueur uniquement.
 * Scraping HTML SSR avec headers navigateur.
 * Note : Transfermarkt a une protection Cloudflare, ce proxy peut échouer
 * selon la région/IP du serveur — le frontend gère l'échec avec un fallback BeSoccer.
 *
 * Actions :
 *   searchAndGet  — recherche par nom + scrape profil
 *   getPlayer     — scrape profil depuis une URL TM connue
 *   getRumors     — scrape les rumeurs de transfert (par id TM ou recherche nom)
 *   getTransfers  — historique des transferts via l'API JSON ceapi (par id TM ou nom)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TM_BASE = "https://www.transfermarkt.com";

// Anti-SSRF : n'autorise que les URLs Transfermarkt en https.
const isTmUrl = (u: string): boolean => {
  try { const x = new URL(u); return x.protocol === "https:" && (x.hostname === "transfermarkt.com" || x.hostname.endsWith(".transfermarkt.com")); }
  catch { return false; }
};

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

const searchPlayer = async (name: string, club?: string): Promise<{ url: string; confidence: number } | null> => {
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

  let best: typeof cands[0] | null = null, bestScore = -1, bestNameSim = 0;
  for (const c of cands) {
    const nameSim = overlap(c.name, name);
    if (nameSim < 0.5) continue;                        // le nom DOIT correspondre
    let score = nameSim * 4;
    if (club) {
      const clubM = c.window.match(/\/verein\/\d+"[^>]*(?:title="([^"]+)"|>\s*([^<]{2,40}))/i);
      const clubName = clubM ? (clubM[1] ?? clubM[2] ?? "") : "";
      if (clubName) score += overlap(clubName, club) * 3;
    }
    if (score > bestScore) { bestScore = score; best = c; bestNameSim = nameSim; }
  }

  if (best) {
    const confidence = Math.min(1, bestNameSim * 0.6 + (bestScore - bestNameSim * 4) / 3 * 0.4 + 0.1);
    return { url: `${TM_BASE}${best.path}`, confidence: Math.round(confidence * 100) / 100 };
  }
  // Aucun nom ne passe le seuil : on garde le 1er candidat mais en confiance
  // basse (le client décidera s'il fait confiance aux champs d'identité).
  return { url: `${TM_BASE}${cands[0].path}`, confidence: 0.3 };
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

  // Nom (le <h1> Transfermarkt préfixe le numéro de maillot : "#10 Enzo Millot")
  d.nom = (grab(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || "")
    .replace(/^\s*(?:#|n[°ºo.]?\s*)?\d{1,3}\s+(?=\D)/i, "").trim() || null;

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

// ── Parse rumeurs de transfert ────────────────────────────────────────────────
// La page /geruechte/spieler/{id} contient une table "Rumours" (rumeurs ouvertes,
// souvent vide) et une table "Rumour archive" (clubs intéressés + dates + source).
// Les deux partagent la même structure <table class="items"> ; on parse toutes les
// lignes et on déduplique par club + lien source.

const decodeEntities = (s: string): string =>
  (s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&([a-z]+);/gi, " ").replace(/\s+/g, " ").trim();

const parseRumors = (html: string): any[] => {
  const rumors: any[] = [];
  const seen = new Set<string>();

  const rowRe = /<tr class="(?:odd|even)">([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(html)) !== null) {
    const row = m[1];

    // Club intéressé : cellule "hauptlink" avec lien /verein/{id}
    const clubM = row.match(/<td class="links hauptlink[^"]*">\s*<a[^>]*title="([^"]+)"[^>]*href="([^"]*verein\/(\d+))"/i);
    if (!clubM) continue;
    const club    = decodeEntities(clubM[1]);
    const clubId  = clubM[3];

    // Logo du club
    const logoM = row.match(/<img[^>]+src="(https:\/\/tmssl[^"]+wappen[^"]+)"/i);

    // Dates (cellules centrées avec date DD/MM/YYYY + lien source forum)
    const dates = [...row.matchAll(/<td class="zentriert">\s*<a[^>]*href="([^"]+)"[^>]*>\s*(\d{2}\/\d{2}\/\d{4})\s*<\/a>/gi)];
    const sourceUrl  = dates[0]?.[1] ?? null;
    const sourceDate = dates[0]?.[2] ?? null;
    const lastReply  = dates[1]?.[2] ?? dates[0]?.[2] ?? null;

    // Probabilité estimée (cellule "rechts hauptlink") — texte avant la bulle
    const probM = row.match(/<td class="rechts hauptlink">\s*([^<&]*?)\s*(?:&nbsp;|<)/i);
    let probability: string | null = probM ? decodeEntities(probM[1]) : null;
    if (!probability || probability === "-") probability = null;

    const key = `${clubId}|${sourceUrl ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rumors.push({
      club,
      club_id:     clubId,
      club_logo:   logoM ? logoM[1] : null,
      source_date: sourceDate,
      last_reply:  lastReply,
      source_url:  sourceUrl,
      probability,
    });
    if (rumors.length >= 25) break;
  }
  return rumors;
};

// ── Parse historique transferts (API JSON ceapi/transferHistory) ──────────────
// Renvoie un format directement consommable par le composant TransferHistory.

const parseTransferFee = (raw: string): { type: string; montant: number | null } => {
  const s = String(raw || "").toLowerCase();
  let type = "Transfert définitif";
  if (s.includes("loan")) type = s.includes("end") ? "Fin de prêt" : "Prêt";
  else if (s.includes("free")) type = "Libre";

  let montant: number | null = null;
  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(bn|m|k)\b/);
  if (m) {
    let v = parseFloat(m[1]);
    if (m[2] === "k") v = v / 1000;
    else if (m[2] === "bn") v = v * 1000;
    montant = Math.round(v * 100) / 100;            // en M€
  }
  return { type, montant };
};

const parseTransfers = (json: any): any[] => {
  const list: any[] = Array.isArray(json?.transfers) ? json.transfers : [];
  return list
    .filter((t) => t?.dateUnformatted && t?.to?.clubName)
    .map((t) => {
      const { type, montant } = parseTransferFee(t.fee);
      return {
        date_transfert:    t.dateUnformatted,
        saison:            t.season ?? null,
        club_depart:       t.from?.clubName ?? null,
        club_arrivee:      t.to?.clubName ?? null,
        club_depart_logo:  t.from?.["clubEmblem-1x"] ?? null,
        club_arrivee_logo: t.to?.["clubEmblem-1x"] ?? null,
        type_transfert:    type,
        montant,
        valeur_marche:     typeof t.marketValue === "string" ? t.marketValue.replace(/\s+/g, "") : null,
        url:               t.url ? `${TM_BASE}${t.url}` : null,
      };
    });
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { action, query, club, transfermarkt_url, transfermarkt_id } = await req.json();

    if (action === "searchAndGet") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const hit = await searchPlayer(query.trim(), club);
      if (!hit) return Response.json({ ok: false, error: "Joueur non trouvé sur Transfermarkt." });
      const html   = await fetchHtml(hit.url);
      const player = parseProfile(html, hit.url);
      return Response.json({ ok: true, player, confidence: hit.confidence });
    }

    if (action === "getPlayer") {
      if (!transfermarkt_url) return Response.json({ ok: false, error: "transfermarkt_url requis" });
      if (!isTmUrl(transfermarkt_url)) return Response.json({ ok: false, error: "URL Transfermarkt non autorisée" });
      const html   = await fetchHtml(transfermarkt_url);
      const player = parseProfile(html, transfermarkt_url);
      return Response.json({ ok: true, player });
    }

    if (action === "getRumors") {
      // ID TM fourni directement, sinon on le retrouve via une recherche par nom.
      let id: string | null = transfermarkt_id ? String(transfermarkt_id) : null;
      if (!id) {
        if (!query?.trim()) return Response.json({ ok: false, error: "transfermarkt_id ou query requis" });
        const hit = await searchPlayer(query.trim(), club);
        const idM = hit?.url.match(/\/spieler\/(\d+)/);
        id = idM ? idM[1] : null;
      }
      if (!id) return Response.json({ ok: false, error: "Joueur introuvable sur Transfermarkt." });

      // Slug générique : Transfermarkt route par l'ID numérique, le slug est ignoré.
      const url    = `${TM_BASE}/x/geruechte/spieler/${id}`;
      const html   = await fetchHtml(url);
      const rumors = parseRumors(html);
      return Response.json({ ok: true, total: rumors.length, rumors, transfermarkt_id: id, source_url: url });
    }

    if (action === "getTransfers") {
      let id: string | null = transfermarkt_id ? String(transfermarkt_id) : null;
      if (!id) {
        if (!query?.trim()) return Response.json({ ok: false, error: "transfermarkt_id ou query requis" });
        const hit = await searchPlayer(query.trim(), club);
        const idM = hit?.url.match(/\/spieler\/(\d+)/);
        id = idM ? idM[1] : null;
      }
      if (!id) return Response.json({ ok: false, error: "Joueur introuvable sur Transfermarkt." });

      // API JSON officielle interne (pas de scraping HTML).
      const res = await fetch(`${TM_BASE}/ceapi/transferHistory/list/${id}`, {
        headers: { ...TM_HEADERS, "Accept": "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`Transfermarkt HTTP ${res.status}`);
      const json      = await res.json();
      const transfers = parseTransfers(json);
      return Response.json({ ok: true, total: transfers.length, transfers, transfermarkt_id: id });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("transfermarktProxy:", err.message);
    // Retourne ok: false pour que le frontend utilise BeSoccer en fallback
    return Response.json({ ok: false, error: err.message }, { status: 200 });
  }
});
