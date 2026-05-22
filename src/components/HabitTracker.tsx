import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Droplet, Activity, Moon, Plus, Minus, Target, Check } from 'lucide-react';

export default function HabitTracker() {
  const [habitLog, setHabitLog] = useState<any>(null);
  const [userGoals, setUserGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateStr();

  useEffect(() => {
    async function fetchData() {
      if (!auth.currentUser) return;
      try {
        // Fetch user goals
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().goals) {
          setUserGoals(userDoc.data().goals);
        }

        const q = query(
          collection(db, 'habitLogs'),
          where('userId', '==', auth.currentUser.uid),
          where('dateStr', '==', todayStr)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setHabitLog({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setHabitLog({
            waterGlasses: 0,
            exerciseMinutes: 0,
            sleepHours: 0,
            goalsCompleted: [],
            dateStr: todayStr
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'habitLogs');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [todayStr]);

  const updateHabitNum = async (field: string, value: number) => {
    if (!auth.currentUser || !habitLog) return;
    
    const newLog = { ...habitLog, [field]: value };
    setHabitLog(newLog);

    saveHabitLog(newLog);
  };

  const toggleGoal = async (goal: string) => {
    if (!auth.currentUser || !habitLog) return;
    const currentGoals = habitLog.goalsCompleted || [];
    const newGoals = currentGoals.includes(goal) 
      ? currentGoals.filter((g: string) => g !== goal)
      : [...currentGoals, goal];
      
    const newLog = { ...habitLog, goalsCompleted: newGoals };
    setHabitLog(newLog);
    saveHabitLog(newLog);
  }

  const saveHabitLog = async (newLog: any) => {
    if (!auth.currentUser) return;
    try {
      const docId = newLog.id || `habit_${auth.currentUser.uid}_${todayStr}`;
      await setDoc(doc(db, 'habitLogs', docId), {
        userId: auth.currentUser.uid,
        dateStr: todayStr,
        waterGlasses: newLog.waterGlasses,
        exerciseMinutes: newLog.exerciseMinutes,
        sleepHours: newLog.sleepHours,
        goalsCompleted: newLog.goalsCompleted || [],
        updatedAt: Date.now()
      });
      if (!newLog.id) {
        setHabitLog({ ...newLog, id: docId });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'habitLogs');
    }
  }

  if (loading) return <div className="h-40 bg-gray-50 animate-pulse rounded-3xl" />;

  return (
    <div className="space-y-6 mt-6">
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8">
        
        <div className="flex-1">
          <h2 className="font-serif text-xl font-medium mb-6 text-dark flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Daily Habits
          </h2>
          
          <div className="space-y-6">
            {/* Water */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-bold text-dark">Water</p>
                </div>
                <span className="text-xs font-bold text-dark/60">{habitLog.waterGlasses} / 8 <span className="text-[10px] uppercase font-bold text-dark/40">glasses</span></span>
              </div>
              <div className="w-full h-2 bg-blue-50 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (habitLog.waterGlasses / 8) * 100)}%` }}></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateHabitNum('waterGlasses', Math.max(0, habitLog.waterGlasses - 1))} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Minus className="w-4 h-4 text-dark/60" />
                </button>
                <button onClick={() => updateHabitNum('waterGlasses', Math.min(20, habitLog.waterGlasses + 1))} className="flex-1 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors">
                  <Plus className="w-3 h-3" /> Add Glass
                </button>
              </div>
            </div>

            {/* Exercise */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-bold text-dark">Exercise</p>
                </div>
                <span className="text-xs font-bold text-dark/60">{habitLog.exerciseMinutes} / 30 <span className="text-[10px] uppercase font-bold text-dark/40">min</span></span>
              </div>
              <div className="w-full h-2 bg-green-50 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (habitLog.exerciseMinutes / 30) * 100)}%` }}></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateHabitNum('exerciseMinutes', Math.max(0, habitLog.exerciseMinutes - 10))} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Minus className="w-4 h-4 text-dark/60" />
                </button>
                <button onClick={() => updateHabitNum('exerciseMinutes', Math.min(120, habitLog.exerciseMinutes + 10))} className="flex-1 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-100 transition-colors">
                  <Plus className="w-3 h-3" /> Add 10 Min
                </button>
              </div>
            </div>

            {/* Sleep */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <p className="text-sm font-bold text-dark">Sleep</p>
                </div>
                <span className="text-xs font-bold text-dark/60">{habitLog.sleepHours} / 8 <span className="text-[10px] uppercase font-bold text-dark/40">hrs</span></span>
              </div>
              <div className="w-full h-2 bg-indigo-50 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (habitLog.sleepHours / 8) * 100)}%` }}></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateHabitNum('sleepHours', Math.max(0, habitLog.sleepHours - 1))} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Minus className="w-4 h-4 text-dark/60" />
                </button>
                <button onClick={() => updateHabitNum('sleepHours', Math.min(24, habitLog.sleepHours + 1))} className="flex-1 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-100 transition-colors">
                  <Plus className="w-3 h-3" /> Add Hour
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[320px] flex flex-col">
          {/* Streak Calendar Dots */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-dark">14-Day Activity</h3>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-md flex items-center gap-1">14 Day Streak <span className="text-sm">🔥</span></span>
            </div>
            
            <div className="grid grid-cols-7 gap-2.5 place-items-center mb-4">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-dark/40 uppercase">{d}</span>
              ))}
              {Array.from({ length: 14 }).map((_, i) => {
                const isToday = i === 13;
                const isFilled = i < 13; // mock streak
                return (
                  <div 
                    key={i} 
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isFilled ? 'bg-primary border border-primary text-primary'  // Filled
                      : isToday ? 'border-[3px] border-primary bg-transparent'    // Hollow / ring only
                      : 'bg-gray-200 border border-gray-200'                      // Empty
                    }`}
                    title={isToday ? "Today" : `Day ${i + 1}`}
                  >
                     {isFilled && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-dark/50 text-center font-medium mt-auto">You're doing great! Keep it up tomorrow.</p>
          </div>
        </div>

      </div>

      {userGoals.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-medium text-dark flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Daily Goals Progress
            </h2>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
              {habitLog?.goalsCompleted?.length || 0} / {userGoals.length}
            </div>
          </div>

          <div className="space-y-3">
            {userGoals.map(goal => {
              const isCompleted = habitLog?.goalsCompleted?.includes(goal);
              return (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    isCompleted ? 'border-primary bg-primary/5' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                    isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300'
                  }`}>
                    {isCompleted && <Check className="w-4 h-4" />}
                  </div>
                  <span className={`font-medium ${isCompleted ? 'text-primary line-through opacity-80' : 'text-dark'}`}>
                    {goal}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
