import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Target, ArrowRight, Check, Sparkles } from 'lucide-react';

const GOALS = [
  "Manage stress & anxiety",
  "Improve sleep quality",
  "Build healthy habits",
  "Increase mindfulness",
  "Seek professional help"
];

interface OnboardingModalProps {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };
  
  const handleNextStep = () => {
    setStep(2);
  };

  const handleFinish = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        onboardingCompleted: true,
        goals: selectedGoals,
        updatedAt: Date.now()
      });
      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Progress Bar Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between text-sm font-bold text-dark/40 uppercase tracking-widest mb-3">
            <span>Step {step} of 2</span>
            <span>{step === 1 ? 'Next: Tell us about yourself' : 'Almost done!'}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary rounded-full w-full"
              initial={{ scaleX: 0.5 }}
              animate={{ scaleX: step === 1 ? 0.5 : 1 }}
              style={{ originX: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="px-8 pb-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-dark">What are your goals?</h2>
                </div>
                <p className="text-dark/60 mb-6">Select all that apply. This helps us personalize your dashboard.</p>
                
                <div className="space-y-3">
                  {GOALS.map((goal) => (
                    <button 
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedGoals.includes(goal) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                        selectedGoals.includes(goal) ? 'bg-primary border-primary text-white' : 'border-gray-300'
                      }`}>
                        {selectedGoals.includes(goal) && <Check className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-dark">{goal}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleNextStep}
                    disabled={selectedGoals.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-dark text-white rounded-xl font-bold hover:bg-dark/90 transition-colors disabled:opacity-50"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="pt-2"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-dark">Tell us about yourself</h2>
                </div>
                <p className="text-dark/60 mb-8">
                  We've personalized your experience. To make the most of Nevara, you can add more details to your profile later.
                </p>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center mb-8">
                  <h3 className="font-bold text-dark mb-2">You're all set!</h3>
                  <p className="text-dark/60 text-sm">Your goals have been saved successfully.</p>
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-dark/50 hover:text-dark font-bold px-4 py-2"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleFinish}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-dark text-white rounded-xl font-bold hover:bg-dark/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Finishing setup...' : 'Go to Dashboard'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
