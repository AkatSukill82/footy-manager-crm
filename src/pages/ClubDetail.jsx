import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, Users, TrendingUp, Trophy, Edit2, Trash2, Calendar } from "lucide-react";
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
    onSuccess: () => {
      navigate(createPageUrl("Clubs"));
    },
  });

  if (!club) return null;

  if (isEditing) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setIsEditing(false)}
            className="mb-4"
          >
            ← Annuler
          </Button>
          <ClubForm
            club={club}
            onSubmit={(data) => updateClubMutation.mutate(data)}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  const arrivals = transfers.filter(t => t.club_arrivee === club.nom);
  const departures = transfers.filter(t => t.club_depart === club.nom);

  return (
    <div className="p-8 space-y-8">
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl("Clubs"))}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <div className="flex items-start justify-between">
        <div className="flex gap-6">
          <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.nom} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{club.nom}</h1>
            <div className="flex items-center gap-3 text-slate-600">
              <MapPin className="w-5 h-5" />
              <span>{club.ville}, {club.pays}</span>
              {club.annee_fondation && (
                <>
                  <span>•</span>
                  <Calendar className="w-5 h-5" />
                  <span>Fondé en {club.annee_fondation}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (confirm("Êtes-vous sûr de vouloir supprimer ce club ?")) {
                deleteClubMutation.mutate();
              }
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900">{players.length}</div>
            <div className="text-sm text-slate-500 mt-1">Joueurs</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">{club.budget_transfert || 0}M€</div>
            <div className="text-sm text-slate-500 mt-1">Budget transfert</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">{club.valeur_effectif || 0}M€</div>
            <div className="text-sm text-slate-500 mt-1">Valeur effectif</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900">{transfers.length}</div>
            <div className="text-sm text-slate-500 mt-1">Transferts</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {club.stade && (
              <div className="flex justify-between">
                <span className="text-slate-600">Stade:</span>
                <span className="font-medium">{club.stade} {club.capacite_stade && `(${club.capacite_stade.toLocaleString()})`}</span>
              </div>
            )}
            {club.president && (
              <div className="flex justify-between">
                <span className="text-slate-600">Président:</span>
                <span className="font-medium">{club.president}</span>
              </div>
            )}
            {club.entraineur && (
              <div className="flex justify-between">
                <span className="text-slate-600">Entraîneur:</span>
                <span className="font-medium">{club.entraineur}</span>
              </div>
            )}
            {club.directeur_sportif && (
              <div className="flex justify-between">
                <span className="text-slate-600">Directeur sportif:</span>
                <span className="font-medium">{club.directeur_sportif}</span>
              </div>
            )}
            {club.categorie && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Catégorie:</span>
                <Badge>{club.categorie}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Situation financière</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {club.budget_annuel && (
              <div className="flex justify-between">
                <span className="text-slate-600">Budget annuel:</span>
                <span className="font-bold text-green-600">{club.budget_annuel}M€</span>
              </div>
            )}
            {club.budget_transfert && (
              <div className="flex justify-between">
                <span className="text-slate-600">Budget transfert:</span>
                <span className="font-bold text-blue-600">{club.budget_transfert}M€</span>
              </div>
            )}
            {club.dette && (
              <div className="flex justify-between">
                <span className="text-slate-600">Dette:</span>
                <span className="font-bold text-red-600">{club.dette}M€</span>
              </div>
            )}
            {club.valeur_effectif && (
              <div className="flex justify-between">
                <span className="text-slate-600">Valeur effectif:</span>
                <span className="font-bold text-purple-600">{club.valeur_effectif}M€</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {club.historique && (
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-line">{club.historique}</p>
          </CardContent>
        </Card>
      )}

      {club.palmares && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Palmarès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {club.palmares.split(',').map((titre, i) => (
                <Badge key={i} variant="outline" className="bg-yellow-50">
                  {titre.trim()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Arrivées ({arrivals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {arrivals.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Aucune arrivée</p>
            ) : (
              <div className="space-y-2">
                {arrivals.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900">{players.find(p => p.id === t.player_id)?.nom || "Joueur"}</span>
                    {t.montant && <span className="text-green-600 font-bold">{t.montant}M€</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Départs ({departures.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {departures.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Aucun départ</p>
            ) : (
              <div className="space-y-2">
                {departures.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900">{players.find(p => p.id === t.player_id)?.nom || "Joueur"}</span>
                    {t.montant && <span className="text-orange-600 font-bold">{t.montant}M€</span>}
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