import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Search, Filter, Globe, AlertCircle, X } from "lucide-react";
import ClubCard from "../components/clubs/ClubCard";
import ClubForm from "../components/clubs/ClubForm";
import ClubSearch from "../components/clubs/ClubSearch";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { useCurrentUser } from "../lib/useCurrentUser";

export default function ClubsPage() {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [mutationError, setMutationError] = useState(null);

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
    onError: (err) => setMutationError(err.message || "Erreur lors de la création du club"),
  });

  const PAGE_SIZE = 18;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.pays?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategorie = filterCategorie === "all" || club.categorie === filterCategorie;
    return matchesSearch && matchesCategorie;
  });

  // Reset pagination quand les filtres changent
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, filterCategorie]);

  if (showForm) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setShowForm(false)} className="mb-4">← {t(lang, 'common.back')}</Button>
          <ClubForm onSubmit={(data) => createClubMutation.mutate(data)} onCancel={() => setShowForm(false)} />
        </div>
      </div>
    );
  }

  if (showSearch) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => setShowSearch(false)} className="mb-4">← {t(lang, 'common.back')}</Button>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Rechercher un club</h2>
            <p className="text-slate-500 text-sm mt-1">Données récupérées depuis Transfermarkt & Sofascore</p>
          </div>
          <ClubSearch onClose={() => setShowSearch(false)} />
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 truncate">{t(lang, 'clubs.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5 hidden md:block">{t(lang, 'clubs.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={() => setShowSearch(true)}
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Globe className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{t(lang, 'clubs.searchOnline')}</span>
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-slate-900 hover:bg-slate-800 shadow-lg"
            size="sm"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{t(lang, 'clubs.addManual')}</span>
            <span className="md:hidden">{t(lang, 'common.add')}</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(lang, 'clubs.searchPlh')}
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
                <SelectItem value="all">{t(lang, 'clubs.allCategories')}</SelectItem>
                <SelectItem value="Elite">{t(lang, 'clubs.elite')}</SelectItem>
                <SelectItem value="Premier plan">{t(lang, 'clubs.topLevel')}</SelectItem>
                <SelectItem value="Intermédiaire">{t(lang, 'clubs.intermediate')}</SelectItem>
                <SelectItem value="En développement">{t(lang, 'clubs.developing')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">{t(lang, 'common.loading')}</div>
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{t(lang, 'clubs.noResults')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.slice(0, visibleCount).map(club => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
          {visibleCount < filteredClubs.length && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                Voir plus ({filteredClubs.length - visibleCount} restants)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}