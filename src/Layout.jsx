import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  Users, Star, LogOut, BarChart3, Bell, Phone, Shield,
  FileText, Network, ArrowRightLeft, Menu, X, Building2,
  Sparkles, Newspaper, FileSpreadsheet, CalendarDays, UserCircle,
  ClipboardList, Columns, ChevronDown, Search, GitCompare, Wallet, Store,
  Sun, Moon,
} from "lucide-react";
import { useTheme } from "./lib/ThemeContext";
import { base44 } from "@/api/base44Client";
import { Toaster } from "@/components/ui/sonner";
import { useLanguage } from "./lib/LanguageContext";
import { BRAND_NAME, BRAND_SHORT } from "./lib/brand";
import { t } from "./i18n/translations";
import { useQuery } from "@tanstack/react-query";
import GlobalSearch from "./components/ui/GlobalSearch";

// Pages principales — toujours visibles
const CORE_PAGES = ["Dashboard", "Players", "Clubs", "MyWatchList", "ClubContacts", "Organization"];
// Outils — groupe repliable
const TOOLS_PAGES = ["Comparator", "TransferManagement", "Teams", "News", "Calendar"];
// Avancé — groupe repliable
const ADVANCED_PAGES = ["Pipeline", "Finance", "Marketplace", "ScoutingReports", "Alerts", "Reports", "PredictiveDashboard", "AgentNetwork", "ImportExcel"];

const ALL_ITEMS = (lang) => [
  { name: "Dashboard",           key: "dashboard",        icon: BarChart3 },
  { name: "Players",             key: "players",          icon: Users },
  { name: "Clubs",               key: "clubs",            icon: Building2 },
  { name: "MyWatchList",         key: "watchlist",        icon: Star },
  { name: "Pipeline",            key: "pipeline",         icon: Columns,       label: "Pipeline" },
  { name: "Finance",             key: "finance",          icon: Wallet,        label: "Finance" },
  { name: "Marketplace",         key: "marketplace",      icon: Store,         label: "Marketplace" },
  { name: "ScoutingReports",     key: "scouting_reports", icon: ClipboardList, label: "Scouting" },
  { name: "Comparator",          key: "comparator",       icon: GitCompare,    label: "Comparateur" },
  { name: "Alerts",              key: "alerts",           icon: Bell },
  { name: "ClubContacts",        key: "contacts",         icon: Phone },
  { name: "TransferManagement",  key: "transfers",        icon: ArrowRightLeft },
  { name: "Teams",               key: "teams",            icon: Shield },
  { name: "News",                key: "news",             icon: Newspaper },
  { name: "Calendar",            key: "calendar",         icon: CalendarDays },
  { name: "Reports",             key: "reports",          icon: FileText },
  { name: "PredictiveDashboard", key: "predictive",       icon: Sparkles },
  { name: "AgentNetwork",        key: "network",          icon: Network },
  { name: "ImportExcel",         key: "import",           icon: FileSpreadsheet },
  { name: "Organization",        key: "organization",     icon: Users },
].map(item => ({ ...item, label: item.label || t(lang, `nav.${item.key}`) }));

const navItems = (lang) => ALL_ITEMS(lang);
const bottomPrimary_items = ["Dashboard", "Players", "Pipeline", "Alerts", "Clubs"];

const bottomPrimary = bottomPrimary_items;

function NavGroup({ label, items, currentPageName, open, onToggle }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && items.map((item) => {
        const Icon = item.icon;
        const isActive = currentPageName === item.name;
        return (
          <Link
            key={item.name}
            to={createPageUrl(item.name)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isActive
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-sm truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { lang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const items = navItems(lang);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ── DESKTOP SIDEBAR (fixed) ── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-white shadow-[2px_0_20px_rgba(0,0,0,0.06)] flex-col z-30">

        {/* Logo */}
        <div className="p-5 border-b border-slate-100 flex-shrink-0">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <img src="/brand/logo.png" alt={BRAND_SHORT} className="w-10 h-10 rounded-xl object-contain flex-shrink-0" />
            <div>
              <div className="font-bold text-lg tracking-tight text-slate-900 leading-none">{BRAND_SHORT}</div>
              <div className="text-xs text-slate-400 leading-tight mt-0.5">{BRAND_NAME}</div>
            </div>
          </Link>
        </div>

        {/* Search button */}
        <div className="px-3 pb-2 flex-shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Rechercher…</span>
            <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Core pages — toujours visibles */}
          {items.filter(i => CORE_PAGES.includes(i.name)).map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-1">
            <NavGroup
              label="Outils"
              items={items.filter(i => TOOLS_PAGES.includes(i.name))}
              currentPageName={currentPageName}
              open={toolsOpen || TOOLS_PAGES.includes(currentPageName)}
              onToggle={() => setToolsOpen(o => !o)}
            />
          </div>

          <div className="pt-1">
            <NavGroup
              label="Avancé"
              items={items.filter(i => ADVANCED_PAGES.includes(i.name))}
              currentPageName={currentPageName}
              open={advancedOpen || ADVANCED_PAGES.includes(currentPageName)}
              onToggle={() => setAdvancedOpen(o => !o)}
            />
          </div>
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="p-3 border-t border-slate-100 space-y-0.5 flex-shrink-0">
          <Link
            to={createPageUrl("Profile")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              currentPageName === "Profile"
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <span className="font-medium text-sm truncate">{t(lang, "nav.profile")}</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
            <span className="font-medium text-sm">{t(lang, theme === "dark" ? "nav.lightMode" : "nav.darkMode")}</span>
          </button>

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
                  isActive ? "text-slate-900" : "text-slate-400"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium leading-none truncate max-w-[56px]">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-8 bg-slate-900 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all ${
              drawerOpen ? "text-slate-900" : "text-slate-400"
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
                <img src="/brand/logo.png" alt={BRAND_SHORT} className="w-8 h-8 rounded-lg object-contain" />
                <span className="font-bold text-slate-900">{BRAND_SHORT}</span>
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
                        ? "bg-slate-100 text-slate-900"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
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
                    ? "bg-slate-100 text-slate-900"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <UserCircle className="w-6 h-6" />
                <span className="text-xs font-medium text-center leading-tight">{t(lang, "nav.profile")}</span>
              </Link>
            </div>

            <div className="px-4 pb-6 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 py-3 text-slate-600 bg-slate-100 rounded-xl font-medium"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {t(lang, theme === "dark" ? "nav.lightMode" : "nav.darkMode")}
              </button>
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

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toaster position="top-right" richColors />
    </div>
  );
}