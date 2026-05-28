import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Building2, MapPin, Users, TrendingUp, Trophy,
  Edit2, Trash2, Calendar, Phone, Mail, Globe, User, ExternalLink,
  Instagram, Twitter, Palette, Link
} from "lucide-react";
import TransfermarktImage from "../components/ui/TransfermarktImage";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import ClubForm from "../components/clubs/ClubForm";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import ActivityLogList from "../components/activity/ActivityLogList";
import ClubExternalLinks from "../components/clubs/ClubExternalLinks";

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
  });

  const deleteClubMutation = useMutation({
    mutationFn: () => base44.entities.Club.delete(clubId),
    onSuccess: () => navigate(createPageUrl("Clubs")),
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

  const hasClubContact = club.telephone || club.email || club.site_web || club.instagram || club.twitter;
  const hasPersonContact = club.contact_nom || club.contact_email || club.contact_telephone;
  const hasPresidentContact = club.president && (club.president_email || club.president_telephone);
  const hasCoachContact = club.entraineur && club.entraineur_email;
  const hasDSContact = club.directeur_sportif && (club.directeur_sportif_email || club.directeur_sportif_telephone);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate(createPageUrl("Clubs"))}>
        <ArrowLeft className="w-4 h-4 mr-2" /> {t(lang,'clubDetail.back')}
      </Button>

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
          { label: t(lang,'clubDetail.transferBudget'), value: club.budget_transfert ? `${club.budget_transfert}M€` : "—", color: "text-green-600" },
          { label: t(lang,'clubDetail.squadValue'), value: club.valeur_effectif ? `${club.valeur_effectif}M€` : "—", color: "text-purple-600" },
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {t(lang,'clubDetail.generalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Direction */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" /> {t(lang,'clubDetail.management')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {club.president && (
              <div className="p-2 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-400 mb-0.5">{t(lang,'clubDetail.president')}</p>
                <p className="font-semibold text-slate-900 text-sm">{club.president}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {club.president_email && (
                    <a href={`mailto:${club.president_email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3" />{club.president_email}
                    </a>
                  )}
                  {club.president_telephone && (
                    <a href={`tel:${club.president_telephone}`} className="text-xs text-green-600 hover:underline flex items-center gap-1">
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
                    <a href={`mailto:${club.directeur_sportif_email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3" />{club.directeur_sportif_email}
                    </a>
                  )}
                  {club.directeur_sportif_telephone && (
                    <a href={`tel:${club.directeur_sportif_telephone}`} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" />{club.directeur_sportif_telephone}
                    </a>
                  )}
                </div>
              </div>
            )}
            {!club.president && !club.entraineur && !club.directeur_sportif && (
              <p className="text-slate-400 italic text-xs">{t(lang,'clubDetail.noManagement')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact club */}
      {hasClubContact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500" /> {t(lang,'clubDetail.contact')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ContactLink href={`tel:${club.telephone}`} icon={Phone} label={t(lang,'clubDetail.phone')} value={club.telephone} color="green" />
            <ContactLink href={`mailto:${club.email}`} icon={Mail} label={t(lang,'clubDetail.email')} value={club.email} color="blue" />
            <ContactLink href={club.site_web} icon={Globe} label={t(lang,'clubDetail.website')} value={club.site_web} color="slate" />
            <ContactLink href={club.instagram ? `https://instagram.com/${club.instagram.replace('@','')}` : null} icon={Instagram} label={t(lang,'clubDetail.instagram')} value={club.instagram} color="pink" />
            <ContactLink href={club.twitter ? `https://twitter.com/${club.twitter.replace('@','')}` : null} icon={Twitter} label={t(lang,'clubDetail.twitter')} value={club.twitter} color="sky" />
          </CardContent>
        </Card>
      )}

      {/* Personne de contact */}
      {hasPersonContact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> {t(lang,'clubDetail.contactPerson')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1 space-y-1">
                {club.contact_nom && <p className="font-bold text-slate-900">{club.contact_nom}</p>}
                {club.contact_poste && <p className="text-sm text-slate-500">{club.contact_poste}</p>}
                <div className="flex flex-wrap gap-3 mt-2">
                  {club.contact_email && (
                    <a href={`mailto:${club.contact_email}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
                      <Mail className="w-3.5 h-3.5" /> {club.contact_email}
                    </a>
                  )}
                  {club.contact_telephone && (
                    <a href={`tel:${club.contact_telephone}`} className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700">
                      <Phone className="w-3.5 h-3.5" /> {club.contact_telephone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts importés (ClubContact) */}
      {clubContacts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Contacts ({clubContacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clubContacts.map(c => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{c.nom}</p>
                    {c.poste && <p className="text-xs text-slate-500">{c.poste}</p>}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Mail className="w-3 h-3" />{c.email}
                        </a>
                      )}
                      {c.telephone && (
                        <a href={`tel:${c.telephone}`} className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                          <Phone className="w-3 h-3" />{c.telephone}
                        </a>
                      )}
                      {c.lien && (
                        <a href={c.lien.startsWith('http') ? c.lien : `https://${c.lien}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-purple-600 hover:underline">
                          <Link className="w-3 h-3" />Lien
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
            className="flex items-center gap-1 text-green-600 hover:underline font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />Voir sur Transfermarkt
          </a>
        </div>
      )}

      {/* Finances */}
      {(club.budget_annuel || club.budget_transfert || club.dette || club.valeur_effectif) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" /> {t(lang,'clubDetail.finances')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {club.budget_annuel && (
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="font-bold text-green-700 text-lg">{club.budget_annuel}M€</p>
                <p className="text-xs text-slate-500">{t(lang,'clubDetail.annualBudget')}</p>
              </div>
            )}
            {club.budget_transfert && (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="font-bold text-blue-700 text-lg">{club.budget_transfert}M€</p>
                <p className="text-xs text-slate-500">{t(lang,'clubDetail.transferBudget')}</p>
              </div>
            )}
            {club.valeur_effectif && (
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="font-bold text-purple-700 text-lg">{club.valeur_effectif}M€</p>
                <p className="text-xs text-slate-500">{t(lang,'clubDetail.squadValue')}</p>
              </div>
            )}
            {club.dette && (
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="font-bold text-red-700 text-lg">{club.dette}M€</p>
                <p className="text-xs text-slate-500">{t(lang,'clubDetail.debt')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Joueurs du club */}
      {players.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> {t(lang,'clubDetail.playersCount', { count: players.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${p.id}`)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:border-green-300 hover:bg-green-50 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                      : <User className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{p.nom}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.poste}</p>
                    {p.valeur_marchande && (
                      <p className="text-[10px] text-green-600 font-bold">{p.valeur_marchande}M€</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique + Palmarès */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {club.historique && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{t(lang,'clubDetail.history')}</CardTitle></CardHeader>
            <CardContent><p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{club.historique}</p></CardContent>
          </Card>
        )}
        {club.palmares && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-600" /> {t(lang,'clubDetail.trophies')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {club.palmares.split(',').map((t, i) => (
                  <Badge key={i} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">🏆 {t.trim()}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Historique des modifications */}
      <ActivityLogList entityId={clubId} entityType="Club" />

      {/* Transferts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t(lang,'clubDetail.arrivals', { count: arrivals.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            {arrivals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-sm text-slate-400">
                <p>{t(lang,'clubDetail.noArrivals')}</p>
                <a
                  href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(club.nom)}&Feld=verein`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-600 hover:underline font-medium text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />Voir les transferts sur Transfermarkt
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {arrivals.slice(0, 5).map(tr => (
                  <div key={tr.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900 text-sm">{players.find(p => p.id === tr.player_id)?.nom || tr.joueur || t(lang,'clubDetail.player')}</span>
                    {tr.montant && <span className="text-green-600 font-bold text-sm">{tr.montant}M€</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t(lang,'clubDetail.departures', { count: departures.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            {departures.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-sm text-slate-400">
                <p>{t(lang,'clubDetail.noDepartures')}</p>
                <a
                  href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(club.nom)}&Feld=verein`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-600 hover:underline font-medium text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />Voir les transferts sur Transfermarkt
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {departures.slice(0, 5).map(tr => (
                  <div key={tr.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900 text-sm">{players.find(p => p.id === tr.player_id)?.nom || tr.joueur || t(lang,'clubDetail.player')}</span>
                    {tr.montant && <span className="text-orange-600 font-bold text-sm">{tr.montant}M€</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}