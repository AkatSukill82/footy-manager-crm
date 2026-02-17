import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Search, Filter } from "lucide-react";
import ClubCard from "../components/clubs/ClubCard";
import ClubForm from "../components/clubs/ClubForm";

export default function ClubsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("all");

  const { data: clubs = [], isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => base44.entities.Club.list('-created_date'),
  });

  const createClubMutation = useMutation({
    mutationFn: (data) => base44.entities.Club.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setShowForm(false);
    },
  });

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.pays?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategorie = filterCategorie === "all" || club.categorie === filterCategorie;
    return matchesSearch && matchesCategorie;
  });

  if (showForm) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setShowForm(false)}
            className="mb-4"
          >
            ← Retour
          </Button>
          <ClubForm
            onSubmit={(data) => createClubMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 truncate">Clubs</h1>
          <p className="text-slate-500 text-sm mt-0.5 hidden md:block">Gérez votre base de données des clubs</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-slate-900 hover:bg-slate-800 shadow-lg flex-shrink-0"
          size="sm"
        >
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Ajouter un club</span>
          <span className="md:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un club..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <Select value={filterCategorie} onValueChange={setFilterCategorie}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="Elite">Elite</SelectItem>
                <SelectItem value="Premier plan">Premier plan</SelectItem>
                <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                <SelectItem value="En développement">En développement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Chargement...</div>
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Aucun club trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}