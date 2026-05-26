import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function PlayersByAge({ players }) {
  const { lang } = useLanguage();
  const ageRanges = {
    "16-20": 0,
    "21-25": 0,
    "26-30": 0,
    "31-35": 0,
    "36+": 0
  };

  players.forEach(player => {
    const age = player.age;
    if (!age) return;
    
    if (age <= 20) ageRanges["16-20"]++;
    else if (age <= 25) ageRanges["21-25"]++;
    else if (age <= 30) ageRanges["26-30"]++;
    else if (age <= 35) ageRanges["31-35"]++;
    else ageRanges["36+"]++;
  });

  const data = Object.entries(ageRanges).map(([range, count]) => ({
    range,
    count
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(lang, 'dashboard.byAge')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}