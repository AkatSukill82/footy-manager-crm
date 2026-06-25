import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

/**
 * Projection de NOTRE liste de joueurs sur une formation choisie.
 * Place chaque joueur (par son poste) dans la formation, met en évidence les
 * postes MANQUANTS, et liste l'effectif par poste + les joueurs hors onze.
 */

// Poste joueur (enum Player) → rôle de slot.
const POSTE_TO_ROLE = {
  "Gardien": "GK",
  "Défenseur central": "CB",
  "Latéral droit": "RB",
  "Latéral gauche": "LB",
  "Milieu défensif": "DM",
  "Milieu central": "CM",
  "Milieu offensif": "AM",
  "Ailier droit": "RW",
  "Ailier gauche": "LW",
  "Attaquant": "ST",
};
const ROLE_LABEL = {
  GK: "Gardien", CB: "Déf. central", RB: "Latéral D", LB: "Latéral G", DM: "Milieu déf.",
  CM: "Milieu central", AM: "Milieu off.", RW: "Ailier D", LW: "Ailier G", ST: "Attaquant",
};
const ROLE_COLOR = {
  GK: "#f59e0b", CB: "#3b82f6", RB: "#3b82f6", LB: "#3b82f6",
  DM: "#10b981", CM: "#10b981", AM: "#10b981", RW: "#ef4444", LW: "#ef4444", ST: "#ef4444",
};

// Formations = lignes (du fond vers l'attaque), chaque ligne = liste de rôles.
const FORMATIONS = {
  "4-3-3":   [["GK"], ["LB", "CB", "CB", "RB"], ["CM", "CM", "CM"], ["LW", "ST", "RW"]],
  "4-4-2":   [["GK"], ["LB", "CB", "CB", "RB"], ["LW", "CM", "CM", "RW"], ["ST", "ST"]],
  "4-5-1":   [["GK"], ["LB", "CB", "CB", "RB"], ["LW", "CM", "CM", "CM", "RW"], ["ST"]],
  "4-2-3-1": [["GK"], ["LB", "CB", "CB", "RB"], ["DM", "DM"], ["LW", "AM", "RW"], ["ST"]],
  "3-5-2":   [["GK"], ["CB", "CB", "CB"], ["LW", "CM", "CM", "CM", "RW"], ["ST", "ST"]],
  "3-4-3":   [["GK"], ["CB", "CB", "CB"], ["LB", "CM", "CM", "RB"], ["LW", "ST", "RW"]],
  "5-3-2":   [["GK"], ["LB", "CB", "CB", "CB", "RB"], ["CM", "CM", "CM"], ["ST", "ST"]],
};

function buildSlots(formation) {
  const lines = FORMATIONS[formation] || FORMATIONS["4-3-3"];
  const N = lines.length;
  const slots = [];
  lines.forEach((line, li) => {
    const y = N === 1 ? 50 : 90 - (li / (N - 1)) * 80; // GK en bas (90), attaque en haut (10)
    line.forEach((role, ri) => {
      const x = ((ri + 1) / (line.length + 1)) * 100;
      slots.push({ id: `${li}-${ri}`, role, x, y });
    });
  });
  return slots;
}

// Assignation gloutonne : poste principal d'abord, puis poste secondaire.
function assign(slots, players) {
  const primary = {}, secondary = {};
  for (const p of players) {
    const r = POSTE_TO_ROLE[p.poste];
    if (r) (primary[r] = primary[r] || []).push(p);
    const r2 = POSTE_TO_ROLE[p.poste_secondaire];
    if (r2) (secondary[r2] = secondary[r2] || []).push(p);
  }
  const used = new Set();
  const placed = slots.map((s) => {
    let pick = (primary[s.role] || []).find((p) => !used.has(p.id));
    let fit = pick ? "primary" : null;
    if (!pick) { pick = (secondary[s.role] || []).find((p) => !used.has(p.id)); fit = pick ? "secondary" : "empty"; }
    if (pick) used.add(pick.id);
    return { ...s, player: pick || null, fit };
  });
  const bench = players.filter((p) => !used.has(p.id));
  return { placed, bench };
}

const lastName = (nom = "") => { const parts = nom.trim().split(/\s+/); return parts[parts.length - 1] || nom; };

