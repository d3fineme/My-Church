import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChurchDataProvider, useChurchData } from './context/ChurchDataContext';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { HomeScreen } from './screens/HomeScreen';
import { EventsScreen } from './screens/EventsScreen';
import { ServicesScreen } from './screens/ServicesScreen';
import { GivingScreen } from './screens/GivingScreen';
import { ChurchScreen } from './screens/ChurchScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminPanelScreen } from './screens/AdminPanelScreen';
import { ChurchEvent } from './types';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { isLoading: churchLoading } = useChurchData();

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentView, setCurrentView] = useState<'tabs' | 'profile' | 'admin'>('tabs');
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentView('tabs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEvent = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setActiveTab('events');
    setCurrentView('tabs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProfile = () => {
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading && churchLoading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] text-2xl font-bold animate-pulse">
          ✝
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          <span>AOGIM Dublin · Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#0A192F]">
      {/* Top Header */}
      {currentView !== 'admin' && (
        <Header
          onOpenProfile={handleOpenProfile}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAdmin={isAdmin ? handleOpenAdmin : undefined}
        />
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-4 sm:pt-6">
        {currentView === 'admin' && (
          <AdminPanelScreen onBackToApp={() => setCurrentView('tabs')} />
        )}

        {currentView === 'profile' && (
          <ProfileScreen onOpenAdminPanel={isAdmin ? handleOpenAdmin : undefined} />
        )}

        {currentView === 'tabs' && (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                onNavigateTab={handleTabChange}
                onSelectEvent={handleSelectEvent}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
              />
            )}

            {activeTab === 'events' && (
              <EventsScreen
                selectedEventFromHome={selectedEvent}
                onClearSelectedEvent={() => setSelectedEvent(null)}
              />
            )}

            {activeTab === 'services' && (
              <ServicesScreen onNavigateTab={handleTabChange} />
            )}

            {activeTab === 'giving' && (
              <GivingScreen onNavigateTab={handleTabChange} />
            )}

            {activeTab === 'church' && <ChurchScreen />}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation (visible on tabs and profile views) */}
      {currentView !== 'admin' && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Auth Modal (Sign in, Sign up, Password Recovery, Admin bootstrap) */}
      <AuthModal />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ChurchDataProvider>
          <MainApp />
        </ChurchDataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
