import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from './redux/Store';
import { setDarkMode } from './redux/Slices/darkModeSlice';
import { Header, MobileBottomNav, DesktopNavbar } from './components';

// Screens
import SignIn from './screens/SignIn';
import SignUp from './screens/Signup';
import ForgetPassword from './screens/ForgetPassword';
import OtpVerification from './screens/OtpVerification';
import SecretQuestion from './screens/SecretQuestion';

import Home from './screens/Home';
import Scan from './screens/Scan';
import Play from './screens/Play';
import Rewards from './screens/Rewards';
import Rankings from './screens/Rankings';
import Winners from './screens/Winners';
import MyReceipts from './screens/MyReceipts';

import SpinWheel from './screens/SpinWheel';
import Scratch2Win from './screens/Scratch2Win';
import Lucky7 from './screens/Lucky7';
import PicPick from './screens/PicPick';
import PicPickGame from './screens/PicPickGame';
import CashGame from './screens/CashGame';

import Feed from './screens/Feed';
import CreatePost from './screens/CreatePost';
import SocialProfile from './screens/SocialProfile';

import ManageCampaigns from './screens/ManageCampaigns';
import CreateCampaign from './screens/CreateCampaign';
import CampaignDetail from './screens/CampaignDetail';

import Profile from './screens/Profile';
import PersonalInfo from './screens/PersonalInfo';
import PasswordScreen from './screens/PasswordScreen';
import Languages from './screens/Languages';
import TermsNCondition from './screens/TermsNCondition';
import PrivacyPolicy from './screens/PrivacyPolicy';
import AboutUs from './screens/AboutUs';
import HelpSupport from './screens/Help&Support';
import RulesScreen from './screens/RulesScreen';
import GuideVideo from './screens/GuideVideo';
import Notification from './screens/Notification';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideNavPaths = [
    '/signin',
    '/signup',
    '/forgot-password',
    '/otp',
    '/secret-question',
    '/play/spin-wheel',
    '/play/scratch-to-win',
    '/play/lucky-7',
    '/play/pic-pick-game',
    '/play/cash-game',
  ];
  const isGameOrAuth = hideNavPaths.some((p) => location.pathname.startsWith(p));
  const showChrome = !isGameOrAuth;

  return (
    <div className={showChrome ? 'app-shell app-shell--with-sidebar' : 'app-shell'}>
      <ScrollToTop />
      {showChrome && <DesktopNavbar />}
      <div className="app-shell__content">
        {showChrome && <Header />}
        <main className={showChrome ? 'app-main app-main--with-nav' : 'app-main'}>
          {children}
        </main>
      </div>
      {showChrome && <MobileBottomNav />}
    </div>
  );
}


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useSelector((state: RootState) => state.auth?.token);
  const isAuthenticated = Boolean(token);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  const isDarkMode = useSelector((state: RootState) => state.theme?.isDarkMode);
  const token = useSelector((state: RootState) => state.auth?.token);
  const isAuthenticated = Boolean(token);
  const language = useSelector((state: RootState) => state.language?.language);
  const { i18n } = useTranslation();

  // Dark mode class toggle on root html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync language
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return (
    <Layout>
      <Routes>
        {/* Public / Guest Routes */}
        <Route path="/signin" element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignUp />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="/otp" element={<OtpVerification />} />
        <Route path="/secret-question" element={<SecretQuestion />} />

        {/* Protected Core Routes */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
        <Route path="/play" element={<ProtectedRoute><Play /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
        <Route path="/rankings" element={<ProtectedRoute><Rankings /></ProtectedRoute>} />
        <Route path="/winners" element={<ProtectedRoute><Winners /></ProtectedRoute>} />
        <Route path="/my-receipts" element={<ProtectedRoute><MyReceipts /></ProtectedRoute>} />

        {/* Games */}
        <Route path="/play/spin-wheel" element={<ProtectedRoute><SpinWheel /></ProtectedRoute>} />
        <Route path="/play/scratch-to-win" element={<ProtectedRoute><Scratch2Win /></ProtectedRoute>} />
        <Route path="/play/lucky-7" element={<ProtectedRoute><Lucky7 /></ProtectedRoute>} />
        <Route path="/play/pic-pick" element={<ProtectedRoute><PicPick /></ProtectedRoute>} />
        <Route path="/play/pic-pick-game" element={<ProtectedRoute><PicPickGame /></ProtectedRoute>} />
        <Route path="/play/cash-game" element={<ProtectedRoute><CashGame /></ProtectedRoute>} />

        {/* Social Feed */}
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/feed/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/social-profile" element={<ProtectedRoute><SocialProfile /></ProtectedRoute>} />
        <Route path="/social-profile/:userId" element={<ProtectedRoute><SocialProfile /></ProtectedRoute>} />

        {/* Campaigns */}
        <Route path="/campaigns" element={<ProtectedRoute><ManageCampaigns /></ProtectedRoute>} />
        <Route path="/campaigns/create" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
        <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignDetail /></ProtectedRoute>} />

        {/* Settings & Info */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/personal-info" element={<ProtectedRoute><PersonalInfo /></ProtectedRoute>} />
        <Route path="/profile/change-password" element={<ProtectedRoute><PasswordScreen /></ProtectedRoute>} />
        <Route path="/profile/languages" element={<ProtectedRoute><Languages /></ProtectedRoute>} />
        <Route path="/profile/terms" element={<TermsNCondition />} />
        <Route path="/profile/privacy" element={<PrivacyPolicy />} />
        <Route path="/profile/about" element={<AboutUs />} />
        <Route path="/profile/help" element={<HelpSupport />} />
        <Route path="/profile/rules" element={<RulesScreen />} />
        <Route path="/rules" element={<RulesScreen />} />
        <Route path="/profile/guide-video" element={<GuideVideo />} />
        <Route path="/guide-video" element={<GuideVideo />} />
        <Route path="/explainer-video" element={<GuideVideo />} />
        <Route path="/notifications" element={<ProtectedRoute><Notification /></ProtectedRoute>} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
