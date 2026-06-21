import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import { base44 } from '@/api/base44Client';

const ImportExcel  = lazy(() => import('./pages/ImportExcel'));
const Organization = lazy(() => import('./pages/Organization'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const queryClient = useQueryClient();

  // Dès que l'auth est confirmée, prefetch les données les plus utilisées
  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings || authError) return;

    queryClient.fetchQuery({
      queryKey: ['currentUser'],
      queryFn: () => base44.auth.me(),
      staleTime: Infinity,
    }).then(user => {
      if (!user) return;
      if (user.id) {
        queryClient.prefetchQuery({
          queryKey: ['players', user.id],
          queryFn: () => base44.entities.Player.filter({}, '-created_date'),
          staleTime: Infinity,
        });
      }
      if (user.email) {
        queryClient.prefetchQuery({
          queryKey: ['watchList', user.email],
          queryFn: () => base44.entities.WatchList.filter({}),
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

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  const pageSpinner = (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <Suspense fallback={pageSpinner}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes — unauthenticated users → /login */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
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
          <Route path="/ImportExcel" element={<LayoutWrapper currentPageName="ImportExcel"><ImportExcel /></LayoutWrapper>} />
          <Route path="/Organization" element={<LayoutWrapper currentPageName="Organization"><Organization /></LayoutWrapper>} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}

export default App