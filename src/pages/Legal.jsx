import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";

const CONTACT = "support@football-dm.com";

// ── Contenu traduit fr / en / es ─────────────────────────────────────────────
const UI = {
  fr: { back: "← Retour", updated: "Dernière mise à jour", warn: "⚠️ Modèle à finaliser : remplacez les champs entre [crochets] par vos informations légales, et faites idéalement relire par un juriste.", privacy: "Confidentialité", terms: "CGU", legal: "Mentions légales", login: "Se connecter" },
  en: { back: "← Back", updated: "Last updated", warn: "⚠️ Template to finalize: replace the fields in [brackets] with your legal information, and ideally have it reviewed by a lawyer.", privacy: "Privacy", terms: "Terms", legal: "Legal notice", login: "Log in" },
  es: { back: "← Volver", updated: "Última actualización", warn: "⚠️ Plantilla por finalizar: sustituya los campos entre [corchetes] por su información legal e, idealmente, hágala revisar por un abogado.", privacy: "Privacidad", terms: "Términos", legal: "Aviso legal", login: "Iniciar sesión" },
};
const UPDATED = { fr: "28 juin 2026", en: "June 28, 2026", es: "28 de junio de 2026" };

const DOCS = {
  confidentialite: {
    fr: { title: "Politique de confidentialité", sections: [
      { p: ["La présente politique décrit comment Football Data Management (« nous », « le Service ») collecte, utilise et protège les données à caractère personnel, conformément au RGPD et au droit belge."] },
      { h: "1. Responsable du traitement", p: [`[Nom de la société / indépendant], [forme juridique], inscrite à la BCE sous le n° [numéro BCE], dont le siège est situé [adresse complète]. Contact : ${CONTACT}.`] },
      { h: "2. Données que nous collectons", list: ["Compte : nom, e-mail, rôle/fonction, organisation, mot de passe (stocké de façon sécurisée par notre prestataire d'authentification).", "Demande d'accès : nom, e-mail, téléphone, société/agence, formule souhaitée, message.", "Données métier saisies ou importées : fiches de joueurs (identité, statistiques, valeur, contrat), clubs, contacts, dossiers de recrutement, finances et commissions.", "Agenda Google (si vous le connectez) : jeton d'accès et événements concernés.", "Données techniques : journaux de connexion, préférences (stockage local), cookies strictement nécessaires."] },
      { h: "3. Finalités et bases légales", list: ["Fournir et faire fonctionner le Service (exécution du contrat).", "Gérer votre compte, votre formule et la facturation (exécution du contrat).", "Assurer la sécurité et améliorer le Service (intérêt légitime).", "Synchroniser Google Agenda (consentement).", "Vous contacter au sujet du Service (intérêt légitime / consentement)."] },
      { h: "4. Données relatives à des joueurs et des tiers", p: ["Le Service permet de stocker des informations relatives à des joueurs, agents ou contacts qui ne sont pas utilisateurs, provenant de sources publiques (Transfermarkt, FotMob, SofaScore, BeSoccer) ou saisies par vous. La base légale est l'intérêt légitime lié à l'activité d'agent. Vous êtes responsable de la licéité des données saisies et de vos obligations RGPD vis-à-vis de ces personnes."] },
      { h: "5. Destinataires et sous-traitants", list: ["Les membres de votre groupe de travail (partage d'équipe).", "Base44 (hébergement et infrastructure applicative).", "Google (uniquement si vous connectez Google Agenda).", "Notre prestataire d'envoi d'e-mails."] },
      { h: "6. Transferts hors UE", p: ["Certains prestataires (Base44, Google) peuvent traiter des données hors UE, encadré par des garanties appropriées (clauses contractuelles types)."] },
      { h: "7. Durée de conservation", p: ["Les données sont conservées tant que votre compte est actif, puis supprimées ou anonymisées dans un délai raisonnable, sauf obligation légale. Les demandes d'accès sont conservées le temps de leur traitement."] },
      { h: "8. Sécurité", p: ["Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (contrôle d'accès par rôle, hébergement sécurisé)."] },
      { h: "9. Vos droits", p: [`Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, d'opposition, de portabilité, et du retrait du consentement. Exercice : ${CONTACT}.`, "Vous pouvez introduire une réclamation auprès de l'Autorité de protection des données (APD), Rue de la Presse 35, 1000 Bruxelles."] },
      { h: "10. Cookies et stockage local", p: ["Le Service utilise des cookies strictement nécessaires et un stockage local pour vos préférences. Aucun cookie publicitaire."] },
      { h: "11. Modifications", p: ["Nous pouvons mettre à jour cette politique ; la date figure en haut de page."] },
      { h: "12. Contact", p: [CONTACT] },
    ] },
    en: { title: "Privacy Policy", sections: [
      { p: ["This policy describes how Football Data Management (\"we\", \"the Service\") collects, uses and protects personal data, in accordance with the GDPR and Belgian law."] },
      { h: "1. Data controller", p: [`[Company / sole trader name], [legal form], registered with the BCE under no. [BCE number], with registered office at [full address]. Contact: ${CONTACT}.`] },
      { h: "2. Data we collect", list: ["Account: name, email, role/function, organization, password (securely stored by our authentication provider).", "Access request: name, email, phone, company/agency, desired plan, message.", "Business data you enter or import: player profiles (identity, stats, value, contract), clubs, contacts, recruitment cases, finances and commissions.", "Google Calendar (if you connect it): access token and relevant events.", "Technical data: connection logs, preferences (local storage), strictly necessary cookies."] },
      { h: "3. Purposes and legal bases", list: ["Provide and operate the Service (performance of the contract).", "Manage your account, plan and billing (performance of the contract).", "Ensure security and improve the Service (legitimate interest).", "Sync Google Calendar (consent).", "Contact you about the Service (legitimate interest / consent)."] },
      { h: "4. Data about players and third parties", p: ["The Service lets you store information about players, agents or contacts who are not users, sourced from public sources (Transfermarkt, FotMob, SofaScore, BeSoccer) or entered by you. The legal basis is the legitimate interest of the agent's business. You are responsible for the lawfulness of the data you enter and your GDPR obligations toward those individuals."] },
      { h: "5. Recipients and processors", list: ["Members of your work group (team sharing).", "Base44 (hosting and application infrastructure).", "Google (only if you connect Google Calendar).", "Our email provider."] },
      { h: "6. Transfers outside the EU", p: ["Some providers (Base44, Google) may process data outside the EU, framed by appropriate safeguards (standard contractual clauses)."] },
      { h: "7. Retention period", p: ["Data is kept while your account is active, then deleted or anonymized within a reasonable period, unless required by law. Access requests are kept for the time needed to process them."] },
      { h: "8. Security", p: ["We implement appropriate technical and organizational measures (role-based access control, secure hosting)."] },
      { h: "9. Your rights", p: [`You have the rights of access, rectification, erasure, restriction, objection, portability, and withdrawal of consent. To exercise: ${CONTACT}.`, "You may lodge a complaint with the Data Protection Authority (APD), Rue de la Presse 35, 1000 Brussels."] },
      { h: "10. Cookies and local storage", p: ["The Service uses strictly necessary cookies and local storage for your preferences. No advertising cookies."] },
      { h: "11. Changes", p: ["We may update this policy; the date appears at the top of the page."] },
      { h: "12. Contact", p: [CONTACT] },
    ] },
    es: { title: "Política de privacidad", sections: [
      { p: ["Esta política describe cómo Football Data Management («nosotros», «el Servicio») recopila, utiliza y protege los datos personales, conforme al RGPD y al derecho belga."] },
      { h: "1. Responsable del tratamiento", p: [`[Nombre de la empresa / autónomo], [forma jurídica], inscrita en el BCE con el n.º [número BCE], con sede en [dirección completa]. Contacto: ${CONTACT}.`] },
      { h: "2. Datos que recopilamos", list: ["Cuenta: nombre, correo, rol/función, organización, contraseña (almacenada de forma segura por nuestro proveedor de autenticación).", "Solicitud de acceso: nombre, correo, teléfono, empresa/agencia, plan deseado, mensaje.", "Datos de negocio que introduces o importas: fichas de jugadores (identidad, estadísticas, valor, contrato), clubes, contactos, casos de reclutamiento, finanzas y comisiones.", "Google Calendar (si lo conectas): token de acceso y eventos correspondientes.", "Datos técnicos: registros de conexión, preferencias (almacenamiento local), cookies estrictamente necesarias."] },
      { h: "3. Finalidades y bases legales", list: ["Prestar y operar el Servicio (ejecución del contrato).", "Gestionar tu cuenta, plan y facturación (ejecución del contrato).", "Garantizar la seguridad y mejorar el Servicio (interés legítimo).", "Sincronizar Google Calendar (consentimiento).", "Contactarte sobre el Servicio (interés legítimo / consentimiento)."] },
      { h: "4. Datos de jugadores y terceros", p: ["El Servicio permite almacenar información sobre jugadores, agentes o contactos que no son usuarios, procedente de fuentes públicas (Transfermarkt, FotMob, SofaScore, BeSoccer) o introducida por ti. La base legal es el interés legítimo de la actividad de agente. Eres responsable de la licitud de los datos que introduces y de tus obligaciones RGPD frente a esas personas."] },
      { h: "5. Destinatarios y encargados", list: ["Los miembros de tu grupo de trabajo (uso compartido en equipo).", "Base44 (alojamiento e infraestructura de la aplicación).", "Google (solo si conectas Google Calendar).", "Nuestro proveedor de envío de correos."] },
      { h: "6. Transferencias fuera de la UE", p: ["Algunos proveedores (Base44, Google) pueden tratar datos fuera de la UE, con garantías adecuadas (cláusulas contractuales tipo)."] },
      { h: "7. Plazo de conservación", p: ["Los datos se conservan mientras tu cuenta esté activa, y luego se eliminan o anonimizan en un plazo razonable, salvo obligación legal. Las solicitudes de acceso se conservan el tiempo necesario para tramitarlas."] },
      { h: "8. Seguridad", p: ["Aplicamos medidas técnicas y organizativas adecuadas (control de acceso por rol, alojamiento seguro)."] },
      { h: "9. Tus derechos", p: [`Tienes derecho de acceso, rectificación, supresión, limitación, oposición, portabilidad y retirada del consentimiento. Para ejercerlos: ${CONTACT}.`, "Puedes presentar una reclamación ante la Autoridad de Protección de Datos (APD), Rue de la Presse 35, 1000 Bruselas."] },
      { h: "10. Cookies y almacenamiento local", p: ["El Servicio usa cookies estrictamente necesarias y almacenamiento local para tus preferencias. Sin cookies publicitarias."] },
      { h: "11. Modificaciones", p: ["Podemos actualizar esta política; la fecha figura en la parte superior."] },
      { h: "12. Contacto", p: [CONTACT] },
    ] },
  },
  cgu: {
    fr: { title: "Conditions générales d'utilisation", sections: [
      { h: "1. Objet", p: ["Les présentes CGU régissent l'accès et l'utilisation de Football Data Management (le « Service »), édité par [Nom de la société], et l'abonnement à ses formules."] },
      { h: "2. Accès au Service", p: ["L'accès se fait sur invitation après validation d'une demande. Le Service est proposé en formules : Standard (50 €/mois), Pro (100 €/mois) et Sur-mesure (sur devis). Les fonctionnalités varient selon la formule."] },
      { h: "3. Compte et sécurité", p: ["Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée via votre compte."] },
      { h: "4. Utilisation acceptable", list: ["Utiliser le Service conformément aux lois, notamment le RGPD pour les données saisies.", "Ne pas détourner le Service à des fins illicites ou portant atteinte aux droits de tiers.", "Ne pas contourner les mesures de sécurité ni extraire massivement les données au-delà de l'usage prévu."] },
      { h: "5. Abonnement, paiement et résiliation", p: ["L'abonnement est mensuel selon la formule choisie. [Précisez : moyen de paiement, facturation, préavis de résiliation.] Les sommes dues restent exigibles jusqu'à la résiliation effective."] },
      { h: "6. Disponibilité et données tierces", p: ["Le Service est fourni « en l'état ». Les données de joueurs proviennent en partie de sources tierces : nous ne garantissons ni leur exactitude, ni leur exhaustivité, ni leur disponibilité permanente."] },
      { h: "7. Propriété intellectuelle", p: ["Le Service, sa marque, son code et ses contenus sont protégés. Aucun droit n'est cédé en dehors du droit d'utilisation lié à votre abonnement."] },
      { h: "8. Responsabilité", p: ["Dans les limites permises par la loi, notre responsabilité est limitée aux dommages directs et plafonnée aux montants payés au cours des 12 derniers mois."] },
      { h: "9. Données personnelles", p: ["Le traitement des données personnelles est décrit dans notre politique de confidentialité."] },
      { h: "10. Durée, suspension et résiliation", p: ["Nous pouvons suspendre ou résilier l'accès en cas de manquement aux présentes CGU."] },
      { h: "11. Droit applicable et juridiction", p: ["Les présentes CGU sont régies par le droit belge. Tout litige relève des tribunaux de l'arrondissement de [arrondissement judiciaire], sauf disposition légale impérative contraire."] },
      { h: "12. Contact", p: [CONTACT] },
    ] },
    en: { title: "Terms of Use", sections: [
      { h: "1. Purpose", p: ["These Terms govern access to and use of Football Data Management (the \"Service\"), published by [Company name], and subscription to its plans."] },
      { h: "2. Access to the Service", p: ["Access is by invitation after approval of a request. The Service is offered in plans: Standard (€50/month), Pro (€100/month) and Custom (on quote). Features vary by plan."] },
      { h: "3. Account and security", p: ["You are responsible for the confidentiality of your credentials and any activity carried out via your account."] },
      { h: "4. Acceptable use", list: ["Use the Service in accordance with the law, notably the GDPR for the data you enter.", "Do not misuse the Service for unlawful purposes or in ways that infringe third-party rights.", "Do not bypass security measures or extract data en masse beyond intended use."] },
      { h: "5. Subscription, payment and termination", p: ["The subscription is monthly according to the chosen plan. [Specify: payment method, billing, termination notice.] Amounts due remain payable until effective termination."] },
      { h: "6. Availability and third-party data", p: ["The Service is provided \"as is\". Player data partly comes from third-party sources: we do not guarantee its accuracy, completeness, or permanent availability."] },
      { h: "7. Intellectual property", p: ["The Service, its brand, code and content are protected. No rights are granted beyond the usage right tied to your subscription."] },
      { h: "8. Liability", p: ["To the extent permitted by law, our liability is limited to direct damages and capped at the amounts paid over the last 12 months."] },
      { h: "9. Personal data", p: ["The processing of personal data is described in our privacy policy."] },
      { h: "10. Term, suspension and termination", p: ["We may suspend or terminate access in case of breach of these Terms."] },
      { h: "11. Governing law and jurisdiction", p: ["These Terms are governed by Belgian law. Any dispute falls under the courts of the [judicial district] district, unless a mandatory legal provision states otherwise."] },
      { h: "12. Contact", p: [CONTACT] },
    ] },
    es: { title: "Condiciones generales de uso", sections: [
      { h: "1. Objeto", p: ["Estas condiciones regulan el acceso y uso de Football Data Management (el «Servicio»), editado por [Nombre de la empresa], y la suscripción a sus planes."] },
      { h: "2. Acceso al Servicio", p: ["El acceso es por invitación tras la validación de una solicitud. El Servicio se ofrece en planes: Standard (50 €/mes), Pro (100 €/mes) y A medida (presupuesto). Las funciones varían según el plan."] },
      { h: "3. Cuenta y seguridad", p: ["Eres responsable de la confidencialidad de tus credenciales y de toda actividad realizada a través de tu cuenta."] },
      { h: "4. Uso aceptable", list: ["Usar el Servicio conforme a la ley, en particular el RGPD para los datos introducidos.", "No utilizar el Servicio con fines ilícitos o que vulneren derechos de terceros.", "No eludir las medidas de seguridad ni extraer datos masivamente más allá del uso previsto."] },
      { h: "5. Suscripción, pago y cancelación", p: ["La suscripción es mensual según el plan elegido. [Especifique: medio de pago, facturación, preaviso de cancelación.] Las cantidades adeudadas siguen siendo exigibles hasta la cancelación efectiva."] },
      { h: "6. Disponibilidad y datos de terceros", p: ["El Servicio se presta «tal cual». Los datos de jugadores provienen en parte de fuentes de terceros: no garantizamos su exactitud, exhaustividad ni disponibilidad permanente."] },
      { h: "7. Propiedad intelectual", p: ["El Servicio, su marca, código y contenidos están protegidos. No se cede ningún derecho más allá del derecho de uso ligado a tu suscripción."] },
      { h: "8. Responsabilidad", p: ["En los límites permitidos por la ley, nuestra responsabilidad se limita a los daños directos y se limita a las cantidades pagadas en los últimos 12 meses."] },
      { h: "9. Datos personales", p: ["El tratamiento de los datos personales se describe en nuestra política de privacidad."] },
      { h: "10. Duración, suspensión y cancelación", p: ["Podemos suspender o cancelar el acceso en caso de incumplimiento de estas condiciones."] },
      { h: "11. Ley aplicable y jurisdicción", p: ["Estas condiciones se rigen por el derecho belga. Cualquier litigio corresponde a los tribunales del distrito de [distrito judicial], salvo disposición legal imperativa en contrario."] },
      { h: "12. Contacto", p: [CONTACT] },
    ] },
  },
  mentions: {
    fr: { title: "Mentions légales", sections: [
      { h: "Éditeur du site", p: [`[Nom de la société / indépendant] — [forme juridique]. Numéro d'entreprise (BCE) : [numéro BCE]. Siège : [adresse complète]. E-mail : ${CONTACT}. Représentant légal : [Nom du représentant].`] },
      { h: "Directeur de la publication", p: ["[Nom du directeur de la publication]."] },
      { h: "Hébergement", p: ["L'application est hébergée et déployée via la plateforme Base44 (groupe Wix). Coordonnées de l'hébergeur : [à compléter — Base44 / Wix.com Ltd, adresse]."] },
      { h: "Propriété intellectuelle", p: ["L'ensemble des éléments du site (marque, logo, textes, code, mise en page) est protégé. Toute reproduction non autorisée est interdite."] },
      { h: "Contact", p: [CONTACT] },
    ] },
    en: { title: "Legal Notice", sections: [
      { h: "Site publisher", p: [`[Company / sole trader name] — [legal form]. Company number (BCE): [BCE number]. Registered office: [full address]. Email: ${CONTACT}. Legal representative: [Representative name].`] },
      { h: "Publication director", p: ["[Publication director name]."] },
      { h: "Hosting", p: ["The application is hosted and deployed via the Base44 platform (Wix group). Host details: [to complete — Base44 / Wix.com Ltd, address]."] },
      { h: "Intellectual property", p: ["All elements of the site (brand, logo, texts, code, layout) are protected. Any unauthorized reproduction is prohibited."] },
      { h: "Contact", p: [CONTACT] },
    ] },
    es: { title: "Aviso legal", sections: [
      { h: "Editor del sitio", p: [`[Nombre de la empresa / autónomo] — [forma jurídica]. Número de empresa (BCE): [número BCE]. Sede: [dirección completa]. Correo: ${CONTACT}. Representante legal: [Nombre del representante].`] },
      { h: "Director de publicación", p: ["[Nombre del director de publicación]."] },
      { h: "Alojamiento", p: ["La aplicación está alojada y desplegada a través de la plataforma Base44 (grupo Wix). Datos del alojamiento: [por completar — Base44 / Wix.com Ltd, dirección]."] },
      { h: "Propiedad intelectual", p: ["Todos los elementos del sitio (marca, logo, textos, código, diseño) están protegidos. Queda prohibida cualquier reproducción no autorizada."] },
      { h: "Contacto", p: [CONTACT] },
    ] },
  },
};

