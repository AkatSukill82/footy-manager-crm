import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Building2, MapPin, Users, TrendingUp, Trophy,
  Edit2, Trash2, Calendar, Phone, Mail, Globe, User, ExternalLink,
  Instagram, Twitter, Palette, Link, AlertCircle, X
} from "lucide-react";
import TransfermarktImage from "../components/ui/TransfermarktImage";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import ClubForm from "../components/clubs/ClubForm";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import ActivityLogList from "../components/activity/ActivityLogList";
import ClubExternalLinks from "../components/clubs/ClubExternalLinks";
import ClubSquad from "../components/clubs/ClubSquad";
import UpcomingMatches from "../components/players/UpcomingMatches";

function Row({ label, value, valueClass = "font-medium text-slate-900" }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-slate-50 last:border-0 gap-2">
      <span className="text-slate-500 text-sm shrink-0">{label}</span>
      <span className={`${valueClass} text-sm text-right break-all`}>{value}</span>
    </div>
  );
}

function ContactLink({ href, icon: Icon, label, value, color = "blue" }) {
  if (!value) return null;
  const colorMap = {
    blue: "bg-blue-100 text-blue-600 hover:bg-blue-50",
    green: "bg-green-100 text-green-600 hover:bg-green-50",
    slate: "bg-slate-200 text-slate-600 hover:bg-slate-100",
    purple: "bg-purple-100 text-purple-600 hover:bg-purple-50",
    pink: "bg-pink-100 text-pink-600 hover:bg-pink-50",
    sky: "bg-sky-100 text-sky-600 hover:bg-sky-50",
  };
  return (
    <a
      href={href || "#"}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-slate-900 truncate text-sm">{value}</p>
      </div>
      {href?.startsWith("http") && <ExternalLink className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
    </a>
  );
}

export default function ClubDetailPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: club } = useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      const clubs = await base44.entities.Club.filter({ id: clubId });
      return clubs[0];
    },
    enabled: !!clubId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players-by-club', club?.nom],
    queryFn: () => base44.entities.Player.filter({ club_actuel: club.nom }),
    enabled: !!club?.nom,
  });

  const { data: clubContacts = [] } = useQuery({
    queryKey: ['club-contacts', clubId],
    queryFn: () => base44.entities.ClubContact.filter({ club_id: clubId }),
    enabled: !!clubId,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers-by-club', club?.nom],
    queryFn: async () => {
      const allTransfers = await base44.entities.Transfer.list('-date_transfert', 100);
      return allTransfers.filter(t => t.club_arrivee === club.nom || t.club_depart === club.nom);
    },
    enabled: !!club?.nom,
  });

  const updateClubMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Club.update(clubId, data);
      const changedFields = Object.keys(data).filter(k => club && data[k] !== club[k]);
      if (currentUser && changedFields.length > 0) {
        base44.entities.ActivityLog.create({
          entity_type: "Club",
          entity_id: clubId,
          entity_name: club?.nom || "",
          action: "update",
          champs_modifies: JSON.stringify(changedFields),
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['activityLogs', 'Club', clubId] });
      setIsEditing(false);
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la mise à jour du club"),
  });

  const deleteClubMutation = useMutation({
    mutationFn: () => base44.entities.Club.delete(clubId),
    onSuccess: () => navigate(createPageUrl("Clubs")),
    onError: (err) => setMutationError(err.message || "Erreur lors de la suppression du club"),
  });

  if (!club) return null;

  if (isEditing) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setIsEditing(false)} className="mb-4">← {t(lang,'clubDetail.cancel')}</Button>
          <ClubForm club={club} onSubmit={(data) => updateClubMutation.mutate(data)} onCancel={() => setIsEditing(false)} />
        </div>
      </div>
    );
  }

  const arrivals = transfers.filter(t => t.club_arrivee === club.nom);
  const departures = transfers.filter(t => t.club_depart === club.nom);

  const siteWebUrl = club.site_web
    ? (club.site_web.startsWith("http") ? club.site_web : `https://${club.site_web}`)
    : null;
  const hasClubContact = club.telephone_general || club.email_general || club.site_web || club.instagram || club.twitter;
  const hasPersonContact = club.contact_nom || club.contact_email || club.contact_telephone;
  const hasPresidentContact = club.president && (club.president_email || club.president_telephone);
  const hasCoachContact = club.entraineur && club.entraineur_email;
  const hasDSContact = club.directeur_sportif && (club.directeur_sportif_email || club.directeur_sportif_telephone);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate(createPageUrl("Clubs"))}>
        <ArrowLeft className="w-4 h-4 mr-2" /> {t(lang,'clubDetail.back')}
      </Button>
      {mutationError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="hover:text-red-900"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 md:gap-6 items-center">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
            <TransfermarktImage
              src={club.logo_url}
              alt={club.nom}
              className="w-full h-full object-contain p-2"
              fallback={<Building2 className="w-10 h-10 text-slate-400" />}
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900">{club.nom}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-slate-600 mt-1 text-sm">
              {(club.ville || club.pays) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />{[club.ville, club.pays].filter(Boolean).join(', ')}
                </span>
              )}
              {club.annee_fondation && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />{t(lang,'clubDetail.foundedIn', { year: club.annee_fondation })}
                </span>
              )}
              {club.ligue && <Badge variant="outline">{club.ligue}</Badge>}
              {club.categorie && <Badge className="bg-slate-100 text-slate-700">{club.categorie}</Badge>}
              {club.couleurs && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Palette className="w-3.5 h-3.5" />{club.couleurs}
                </span>
              )}
            </div>
            {club.adresse && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{club.adresse}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            if (confirm(t(lang,'clubDetail.deleteConfirm'))) deleteClubMutation.mutate();
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t(lang,'clubDetail.players'), value: players.length, color: "text-slate-900" },
          { label: t(lang,'clubDetail.transferBudget'), value: club.budget_transfert ? `${club.budget_transfert}M€` : "—", color: "text-slate-900" },
          { label: t(lang,'clubDetail.squadValue'), value: club.valeur_effectif ? `${club.valeur_effectif}M€` : "—", color: "text-slate-900" },
          { label: t(lang,'clubDetail.transfers'), value: transfers.length, color: "text-slate-900" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Liens externes */}
      <ClubExternalLinks club={club} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infos générales */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-slate-400" /> {t(lang,'clubDetail.generalInfo')}
          </p>
          <div>
            <Row label={t(lang,'clubDetail.stadium')} value={club.stade ? `${club.stade}${club.capacite_stade ? ` — ${club.capacite_stade.toLocaleString()} ${t(lang,'clubDetail.places')}` : ''}` : null} />
            <Row label={t(lang,'clubDetail.league')} value={club.ligue} />
            <Row label={t(lang,'clubDetail.country')} value={club.pays} />
            <Row label={t(lang,'clubDetail.city')} value={club.ville} />
            <Row label={t(lang,'clubDetail.founded')} value={club.annee_fondation} />
            <Row label={t(lang,'clubDetail.colors')} value={club.couleurs} />
            <Row label={t(lang,'clubDetail.address')} value={club.adresse} />
            {!club.stade && !club.ligue && !club.annee_fondation && (
              <p className="text-slate-400 italic text-xs">{t(lang,'clubDetail.noInfo')}</p>
            )}
          </div>
        </div>

        {/* Direction */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-slate-400" /> {t(lang,'clubDetail.management')}
          </p>
          <div className="space-y-2">
            {club.president && (
              <div className="p-2 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-400 mb-0.5">{t(lang,'clubDetail.president')}</p>
                <p className="font-semibold text-slate-900 text-sm">{club.president}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {club.president_email && (
                    <a href={`mailto:${club.president_email}`} className="text-xs text-slate-600 hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3" />{club.president_email}
                    </a>
                  )}
                  {club.president_telephone && (
                    <a href={`tel:${club.president_telephone}`} className="text-xs text-slate-600 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" />{club.president_telephone}
                    </a>
                  )}
                </div>
              </div>
            )}
            {club.entraineur && (
              <div className="p-2 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-400 mb-0.5">{t(lang,'clubDetail.coach')}</p>
                <p className="font-semibold text-slate-900 text-sm">{club.entraineur}</p>
                {club.entraineur_email && (
                  <a href={`mailto:${club.entraineur_email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" />{club.entraineur_email}
                  </a>
                )}
              </div>
            )}
            {club.directeur_sportif && (
              <div className="p-2 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-400 mb-0.5">{t(lang,'clubDetail.sportingDirector')}</p>
                <p className="font-semibold text-slate-900 text-sm">{club.directeur_sportif}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {club.directeur_sportif_email && (
                    <a href={`mailto:${club.directeur_sportif_email}`} className="text-xs text-slate-600 hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3" />{club.directeur_sportif_email}
                    </a>
                  )}
                  {club.directeur_sportif_telephone && (
                    <a href={`tel:${club.directeur_sportif_telephone}`} className="text-xs text-slate-600 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" />{club.directeur_sportif_telephone}
                    </a>
                  )}
                </div>
              </div>
            )}
            {!club.president && !club.entraineur && !club.directeur_sportif && (
              <p className="text-slate-400 italic text-xs">{t(lang,'clubDetail.noManagement')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact club */}
      {hasClubContact && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-slate-400" /> {t(lang,'clubDetail.contact')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ContactLink href={`tel:${club.telephone_general}`} icon={Phone} label={t(lang,'clubDetail.phone')} value={club.telephone_general} color="slate" />
            <ContactLink href={`mailto:${club.email_general}`} icon={Mail} label={t(lang,'clubDetail.email')} value={club.email_general} color="slate" />
            <ContactLink href={siteWebUrl} icon={Globe} label={t(lang,'clubDetail.website')} value={club.site_web} color="slate" />
            <ContactLink href={club.instagram ? `https://instagram.com/${club.instagram.replace('@','')}` : null} icon={Instagram} label={t(lang,'clubDetail.instagram')} value={club.instagram} color="slate" />
            <ContactLink href={club.twitter ? `https://twitter.com/${club.twitter.replace('@','')}` : null} icon={Twitter} label={t(lang,'clubDetail.twitter')} value={club.twitter} color="slate" />
          </div>
        </div>
      )}

      {/* Personne de contact */}
      {hasPersonContact && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-slate-400" /> {t(lang,'clubDetail.contactPerson')}
          </p>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex-1 space-y-1">
              {club.contact_nom && <p className="font-bold text-slate-900">{club.contact_nom}</p>}
              {club.contact_poste && <p className="text-sm text-slate-500">{club.contact_poste}</p>}
              <div className="flex flex-wrap gap-3 mt-2">
                {club.contact_email && (
                  <a href={`mailto:${club.contact_email}`} className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900">
                    <Mail className="w-3.5 h-3.5" /> {club.contact_email}
                  </a>
                )}
                {club.contact_telephone && (
                  <a href={`tel:${club.contact_telephone}`} className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900">
                    <Phone className="w-3.5 h-3.5" /> {club.contact_telephone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contacts importés (ClubContact) */}
      {clubContacts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-400" /> Contacts ({clubContacts.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clubContacts.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{c.nom}</p>
                  {c.poste && <p className="text-xs text-slate-500">{c.poste}</p>}
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-slate-600 hover:underline">
                        <Mail className="w-3 h-3" />{c.email}
                      </a>
                    )}
                    {c.telephone && (
                      <a href={`tel:${c.telephone}`} className="flex items-center gap-1 text-xs text-slate-600 hover:underline">
                        <Phone className="w-3 h-3" />{c.telephone}
                      </a>
                    )}
                    {c.lien && (
                      <a href={c.lien.startsWith('http') ? c.lien : `https://${c.lien}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-600 hover:underline">
                        <Link className="w-3 h-3" />Lien
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finances — notice si données manquantes */}
      {!club.budget_annuel && !club.budget_transfert && !club.dette && !club.valeur_effectif && (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-sm text-slate-500">
          <TrendingUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Données financières non renseignées —</span>
          <a
            href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(club.nom)}&Feld=verein`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-700 hover:underline font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />Voir sur Transfermarkt
          </a>
        </div>
      )}

      {/* Finances */}
      {(club.budget_annuel || club.budget_transfert || club.dette || club.valeur_effectif) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-400" /> {t(lang,'clubDetail.finances')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {club.budget_annuel && (
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="font-bold text-slate-900 text-lg">{club.budget_annuel}M€</p>
                <p className="text-xs text-slate-500">{t(lang,'clubDetail.annualBudget')}</p>
              </div>
            )}
            {club.budget_transfert && (
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="font-bold text-slate-900 text-lg">{club.budget_transfert}M€</p>
                <p className="text-xs text-slate-500">{t(lang,'clubDetail.transferBudget')}</p>
              </div>
            )}
            {club.valeur_effectif && (
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="font-bold text-slate-900 text-lg">{club.valeur_effectif}M€</p>
                <p className="text-xs text-slate-500">{t(lang,'clubDetail.squadValue')}</p>
              </div>
            )}
            {club.dette && (
              <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                <p className="font-bold text-red-700 text-lg">{club.dette}M€</p>
                <p className="text-xs text-slate-500">{t(lang,'clubDetail.debt')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Effectif complet (recherche web : Transfermarkt / FotMob)
          Les joueurs déjà dans le CRM y sont surlignés et cliquables. */}
      <ClubSquad club={club} crmPlayers={players} />

      {/* Prochains matchs du club */}
      <UpcomingMatches playerClub={club.nom} />

      {/* Historique + Palmarès */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {club.historique && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">{t(lang,'clubDetail.history')}</p>
            <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{club.historique}</p>
          </div>
        )}
        {club.palmares && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-slate-400" /> {t(lang,'clubDetail.trophies')}
            </p>
            <div className="flex flex-wrap gap-2">
              {club.palmares.split(',').map((tr, i) => (
                <Badge key={i} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">🏆 {tr.trim()}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Historique des modifications */}
      <ActivityLogList entityId={clubId} entityType="Club" />

      {/* Transferts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">{t(lang,'clubDetail.arrivals', { count: arrivals.length })}</p>
          {arrivals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-sm text-slate-400">
              <p>{t(lang,'clubDetail.noArrivals')}</p>
              <a
                href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(club.nom)}&Feld=verein`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-600 hover:underline font-medium text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />Voir les transferts sur Transfermarkt
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {arrivals.slice(0, 5).map(tr => (
                <div key={tr.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-900 text-sm">{players.find(p => p.id === tr.player_id)?.nom || tr.joueur || t(lang,'clubDetail.player')}</span>
                  {tr.montant && <span className="text-slate-800 font-bold text-sm">{tr.montant}M€</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">{t(lang,'clubDetail.departures', { count: departures.length })}</p>
          {departures.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-sm text-slate-400">
              <p>{t(lang,'clubDetail.noDepartures')}</p>
              <a
                href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(club.nom)}&Feld=verein`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-600 hover:underline font-medium text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />Voir les transferts sur Transfermarkt
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {departures.slice(0, 5).map(tr => (
                <div key={tr.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-900 text-sm">{players.find(p => p.id === tr.player_id)?.nom || tr.joueur || t(lang,'clubDetail.player')}</span>
                  {tr.montant && <span className="text-slate-800 font-bold text-sm">{tr.montant}M€</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}