import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { fr, es, enUS } from "date-fns/locale";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const DATE_LOCALES = { fr, es, en: enUS };

export default function ContractCalendar({ players }) {
  const { lang } = useLanguage();
  const dateLocale = DATE_LOCALES[lang] || fr;
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getContractsForDay = (day) => {
    return players.filter(player => {
      if (!player.contrat_fin) return false;
      const contractDate = new Date(player.contrat_fin);
      return isSameDay(contractDate, day);
    });
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));

  const dayLabels = [
    t(lang, 'contacts.dayMon'),
    t(lang, 'contacts.dayTue'),
    t(lang, 'contacts.dayWed'),
    t(lang, 'contacts.dayThu'),
    t(lang, 'contacts.dayFri'),
    t(lang, 'contacts.daySat'),
    t(lang, 'contacts.daySun'),
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {t(lang, 'contacts.calTitle')}
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
            >
              ←
            </button>
            <span className="px-4 py-1 font-semibold text-slate-900">
              {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
            </span>
            <button
              onClick={nextMonth}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
            >
              →
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {dayLabels.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}

          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}

          {daysInMonth.map((day) => {
            const contracts = getContractsForDay(day);
            const hasContracts = contracts.length > 0;
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`p-2 min-h-[80px] rounded-lg border ${
                  isToday ? "border-green-500 bg-green-50" : "border-slate-200"
                } ${hasContracts ? "bg-orange-50 border-orange-300" : ""}`}
              >
                <div className={`text-sm font-semibold ${isToday ? "text-green-700" : "text-slate-700"}`}>
                  {format(day, "d")}
                </div>
                {hasContracts && (
                  <div className="mt-1">
                    <Badge className="bg-orange-600 text-white text-xs">
                      {contracts.length}
                    </Badge>
                    <div className="text-xs text-slate-600 mt-1 space-y-1">
                      {contracts.slice(0, 2).map(player => (
                        <div key={player.id} className="truncate">
                          {player.nom}
                        </div>
                      ))}
                      {contracts.length > 2 && (
                        <div className="text-xs text-slate-500">+{contracts.length - 2}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
