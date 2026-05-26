import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User, Clock, Globe, Heart, Activity, Star, Zap, Trophy,
  Shield, Target, Dumbbell, BarChart2, Phone, Mail, MessageCircle,
  Instagram, Twitter, Linkedin, MapPin
} from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

function InfoRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[60%] break-words">{value}</span>
    </div>
  );
}

function StatBox({ label, value, color = "bg-slate-50", textColor = "text-slate-900" }) {
  if (value == null || value === "") return null;
  return (
    <div className={`${color} rounded-xl p-3 text-center`}>
      <div className={`font-bold text-base ${textColor}`}>{value}</div>
      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{label}</div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label, color = "text-slate-700" }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${color}`}>
      <Icon className="w-3.5 h-3.5" />{label}
    </p>
  );
}

export default function PlayerFullProfile({ player }) {
  const { lang } = useLanguage();
  if (!player) return null;

  const hasContacts = player.email || player.telephone || player.whatsapp || player.instagram || player.twitter || player.linkedin;
  const hasAddress = player.adresse || player.ville_residence || player.pays_residence;
  const hasSaisonStats = player.matchs_joues != null || player.buts != null || player.note_moyenne != null;
  const hasOffStats = player.xg != null || player.tirs != null || player.grandes_chances != null;
  const hasPassStats = player.passes_reussies_pct != null || player.passes_cles != null;
  const hasDribbleStats = player.dribbles_reussis != null || player.distance_course != null;
  const hasDefStats = player.interceptions != null || player.tacles != null || player.duels_gagnes_pct != null;
  const hasGKStats = player.arrets != null || player.clean_sheets != null;
  const hasSelection = player.matchs_international != null || player.buts_international != null;
  const hasBlessures = player.blessures != null || player.jours_blesses != null;
  const hasCarriere = player.matchs_carriere != null || player.buts_carriere != null;
  const hasScout = player.style_jeu || player.forces || player.faiblesses;

  return (
    <div className="space-y-4">

      {/* ── Identité ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-500" />{t(lang,'fullProfile.identity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label={t(lang,'fullProfile.fullName')} value={player.nom} />
            <InfoRow label={t(lang,'fullProfile.dob')} value={player.date_naissance} />
            <InfoRow label={t(lang,'fullProfile.birthplace')} value={player.lieu_naissance} />
            <InfoRow label={t(lang,'fullProfile.nationality')} value={player.nationalite} />
            <InfoRow label={t(lang,'fullProfile.nationality2')} value={player.nationalite_secondaire} />
            <InfoRow label={t(lang,'fullProfile.age')} value={player.age ? `${player.age} ${t(lang,'common.ageUnit')}` : null} />
            <InfoRow label={t(lang,'fullProfile.height')} value={player.taille ? `${player.taille} cm` : null} />
            <InfoRow label={t(lang,'fullProfile.weight')} value={player.poids ? `${player.poids} kg` : null} />
            <InfoRow label={t(lang,'fullProfile.foot')} value={player.pied_fort} />
            <InfoRow label={t(lang,'fullProfile.positionSec')} value={player.poste_secondaire} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" />{t(lang,'fullProfile.contract')}</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label={t(lang,'fullProfile.currentClub')} value={player.club_actuel} />
            <InfoRow label={t(lang,'fullProfile.league')} value={player.ligue} />
            <InfoRow label={t(lang,'fullProfile.leagueCountry')} value={player.pays_ligue} />
            <InfoRow label={t(lang,'fullProfile.stadium')} value={player.stade} />
            <InfoRow label={t(lang,'fullProfile.shirtNo')} value={player.numero_maillot ? `${t(lang,'fullProfile.shirtSymbol')}${player.numero_maillot}` : null} />
            <InfoRow label={t(lang,'fullProfile.contractEnd')} value={player.contrat_fin} />
            <InfoRow label={t(lang,'fullProfile.salary')} value={player.salaire ? `${player.salaire} M€` : null} />
            <InfoRow label={t(lang,'fullProfile.salaryWeek')} value={player.salaire_semaine ? `${player.salaire_semaine} k€` : null} />
            <InfoRow label={t(lang,'fullProfile.agent')} value={player.agent} />
            <InfoRow label={t(lang,'fullProfile.agency')} value={player.agence} />
            <InfoRow label={t(lang,'fullProfile.agentEmail')} value={player.agent_email} />
            <InfoRow label={t(lang,'fullProfile.agentPhone')} value={player.agent_telephone} />
            <InfoRow label={t(lang,'fullProfile.coach')} value={player.coach} />
            <InfoRow label={t(lang,'fullProfile.sportingDirector')} value={player.manager} />
            <InfoRow label={t(lang,'fullProfile.tmId')} value={player.transfermarkt_id} />
            <InfoRow label={t(lang,'fullProfile.sofaId')} value={player.sofascore_id} />
          </CardContent>
        </Card>
      </div>

      {/* ── Contacts & Réseaux ── */}
      {(hasContacts || hasAddress) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" />{t(lang,'fullProfile.contactsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {player.telephone && (
                <a href={`tel:${player.telephone}`} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-green-50 transition-colors">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">{t(lang,'fullProfile.phone')}</p>
                    <p className="text-xs font-medium text-slate-900">{player.telephone}</p>
                  </div>
                </a>
              )}
              {player.email && (
                <a href={`mailto:${player.email}`} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">{t(lang,'fullProfile.email')}</p>
                    <p className="text-xs font-medium text-slate-900">{player.email}</p>
                  </div>
                </a>
              )}
              {player.whatsapp && (
                <a href={`https://wa.me/${player.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 transition-colors">
                  <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">{t(lang,'fullProfile.whatsapp')}</p>
                    <p className="text-xs font-medium text-slate-900">{player.whatsapp}</p>
                  </div>
                </a>
              )}
              {player.instagram && (
                <a href={`https://instagram.com/${player.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-pink-50 transition-colors">
                  <div className="w-7 h-7 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">{t(lang,'fullProfile.instagram')}</p>
                    <p className="text-xs font-medium text-slate-900">{player.instagram}</p>
                  </div>
                </a>
              )}
              {player.twitter && (
                <a href={`https://twitter.com/${player.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-sky-50 transition-colors">
                  <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Twitter className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">{t(lang,'fullProfile.twitter')}</p>
                    <p className="text-xs font-medium text-slate-900">{player.twitter}</p>
                  </div>
                </a>
              )}
              {player.linkedin && (
                <a href={player.linkedin.startsWith('http') ? player.linkedin : `https://linkedin.com/in/${player.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Linkedin className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">{t(lang,'fullProfile.linkedin')}</p>
                    <p className="text-xs font-medium text-slate-900">{player.linkedin}</p>
                  </div>
                </a>
              )}
              {(player.adresse || player.ville_residence || player.pays_residence) && (
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50">
                  <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">{t(lang,'fullProfile.residence')}</p>
                    <p className="text-xs font-medium text-slate-900">
                      {[player.adresse, player.ville_residence, player.pays_residence].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Valeur marchande ── */}
      {(player.valeur_marchande != null || player.valeur_marchande_peak != null) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label={t(lang,'fullProfile.marketValue')} value={player.valeur_marchande ? `${player.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700" />
          <StatBox label={t(lang,'fullProfile.peakValue')} value={player.valeur_marchande_peak ? `${player.valeur_marchande_peak} M€` : null} color="bg-emerald-50" textColor="text-emerald-700" />
          <StatBox label={t(lang,'fullProfile.scoutRating')} value={player.note_globale_scout ? `${player.note_globale_scout}/100` : null} color="bg-amber-50" textColor="text-amber-700" />
          <StatBox label={t(lang,'fullProfile.proSeasons')} value={player.saisons_pro} />
        </div>
      )}

      {/* ── Stats saison en cours ── */}
      {hasSaisonStats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-500" />
              {t(lang,'fullProfile.statsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Général */}
            <div>
              <SectionTitle icon={Activity} label={t(lang,'fullProfile.general')} />
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                <StatBox label={t(lang,'fullProfile.matches')} value={player.matchs_joues} />
                <StatBox label={t(lang,'fullProfile.starter')} value={player.titularisations} />
                <StatBox label={t(lang,'fullProfile.minutes')} value={player.minutes_jouees} />
                <StatBox label={t(lang,'players.goals')} value={player.buts} color="bg-green-50" textColor="text-green-700" />
                <StatBox label={t(lang,'players.assists')} value={player.passes_decisives} color="bg-blue-50" textColor="text-blue-700" />
                <StatBox label={t(lang,'fullProfile.yellows')} value={player.cartons_jaunes} color="bg-yellow-50" />
                <StatBox label={t(lang,'players.rating')} value={player.note_moyenne} color="bg-indigo-50" textColor="text-indigo-700" />
              </div>
            </div>

            {/* Offensif */}
            {hasOffStats && (
              <div>
                <SectionTitle icon={Target} label={t(lang,'fullProfile.offensive')} color="text-green-700" />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <StatBox label={t(lang,'fullProfile.xg')} value={player.xg} color="bg-green-50" textColor="text-green-700" />
                  <StatBox label={t(lang,'fullProfile.xa')} value={player.xa} color="bg-blue-50" textColor="text-blue-700" />
                  <StatBox label={t(lang,'fullProfile.xgPer90')} value={player.xg_par_90} />
                  <StatBox label={t(lang,'fullProfile.shots')} value={player.tirs} />
                  <StatBox label={t(lang,'fullProfile.shotsOnTarget')} value={player.tirs_cadres} />
                  <StatBox label={t(lang,'fullProfile.shotsPct')} value={player.tirs_cadres_pct != null ? `${player.tirs_cadres_pct}%` : null} />
                  <StatBox label={t(lang,'fullProfile.bigChances')} value={player.grandes_chances} />
                  <StatBox label={t(lang,'fullProfile.bigChancesMissed')} value={player.grandes_chances_manquees} />
                  <StatBox label={t(lang,'fullProfile.headGoals')} value={player.buts_tete} />
                  <StatBox label={t(lang,'fullProfile.rightGoals')} value={player.buts_pied_droit} />
                  <StatBox label={t(lang,'fullProfile.leftGoals')} value={player.buts_pied_gauche} />
                  <StatBox label={t(lang,'fullProfile.penalties')} value={player.penaltys_marques != null ? `${player.penaltys_marques}/${player.penaltys_tires ?? "?"}` : null} />
                </div>
              </div>
            )}

            {/* Passes */}
            {hasPassStats && (
              <div>
                <SectionTitle icon={Zap} label={t(lang,'fullProfile.passingTitle')} color="text-blue-700" />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <StatBox label={t(lang,'fullProfile.passPct')} value={player.passes_reussies_pct != null ? `${player.passes_reussies_pct}%` : null} />
                  <StatBox label={t(lang,'fullProfile.longPassPct')} value={player.passes_longues_pct != null ? `${player.passes_longues_pct}%` : null} />
                  <StatBox label={t(lang,'fullProfile.keyPassesPM')} value={player.passes_cles} />
                  <StatBox label={t(lang,'fullProfile.crosses')} value={player.centres} />
                  <StatBox label={t(lang,'fullProfile.crossesPct')} value={player.centres_reussis_pct != null ? `${player.centres_reussis_pct}%` : null} />
                </div>
              </div>
            )}

            {/* Dribbles & physique */}
            {hasDribbleStats && (
              <div>
                <SectionTitle icon={Dumbbell} label={t(lang,'fullProfile.dribblesTitle')} color="text-orange-700" />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <StatBox label={t(lang,'fullProfile.dribblesWon')} value={player.dribbles_reussis} />
                  <StatBox label={t(lang,'fullProfile.dribblesAttempted')} value={player.dribbles_tentes} />
                  <StatBox label={t(lang,'fullProfile.dribblesPct')} value={player.dribbles_pct != null ? `${player.dribbles_pct}%` : null} />
                  <StatBox label={t(lang,'fullProfile.touchesPM')} value={player.touches_balle} />
                  <StatBox label={t(lang,'fullProfile.ballLossesPM')} value={player.pertes_balle} />
                  <StatBox label={t(lang,'fullProfile.distKmPM')} value={player.distance_course} />
                  <StatBox label={t(lang,'fullProfile.sprintsPM')} value={player.sprints} />
                  <StatBox label={t(lang,'fullProfile.topSpeed')} value={player.vitesse_max ? `${player.vitesse_max} ${t(lang,'fullProfile.kmh')}` : null} />
                </div>
              </div>
            )}

            {/* Défense */}
            {hasDefStats && (
              <div>
                <SectionTitle icon={Shield} label={t(lang,'fullProfile.defenceTitle')} color="text-slate-700" />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <StatBox label={t(lang,'fullProfile.interceptions')} value={player.interceptions} />
                  <StatBox label={t(lang,'fullProfile.tacklesWon')} value={player.tacles} />
                  <StatBox label={t(lang,'fullProfile.tacklesPct')} value={player.tacles_reussis_pct != null ? `${player.tacles_reussis_pct}%` : null} />
                  <StatBox label={t(lang,'fullProfile.clearances')} value={player.degagements} />
                  <StatBox label={t(lang,'fullProfile.duelsPct')} value={player.duels_gagnes_pct != null ? `${player.duels_gagnes_pct}%` : null} />
                  <StatBox label={t(lang,'fullProfile.aerialDuelsPct')} value={player.duels_aeriens_pct != null ? `${player.duels_aeriens_pct}%` : null} />
                  <StatBox label={t(lang,'fullProfile.recoveries')} value={player.recuperations} />
                  <StatBox label={t(lang,'fullProfile.foulsMade')} value={player.fautes_commises} />
                  <StatBox label={t(lang,'fullProfile.foulsDrawn')} value={player.fautes_subies} />
                  <StatBox label={t(lang,'fullProfile.offside')} value={player.hors_jeu} />
                </div>
              </div>
            )}

            {/* Gardien */}
            {hasGKStats && (
              <div>
                <SectionTitle icon={Shield} label={t(lang,'fullProfile.gkTitle')} color="text-yellow-700" />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <StatBox label={t(lang,'fullProfile.saves')} value={player.arrets} />
                  <StatBox label={t(lang,'fullProfile.savesPct')} value={player.arrets_pct != null ? `${player.arrets_pct}%` : null} />
                  <StatBox label={t(lang,'fullProfile.cleanSheets')} value={player.clean_sheets} color="bg-green-50" textColor="text-green-700" />
                  <StatBox label={t(lang,'fullProfile.goalsConceded')} value={player.buts_encaisses} />
                  <StatBox label={t(lang,'fullProfile.xgConceded')} value={player.xg_contre} />
                  <StatBox label={t(lang,'fullProfile.successfulExits')} value={player.sorties_reussies} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Sélection + Blessures + Carrière ── */}
      <div className="grid md:grid-cols-3 gap-4">
        {hasSelection && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" />{t(lang,'fullProfile.nationalTeam')}</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label={t(lang,'fullProfile.ntMatches')} value={player.matchs_international} />
              <InfoRow label={t(lang,'players.goals')} value={player.buts_international} />
              <InfoRow label={t(lang,'fullProfile.ntAssists')} value={player.passes_international} />
              <InfoRow label={t(lang,'fullProfile.firstCap')} value={player.premier_match_selection} />
              <InfoRow label={t(lang,'fullProfile.u21')} value={player.selection_u21 != null ? (player.selection_u21 ? t(lang,'common.yes') : t(lang,'common.no')) : null} />
            </CardContent>
          </Card>
        )}

        {hasBlessures && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" />{t(lang,'fullProfile.injuriesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label={t(lang,'fullProfile.injuriesCount')} value={player.blessures} />
              <InfoRow label={t(lang,'fullProfile.daysMissed')} value={player.jours_blesses} />
              <InfoRow label={t(lang,'fullProfile.injuryTypes')} value={player.type_blessures} />
            </CardContent>
          </Card>
        )}

        {hasCarriere && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-slate-500" />{t(lang,'fullProfile.careerTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label={t(lang,'players.matches')} value={player.matchs_carriere} />
              <InfoRow label={t(lang,'players.goals')} value={player.buts_carriere} />
              <InfoRow label={t(lang,'players.assists')} value={player.passes_carriere} />
              <InfoRow label={t(lang,'fullProfile.differentClubs')} value={player.nb_clubs} />
              <InfoRow label={t(lang,'fullProfile.proSeasons')} value={player.saisons_pro} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Profil scout ── */}
      {hasScout && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" />{t(lang,'fullProfile.scoutTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {player.style_jeu && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t(lang,'fullProfile.playStyle')}</p>
                <p className="text-sm text-slate-700">{player.style_jeu}</p>
              </div>
            )}
            {player.forces && (
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase mb-1">{t(lang,'fullProfile.strengths')}</p>
                <p className="text-sm text-slate-700">{player.forces}</p>
              </div>
            )}
            {player.faiblesses && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase mb-1">{t(lang,'fullProfile.weaknesses')}</p>
                <p className="text-sm text-slate-700">{player.faiblesses}</p>
              </div>
            )}
            {player.stats_resume && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t(lang,'fullProfile.careerSummary')}</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">{player.stats_resume}</p>
              </div>
            )}
            {player.note_globale_scout != null && (
              <div className="flex items-center gap-2 pt-1">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xl text-slate-900">{player.note_globale_scout}/100</span>
                <span className="text-xs text-slate-500">{t(lang,'fullProfile.globalRating')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Palmarès & Distinctions ── */}
      {(player.palmares || player.distinctions) && (
        <div className="grid md:grid-cols-2 gap-4">
          {player.palmares && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" />{t(lang,'fullProfile.trophies')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {player.palmares.split(",").map((t, i) => (
                    <Badge key={i} className="bg-amber-50 text-amber-800 border border-amber-200">🏆 {t.trim()}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {player.distinctions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500" />{t(lang,'fullProfile.awards')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">{player.distinctions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}