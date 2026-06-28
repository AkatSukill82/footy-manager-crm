import React from "react";
import { Link } from "react-router-dom";

const UPDATED = "28 juin 2026";
const CONTACT = "support@football-dm.com";

// ── Petite mise en page commune aux pages légales (publique, sans auth) ───────
function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/vitrine" className="font-bold flex items-center gap-2 text-slate-900">
            <span className="w-7 h-7 rounded-lg bg-green-600 text-white flex items-center justify-center">⚽</span>
            Football Data Management
          </Link>
          <Link to="/vitrine" className="text-sm text-slate-500 hover:text-slate-900">← Retour</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-400 mt-1">Dernière mise à jour : {UPDATED}</p>
        <div className="mt-4 mb-8 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
          ⚠️ Modèle à finaliser : remplacez les champs entre [crochets] par vos informations légales, et faites idéalement relire par un juriste.
        </div>
        {children}
      </article>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-4 flex-wrap mb-2">
          <Link to="/confidentialite" className="hover:text-slate-700">Confidentialité</Link>
          <Link to="/cgu" className="hover:text-slate-700">CGU</Link>
          <Link to="/mentions-legales" className="hover:text-slate-700">Mentions légales</Link>
          <Link to="/login" className="hover:text-slate-700">Se connecter</Link>
        </div>
        © {new Date().getFullYear()} Football Data Management
      </footer>
    </div>
  );
}

const H2 = ({ children }) => <h2 className="text-lg font-bold text-slate-900 mt-8 mb-2">{children}</h2>;
const P = ({ children }) => <p className="text-sm leading-relaxed text-slate-600 mb-3">{children}</p>;
const UL = ({ children }) => <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1 mb-3">{children}</ul>;

