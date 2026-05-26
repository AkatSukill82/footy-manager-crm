import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Users, Calendar, Bell } from "lucide-react";
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
  });

  const createReminderMutation = useMutation({
    mutationFn: (data) => base44.entities.Reminder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['all-reminders'] });
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, statut }) => base44.entities.Reminder.update(id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['all-reminders'] });
    },
  });

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const upcomingReminders = allReminders.filter(r => r.statut !== "Terminé").slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Phone className="w-8 h-8 text-blue-600" />
          {t(lang, 'contacts.title')}
        </h1>
        <p className="text-slate-600 mt-1">{t(lang, 'contacts.subtitle')}</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("contacts")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "contacts"
              ? "border-b-2 border-green-600 text-green-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          {t(lang, 'contacts.tabContacts')}
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "reminders"
              ? "border-b-2 border-green-600 text-green-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          {t(lang, 'contacts.tabReminders')}
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "calendar"
              ? "border-b-2 border-green-600 text-green-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{t(lang, 'contacts.upcomingReminders')}</h3>
                {upcomingReminders.length === 0 ? (
                  <p className="text-blue-700">{t(lang, 'contacts.noReminders')}</p>
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
  );
}