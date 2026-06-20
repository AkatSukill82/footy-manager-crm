import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from '@/pages/Login';
import { base44 } from '@/api/base44Client';

const ScoutingIA   = lazy(() => import('./pages/ScoutingIA'));
const ImportExcel  = lazy(() => import('./pages/ImportExcel'));
const Organization = lazy(() => import('./pages/Organization'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();

  // Dès que l'auth est confirmée, prefetch les données les plus utilisées
  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings || authError) return;

    // currentUser en premier — on en a besoin pour les requêtes suivantes
    queryClient.fetchQuery({
      queryKey: ['currentUser'],
      queryFn: () => base44.auth.me(),
      staleTime: Infinity,
    }).then(user => {
      if (!user) return;
      // Prefetch joueurs + watchlist dès l'auth — Dashboard et Players s'affichent instantanément
      if (user.id) {
        queryClient.prefetchQuery({
          queryKey: ['players', user.id],
          queryFn: () => base44.entities.Player.filter({ created_by_id: user.id }, '-created_date'),
          staleTime: Infinity,
        });
      }
      if (user.email) {
        queryClient.prefetchQuery({
          queryKey: ['watchList', user.email],
          queryFn: () => base44.entities.WatchList.filter({ created_by: user.email }),
          staleTime: Infinity,
        });
      }
    }).catch(() => {});

    queryClient.prefetchQuery({
      queryKey: ['clubs'],
      queryFn: () => base44.entities.Club.list('-created_date'),
      staleTime: Infinity,
    });
    queryClient.prefetchQuery({
      queryKey: ['club-contacts'],
      queryFn: () => base44.entities.ClubContact.list(),
      staleTime: Infinity,
    });
  }, [isLoadingAuth, isLoadingPublicSettings, authError]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Page de connexion de marque ; le bouton lance l'auth Base44.
      return <Login onConnect={navigateToLogin} />;
    }
  }

  const pageSpinner = (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );

  // Render the main app
  return (
    <Suspense fallback={pageSpinner}>
      <Routes>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/ScoutingIA" element={<LayoutWrapper currentPageName="ScoutingIA"><ScoutingIA /></LayoutWrapper>} />
        <Route path="/ImportExcel" element={<LayoutWrapper currentPageName="ImportExcel"><ImportExcel /></LayoutWrapper>} />
        <Route path="/Organization" element={<LayoutWrapper currentPageName="Organization"><Organization /></LayoutWrapper>} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App