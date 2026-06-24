import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, UserCircle, Layers, ArrowRightLeft } from "lucide-react";
import DealSimulator from "./DealSimulator";

const MANUEL = "__manuel__";

// Rôle (cahier §2) — pilote les blocs affichés dans la Simulation 360.
const ROLES = [
  { id: "complet",  nom: "Tous les acteurs (360°)" },
  { id: "joueur",   nom: "Joueur" },
  { id: "agent",    nom: "Agent" },
  { id: "acheteur", nom: "Club acheteur" },
  { id: "vendeur",  nom: "Club vendeur" },
];

// Type d'opération (cahier §3) — active/désactive les volets transfert/vendeur.
const OPERATIONS = [
  { id: "transfert_payant", nom: "Transfert payant" },
  { id: "joueur_libre",     nom: "Joueur libre" },
  { id: "pret",             nom: "Prêt simple" },
  { id: "pret_option",      nom: "Prêt + option/obligation" },
  { id: "renouvellement",   nom: "Renouvellement" },
  { id: "renegociation",    nom: "Renégociation" },
  { id: "resiliation",      nom: "Résiliation / rupture" },
];

export default function TransferSimulator({ players = [], openSim = null }) {
  const [playerId, setPlayerId] = useState(MANUEL);
  const [role, setRole] = useState("complet");
  const [operation, setOperation] = useState("transfert_payant");

  const selectedPlayer = playerId === MANUEL ? null : players.find((p) => p.id === playerId) || null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Simulation 360 — transfert multi-acteurs
        </CardTitle>
        <p className="text-xs text-slate-500">
          Le même deal lu par les 4 acteurs : net joueur, coût total acheteur, net vendeur et profit agent, avec alertes et cash-flow.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Rôle (§2) */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
            <Label className="text-xs font-medium text-indigo-800 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Votre rôle
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Type d'opération (§3) */}
          <div className="bg-violet-50/60 border border-violet-100 rounded-xl p-3">
            <Label className="text-xs font-medium text-violet-800 mb-1.5 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Type d'opération
            </Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPERATIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Joueur — préremplissage automatique */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
            <Label className="text-xs font-medium text-blue-800 mb-1.5 flex items-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5" /> Joueur (préremplissage)
            </Label>
            <Select value={playerId} onValueChange={setPlayerId}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={MANUEL}>Saisie manuelle (aucun joueur)</SelectItem>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom}{p.age ? ` · ${p.age} ans` : ""}{p.club_actuel ? ` · ${p.club_actuel}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DealSimulator player={selectedPlayer} role={role} operation={operation} openSim={openSim} />
      </CardContent>
    </Card>
  );
}
