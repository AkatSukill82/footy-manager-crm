import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  Users, Star, LogOut, BarChart3, Bell, Phone, Shield,
  FileText, Network, ArrowRightLeft, Menu, X, Building2,
  Sparkles, Newspaper, FileSpreadsheet, CalendarDays, UserCircle,
  ClipboardList, Columns,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Toaster } from "@/components/ui/sonner";
import { useLanguage } from "./lib/LanguageContext";
import { t } from "./i18n/translations";
import { useQuery } from "@tanstack/react-query";

const navItems = (lang) => [
  { name: "Dashboard",           key: "dashboard",  icon: BarChart3 },
  { name: "Players",             key: "players",    icon: Users },
  { name: "Clubs",               key: "clubs",      icon: Building2 },
  { name: "MyWatchList",         key: "watchlist",  icon: Star },
  { name: "Alerts",              key: "alerts",     icon: Bell },
  { name: "ClubContacts",        key: "contacts",   icon: Phone },
  { name: "Teams",               key: "teams",      icon: Shield },
  { name: "TransferManagement",  key: "transfers",  icon: ArrowRightLeft },
  { name: "Reports",             key: "reports",    icon: FileText },
  { name: "AgentNetwork",        key: "network",    icon: Network },
  { name: "Calendar",            key: "calendar",   icon: CalendarDays },
  { name: "PredictiveDashboard", key: "predictive", icon: Sparkles },
  { name: "News",                key: "news",       icon: Newspaper },
  { name: "ScoutingIA",          key: "scouting",   icon: Sparkles },
  { name: "ImportExcel",         key: "import",     icon: FileSpreadsheet },
  { name: "Organization",        key: "organization",    icon: Building2 },
  { name: "ScoutingReports",     key: "scouting_reports", icon: ClipboardList, label: "Scouting" },
  { name: "Pipeline",            key: "pipeline",        icon: Columns,       label: "Pipeline" },

].map(item => ({ ...item, label: item.label || t(lang, `nav.${item.key}`) }));

const bottomPrimary = ["Dashboard", "Players", "Teams", "TransferManagement", "Clubs"];

export default function Layout({ children, currentPageName }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { lang } = useLanguage();
  const items = navItems(lang);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ── DESKTOP SIDEBAR (fixed) ── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-white shadow-[2px_0_20px_rgba(0,0,0,0.06)] flex-col z-30">

        {/* Logo */}
        <div className="p-5 border-b border-slate-100 flex-shrink-0">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900">FDM</div>
              <div className="text-xs text-slate-400">Football Data Manager</div>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/25"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="p-3 border-t border-slate-100 space-y-0.5 flex-shrink-0">
          <Link
            to={createPageUrl("Profile")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              currentPageName === "Profile"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <span className="font-medium text-sm truncate">{t(lang, "nav.profile")}</span>
          </Link>

          <button
            onClick={() => base44.auth.logout("/login")}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-sm">{t(lang, "nav.logout")}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT (offset for fixed sidebar) ── */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 md:ml-64">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl">
        <div className="flex items-center h-16">
          {bottomPrimary.map((pageName) => {
            const item = items.find(n => n.name === pageName);
            if (!item) return null;
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all ${
                  isActive ? "text-green-600" : "text-slate-400"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium leading-none truncate max-w-[56px]">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-8 bg-green-500 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all ${
              drawerOpen ? "text-green-600" : "text-slate-400"
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{t(lang, "nav.more")}</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-900">FDM</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-4">
              {items.filter(i => !bottomPrimary.includes(i.name)).map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.name;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}

              {/* Profile in drawer */}
              <Link
                to={createPageUrl("Profile")}
                onClick={() => setDrawerOpen(false)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                  currentPageName === "Profile"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <UserCircle className="w-6 h-6" />
                <span className="text-xs font-medium text-center leading-tight">{t(lang, "nav.profile")}</span>
              </Link>
            </div>

            <div className="px-4 pb-6">
              <button
                onClick={() => { base44.auth.logout("/login"); setDrawerOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-500 bg-red-50 rounded-xl font-medium"
              >
                <LogOut className="w-5 h-5" />
                {t(lang, "nav.logout")}
              </button>
            </div>
          </div>
        </>
      )}

      <Toaster position="top-right" richColors />
    </div>
  );
}