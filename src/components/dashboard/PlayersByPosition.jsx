import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function PlayersByPosition({ players }) {
  const positionCounts = players.reduce((acc, player) => {
    const poste = player.poste || "Non défini";
    acc[poste] = (acc[poste] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(positionCounts).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = [
    "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", 
    "#ef4444", "#ec4899", "#06b6d4", "#84cc16"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par poste</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}