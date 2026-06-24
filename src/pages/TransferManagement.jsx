import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calculator, History } from "lucide-react";
import TransferSimulator from "../components/transfers/simulator/TransferSimulator";
import SimulationHistory from "../components/transfers/simulator/SimulationHistory";
import { useCurrentUser } from "../lib/useCurrentUser";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

export default function TransferManagementPage() {
  const location = useLocation();
  const dealPrefill = location.state?.dealPrefill || null; // depuis un dossier de recrutement
  const [activeTab, setActiveTab] = useState("simulator");
  const [openSim, setOpenSim] = useState(null);
  const { lang } = useLanguage();
  const user = useCurrentUser();

  const { data: players = [] } = useQuery({
    queryKey: ["players", user?.id],
    queryFn: () => base44.entities.Player.filter({}),
    enabled: !!user?.id,
  });

  // Ouvrir une simulation depuis l'onglet Historique → la charger dans le 360.
  const handleOpenFromHistory = (sim) => {
    setOpenSim(sim); // nouvel objet à chaque clic → recharge même si on rouvre la même
    setActiveTab("simulator");
  };

  const tabClass = (active) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium transition-all text-sm ${
      active ? "bg-slate-900 text-white shadow-lg" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 truncate">{t(lang, "transfers.title")}</h1>
          <p className="text-slate-500 text-sm mt-0.5 hidden md:block">{t(lang, "transfers.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
          <div className="flex gap-1">
            <button onClick={() => setActiveTab("simulator")} className={tabClass(activeTab === "simulator")}>
              <Calculator className="w-4 h-4 flex-shrink-0" /> {t(lang, "transfers.tabSimulator")}
            </button>
            <button onClick={() => setActiveTab("history")} className={tabClass(activeTab === "history")}>
              <History className="w-4 h-4 flex-shrink-0" /> {t(lang, "transfers.tabHistory")}
            </button>
          </div>
        </div>

        {/* Les deux onglets restent montés (visibilité togglée) pour préserver l'état du 360 */}
        <div className={activeTab === "simulator" ? "" : "hidden"}>
          <TransferSimulator players={players} openSim={openSim} prefill={dealPrefill} />
        </div>
        <div className={activeTab === "history" ? "" : "hidden"}>
          <SimulationHistory onOpen={handleOpenFromHistory} />
        </div>
      </div>
    </div>
  );
}
