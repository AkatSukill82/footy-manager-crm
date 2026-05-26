import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle, Sparkles, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { format } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function PersonalizedDashboard({ 
  negociations = [], 
  insights = [], 
  reminders = [],
  sharedContent = []
}) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const activeNegociations = negociations.filter(n => 
    n.statut !== "transfert_finalise" && n.statut !== "annule"
  ).slice(0, 5);

  const upcomingReminders = reminders
    .filter(r => r.statut !== "Terminé")
    .sort((a, b) => new Date(a.date_rappel) - new Date(b.date_rappel))
    .slice(0, 5);

  const recentInsights = insights
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 4);

  const recentSharedContent = sharedContent
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 3);

  const priorityActions = [
    ...activeNegociations.filter(n => n.priorite === "haute").map(n => ({
      type: "negociation",
      priority: "haute",
      title: `Négociation urgente`,
      description: n.club_acheteur,
      action: () => navigate(createPageUrl("TransferManagement"))
    })),
    ...upcomingReminders.filter(r => {
      const daysUntil = Math.floor((new Date(r.date_rappel) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3 && r.priorite === "Haute";
    }).map(r => ({
      type: "reminder",
      priority: "haute",
      title: r.titre,
      description: `Échéance: ${format(new Date(r.date_rappel), "dd/MM/yyyy")}`,
      action: () => navigate(createPageUrl("Contacts"))
    }))
  ].slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Actions prioritaires */}
      {priorityActions.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              {t(lang,'dashboard.priorityActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityActions.map((action, i) => (
              <div 
                key={i}
                onClick={action.action}
                className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="font-medium text-slate-900">{action.title}</div>
                  <div className="text-sm text-slate-600">{action.description}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-red-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Négociations en cours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t(lang,'dashboard.negotiations')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(createPageUrl("TransferManagement"))}
            >
              {t(lang,'common.seeAll')}
            </Button>
          </CardHeader>
          <CardContent>
            {activeNegociations.length === 0 ? (
              <p className="text-center text-slate-500 py-4">{t(lang,'dashboard.noNegotiations')}</p>
            ) : (
              <div className="space-y-3">
                {activeNegociations.map(neg => (
                  <div 
                    key={neg.id}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl("TransferManagement"))}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-slate-900">{neg.club_acheteur}</span>
                      <Badge className={
                        neg.priorite === "haute" ? "bg-red-100 text-red-800" :
                        neg.priorite === "moyenne" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }>
                        {neg.priorite}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{neg.statut.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-green-600">{neg.montant_propose}M€</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rappels à venir */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t(lang,'dashboard.reminders')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(createPageUrl("Contacts"))}
            >
              {t(lang,'common.seeAll')}
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <p className="text-center text-slate-500 py-4">{t(lang,'dashboard.noReminders')}</p>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map(reminder => {
                  const daysUntil = Math.floor((new Date(reminder.date_rappel) - new Date()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntil <= 3;
                  return (
                    <div 
                      key={reminder.id}
                      className={`p-3 rounded-lg transition-colors cursor-pointer ${
                        isUrgent ? "bg-red-50 hover:bg-red-100" : "bg-slate-50 hover:bg-slate-100"
                      }`}
                      onClick={() => navigate(createPageUrl("Contacts"))}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-slate-900">{reminder.titre}</span>
                        {isUrgent && <Badge className="bg-red-100 text-red-800">{t(lang,'dashboard.urgent')}</Badge>}
                      </div>
                      <div className="text-sm text-slate-600">
                        {format(new Date(reminder.date_rappel), "dd/MM/yyyy")} • {reminder.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights IA récents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t(lang,'dashboard.aiInsights')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl("AgentNetwork"))}
          >
            {t(lang,'common.seeAll')}
          </Button>
        </CardHeader>
        <CardContent>
          {recentInsights.length === 0 ? (
            <p className="text-center text-slate-500 py-4">{t(lang,'dashboard.noInsights')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentInsights.map(insight => (
                <div 
                  key={insight.id}
                  className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(createPageUrl("AgentNetwork"))}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      {insight.categorie.replace(/_/g, ' ')}
                    </Badge>
                    {insight.priority === "haute" && (
                      <Badge className="bg-red-100 text-red-800">{t(lang,'dashboard.highPriority')}</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">{insight.titre}</h4>
                  <p className="text-sm text-slate-700 line-clamp-2">{insight.contenu}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contenu partagé récent */}
      {recentSharedContent.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t(lang,'dashboard.recentShared')}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(createPageUrl("AgentNetwork"))}
            >
              {t(lang,'common.seeAll')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentSharedContent.map(content => (
                <div 
                  key={content.id}
                  className="p-4 bg-slate-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(createPageUrl("AgentNetwork"))}
                >
                  <Badge className="mb-2">{content.type.replace(/_/g, ' ')}</Badge>
                  <h4 className="font-semibold text-slate-900 mb-1">{content.titre}</h4>
                  <p className="text-sm text-slate-600 line-clamp-2">{content.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}