// @ts-nocheck
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/referral-app/components/ui/toaster";
import { TooltipProvider } from "@/referral-app/components/ui/tooltip";
import { installReferralMockApi } from "@/referral-app/lib/mock-live-data";

import NotFound from "@/referral-app/pages/not-found";
import IndexPage from "@/referral-app/pages/index";
import RegisterPage from "@/referral-app/pages/register";
import HomePage from "@/referral-app/pages/home";
import ReferPage from "@/referral-app/pages/refer";
import ProfilePage from "@/referral-app/pages/me";
import LeaderboardPage from "@/referral-app/pages/leaderboard";

import PgBrowsePage from "@/referral-app/pages/pg/browse";
import PgDetailPage from "@/referral-app/pages/pg/detail";
import TeamsPage from "@/referral-app/pages/teams";
import TeamDetailPage from "@/referral-app/pages/teams/detail";
import ChallengesPage from "@/referral-app/pages/challenges";
import NotificationsPage from "@/referral-app/pages/notifications";
import CalculatorPage from "@/referral-app/pages/calculator";
import AreasPage from "@/referral-app/pages/areas";
import ManagerDashPage from "@/referral-app/pages/manager/dashboard";
import ManagerPropertiesPage from "@/referral-app/pages/manager/properties";
import ManagerAddPropertyPage from "@/referral-app/pages/manager/add-property";
import ManagerRoomsPage from "@/referral-app/pages/manager/rooms";
import ManagerOwnersPage from "@/referral-app/pages/manager/owners";
import ManagerOwnerDetailPage from "@/referral-app/pages/manager/owner-detail";
import ManagerCredentialsPage from "@/referral-app/pages/manager/credentials";

import PayoutSetupPage from "@/referral-app/pages/payout-setup";
import PublicProfilePage from "@/referral-app/pages/profile";

import OwnerDashboardPage from "@/referral-app/pages/owner/dashboard";
import OwnerPropertiesPage from "@/referral-app/pages/owner/properties";
import OwnerAddPropertyPage from "@/referral-app/pages/owner/add-property";
import OwnerRoomsPage from "@/referral-app/pages/owner/rooms";
import OwnerAllRoomsPage from "@/referral-app/pages/owner/all-rooms";
import OwnerRoomDetailPage from "@/referral-app/pages/owner/room-detail";
import OwnerInventoryPage from "@/referral-app/pages/owner/inventory";
import OwnerPricingPage from "@/referral-app/pages/owner/pricing";
import OwnerLogin from "@/referral-app/pages/manager/login";

import StreakPage from "@/referral-app/pages/streak";
import LuckyDrawPage from "@/referral-app/pages/lucky-draw";
import SquadBattlesPage from "@/referral-app/pages/squad-battles";
import FlashPage from "@/referral-app/pages/flash";
import ChainPage from "@/referral-app/pages/chain";
import ActivityPage from "@/referral-app/pages/activity";
import VisitsPage from "@/referral-app/pages/visits";
import EarningsPage from "@/referral-app/pages/earnings";

import BrokerDashboard from "@/referral-app/pages/broker/dashboard";
import InfluencerDashboard from "@/referral-app/pages/influencer/dashboard";
import CorporateDashboard from "@/referral-app/pages/corporate/dashboard";

import AdminLogin from "@/referral-app/pages/admin/login";
import AdminDashPage from "@/referral-app/pages/admin/dashboard";
import AdminPropertiesPage from "@/referral-app/pages/admin/properties";
import AdminAddPropertyPage from "@/referral-app/pages/admin/add-property";
import AdminOwnersPage from "@/referral-app/pages/admin/owners";
import AdminOwnerDetailPage from "@/referral-app/pages/admin/owner-detail";
import AdminCredentialsPage from "@/referral-app/pages/admin/credentials";
import AdminNotificationsPage from "@/referral-app/pages/admin/notifications";
import AdminRoomsPage from "@/referral-app/pages/admin/rooms";
import EarnHubPage from "@/referral-app/pages/earn-hub";
import EarnPlaybookPage from "@/referral-app/pages/earn-playbook";
import PersonaKitPage from "@/referral-app/pages/persona-kit";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={IndexPage} />
      {/* <Route path="/register" component={RegisterPage} /> */}
      <Route path="/home" component={HomePage} />
      <Route path="/refer" component={ReferPage} />
      <Route path="/me" component={ProfilePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/payout-setup" component={PayoutSetupPage} />
      <Route path="/earnings" component={EarningsPage} />

      <Route path="/pg" component={PgBrowsePage} />
      <Route path="/pg/:id" component={PgDetailPage} />
      <Route path="/areas" component={AreasPage} />

      <Route path="/teams" component={TeamsPage} />
      <Route path="/teams/:id" component={TeamDetailPage} />
      <Route path="/challenges" component={ChallengesPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/calculator" component={CalculatorPage} />
      <Route path="/profile/:code" component={PublicProfilePage} />

      <Route path="/streak" component={StreakPage} />
      <Route path="/lucky-draw" component={LuckyDrawPage} />
      <Route path="/squad-battles" component={SquadBattlesPage} />
      <Route path="/flash" component={FlashPage} />
      <Route path="/chain" component={ChainPage} />
      <Route path="/activity" component={ActivityPage} />
      <Route path="/visits" component={VisitsPage} />

      <Route path="/broker" component={BrokerDashboard} />
      <Route path="/influencer" component={InfluencerDashboard} />
      <Route path="/corporate" component={CorporateDashboard} />

      <Route path="/manager" component={ManagerDashPage} />
      <Route path="/manager/properties" component={ManagerPropertiesPage} />
      <Route path="/manager/properties/new" component={ManagerAddPropertyPage} />
      <Route path="/manager/properties/:id/rooms" component={ManagerRoomsPage} />
      <Route path="/manager/owners" component={ManagerOwnersPage} />
      <Route path="/manager/owners/:id" component={ManagerOwnerDetailPage} />
      <Route path="/manager/credentials" component={ManagerCredentialsPage} />

      <Route path="/owner/login" component={OwnerLogin} />
      <Route path="/owner/dashboard" component={OwnerDashboardPage} />
      <Route path="/owner/properties" component={OwnerPropertiesPage} />
      <Route path="/owner/properties/new" component={OwnerAddPropertyPage} />
      <Route path="/owner/properties/:id/rooms" component={OwnerRoomsPage} />
      <Route path="/owner/properties/:id/rooms/:roomId" component={OwnerRoomDetailPage} />
      <Route path="/owner/rooms" component={OwnerAllRoomsPage} />
      <Route path="/owner/inventory" component={OwnerInventoryPage} />
      <Route path="/owner/pricing" component={OwnerPricingPage} />

      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashPage} />
      <Route path="/admin/properties" component={AdminPropertiesPage} />
      <Route path="/admin/properties/new" component={AdminAddPropertyPage} />
      <Route path="/admin/properties/:id/rooms" component={AdminRoomsPage} />
      <Route path="/admin/owners" component={AdminOwnersPage} />
      <Route path="/admin/owners/:id" component={AdminOwnerDetailPage} />
      <Route path="/admin/credentials" component={AdminCredentialsPage} />
      <Route path="/admin/notifications" component={AdminNotificationsPage} />

      <Route path="/earn" component={EarnHubPage} />
      <Route path="/earn/:channel" component={EarnPlaybookPage} />
      <Route path="/persona-kit/:id" component={PersonaKitPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  installReferralMockApi();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="/app">
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
