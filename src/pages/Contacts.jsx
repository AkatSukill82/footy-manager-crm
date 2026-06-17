import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Users, Calendar, Bell, AlertCircle, X } from "lucide-react";
import ContactHistory from "../components/contacts/ContactHistory";
import ContactForm from "../components/contacts/ContactForm";
import RemindersList from "../components/contacts/RemindersList";
import ReminderForm from "../components/contacts/ReminderForm";
import ContractCalendar from "../components/contacts/ContractCalendar";
import { useCurrentUser } from "../lib/useCurrentUser";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

export default function ContactsPage() {
  const { lang } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");
  const [mutationError, setMutationError] = useState(null);
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const userEmail = user?.email;

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', selectedPlayerId, userEmail],
    queryFn: () => base44.entities.Contact.filter({
      player_id: selectedPlayerId,
      created_by: userEmail
    }),
    enabled: !!selectedPlayerId && !!userEmail,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', selectedPlayerId, userEmail],
    queryFn: () => base44.entities.Reminder.filter({
      player_id: selectedPlayerId,
      created_by: userEmail
    }),
    enabled: !!selectedPlayerId && !!userEmail,
  });

  const { data: allReminders = [] } = useQuery({
    queryKey: ['all-reminders', userEmail],
    queryFn: () => base44.entities.Reminder.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const createContactMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la création du contact"),
  });

  const createReminderMutation = useMutation({
    mutationFn: (data) => base44.entities.Reminder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['all-reminders'] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la création du rappel"),
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, statut }) => base44.entities.Reminder.update(id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['all-reminders'] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la mise à jour du rappel"),
  });

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const upcomingReminders = allReminders.filter(r => r.statut !== "Terminé").slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {mutationError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="hover:text-red-900"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Phone className="w-6 h-6 text-slate-600" />
          {t(lang, 'contacts.title')}
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{t(lang, 'contacts.subtitle')}</p>
      </div>

      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-sm">
        <button
          onClick={() => setActiveTab("contacts")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "contacts"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Phone className="w-3.5 h-3.5 inline mr-1.5" />
          {t(lang, 'contacts.tabContacts')}
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "reminders"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Bell className="w-3.5 h-3.5 inline mr-1.5" />
          {t(lang, 'contacts.tabReminders')}
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "calendar"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
          {t(lang, 'contacts.tabCalendar')}
        </button>
      </div>

      {activeTab !== "calendar" && (
        <div className="flex items-center gap-4">
          <label className="font-medium text-slate-700">{t(lang, 'contacts.selectPlayer')}</label>
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder={t(lang, 'contacts.selectPlayerPlh')} />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.nom} - {player.poste}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPlayer && (
            <div className="text-sm text-slate-600">
              {selectedPlayer.club_actuel || t(lang, 'players.noClub')}
            </div>
          )}
        </div>
      )}

      {activeTab === "contacts" && (
        <div>
          {!selectedPlayerId ? (
            <div className="text-center py-20 bg-slate-50 rounded-lg">
              <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600">{t(lang, 'contacts.emptySelect')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ContactHistory contacts={contacts} />
              </div>
              <div>
                <ContactForm 
                  playerId={selectedPlayerId} 
                  onSubmit={(data) => createContactMutation.mutate(data)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "reminders" && (
        <div>
          {!selectedPlayerId ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-2">{t(lang, 'contacts.upcomingReminders')}</h3>
                {upcomingReminders.length === 0 ? (
                  <p className="text-slate-500 text-sm">{t(lang, 'contacts.noReminders')}</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingReminders.map(reminder => (
                      <div key={reminder.id} className="bg-white p-3 rounded">
                        <div className="font-medium">{reminder.titre}</div>
                        <div className="text-sm text-slate-600">
                          {new Date(reminder.date_rappel).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-center py-10 bg-slate-50 rounded-lg">
                <Bell className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600">{t(lang, 'contacts.emptyReminders')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RemindersList 
                  reminders={reminders}
                  onUpdateStatus={(id, statut) => updateReminderMutation.mutate({ id, statut })}
                />
              </div>
              <div>
                <ReminderForm 
                  playerId={selectedPlayerId} 
                  onSubmit={(data) => createReminderMutation.mutate(data)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "calendar" && (
        <ContractCalendar players={players} />
      )}
    </div>
    </div>
  );
}