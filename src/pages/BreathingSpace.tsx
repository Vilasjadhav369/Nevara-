import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Play, Square, Settings } from 'lucide-react';

export default function BreathingSpace() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'>('idle');
  const [timer, setTimer] = useState(0);

  // 4-7-8 method: Inhale 4s, Hold 7s, Exhale 8s
  // Box breathing method: Inhale 4s, Hold 4s, Exhale 4s, Hold 4s
  const currentPattern = {
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev + 1;
          
          if (phase === 'idle' || phase === 'hold2') {
            if (newTime >= currentPattern.hold2) {
              setPhase('inhale');
              return 0;
            }
          } else if (phase === 'inhale') {
            if (newTime >= currentPattern.inhale) {
              setPhase('hold1');
              return 0;
            }
          } else if (phase === 'hold1') {
            if (newTime >= currentPattern.hold1) {
              setPhase('exhale');
              return 0;
            }
          } else if (phase === 'exhale') {
            if (newTime >= currentPattern.exhale) {
              setPhase('hold2');
              return 0;
            }
          }
          return newTime;
        });
      }, 1000);
    } else {
      setPhase('idle');
      setTimer(0);
    }

    return () => clearInterval(interval);
  }, [isActive, phase]);

  const toggleBreathing = () => {
    if (!isActive) {
      setIsActive(true);
      setPhase('inhale');
      setTimer(0);
    } else {
      setIsActive(false);
    }
  };

  const getPhaseText = () => {
    if (!isActive) return 'Ready to breathe?';
    switch (phase) {
      case 'inhale': return 'Breathe In...';
      case 'hold1': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      case 'hold2': return 'Hold...';
      default: return 'Ready to breathe?';
    }
  };

  const getScale = () => {
    if (!isActive) return 1;
    switch (phase) {
      case 'inhale': return 1.5;
      case 'hold1': return 1.5;
      case 'exhale': return 1;
      case 'hold2': return 1;
      default: return 1;
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[min(calc(100vh-120px),600px)] flex flex-col items-center justify-center relative">
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-3xl font-serif font-bold text-dark mb-3">Breathing Space</h1>
        <p className="text-dark/60">Take a moment to reset and center yourself.</p>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center mb-12">
        <AnimatePresence>
          <motion.div
            animate={{
              scale: getScale(),
              opacity: isActive ? 1 : 0.5,
              backgroundColor: phase === 'inhale' || phase === 'hold1' ? '#9bb399' : '#e1e8e5'
            }}
            transition={{
              duration: phase === 'inhale' ? currentPattern.inhale : phase === 'exhale' ? currentPattern.exhale : 0.5,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-primary/20"
          />
        </AnimatePresence>
        
        <div className="absolute inset-4 rounded-full bg-white/80 backdrop-blur-sm shadow-xl border border-white flex flex-col items-center justify-center z-10">
          <Wind className={`w-8 h-8 mb-2 ${isActive ? 'text-primary' : 'text-dark/30'}`} />
          <h2 className={`text-xl font-bold font-serif px-4 text-center ${isActive ? 'text-primary' : 'text-dark/60'}`}>
            {getPhaseText()}
          </h2>
          {isActive && (
            <p className="text-sm font-medium text-dark/40 mt-1 tabular-nums">
              {timer}
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10">
        <button
          onClick={toggleBreathing}
          className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold shadow-lg transition-all active:scale-95 ${
            isActive 
              ? 'bg-white border border-gray-200 text-dark hover:bg-gray-50' 
              : 'bg-dark text-white hover:bg-dark/90'
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>Stop Exercise</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start Box Breathing</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
