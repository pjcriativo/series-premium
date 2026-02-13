import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import ReelsFeed from "./pages/ReelsFeed";
import FanClub from "./pages/FanClub";
import Brand from "./pages/Brand";
import Auth from "./pages/Auth";
import SeriesDetail from "./pages/SeriesDetail";
import EpisodePlayer from "./pages/EpisodePlayer";
import SearchPage from "./pages/Search";
import Profile from "./pages/Profile";
import Purchases from "./pages/Purchases";
import CoinStore from "./pages/CoinStore";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import SeriesManager from "./pages/admin/SeriesManager";
import SeriesForm from "./pages/admin/SeriesForm";
import EpisodeManager from "./pages/admin/EpisodeManager";
import EpisodeForm from "./pages/admin/EpisodeForm";
import UserManager from "./pages/admin/UserManager";
import CategoryManager from "./pages/admin/CategoryManager";
import CoinPackageManager from "./pages/admin/CoinPackageManager";
import BannerManager from "./pages/admin/BannerManager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/forgot" element={<Auth />} />
            <Route path="/reset-password" element={<Auth />} />

            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/reels" element={<ReelsFeed />} />
            <Route path="/fan-club" element={<FanClub />} />
            <Route path="/brand" element={<Brand />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/series/:id" element={<SeriesDetail />} />

            {/* Player */}
            <Route path="/watch/:episodeId" element={<EpisodePlayer />} />

            {/* User routes */}
            <Route path="/me" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute><CoinStore /></ProtectedRoute>
            } />
            <Route path="/purchases" element={
              <ProtectedRoute><Purchases /></ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="categories" element={<CategoryManager />} />
              <Route path="series" element={<SeriesManager />} />
              <Route path="series/new" element={<SeriesForm />} />
              <Route path="series/:id/edit" element={<SeriesForm />} />
              <Route path="episodes" element={<EpisodeManager />} />
              <Route path="episodes/new" element={<EpisodeForm />} />
              <Route path="episodes/:id/edit" element={<EpisodeForm />} />
              <Route path="users" element={<UserManager />} />
              <Route path="packages" element={<CoinPackageManager />} />
              <Route path="banners" element={<BannerManager />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