export default function FormationProjection() {
  const navigate = useNavigate();
  const [formation, setFormation] = useState("4-3-3");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: Infinity });
  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", user?.id],
    queryFn: () => base44.entities.Player.filter({}),
    enabled: !!user?.id,
  });

  // Filtres (cahier §11)
  const [fPays, setFPays] = useState("");
  const [fNiveau, setFNiveau] = useState("");
  const [fDispo, setFDispo] = useState("");
  const [fPrio, setFPrio] = useState("");
  const [fAgeMax, setFAgeMax] = useState("");

  const fPlayers = useMemo(() => players.filter((p) => {
    if (fPays && !(p.nationalite || "").toLowerCase().includes(fPays.toLowerCase())) return false;
    if (fNiveau && p.niveau !== fNiveau) return false;
    if (fDispo && p.disponibilite !== fDispo) return false;
    if (fPrio && p.priorite_recrutement !== fPrio) return false;
    if (fAgeMax && !(p.age != null && Number(p.age) <= Number(fAgeMax))) return false;
    return true;
  }), [players, fPays, fNiveau, fDispo, fPrio, fAgeMax]);

  const slots = useMemo(() => buildSlots(formation), [formation]);
  const { placed, bench } = useMemo(() => assign(slots, fPlayers), [slots, fPlayers]);

  // Postes manquants (slots vides) + effectif par poste.
  const missing = useMemo(() => {
    const m = {};
    placed.filter((s) => s.fit === "empty").forEach((s) => { m[s.role] = (m[s.role] || 0) + 1; });
    return m;
  }, [placed]);
  const parPoste = useMemo(() => {
    const c = {};
    for (const p of fPlayers) { const r = POSTE_TO_ROLE[p.poste]; if (r) c[r] = (c[r] || 0) + 1; }
    return c;
  }, [fPlayers]);

  const goPlayer = (p) => navigate(createPageUrl("PlayerDetail") + "?id=" + p.id);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>;

  const selCls = "text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white";
  const anyFilter = fPays || fAgeMax || fNiveau || fDispo || fPrio;

  return (
    <div className="space-y-4">
      {/* Filtres (§11) */}
      <div className="flex flex-wrap gap-2 items-center bg-white border border-slate-200 rounded-xl p-2">
        <span className="text-xs text-slate-400 px-1">Filtrer :</span>
        <input value={fPays} onChange={(e) => setFPays(e.target.value)} placeholder="Pays" className={`${selCls} w-24`} />
        <input type="number" min="0" value={fAgeMax} onChange={(e) => setFAgeMax(e.target.value)} placeholder="Âge max" className={`${selCls} w-20`} />
        <select value={fNiveau} onChange={(e) => setFNiveau(e.target.value)} className={selCls}>
          <option value="">Niveau</option>
          {["International", "1re division", "2e division", "3e division", "4e division / amateur", "Jeunes / académie", "Autre"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={fDispo} onChange={(e) => setFDispo(e.target.value)} className={selCls}>
          <option value="">Dispo</option>
          {["Sous contrat", "Fin de contrat (<12 mois)", "Libre", "Prêt possible", "Indisponible"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={fPrio} onChange={(e) => setFPrio(e.target.value)} className={selCls}>
          <option value="">Priorité</option>
          {["Priorité A", "Priorité B", "Veille", "Aucune"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        {anyFilter && (
          <button onClick={() => { setFPays(""); setFAgeMax(""); setFNiveau(""); setFDispo(""); setFPrio(""); }} className="text-xs text-slate-400 hover:text-slate-700 underline">Réinitialiser</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Terrain */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-semibold text-slate-800">Projection de l'effectif</h2>
            <p className="text-xs text-slate-500">{fPlayers.length} joueur{fPlayers.length > 1 ? "s" : ""}{fPlayers.length !== players.length ? ` / ${players.length}` : ""} · {placed.filter(s => s.fit !== "empty").length}/11 postes couverts</p>
          </div>
          <Select value={formation} onValueChange={setFormation}>
            <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.keys(FORMATIONS).map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden border border-green-700/30 shadow-sm"
          style={{ aspectRatio: "3 / 4", background: "linear-gradient(#15803d,#166534)" }}>
          {/* marquages terrain */}
          <div className="absolute inset-3 border-2 border-white/25 rounded-lg" />
          <div className="absolute left-3 right-3 top-1/2 border-t-2 border-white/20" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full" />
          <div className="absolute left-1/4 right-1/4 top-3 h-10 border-2 border-t-0 border-white/20" />
          <div className="absolute left-1/4 right-1/4 bottom-3 h-10 border-2 border-b-0 border-white/20" />

          {placed.map((s) => {
            const empty = s.fit === "empty";
            const color = ROLE_COLOR[s.role];
            return (
              <div key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: 78 }}>
                <button
                  onClick={() => s.player && goPlayer(s.player)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md border-2 ${empty ? "border-dashed" : ""}`}
                  style={empty
                    ? { background: "rgba(239,68,68,0.15)", borderColor: "#ef4444", color: "#fecaca", cursor: "default" }
                    : { background: "#fff", borderColor: color, color }}
                  title={empty ? `Poste manquant : ${ROLE_LABEL[s.role]}` : `${s.player.nom} — ${s.player.poste}`}
                >
                  {empty ? "?" : s.role}
                </button>
                <span className={`mt-1 text-[10px] font-medium px-1 rounded text-center leading-tight truncate max-w-[78px] ${empty ? "text-red-100 bg-red-600/40" : "text-white bg-black/30"}`}>
                  {empty ? ROLE_LABEL[s.role] : lastName(s.player.nom)}
                  {s.fit === "secondary" && <span className="opacity-70"> *</span>}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Cercle plein = joueur de la liste · pointillé rouge = poste manquant · « * » = joueur placé via son poste secondaire.</p>
      </div>

      {/* Panneau latéral */}
      <div className="space-y-4">
        {/* Postes manquants */}
        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-2">
            {Object.keys(missing).length ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
            Postes manquants
          </h3>
          {Object.keys(missing).length === 0 ? (
            <p className="text-xs text-green-700">Tous les postes du {formation} sont couverts ✓</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(missing).map(([role, n]) => (
                <span key={role} className="text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-1">
                  {ROLE_LABEL[role]}{n > 1 ? ` ×${n}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Effectif par poste */}
        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-2">Effectif par poste</h3>
          <div className="space-y-1">
            {["GK", "RB", "CB", "LB", "DM", "CM", "AM", "RW", "ST", "LW"].map((role) => (
              <div key={role} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[role] }} /> {ROLE_LABEL[role]}
                </span>
                <span className={`font-semibold ${(parPoste[role] || 0) === 0 ? "text-red-500" : "text-slate-700"}`}>{parPoste[role] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hors onze */}
        {bench.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-slate-400" /> Hors onze ({bench.length})</h3>
            <div className="flex flex-wrap gap-1.5">
              {bench.map((p) => (
                <button key={p.id} onClick={() => goPlayer(p)} className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1 text-slate-600">
                  {p.nom}{p.poste ? <span className="text-slate-400"> · {p.poste}</span> : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
