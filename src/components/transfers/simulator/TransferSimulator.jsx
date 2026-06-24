import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Wallet, Briefcase, ArrowRightLeft, PiggyBank, UserCircle, ShieldCheck } from "lucide-react";
import SalarySimulator from "./SalarySimulator";
import AgentCommissionSimulator from "./AgentCommissionSimulator";
import TransferFeeSimulator from "./TransferFeeSimulator";
import ComplianceChecker from "./ComplianceChecker";
import BudgetSimulator from "../BudgetSimulator";

const MANUEL = "__manuel__";

const MODULES = [
  { key: "salaire",     label: "Salaire (brut↔net)", icon: Wallet },
  { key: "commission",  label: "Commission agent",   icon: Briefcase },
  { key: "transfert",   label: "Transfert",          icon: ArrowRightLeft },
  { key: "conformite",  label: "Conformité",         icon: ShieldCheck },
  { key: "budget",      label: "Faisabilité budget", icon: PiggyBank },
];

export default function TransferSimulator({ teams, players, teamPlayers }) {
  const [module, setModule] = useState("salaire");
  const [playerId, setPlayerId] = useState(MANUEL);

  const selectedPlayer = playerId === MANUEL ? null : players.find((p) => p.id === playerId) || null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Simulateur de transfert
        </CardTitle>
        <p className="text-xs text-slate-500">
          Choisissez un joueur pour préremplir les données, puis simulez : net joueur, coût club, net vendeur et commissions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélecteur de joueur — préremplit les modules */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
          <Label className="text-xs font-medium text-blue-800 mb-1.5 flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5" /> Joueur (préremplissage automatique)
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
          {selectedPlayer && (
            <p className="text-[11px] text-blue-600 mt-1.5">
              Données préremplies depuis la fiche de <b>{selectedPlayer.nom}</b> — modifiables dans chaque module.
            </p>
          )}
        </div>

        {/* Sous-onglets des modules */}
        <div className="bg-slate-100 rounded-xl p-1 flex gap-1 overflow-x-auto">
          {MODULES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setModule(key)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                module === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {module === "salaire" && <SalarySimulator player={selectedPlayer} />}
        {module === "commission" && <AgentCommissionSimulator player={selectedPlayer} />}
        {module === "transfert" && <TransferFeeSimulator player={selectedPlayer} />}
        {module === "conformite" && <ComplianceChecker player={selectedPlayer} />}
        {module === "budget" && (
          <BudgetSimulator teams={teams} players={players} teamPlayers={teamPlayers} />
        )}
      </CardContent>
    </Card>
  );
}
