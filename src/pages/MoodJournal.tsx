import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Mic, MicOff, Sparkles, X } from 'lucide-react';

const MOODS = [
  { emoji: '😡', score: 1, label: 'Angry' },
  { emoji: '😔', score: 2, label: 'Sad' },
  { emoji: '😐', score: 3, label: 'Neutral' },
  { emoji: '😊', score: 4, label: 'Happy' },
  { emoji: '🤩', score: 5, label: 'Great' },
];

export default function MoodJournal() {
  const [moodsList, setMoodsList] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [isGettingInsight, setIsGettingInsight] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setNote(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser to use voice-to-text.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Voice recognition is not supported in this browser.");
      }
    }
  };

  const getAiInsight = async () => {
    if (!note.trim()) return;
    setIsGettingInsight(true);
    setAiInsight('');
    try {
      const res = await fetch('/api/ai-journal-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      const data = await res.json();
      if (data.insight) {
        setAiInsight(data.insight);
      } else if (data.error) {
        setAiInsight(data.error);
      }
    } catch (err) {
      setAiInsight("Unable to connect to AI Assistant.");
    } finally {
      setIsGettingInsight(false);
    }
  };

  const fetchMoods = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'moods'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateFormatted: new Date(doc.data().createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      })).sort((a: any, b: any) => a.createdAt - b.createdAt);
      setMoodsList(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'moods');
    }
  };

  useEffect(() => {
    fetchMoods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood || !auth.currentUser) return;
    
    setIsSubmitting(true);
    const targetMood = MOODS.find(m => m.score === selectedMood);

    try {
      await addDoc(collection(db, 'moods'), {
        userId: auth.currentUser.uid,
        emoji: targetMood?.emoji,
        score: selectedMood,
        note: note.trim() || null,
        createdAt: Date.now()
      });
      setSelectedMood(null);
      setNote('');
      setAiInsight('');
      fetchMoods();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'moods');
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = moodsList.slice(-7); // Last 7 entries

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-serif text-dark mb-2">Mood Journal</h1>
        <p className="text-dark/60">Log your feelings and track your emotional journey over time.</p>
      </header>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
        
        <form onSubmit={handleSubmit} className="relative z-10">
          <h2 className="text-lg font-medium mb-6">How are you feeling right now?</h2>
          
          <div className="flex gap-2 md:gap-4 mb-8 justify-between md:justify-start">
            {MOODS.map((mood) => (
              <button
                key={mood.score}
                type="button"
                onClick={() => setSelectedMood(mood.score)}
                className={`flex flex-col items-center p-3 md:p-4 rounded-2xl transition-all ${
                  selectedMood === mood.score 
                    ? 'bg-primary/10 border-2 border-primary scale-110 shadow-sm' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 grayscale hover:grayscale-0'
                }`}
              >
                <span className="text-3xl md:text-4xl mb-2 block">{mood.emoji}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  selectedMood === mood.score ? 'text-primary' : 'text-dark/40'
                }`}>{mood.label}</span>
              </button>
            ))}
          </div>

          <div className="mb-6 relative">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-dark/70">Add a note (optional)</label>
              <button 
                type="button" 
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' 
                    : 'bg-primary/10 text-primary hover:bg-primary/20 border border-transparent'
                }`}
              >
                {isListening ? (
                  <><MicOff className="w-3.5 h-3.5" /> Stop Listening</>
                ) : (
                  <><Mic className="w-3.5 h-3.5" /> Voice Note</>
                )}
              </button>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's going on in your mind?"
              className="w-full bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all placeholder:text-dark/30 min-h-[120px] resize-none"
            ></textarea>
            {isListening && (
              <div className="absolute right-4 bottom-4 flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-xs text-red-500 font-medium ml-1">Recording...</span>
              </div>
            )}
            
            <AnimatePresence>
              {aiInsight && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start relative"
                >
                  <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-900 leading-relaxed pr-6">{aiInsight}</p>
                  <button 
                    type="button" 
                    onClick={() => setAiInsight('')} 
                    className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <button
              type="submit"
              disabled={!selectedMood || isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-dark text-white rounded-xl font-bold tracking-wide transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Log Entry'}
            </button>
            
            {note.trim() && !aiInsight && (
              <button
                type="button"
                onClick={getAiInsight}
                disabled={isGettingInsight}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-medium transition-all hover:bg-indigo-100 active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGettingInsight ? 'Thinking...' : 'Get AI Insight'}
              </button>
            )}
          </div>
        </form>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <h2 className="font-serif text-xl font-medium mb-6 text-dark">Your Mood Last 7 Entries</h2>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="dateFormatted" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                  dy={10}
                />
                <YAxis 
                  domain={[1, 5]} 
                  ticks={[1, 2, 3, 4, 5]}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                  tickFormatter={(val) => {
                    const mood = MOODS.find(m => m.score === val);
                    return mood ? mood.emoji : '';
                  }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [MOODS.find(m => m.score === value)?.label, 'Mood']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8fa78d" 
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#8fa78d', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#3a5354' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {moodsList.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-medium text-dark mt-8 px-2">Past Entries</h2>
          <div className="grid gap-4">
            {[...moodsList].reverse().map((entry) => (
              <div key={entry.id} className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 flex gap-4">
                <div className="w-12 h-12 bg-white rounded-full shrink-0 flex items-center justify-center text-2xl shadow-sm border border-gray-50">
                  {entry.emoji}
                </div>
                <div>
                  <div className="text-sm font-medium text-dark/50 mb-1">{entry.dateFormatted} • {new Date(entry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <p className="text-dark leading-relaxed">{entry.note || "No note added."}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
