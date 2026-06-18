import React from "react";
import { invokeFn } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Loader2, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

// Rumeurs de transfert scrapées depuis Transfermarkt (clubs intéressés + dates + source).
export default function PlayerRumors({ player }) {
  const { lang } = useLanguage();

  const hasRef = !!(player?.nom || player?.transfermarkt_id);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["rumors", "player", player?.id],
    enabled: hasRef,
    staleTime: 1000 * 60 * 60,   // 1h : les rumeurs bougent lentement
    retry: false,
    queryFn: async () => {
      const res = await invokeFn("transfermarktProxy", {
        action: "getRumors",
        transfermarkt_id: player.transfermarkt_id || undefined,
        query: player.nom,
        club: player.club_actuel,
      });
      if (!res?.ok) throw new Error(res?.error || t(lang, "session.rumors.error"));
      return res;
    },
  });

  if (!hasRef) return null;

  const rumors = data?.rumors || [];
  const sourceUrl = data?.source_url
    || `https://www.transfermarkt.com/x/geruechte/spieler/${player.transfermarkt_id || ""}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-rose-600" /> {t(lang, "session.rumors.title")}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Transfermarkt</span>
          </CardTitle>
          <Button onClick={() => refetch()} disabled={isFetching} variant="ghost" size="sm" className="h-7 w-7 p-0">
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            <span className="text-sm">{t(lang, "session.rumors.loading")}</span>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error?.message || t(lang, "session.rumors.error")}</span>
            <Button onClick={() => refetch()} size="sm" variant="ghost" className="h-7 gap-1 text-red-500 hover:text-red-700">
              <RefreshCw className="w-3 h-3" /> {t(lang, "session.rumors.retry")}
            </Button>
          </div>
        ) : rumors.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">{t(lang, "session.rumors.empty")}</p>
        ) : (
          <>
            {/* 3 rumeurs visibles, le reste accessible par scroll interne au bloc */}
            <div className="max-h-[210px] overflow-y-auto space-y-2 pr-1">
            {rumors.map((r, i) => (
              <a
                key={`${r.club_id}-${i}`}
                href={r.source_url || sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:border-rose-300 hover:bg-rose-50/40 transition-colors group"
              >
                <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {r.club_logo
                    ? <img src={r.club_logo} alt={r.club} className="w-full h-full object-contain" referrerPolicy="no-referrer" onError={(e) => { e.target.style.display = "none"; }} />
                    : <Megaphone className="w-4 h-4 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 group-hover:text-rose-700 truncate">{r.club}</span>
                    {r.probability && (
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">{r.probability}</Badge>
                    )}
                  </div>
                  {r.source_date && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {t(lang, "session.rumors.since")} {r.source_date}
                    </div>
                  )}
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-500 flex-shrink-0" />
              </a>
            ))}
            </div>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 pt-1"
            >
              {t(lang, "session.rumors.all")} <ExternalLink className="w-3 h-3" />
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}
