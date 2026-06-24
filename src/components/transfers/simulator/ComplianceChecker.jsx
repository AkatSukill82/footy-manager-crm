import React, { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { toNum, ageFromDob } from "../../../lib/transferCalc";

/**
 * Compliance Checker — vérifie les zones d'alerte d'une transaction (cours FIFA, p.17/19).
 * Calcule des ALERTES (rouge / orange / vert) ; ne bloque pas, mais signale.
 */
export default function ComplianceChecker({ player }) {
  const [age, setAge] = useState("");
  const [mandat, setMandat] = useState("oui");        // mandat de représentation actif ?
  const [repr, setRepr] = useState("joueur");          // qui l'agent représente
  const [tpi, setTpi] = useState("non");               // commission liée à un futur transfert (tiers) ?
  const [mode, setMode] = useState("fifa");            // cadre réglementaire

  useEffect(() => {
    if (!player) return;
    const a = player.age ?? ageFromDob(player.date_naissance);
    if (a != null) setAge(String(a));
  }, [player?.id]);

  const alerts = useMemo(() => {
    const a = [];
    const ageNum = age !== "" ? toNum(age) : null;

    if (ageNum != null && ageNum < 18) {
      a.push({ level: "red", titre: "Joueur mineur", msg: "Règles spécifiques de protection des mineurs (RSTP art. 19) + documents obligatoires. Transfert international très encadré (exceptions limitées)." });
    }
    if (mandat === "non") {
      a.push({ level: "red", titre: "Aucun mandat actif", msg: "Pas de base contractuelle claire pour facturer une commission. Régulariser un accord de représentation AVANT toute facturation." });
    }
    if (repr === "vendeur_joueur" || repr === "deux_clubs") {
      a.push({ level: "red", titre: "Double représentation interdite", msg: "Représenter club vendeur + joueur, ou les deux clubs, est une zone à risque de conflit d'intérêt (en principe interdit)." });
    } else if (repr === "joueur_acheteur") {
      a.push({ level: "amber", titre: "Double représentation encadrée", msg: "Joueur + club acheteur : autorisée uniquement avec accord écrit préalable de toutes les parties (consentements à documenter)." });
    }
    if (tpi === "oui") {
      a.push({ level: "red", titre: "TPI / droits futurs", msg: "Commission liée à un FUTUR transfert pour un agent ou un tiers = third-party influence/ownership, interdit par le RSTP. Zone rouge." });
    }
    if (mode === "fifa") {
      a.push({ level: "amber", titre: "Plafonds FFAR incertains", msg: "Certaines règles d'agents (plafonds, client-pays) sont suspendues/incertaines selon les juridictions (injonction allemande, Circulaire 1873). Vérifier le droit national applicable." });
    }
    if (!a.some((x) => x.level === "red")) {
      a.unshift({ level: "green", titre: "Pas de zone rouge", msg: "Aucun blocage détecté sur les points vérifiés. Estimation — à valider par un juriste du sport avant signature." });
    }
    return a;
  }, [age, mandat, repr, tpi, mode]);

  const STYLE = {
    red:   { box: "bg-red-50 border-red-200 text-red-800",       Icon: ShieldAlert,   ic: "text-red-500" },
    amber: { box: "bg-amber-50 border-amber-200 text-amber-800", Icon: AlertTriangle, ic: "text-amber-500" },
    green: { box: "bg-green-50 border-green-200 text-green-800", Icon: ShieldCheck,   ic: "text-green-600" },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Âge du joueur</Label>
          <Input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} placeholder="ex: 17" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Mandat de représentation actif ?</Label>
          <Select value={mandat} onValueChange={setMandat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui</SelectItem>
              <SelectItem value="non">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-slate-500 mb-1 block">L'agent représente…</Label>
          <Select value={repr} onValueChange={setRepr}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="joueur">Le joueur uniquement</SelectItem>
              <SelectItem value="club_acheteur">Le club acheteur uniquement</SelectItem>
              <SelectItem value="club_vendeur">Le club vendeur uniquement</SelectItem>
              <SelectItem value="joueur_acheteur">Joueur + club acheteur (double rep. encadrée)</SelectItem>
              <SelectItem value="vendeur_joueur">Club vendeur + joueur (à risque)</SelectItem>
              <SelectItem value="deux_clubs">Les deux clubs (à risque)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Commission sur un futur transfert (tiers) ?</Label>
          <Select value={tpi} onValueChange={setTpi}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="non">Non</SelectItem>
              <SelectItem value="oui">Oui</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Cadre réglementaire</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fifa">FIFA théorique</SelectItem>
              <SelectItem value="national">Association nationale</SelectItem>
              <SelectItem value="libre">Contrat libre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        {alerts.map((al, i) => {
          const s = STYLE[al.level];
          return (
            <div key={i} className={`flex items-start gap-2 border rounded-lg px-3 py-2 text-xs ${s.box}`}>
              <s.Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.ic}`} />
              <div><span className="font-semibold">{al.titre} — </span>{al.msg}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>Vérification indicative basée sur le RSTP / les FAQ FIFA. Les règles nationales et la fiscalité varient ; à valider par un juriste du sport avant tout engagement.</span>
      </div>
    </div>
  );
}
