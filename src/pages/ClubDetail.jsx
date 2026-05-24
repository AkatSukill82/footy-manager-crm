import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Building2, MapPin, Users, TrendingUp, Trophy,
  Edit2, Trash2, Calendar, Phone, Mail, Globe, User, ExternalLink
} from "lucide-react";
import TransfermarktImage from "../components/ui/TransfermarktImage";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import ClubForm from "../components/clubs/ClubForm";

export default function ClubDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('id');
  const [isEditing, setIsEditing] = useState(false);

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

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers-by-club', club?.nom],
    queryFn: async () => {
      const allTransfers = await base44.entities.Transfer.list('-date_transfert', 100);
      return allTransfers.filter(t => t.club_arrivee === club.nom || t.club_depart === club.nom);
    },
    enabled: !!club?.nom,
  });

  const updateClubMutation = useMutation({
    mutationFn: (data) => base44.entities.Club.update(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
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
          <Button variant="ghost" onClick={() => setIsEditing(false)} className="mb-4">← Annuler</Button>
          <ClubForm club={club} onSubmit={(data) => updateClubMutation.mutate(data)} onCancel={() => setIsEditing(false)} />
        </div>
      </div>
    );
  }

  const arrivals = transfers.filter(t => t.club_arrivee === club.nom);
  const departures = transfers.filter(t => t.club_depart === club.nom);
  const hasContact = club.email || club.telephone || club.site_web;
  const hasPersonContact = club.contact_nom || club.contact_email || club.contact_telephone;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate(createPageUrl("Clubs"))}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 md:gap-6 items-center">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
            <TransfermarktImage
              src={club.logo_url}
              alt={club.nom}
              className="w-full h-full object-contain p-1"
              fallback={<Building2 className="w-10 h-10 text-slate-400" />}
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900">{club.nom}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-slate-600 mt-1 text-sm">
              {(club.ville || club.pays) && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{[club.ville, club.pays].filter(Boolean).join(', ')}</span>
              )}
              {club.annee_fondation && (
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Fondé en {club.annee_fondation}</span>
              )}
              {club.ligue && <Badge variant="outline">{club.ligue}</Badge>}
              {club.categorie && <Badge className="bg-slate-100 text-slate-700">{club.categorie}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            if (confirm("Supprimer ce club ?")) deleteClubMutation.mutate();
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Joueurs", value: players.length, color: "text-slate-900" },
          { label: "Budget transfert", value: club.budget_transfert ? `${club.budget_transfert}M€` : "—", color: "text-green-600" },
          { label: "Valeur effectif", value: club.valeur_effectif ? `${club.valeur_effectif}M€` : "—", color: "text-purple-600" },
          { label: "Transferts", value: transfers.length, color: "text-slate-900" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infos générales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {club.stade && <Row label="Stade" value={`${club.stade}${club.capacite_stade ? ` (${club.capacite_stade.toLocaleString()} places)` : ''}`} />}
            {club.president && <Row label="Président" value={club.president} />}
            {club.entraineur && <Row label="Entraîneur" value={club.entraineur} />}
            {club.directeur_sportif && <Row label="Directeur sportif" value={club.directeur_sportif} />}
          </CardContent>
        </Card>

        {/* Contact club */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" /> Contact du club</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!hasContact && !hasPersonContact ? (
              <p className="text-slate-400 italic text-xs">Aucun contact renseigné — cliquez sur Modifier pour en ajouter.</p>
            ) : (
              <>
                {club.telephone && (
                  <a href={`tel:${club.telephone}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-green-50 transition-colors group">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Téléphone</p>
                      <p className="font-medium text-slate-900 group-hover:text-green-700">{club.telephone}</p>
                    </div>
                  </a>
                )}
                {club.email && (
                  <a href={`mailto:${club.email}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Email</p>
                      <p className="font-medium text-slate-900 group-hover:text-blue-700">{club.email}</p>
                    </div>
                  </a>
                )}
                {club.site_web && (
                  <a href={club.site_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Site web</p>
                      <p className="font-medium text-slate-900 truncate group-hover:text-slate-700">{club.site_web}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                  </a>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personne de contact */}
      {hasPersonContact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-purple-500" /> Personne de contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-purple-600" />
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

      {/* Finances */}
      {(club.budget_annuel || club.budget_transfert || club.dette || club.valeur_effectif) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Situation financière</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {club.budget_annuel && <Row label="Budget annuel" value={`${club.budget_annuel}M€`} valueClass="text-green-600 font-bold" />}
            {club.budget_transfert && <Row label="Budget transfert" value={`${club.budget_transfert}M€`} valueClass="text-blue-600 font-bold" />}
            {club.dette && <Row label="Dette" value={`${club.dette}M€`} valueClass="text-red-600 font-bold" />}
            {club.valeur_effectif && <Row label="Valeur effectif" value={`${club.valeur_effectif}M€`} valueClass="text-purple-600 font-bold" />}
          </CardContent>
        </Card>
      )}

      {/* Joueurs du club */}
      {players.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Joueurs ({players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${p.id}`)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:border-green-300 hover:bg-green-50 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden">
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                      : <User className="w-4 h-4 text-slate-400 m-auto mt-2.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{p.nom}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.poste}</p>
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
            <CardHeader className="pb-3"><CardTitle className="text-base">Historique</CardTitle></CardHeader>
            <CardContent><p className="text-slate-700 text-sm whitespace-pre-line">{club.historique}</p></CardContent>
          </Card>
        )}
        {club.palmares && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-600" /> Palmarès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {club.palmares.split(',').map((t, i) => (
                  <Badge key={i} variant="outline" className="bg-yellow-50">{t.trim()}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transferts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Arrivées ({arrivals.length})</CardTitle></CardHeader>
          <CardContent>
            {arrivals.length === 0 ? (
              <p className="text-center text-slate-500 py-4 text-sm">Aucune arrivée</p>
            ) : (
              <div className="space-y-2">
                {arrivals.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900 text-sm">{players.find(p => p.id === t.player_id)?.nom || "Joueur"}</span>
                    {t.montant && <span className="text-green-600 font-bold text-sm">{t.montant}M€</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Départs ({departures.length})</CardTitle></CardHeader>
          <CardContent>
            {departures.length === 0 ? (
              <p className="text-center text-slate-500 py-4 text-sm">Aucun départ</p>
            ) : (
              <div className="space-y-2">
                {departures.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900 text-sm">{players.find(p => p.id === t.player_id)?.nom || "Joueur"}</span>
                    {t.montant && <span className="text-orange-600 font-bold text-sm">{t.montant}M€</span>}
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

function Row({ label, value, valueClass = "font-medium text-slate-900" }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}