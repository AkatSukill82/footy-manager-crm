import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Wallet, Briefcase, ArrowRightLeft, PiggyBank, UserCircle, ShieldCheck, GraduationCap, GitCompare, History, Layers } from "lucide-react";
import SalarySimulator from "./SalarySimulator";
import AgentCommissionSimulator from "./AgentCommissionSimulator";
import TransferFeeSimulator from "./TransferFeeSimulator";
import TrainingRewardsSimulator from "./TrainingRewardsSimulator";
import ComplianceChecker from "./ComplianceChecker";
import ScenarioComparator from "./ScenarioComparator";
import DealSimulator from "./DealSimulator";
import SimulationAuditLog from "./SimulationAuditLog";
import BudgetSimulator from "../BudgetSimulator";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { isCurrentChef } from "@/lib/org";

const MANUEL = "__manuel__";

const MODULES = [
  { key: "deal",        label: "Simulation 360", icon: Layers },
  { key: "salaire",     label: "Salaire (brut↔net)", icon: Wallet },
  { key: "commission",  label: "Commission agent",   icon: Briefcase },
  { key: "transfert",   label: "Transfert",          icon: ArrowRightLeft },
  { key: "formation",   label: "Formation",          icon: GraduationCap },
  { key: "conformite",  label: "Conformité",         icon: ShieldCheck },
  { key: "scenarios",   label: "Scénarios",          icon: GitCompare },
  { key: "budget",      label: "Faisabilité budget", icon: PiggyBank },
];

// Rôle (cahier §2) → modules recommandés. "deal" (Simulation 360) toujours en tête.
const ROLES = [
  { id: "complet",  nom: "Tous les modules" },
  { id: "joueur",   nom: "Joueur" },
  { id: "agent",    nom: "Agent" },
  { id: "acheteur", nom: "Club acheteur" },
  { id: "vendeur",  nom: "Club vendeur" },
];
const ROLE_MODULES = {
  complet:  MODULES.map((m) => m.key),
  joueur:   ["deal", "salaire", "conformite"],
  agent:    ["deal", "commission", "conformite"],
  acheteur: ["deal", "salaire", "transfert", "formation", "budget", "conformite"],
  vendeur:  ["deal", "transfert", "formation", "conformite"],
};

export default function TransferSimulator({ teams, players, teamPlayers }) {
  const [module, setModule] = useState("deal");
  const [playerId, setPlayerId] = useState(MANUEL);
  const [role, setRole] = useState("complet");

  const user = useCurrentUser();
  // Le journal global est réservé à l'admin du groupe (rôle admin ou chef/CEO).
  const isAdmin = user?.role === "admin" || isCurrentChef();

  const allowed = ROLE_MODULES[role] || ROLE_MODULES.complet;
  let modules = MODULES.filter((m) => allowed.includes(m.key));
  if (isAdmin) modules = [...modules, { key: "journal", label: "Journal (admin)", icon: History }];

  // Si le module courant n'est plus visible après changement de rôle, on bascule sur le 1er.
  useEffect(() => {
    if (!modules.some((m) => m.key === module)) setModule(modules[0]?.key || "deal");
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Choix du rôle — filtre les modules pertinents (cahier §2) */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
            <Label className="text-xs font-medium text-indigo-800 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Votre rôle dans le deal
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-indigo-600 mt-1.5">Affiche les modules utiles à votre rôle. « Simulation 360 » donne les 4 lectures du deal.</p>
          </div>

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
                Préremplies depuis la fiche de <b>{selectedPlayer.nom}</b> — modifiables.
              </p>
            )}
          </div>
        </div>

        {/* Sous-onglets des modules */}
        <div className="bg-slate-100 rounded-xl p-1 flex gap-1 overflow-x-auto">
          {modules.map(({ key, label, icon: Icon }) => (
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

        {module === "deal" && <DealSimulator player={selectedPlayer} />}
        {module === "salaire" && <SalarySimulator player={selectedPlayer} />}
        {module === "commission" && <AgentCommissionSimulator player={selectedPlayer} />}
        {module === "transfert" && <TransferFeeSimulator player={selectedPlayer} />}
        {module === "formation" && <TrainingRewardsSimulator player={selectedPlayer} />}
        {module === "conformite" && <ComplianceChecker player={selectedPlayer} />}
        {module === "scenarios" && <ScenarioComparator />}
        {module === "budget" && (
          <BudgetSimulator teams={teams} players={players} teamPlayers={teamPlayers} />
        )}
        {module === "journal" && isAdmin && <SimulationAuditLog />}
      </CardContent>
    </Card>
  );
}