// ══════════════════════════ POLITIQUE DE CONFIDENTIALITÉ ══════════════════════
export function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <P>La présente politique décrit comment Football Data Management (« nous », « le Service ») collecte, utilise et protège les données à caractère personnel, conformément au Règlement général sur la protection des données (RGPD) et au droit belge.</P>

      <H2>1. Responsable du traitement</H2>
      <P>[Nom de la société / indépendant], [forme juridique], inscrite à la BCE sous le n° [numéro BCE], dont le siège est situé [adresse complète]. Contact : <a href={`mailto:${CONTACT}`} className="text-green-700 underline">{CONTACT}</a>.</P>

      <H2>2. Données que nous collectons</H2>
      <UL>
        <li><b>Compte</b> : nom, adresse e-mail, rôle/fonction, organisation, mot de passe (stocké de façon sécurisée par notre prestataire d'authentification).</li>
        <li><b>Demande d'accès</b> (formulaire du site) : nom, e-mail, téléphone, société/agence, formule souhaitée, message.</li>
        <li><b>Données métier que vous saisissez ou importez</b> : fiches de joueurs (identité, statistiques, valeur, contrat), clubs, contacts, dossiers de recrutement, données financières et commissions.</li>
        <li><b>Agenda Google</b> (si vous le connectez) : jeton d'accès permettant la synchronisation, et les événements concernés.</li>
        <li><b>Données techniques</b> : journaux de connexion, préférences (stockées localement dans votre navigateur), cookies strictement nécessaires au fonctionnement.</li>
      </UL>

      <H2>3. Finalités et bases légales</H2>
      <UL>
        <li>Fournir et faire fonctionner le Service — <i>exécution du contrat</i>.</li>
        <li>Gérer votre compte, votre formule et la facturation — <i>exécution du contrat</i>.</li>
        <li>Assurer la sécurité, prévenir la fraude et améliorer le Service — <i>intérêt légitime</i>.</li>
        <li>Synchroniser Google Agenda — <i>consentement</i> (révocable à tout moment).</li>
        <li>Vous contacter au sujet du Service — <i>intérêt légitime</i> / <i>consentement</i>.</li>
      </UL>

      <H2>4. Données relatives à des joueurs et des tiers</H2>
      <P>Le Service permet de stocker des informations relatives à des joueurs, agents ou contacts qui ne sont pas utilisateurs, provenant de sources accessibles au public (notamment Transfermarkt, FotMob, SofaScore, BeSoccer) ou saisies par vous. La base légale est l'<i>intérêt légitime</i> lié à l'activité d'agent sportif. En tant qu'utilisateur, <b>vous êtes responsable</b> de la licéité des données que vous saisissez et de vos obligations RGPD vis-à-vis de ces personnes (information, exactitude, etc.).</P>

      <H2>5. Destinataires et sous-traitants</H2>
      <P>Vos données peuvent être partagées avec :</P>
      <UL>
        <li><b>Les membres de votre groupe</b> de travail, lorsque vous utilisez le partage d'équipe (les données ajoutées sont visibles par tout le groupe).</li>
        <li><b>Base44</b> (hébergement et infrastructure applicative).</li>
        <li><b>Google</b> (uniquement si vous connectez Google Agenda).</li>
        <li><b>Notre prestataire d'envoi d'e-mails</b> (invitations, notifications).</li>
      </UL>
      <P>Nous ne vendons pas vos données à des tiers.</P>

      <H2>6. Transferts hors Union européenne</H2>
      <P>Certains prestataires (ex. Base44, Google) peuvent traiter des données en dehors de l'UE. Le cas échéant, ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types de la Commission européenne).</P>

      <H2>7. Durée de conservation</H2>
      <P>Les données de compte et données métier sont conservées tant que votre compte est actif, puis supprimées ou anonymisées dans un délai raisonnable après clôture, sauf obligation légale de conservation. Les demandes d'accès sont conservées le temps de leur traitement.</P>

      <H2>8. Sécurité</H2>
      <P>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement des accès, contrôle d'accès par rôle, hébergement sécurisé) pour protéger vos données.</P>

      <H2>9. Vos droits</H2>
      <P>Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de limitation, d'opposition, de portabilité, et du droit de retirer votre consentement. Pour les exercer : <a href={`mailto:${CONTACT}`} className="text-green-700 underline">{CONTACT}</a>.</P>
      <P>Vous pouvez introduire une réclamation auprès de l'Autorité de protection des données (APD), Rue de la Presse 35, 1000 Bruxelles — <a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noreferrer" className="text-green-700 underline">autoriteprotectiondonnees.be</a>.</P>

      <H2>10. Cookies et stockage local</H2>
      <P>Le Service utilise des cookies strictement nécessaires (session, authentification) et un stockage local pour mémoriser vos préférences (langue, réglages). Aucun cookie publicitaire n'est utilisé.</P>

      <H2>11. Modifications</H2>
      <P>Nous pouvons mettre à jour cette politique. La date de dernière mise à jour figure en haut de page.</P>

      <H2>12. Contact</H2>
      <P>Pour toute question : <a href={`mailto:${CONTACT}`} className="text-green-700 underline">{CONTACT}</a>.</P>
    </LegalLayout>
  );
}

