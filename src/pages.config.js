/**
 * pages.config.js - Page routing configuration
 *
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 *
 * Example file structure:
 *
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 *
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const AgentNetwork      = lazy(() => import('./pages/AgentNetwork'));
const Alerts            = lazy(() => import('./pages/Alerts'));
const ClubDetail        = lazy(() => import('./pages/ClubDetail'));
const Clubs             = lazy(() => import('./pages/Clubs'));
const ClubContacts      = lazy(() => import('./pages/ClubContacts'));
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const MyWatchList       = lazy(() => import('./pages/MyWatchList'));
const PlayerDetail      = lazy(() => import('./pages/PlayerDetail'));
const PlayerSearch      = lazy(() => import('./pages/PlayerSearch'));
const Players           = lazy(() => import('./pages/Players'));
const PredictiveDashboard = lazy(() => import('./pages/PredictiveDashboard'));
const Reports           = lazy(() => import('./pages/Reports'));
const TeamDetail        = lazy(() => import('./pages/TeamDetail'));
const Teams             = lazy(() => import('./pages/Teams'));
const TransferManagement = lazy(() => import('./pages/TransferManagement'));
const News              = lazy(() => import('./pages/News'));
const Calendar          = lazy(() => import('./pages/Calendar'));
const Profile           = lazy(() => import('./pages/Profile'));
const ScoutingReports   = lazy(() => import('./pages/ScoutingReports'));
const Pipeline          = lazy(() => import('./pages/Pipeline'));
const Comparator        = lazy(() => import('./pages/Comparator'));
const Finance           = lazy(() => import('./pages/Finance'));
const Marketplace       = lazy(() => import('./pages/Marketplace'));
const Recruitment       = lazy(() => import('./pages/Recruitment'));


export const PAGES = {
    "Recruitment": Recruitment,
    "AgentNetwork": AgentNetwork,
    "Alerts": Alerts,
    "ClubDetail": ClubDetail,
    "Clubs": Clubs,
    "ClubContacts": ClubContacts,
    "Dashboard": Dashboard,
    "MyWatchList": MyWatchList,
    "PlayerDetail": PlayerDetail,
    "PlayerSearch": PlayerSearch,
    "Players": Players,
    "PredictiveDashboard": PredictiveDashboard,
    "Reports": Reports,
    "TeamDetail": TeamDetail,
    "Teams": Teams,
    "TransferManagement": TransferManagement,
    "News": News,
    "Calendar": Calendar,
    "Profile": Profile,
    "ScoutingReports": ScoutingReports,
    "Pipeline": Pipeline,
    "Comparator": Comparator,
    "Finance": Finance,
    "Marketplace": Marketplace,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
