import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Info } from "lucide-react";
import SaveBar from "./SaveBar";
import { PAYS_CODES, ANNEES_FISCALES, TAX_YEAR_DEFAULT, getTaxProfile, getRegimes, estimerTauxSalarie, RESIDENCE_OPTIONS, SITUATION_OPTIONS, AGE_SEUIL_JEUNE, ABATTEMENT_MOINS_23 } from "../../../lib/taxProfiles";
import { packageBrut, netFromBrut, coutEmployeur, fmtEUR, fmtPct, toNum, ageFromDob } from "../../../lib/transferCalc";

// Champ numérique avec label + suffixe d'unité
const NumField = ({ label, value, onChange, placeholder, suffix = "€" }) => (
  <div>
    <Label className="text-xs text-slate-500 mb-1 block">{label}</Label>
    <div className="relative">
      <Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pr-10" />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>
    </div>
  </div>
);

const Stat = ({ label, value, color = "text-slate-900", sub }) => (
  <div className="bg-slate-50 rounded-lg p-4">
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

export default function SalarySimulator({ player }) {
  const [pays, setPays] = useState("FR");
  const [regime, setRegime] = useState("");   // régime fiscal spécial (impatrié…)
  const [annee, setAnnee] = useState(String(TAX_YEAR_DEFAULT));
  const [salaireAnnuel, setSalaireAnnuel] = useState("");
  const [annees, setAnnees] = useState("3");
  const [age, setAge] = useState("");
  const [signingFee, setSigningFee] = useState("");
  const [primes, setPrimes] = useState("");
  const [avantages, setAvantages] = useState("");
  // Paramètres personnels (cahier §5.1) : résidence, situation familiale, enfants
  const [residency, setResidency] = useState("resident");
  const [marital, setMarital] = useState("single");
  const [enfants, setEnfants] = useState("0");
  // Taux effectif éditable, pré-rempli depuis le moteur fiscal
  const [tauxOverride, setTauxOverride] = useState("");

  // Préremplissage depuis la fiche joueur (salaire en M€ → €, âge)
  useEffect(() => {
    if (!player) return;
    if (player.salaire) setSalaireAnnuel(String(Math.round(player.salaire * 1_000_000)));
    const a = player.age ?? ageFromDob(player.date_naissance);
    if (a != null) setAge(String(a));
  }, [player?.id]);

  const ageNum = age !== "" ? toNum(age) : null;
  const jeune = ageNum != null && ageNum < AGE_SEUIL_JEUNE;
  const regimesDispo = getRegimes(pays);
  const regimeObj = regimesDispo.find((r) => r.id === regime) || null;
  // Moteur fiscal : palier petit/gros selon le brut + régime + famille/résidence + abattement <23.
  const fisc = estimerTauxSalarie({
    code: pays, year: Number(annee), grossAnnual: toNum(salaireAnnuel),
    residency, marital, children: toNum(enfants), regime, age: ageNum,
  });
  const tauxPatronal = fisc.tauxPatronal;
  // Priorité du taux : saisie manuelle > moteur fiscal.
  const tauxSalarie = tauxOverride !== "" ? toNum(tauxOverride) / 100 : fisc.tauxSalarie;

  const res = useMemo(() => {
    const brutAnnuel = toNum(salaireAnnuel);
    if (!brutAnnuel) return null;
    const packageGaranti = packageBrut({
      salaireAnnuel: brutAnnuel,
      anneesContrat: Math.max(1, toNum(annees) || 1),
      signingFee: toNum(signingFee),
      primesGaranties: toNum(primes),
    });
    const netAnnuel = netFromBrut(brutAnnuel, tauxSalarie);
    const coutClubAnnuel = coutEmployeur({ brut: brutAnnuel, tauxPatronal, avantages: toNum(avantages) });
    return {
      brutAnnuel,
      netAnnuel,
      netMensuel: netAnnuel / 12,
      coutClubAnnuel,
      packageGaranti,
      netPackage: netFromBrut(packageGaranti, tauxSalarie),
    };
  }, [salaireAnnuel, annees, signingFee, primes, avantages, tauxSalarie, tauxPatronal]);

  // Cash-flow année par année (signing fee sur l'année 1 uniquement).
  const cashflow = useMemo(() => {
    const brut = toNum(salaireAnnuel);
    if (!brut) return [];
    const years = Math.max(1, toNum(annees) || 1);
    const primesAn = toNum(primes), sf = toNum(signingFee), av = toNum(avantages);
    const rows = [];
    for (let y = 1; y <= years; y++) {
      const rem = brut + primesAn + (y === 1 ? sf : 0);
      rows.push({
        annee: y,
        net: netFromBrut(rem, tauxSalarie),
        coutClub: coutEmployeur({ brut: rem, tauxPatronal, avantages: av }),
      });
    }
    return rows;
  }, [salaireAnnuel, annees, primes, signingFee, avantages, tauxSalarie, tauxPatronal]);

  const inputs = { pays, regime, annee, salaireAnnuel, annees, age, signingFee, primes, avantages, residency, marital, enfants, tauxOverride };
  const handleLoad = (o) => {
    if (!o || typeof o !== "object") return;
    setPays(o.pays ?? "FR");
    setRegime(o.regime ?? "");
    setAnnee(o.annee ?? String(TAX_YEAR_DEFAULT));
    setSalaireAnnuel(o.salaireAnnuel ?? "");
    setAnnees(o.annees ?? "3");
    setAge(o.age ?? "");
    setSigningFee(o.signingFee ?? "");
    setPrimes(o.primes ?? "");
    setAvantages(o.avantages ?? "");
    setResidency(o.residency ?? "resident");
    setMarital(o.marital ?? "single");
    setEnfants(o.enfants ?? "0");
    setTauxOverride(o.tauxOverride ?? "");
  };
  const resume = res ? `Net ${fmtEUR(res.netAnnuel)}/an · coût club ${fmtEUR(res.coutClubAnnuel)}/an` : "";

  return (
    <div className="space-y-4">
      <SaveBar
        module="salaire"
        inputs={inputs}
        resume={resume}
        playerId={player?.id}
        playerName={player?.nom}
        onLoad={handleLoad}
        canSave={!!res}
      />

      {/* Pays & année */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Pays (fiscalité)</Label>
          <Select value={pays} onValueChange={(v) => { setPays(v); setRegime(""); setTauxOverride(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYS_CODES.map((code) => {
                const p = getTaxProfile(code, Number(annee));
                return <SelectItem key={code} value={code}>{p.drapeau} {p.nom}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Année fiscale</Label>
          <Select value={annee} onValueChange={(v) => { setAnnee(v); setTauxOverride(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANNEES_FISCALES.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Régime fiscal spécial (impatrié…) — uniquement si le pays en propose */}
      {regimesDispo.length > 0 && (
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Régime fiscal</Label>
          <Select value={regime || "__std__"} onValueChange={(v) => { setRegime(v === "__std__" ? "" : v); setTauxOverride(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__std__">Standard</SelectItem>
              {regimesDispo.map((r) => <SelectItem key={r.id} value={r.id}>{r.nom} (≈{(r.tauxSalarie * 100).toFixed(0)}%)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Paramètres personnels (résidence, famille) — cahier §5.1 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Résidence fiscale</Label>
          <Select value={residency} onValueChange={setResidency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RESIDENCE_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Situation familiale</Label>
          <Select value={marital} onValueChange={setMarital}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SITUATION_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <NumField label="Nombre d'enfants" value={enfants} onChange={setEnfants} placeholder="0" suffix="" />
      </div>

      {/* Saisie contrat */}
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Salaire brut annuel" value={salaireAnnuel} onChange={setSalaireAnnuel} placeholder="300000" />
        <NumField label="Durée du contrat" value={annees} onChange={setAnnees} placeholder="3" suffix="ans" />
        <NumField label="Âge du joueur" value={age} onChange={setAge} placeholder="25" suffix="ans" />
        <NumField label="Signing fee (prime signature)" value={signingFee} onChange={setSigningFee} placeholder="50000" />
        <NumField label="Primes garanties / an" value={primes} onChange={setPrimes} placeholder="0" />
        <NumField label="Avantages / an (voiture, logement…)" value={avantages} onChange={setAvantages} placeholder="0" />
        <NumField
          label={`Taux effectif salarié${tauxOverride === "" ? " (auto)" : ""}`}
          value={tauxOverride !== "" ? tauxOverride : (tauxSalarie * 100).toFixed(0)}
          onChange={setTauxOverride}
          placeholder="45"
          suffix="%"
        />
      </div>

      {res && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          {jeune && tauxOverride === "" && !regimeObj && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              Joueur de moins de {AGE_SEUIL_JEUNE} ans : abattement de {(ABATTEMENT_MOINS_23 * 100).toFixed(0)}% appliqué sur le taux effectif.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Net annuel (joueur)" value={fmtEUR(res.netAnnuel)} color="text-green-600" sub={`taux ${fmtPct(tauxSalarie)} · ${fisc.tier === "gros" ? "gros salaire" : "petit salaire"}${fisc.familyAdjust > 0 && tauxOverride === "" ? " · famille" : ""}`} />
            <Stat label="Net mensuel (joueur)" value={fmtEUR(res.netMensuel)} color="text-green-600" />
            <Stat label="Coût employeur / an (club)" value={fmtEUR(res.coutClubAnnuel)} color="text-orange-600" sub={`charges +${fmtPct(tauxPatronal)}`} />
            <Stat label="Package brut garanti (durée)" value={fmtEUR(res.packageGaranti)} color="text-slate-900" sub={`net estimé ${fmtEUR(res.netPackage)}`} />
          </div>

          {/* Cash-flow année par année */}
          {cashflow.length > 1 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">Cash-flow par année</div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs">
                    <tr>
                      <th className="text-left px-3 py-1.5 font-medium">Année</th>
                      <th className="text-right px-3 py-1.5 font-medium">Net joueur</th>
                      <th className="text-right px-3 py-1.5 font-medium">Coût club</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashflow.map((r) => (
                      <tr key={r.annee} className="border-t border-slate-100">
                        <td className="px-3 py-1.5 text-slate-600">Année {r.annee}</td>
                        <td className="px-3 py-1.5 text-right font-medium text-green-700">{fmtEUR(r.net)}</td>
                        <td className="px-3 py-1.5 text-right font-medium text-orange-700">{fmtEUR(r.coutClub)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold">
                    <tr className="border-t border-slate-200">
                      <td className="px-3 py-1.5 text-slate-700">Total</td>
                      <td className="px-3 py-1.5 text-right text-green-700">{fmtEUR(cashflow.reduce((s, r) => s + r.net, 0))}</td>
                      <td className="px-3 py-1.5 text-right text-orange-700">{fmtEUR(cashflow.reduce((s, r) => s + r.coutClub, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              {regimeObj
                ? `Régime « ${regimeObj.nom} » appliqué (taux estimé). `
                : "Taux effectifs estimés (impôt + cotisations), hors régimes spéciaux. "}
              Modifiez le « taux effectif » pour affiner. À valider par un fiscaliste avant usage contractuel.
            </span>
          </div>
        </div>
      )}

      {!res && (
        <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-6">
          <Wallet className="w-4 h-4" /> Saisissez un salaire brut annuel pour lancer le calcul.
        </div>
      )}
    </div>
  );
}
