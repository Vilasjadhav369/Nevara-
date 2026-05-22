import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { Sun, Calendar, Clock, Smile, Sparkles, BookHeart, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import OnboardingModal from '../components/OnboardingModal';
import HabitTracker from '../components/HabitTracker';

const AFFIRMATIONS = [
  "You are capable of amazing things.",
  "Every day is a fresh start.",
  "Your feelings are valid.",
  "It's okay to take a break.",
  "You are stronger than you think.",
  "Small steps still move you forward.",
  "Breathe in courage, exhale doubt.",
  "You deserve the same kindness you give others.",
  "It's enough to just try your best today.",
  "Growth is a spiral, not a straight line.",
  "Your peace of mind is a priority.",
  "Give yourself permission to rest."
];

export default function Dashboard() {
  const [userName, setUserName] = useState('Student');
  const [latestMood, setLatestMood] = useState<any>(null);
  const [upcomingSession, setUpcomingSession] = useState<any>(null);
  const [affirmation, setAffirmation] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const logQuickMood = async (emoji: string) => {
    if (!auth.currentUser) return;
    try {
      const docId = `mood_${auth.currentUser.uid}_${Date.now()}`;
      const newMood = {
        id: docId,
        userId: auth.currentUser.uid,
        emoji,
        note: '',
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'moods', docId), newMood);
      setLatestMood(newMood);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'moods');
    }
  };

  useEffect(() => {
    setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
    
    async function fetchData() {
      if (!auth.currentUser) return;
      try {
        // Fetch User profile
        const userRef = collection(db, 'users');
        const userQ = query(userRef, where('__name__', '==', auth.currentUser.uid));
        const userSnap = await getDocs(userQ);
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          setUserName(userData.name.split(' ')[0]);
          if (!userData.onboardingCompleted) {
            setShowOnboarding(true);
          }
        }

        // Fetch latest mood
        const moodRef = collection(db, 'moods');
        const moodQ = query(moodRef, where('userId', '==', auth.currentUser.uid));
        const moodSnap = await getDocs(moodQ);
        if (!moodSnap.empty) {
          const allMoods = moodSnap.docs.map(doc => doc.data());
          allMoods.sort((a: any, b: any) => b.createdAt - a.createdAt);
          setLatestMood(allMoods[0]);
        }

        // Fetch upcoming session
        const bookingRef = collection(db, 'bookings');
        const bookingQ = query(bookingRef, where('userId', '==', auth.currentUser.uid));
        const bookingSnap = await getDocs(bookingQ);
        if (!bookingSnap.empty) {
          const allBookings = bookingSnap.docs.map(doc => doc.data()).filter((b: any) => ['pending', 'confirmed'].includes(b.status));
          allBookings.sort((a: any, b: any) => a.scheduledAt - b.scheduledAt);
          if (allBookings.length > 0) {
            setUpcomingSession(allBookings[0]);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'multiple');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const weeklyMoodData = [
    { day: 'M', score: 3 },
    { day: 'T', score: 4 },
    { day: 'W', score: 2 },
    { day: 'T', score: 5 },
    { day: 'F', score: 4 },
    { day: 'S', score: 4 },
    { day: 'S', score: 5 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xs font-bold text-dark/40 uppercase tracking-widest hidden md:block">Dashboard</h2>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm text-dark/70"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            Goals
          </button>
          <button className="relative p-2 bg-white border border-gray-200 rounded-full text-dark/60 hover:bg-gray-50 transition-colors shadow-sm">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </div>

      {/* Wellness Score & Stats */}
      <div className="bg-primary text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-lg shadow-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 w-full md:w-auto text-center md:text-left">
            <h1 className="text-3xl font-serif font-bold mb-2">
              Welcome back, {userName}.
            </h1>
            <p className="text-white/80">Your wellness score is looking great today.</p>
        </div>

        <div className="relative z-10 flex flex-wrap md:flex-nowrap gap-4 md:gap-8 w-full md:w-auto">
            <div className="flex flex-col items-center justify-center p-3 sm:p-0 bg-black/10 sm:bg-transparent rounded-2xl sm:rounded-none flex-1 sm:flex-auto">
              <span className="text-3xl font-bold mb-1">78</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Wellness Score</span>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white/20"></div>
            
            <div className="flex flex-col items-center justify-center p-3 sm:p-0 bg-black/10 sm:bg-transparent rounded-2xl sm:rounded-none flex-1 sm:flex-auto">
              <span className="text-3xl font-bold mb-1 flex items-center gap-1">14 <span className="text-orange-400 text-lg">🔥</span></span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Day Streak</span>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white/20"></div>

            <div className="flex flex-col items-center justify-center p-3 sm:p-0 bg-black/10 sm:bg-transparent rounded-2xl sm:rounded-none flex-1 sm:flex-auto">
              <span className="text-3xl font-bold mb-1">3</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Sessions</span>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white/20"></div>

            <div className="flex flex-col items-center justify-center p-3 sm:p-0 bg-black/10 sm:bg-transparent rounded-2xl sm:rounded-none flex-1 sm:flex-auto">
              <span className="text-3xl font-bold mb-1">85<span className="text-xl">%</span></span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Journal Rate</span>
            </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-3xl p-4 md:p-5 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-dark mb-1">Daily AI Insight</h3>
          <p className="text-sm text-dark/70 leading-relaxed">Your mood is 18% higher after 7+ hours of sleep. Try to aim for a consistent bedtime tonight to maintain your 14-day streak.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Mood Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-medium">Recent Mood</h2>
            <Link to="/journal" className="text-sm text-primary font-medium hover:underline">View Journal</Link>
          </div>
          {loading ? (
             <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse min-h-[80px]"></div>
          ) : latestMood ? (
            <div className="flex-1 bg-gradient-to-br from-[#f0f9ff] to-white rounded-2xl p-4 md:p-5 border border-primary/10 flex flex-col items-center justify-center text-center gap-2">
               <div className="text-5xl">{latestMood.emoji}</div>
               <div>
                  <p className="text-sm font-bold text-dark mb-1">{new Date(latestMood.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  <p className="text-xs text-dark/50">Mood Logged</p>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-4 text-center border border-dashed border-gray-200">
               <p className="text-dark/80 text-sm font-medium mb-3">How are you feeling right now?</p>
               <div className="flex items-center gap-2 flex-wrap justify-center">
                 {["😢", "😕", "😐", "🙂", "😌", "😄"].map((emoji) => (
                   <button
                     key={emoji}
                     onClick={() => logQuickMood(emoji)}
                     className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xl hover:bg-gray-50 hover:scale-110 active:scale-95 transition-all shadow-sm"
                   >
                     {emoji}
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Mini Mood Chart */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-medium">Weekly Mood</h2>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">3.8 / 5 Avg</span>
          </div>
          <div className="flex-1 min-h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyMoodData} margin={{ top: 0, right: 0, left: -20, bottom: -10 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="score" fill="#9bb399" radius={[4, 4, 4, 4]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Session Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-medium">Next Session</h2>
            <Link to="/book" className="text-sm text-primary font-medium hover:underline">Manage</Link>
          </div>
          
          <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between group hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Sarah`} alt="Dr. Sarah" className="w-10 h-10 rounded-full object-cover shadow-sm bg-white border border-gray-200" />
                <div>
                  <h3 className="font-bold text-dark text-sm">Dr. Sarah Jenkins</h3>
                  <p className="text-xs text-dark/60 truncate max-w-[120px]">Clinical Psychologist</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                In 5 days
              </span>
            </div>
            
            <div className="flex items-center gap-4 py-3 border-y border-gray-200/60 mb-3 text-sm text-dark/70">
              <div className="flex items-center gap-1.5 font-medium"><Calendar className="w-4 h-4 text-dark/40" /> May 12th</div>
              <div className="flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4 text-dark/40" /> 2:00 PM</div>
            </div>
            
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs font-bold text-dark/50 uppercase tracking-widest">Video Call</span>
              <button className="px-4 py-1.5 border border-gray-200 bg-white text-dark rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm">Details</button>
            </div>
          </div>
        </div>
      </div>

      <HabitTracker />
      
      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
    </motion.div>
  );
}
