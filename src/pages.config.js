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
import AgentNetwork from './pages/AgentNetwork';
import Alerts from './pages/Alerts';
import ClubDetail from './pages/ClubDetail';
import Clubs from './pages/Clubs';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import MyWatchList from './pages/MyWatchList';
import PlayerDetail from './pages/PlayerDetail';
import PlayerSearch from './pages/PlayerSearch';
import Players from './pages/Players';
import PredictiveDashboard from './pages/PredictiveDashboard';
import Reports from './pages/Reports';
import TeamDetail from './pages/TeamDetail';
import Teams from './pages/Teams';
import TransferManagement from './pages/TransferManagement';
import News from './pages/News';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentNetwork": AgentNetwork,
    "Alerts": Alerts,
    "ClubDetail": ClubDetail,
    "Clubs": Clubs,
    "Contacts": Contacts,
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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};