// ════════════════════════════════════ CGU ════════════════════════════════════
export function CGU() {
  return (
    <LegalLayout title="Conditions générales d'utilisation">
      <H2>1. Objet</H2>
      <P>Les présentes CGU régissent l'accès et l'utilisation de Football Data Management (le « Service »), édité par [Nom de la société], et l'abonnement à ses formules.</P>

      <H2>2. Accès au Service</H2>
      <P>L'accès se fait <b>sur invitation</b> après validation d'une demande. Le Service est proposé en plusieurs formules : <b>Standard (50 €/mois)</b>, <b>Pro (100 €/mois)</b> et <b>Sur-mesure (sur devis)</b>. Les fonctionnalités varient selon la formule.</P>

      <H2>3. Compte et sécurité</H2>
      <P>Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée via votre compte. Prévenez-nous immédiatement en cas d'usage non autorisé.</P>

      <H2>4. Utilisation acceptable</H2>
      <UL>
        <li>Utiliser le Service conformément aux lois applicables, notamment le RGPD pour les données que vous saisissez.</li>
        <li>Ne pas détourner le Service à des fins frauduleuses, illicites ou portant atteinte aux droits de tiers.</li>
        <li>Ne pas tenter de contourner les mesures de sécurité ni d'extraire massivement les données au-delà de l'usage prévu.</li>
      </UL>

      <H2>5. Abonnement, paiement et résiliation</H2>
      <P>L'abonnement est mensuel, selon la formule choisie. [Précisez : moyen de paiement, facturation, date de prélèvement.] Vous pouvez résilier [préciser les modalités et le préavis]. Les sommes dues restent exigibles jusqu'à la résiliation effective.</P>

      <H2>6. Disponibilité et données issues de sources tierces</H2>
      <P>Le Service est fourni « en l'état » et « selon disponibilité ». Les données de joueurs proviennent en partie de sources tierces (Transfermarkt, FotMob, SofaScore, BeSoccer) : nous ne garantissons ni leur exactitude, ni leur exhaustivité, ni leur disponibilité permanente.</P>

      <H2>7. Propriété intellectuelle</H2>
      <P>Le Service, sa marque, son code et ses contenus sont protégés. Aucun droit n'est cédé en dehors du droit d'utilisation lié à votre abonnement.</P>

      <H2>8. Responsabilité</H2>
      <P>Dans les limites permises par la loi, notre responsabilité est limitée aux dommages directs et plafonnée aux montants payés au cours des 12 derniers mois. Nous ne saurions être tenus responsables des décisions prises sur la base des données fournies.</P>

      <H2>9. Données personnelles</H2>
      <P>Le traitement des données personnelles est décrit dans notre <Link to="/confidentialite" className="text-green-700 underline">politique de confidentialité</Link>.</P>

      <H2>10. Durée, suspension et résiliation</H2>
      <P>Nous pouvons suspendre ou résilier l'accès en cas de manquement aux présentes CGU. Vous pouvez cesser d'utiliser le Service à tout moment.</P>

      <H2>11. Droit applicable et juridiction</H2>
      <P>Les présentes CGU sont régies par le droit belge. Tout litige relève de la compétence des tribunaux de l'arrondissement de [arrondissement judiciaire], sauf disposition légale impérative contraire.</P>

      <H2>12. Contact</H2>
      <P><a href={`mailto:${CONTACT}`} className="text-green-700 underline">{CONTACT}</a>.</P>
    </LegalLayout>
  );
}

// ═══════════════════════════════ MENTIONS LÉGALES ════════════════════════════
export function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <H2>Éditeur du site</H2>
      <P>[Nom de la société / indépendant] — [forme juridique]<br />
        Numéro d'entreprise (BCE) : [numéro BCE]<br />
        Siège : [adresse complète]<br />
        E-mail : <a href={`mailto:${CONTACT}`} className="text-green-700 underline">{CONTACT}</a><br />
        Représentant légal : [Nom du représentant]</P>

      <H2>Directeur de la publication</H2>
      <P>[Nom du directeur de la publication].</P>

      <H2>Hébergement</H2>
      <P>L'application est hébergée et déployée via la plateforme <b>Base44</b> (groupe Wix). Pour les coordonnées de l'hébergeur : [à compléter — Base44 / Wix.com Ltd, adresse].</P>

      <H2>Propriété intellectuelle</H2>
      <P>L'ensemble des éléments du site (marque, logo, textes, code, mise en page) est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.</P>

      <H2>Contact</H2>
      <P>Pour toute question : <a href={`mailto:${CONTACT}`} className="text-green-700 underline">{CONTACT}</a>.</P>
    </LegalLayout>
  );
}
