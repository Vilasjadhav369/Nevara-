import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookText, MessageCircle, CalendarPlus, Users, Library, User, LogOut, Sun, Moon, Shield, Wind, MoreVertical, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import Logo from './Logo';

export default function Layout() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<{name: string, avatarUrl?: string} | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRole(data.role);
          setProfilePreview({ name: data.name, avatarUrl: data.avatarUrl });
          const theme = data.themePreference;
          const dark = theme === 'dark';
          setIsDark(dark);
          if (dark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
    };
    fetchUser();
  }, [location.pathname]);

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (auth.currentUser) {
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        themePreference: newIsDark ? 'dark' : 'light'
      }).catch(console.error);
    }
  };

  const mainNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/journal', icon: BookText, label: 'Mood Journal' },
    { path: '/book', icon: CalendarPlus, label: 'Sessions', badge: 1 },
    { path: '/chat', icon: MessageCircle, label: 'Live Chat', badge: 3 },
  ];

  const exploreNavItems = [
    { path: '/forum', icon: Users, label: 'Community' },
    { path: '/resources', icon: Library, label: 'Resources' },
    { path: '/breathe', icon: Wind, label: 'Breathing Space' },
  ];

  if (role === 'counselor') {
    exploreNavItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
  }

  const allNavItems = [...mainNavItems, ...exploreNavItems];

  const renderNavSection = (title: string, items: typeof mainNavItems) => (
    <div className="mb-6">
      <p className="px-4 text-xs font-bold text-dark/40 uppercase tracking-widest mb-3 hidden lg:block">{title}</p>
      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-dark/60 hover:bg-white/40 hover:text-dark'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-primary rounded-r-full" 
                />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-dark/50 group-hover:text-dark'}`} />
              <span className="hidden lg:block truncate">{item.label}</span>
              {item.badge && (
                <span className={`hidden lg:flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold ml-auto bg-green-500 text-white shadow-sm`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-24 lg:w-72 bg-white/50 backdrop-blur-md border-r border-white/30 p-4 lg:p-6 transition-all duration-300 relative z-20">
        <div className="mb-8 flex flex-col items-center">
          <Logo className="w-16 h-16 lg:w-20 lg:h-20" />
          <div className="mt-3 hidden lg:flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-bold border border-orange-100">
            Day 14 streak 🔥
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar">
          {renderNavSection('Main', mainNavItems)}
          {renderNavSection('Explore', exploreNavItems)}
        </nav>

        {/* User Profile Bottom Card */}
        <div className="pt-4 mt-auto border-t border-gray-100/50 relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center justify-between p-2 lg:p-3 hover:bg-white/60 rounded-2xl transition-all border border-transparent hover:border-gray-200/50"
          >
            <div className="flex items-center gap-3">
              {profilePreview?.avatarUrl ? (
                <img src={profilePreview.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-bold text-dark truncate max-w-[120px]">{profilePreview?.name || 'Loading...'}</p>
                <p className="text-xs text-dark/50 truncate">View profile</p>
              </div>
            </div>
            <MoreVertical className="w-5 h-5 text-dark/40 hidden lg:block" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 origin-bottom"
              >
                <Link 
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-dark/70 hover:text-dark hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button 
                  onClick={() => {
                    toggleTheme();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-dark/70 hover:text-dark hover:bg-gray-50 rounded-xl transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className="h-px bg-gray-100 my-1 mx-2" />
                <button 
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/50 backdrop-blur-md border-b border-white/30 z-10 relative">
          <Logo className="w-10 h-10" />
          <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-100">
            Day 14 🔥
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex items-center justify-around p-2 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe z-20">
          {[mainNavItems[0], mainNavItems[1], mainNavItems[3], {path: '/profile', icon: User, label: 'Profile'}].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-primary scale-110' : 'text-dark/40 hover:text-dark/60'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} />
                  {'badge' in item && item.badge && !isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
