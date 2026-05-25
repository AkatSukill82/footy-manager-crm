import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Check, Globe } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷", native: "Français" },
  { code: "es", label: "Español",  flag: "🇪🇸", native: "Español" },
  { code: "en", label: "English",  flag: "🇬🇧", native: "English" },
];

export default function ProfilePage() {
  const { lang, setLang } = useLanguage();
  const [saved, setSaved] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  const handleSelectLang = (code) => {
    setLang(code);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t(lang, "profile.title")}</h1>
            <p className="text-slate-500 text-sm">{t(lang, "profile.subtitle")}</p>
          </div>
        </div>

        {/* Account info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              {t(lang, "profile.account")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-500">{t(lang, "profile.email")}</span>
              <span className="text-sm font-medium text-slate-900">{user?.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500">{t(lang, "profile.role")}</span>
              <span className="text-sm font-medium text-slate-900">{t(lang, "profile.roleValue")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Language selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              {t(lang, "profile.language")}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">{t(lang, "profile.languageDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {LANGUAGES.map((l) => {
                const active = lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => handleSelectLang(l.code)}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      active
                        ? "border-green-500 bg-green-50 shadow-md shadow-green-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-4xl">{l.flag}</span>
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${active ? "text-green-700" : "text-slate-700"}`}>
                        {l.native}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Saved feedback */}
            <div className={`mt-4 flex items-center gap-2 text-sm text-green-600 transition-all duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>
              <Check className="w-4 h-4" />
              {t(lang, "profile.saved")}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
