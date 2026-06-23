import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Info } from "lucide-react";
import { PAYS_CODES, ANNEES_FISCALES, TAX_YEAR_DEFAULT, getTaxProfile } from "../../../lib/taxProfiles";
import { packageBrut, netFromBrut, coutEmployeur, fmtEUR, fmtPct, toNum } from "../../../lib/transferCalc";

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

export default function SalarySimulator() {
  const [pays, setPays] = useState("FR");
  const [annee, setAnnee] = useState(String(TAX_YEAR_DEFAULT));
  const [salaireAnnuel, setSalaireAnnuel] = useState("");
  const [annees, setAnnees] = useState("3");
  const [signingFee, setSigningFee] = useState("");
  const [primes, setPrimes] = useState("");
  const [avantages, setAvantages] = useState("");
  // Taux effectif éditable, pré-rempli depuis le profil pays/année
  const [tauxOverride, setTauxOverride] = useState("");

  const profil = getTaxProfile(pays, Number(annee));
  const tauxSalarie = tauxOverride !== "" ? toNum(tauxOverride) / 100 : (profil?.tauxSalarie ?? 0);
  const tauxPatronal = profil?.tauxPatronal ?? 0;

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

  return (
    <div className="space-y-4">
      {/* Pays & année */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Pays (fiscalité)</Label>
          <Select value={pays} onValueChange={(v) => { setPays(v); setTauxOverride(""); }}>
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

      {/* Saisie contrat */}
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Salaire brut annuel" value={salaireAnnuel} onChange={setSalaireAnnuel} placeholder="300000" />
        <NumField label="Durée du contrat" value={annees} onChange={setAnnees} placeholder="3" suffix="ans" />
        <NumField label="Signing fee (prime signature)" value={signingFee} onChange={setSigningFee} placeholder="50000" />
        <NumField label="Primes garanties / an" value={primes} onChange={setPrimes} placeholder="0" />
        <NumField label="Avantages / an (voiture, logement…)" value={avantages} onChange={setAvantages} placeholder="0" />
        <NumField
          label={`Taux effectif salarié${tauxOverride === "" ? " (auto)" : ""}`}
          value={tauxOverride !== "" ? tauxOverride : (profil ? (profil.tauxSalarie * 100).toFixed(0) : "")}
          onChange={setTauxOverride}
          placeholder="45"
          suffix="%"
        />
      </div>

      {res && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Net annuel (joueur)" value={fmtEUR(res.netAnnuel)} color="text-green-600" sub={`taux ${fmtPct(tauxSalarie)}`} />
            <Stat label="Net mensuel (joueur)" value={fmtEUR(res.netMensuel)} color="text-green-600" />
            <Stat label="Coût employeur / an (club)" value={fmtEUR(res.coutClubAnnuel)} color="text-orange-600" sub={`charges +${fmtPct(tauxPatronal)}`} />
            <Stat label="Package brut garanti (durée)" value={fmtEUR(res.packageGaranti)} color="text-slate-900" sub={`net estimé ${fmtEUR(res.netPackage)}`} />
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Taux effectifs estimés (impôt + cotisations), hors régimes spéciaux (loi Beckham, ruling 30 %, impatriés…).
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