const H2 = ({ children }) => <h2 className="text-lg font-bold text-slate-900 mt-8 mb-2">{children}</h2>;
const P = ({ children }) => <p className="text-sm leading-relaxed text-slate-600 mb-3">{children}</p>;

function LegalDoc({ docKey }) {
  const { lang, setLang } = useLanguage();
  const u = UI[lang] || UI.fr;
  const doc = (DOCS[docKey][lang] || DOCS[docKey].fr);
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/vitrine" className="font-bold flex items-center gap-2 text-slate-900">
            <span className="w-7 h-7 rounded-lg bg-green-600 text-white flex items-center justify-center">⚽</span>
            Football Data Management
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              {["fr", "en", "es"].map((lc) => (
                <button key={lc} onClick={() => setLang(lc)} className={`uppercase px-1.5 py-0.5 rounded ${lang === lc ? "text-green-600 font-bold" : "text-slate-400 hover:text-slate-700"}`}>{lc}</button>
              ))}
            </div>
            <Link to="/vitrine" className="text-sm text-slate-500 hover:text-slate-900">{u.back}</Link>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{doc.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{u.updated} : {UPDATED[lang] || UPDATED.fr}</p>
        <div className="mt-4 mb-8 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">{u.warn}</div>
        {doc.sections.map((s, i) => (
          <div key={i}>
            {s.h && <H2>{s.h}</H2>}
            {(s.p || []).map((para, j) => <P key={j}>{para}</P>)}
            {s.list && <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1 mb-3">{s.list.map((li, k) => <li key={k}>{li}</li>)}</ul>}
          </div>
        ))}
      </article>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-4 flex-wrap mb-2">
          <Link to="/confidentialite" className="hover:text-slate-700">{u.privacy}</Link>
          <Link to="/cgu" className="hover:text-slate-700">{u.terms}</Link>
          <Link to="/mentions-legales" className="hover:text-slate-700">{u.legal}</Link>
          <Link to="/login" className="hover:text-slate-700">{u.login}</Link>
        </div>
        © {new Date().getFullYear()} Football Data Management
      </footer>
    </div>
  );
}

export function Confidentialite() { return <LegalDoc docKey="confidentialite" />; }
export function CGU() { return <LegalDoc docKey="cgu" />; }
export function MentionsLegales() { return <LegalDoc docKey="mentions" />; }
