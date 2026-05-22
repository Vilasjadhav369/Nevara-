import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, Lock, Eye, EyeOff, LogIn, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import Logo from '../components/Logo';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.max(1, score);
  };

  const strength = getPasswordStrength(password);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'users', cred.user.uid);
        try {
          await setDoc(userRef, {
            email: cred.user.email,
            name: name,
            role: 'student',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'users/' + cred.user.uid);
        }
      }
      navigate('/');
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "That email or password is incorrect. Please try again.";
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Please choose a stronger password (at least 8 characters).";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message) {
        errorMessage = err.message.replace('Firebase: ', '');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', cred.user.uid);
      
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        try {
          await setDoc(userRef, {
            email: cred.user.email,
            name: cred.user.displayName || 'Student',
            avatarUrl: cred.user.photoURL,
            role: 'student',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'users/' + cred.user.uid);
        }
      }
      navigate('/');
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed before completing.";
      } else if (err.message) {
        errorMessage = err.message.replace('Firebase: ', '');
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Soft sage/lavender gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e6ece5] via-background to-[#efeef4] overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/60 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px]"></div>
      </div>

      {/* Logo top-left */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <Logo className="w-24 h-24 md:w-32 md:h-32" />
      </div>

      {/* Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-[20px] shadow-[0_2px_24px_rgba(0,0,0,0.06)] p-8 md:p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-dark mb-2 text-center">
            {isLogin ? 'Sign in with email' : 'Create an account'}
          </h2>
          <p className="text-dark/60 text-center text-sm md:text-base">
            {isLogin ? 'Access your personal mental health space.' : 'Join Nevara community today.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" title="User Name">
                <User className="w-5 h-5 text-dark/40" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all placeholder:text-dark/40 text-dark"
                required={!isLogin}
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" title="Email address">
              <Mail className="w-5 h-5 text-dark/40" />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all placeholder:text-dark/40 text-dark"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" title="Password">
                <Lock className="w-5 h-5 text-dark/40" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all placeholder:text-dark/40 text-dark"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-dark/40 hover:text-dark/60 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {!isLogin && password && (
              <div className="flex gap-1.5 px-1 py-1 h-1.5">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-full flex-1 rounded-full transition-colors ${
                      strength >= level
                        ? strength === 1
                          ? 'bg-red-400'
                          : strength === 2
                          ? 'bg-yellow-400'
                          : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}
            {!isLogin && password && (
              <p className={`text-xs px-1 ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                {strength === 1 ? 'Weak password - add numbers or symbols' : strength === 2 ? 'Good password' : 'Strong password'}
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" title="Confirm Password">
                <Lock className="w-5 h-5 text-dark/40" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-11 pr-12 py-3.5 bg-gray-50 border outline-none transition-all placeholder:text-dark/40 text-dark rounded-xl ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-400/10'
                    : confirmPassword && password === confirmPassword
                    ? 'border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10'
                    : 'border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10'
                }`}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                {confirmPassword && password !== confirmPassword && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          )}

          {isLogin && (
            <div className="flex justify-end">
              <a href="#" className="text-sm text-dark/60 hover:text-primary transition-colors font-medium">
                Forgot password?
              </a>
            </div>
          )}

          {!isLogin && (
            <p className="text-xs text-dark/60 text-center px-4 pt-1">
              By creating an account, you agree to our{' '}
              <a href="#" className="font-medium hover:text-dark underline underline-offset-2 transition-colors">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="font-medium hover:text-dark underline underline-offset-2 transition-colors">Privacy Policy</a>.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-dark hover:bg-dark/90 text-white rounded-xl font-medium tracking-wide transition-all shadow-md active:scale-[0.98] disabled:opacity-70 mt-2"
          >
            {loading ? 'Please wait...' : 'Get Started'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-dark/40 font-medium" style={{background: 'rgba(255, 255, 255, 0.2)'}}>
                Or continue with
              </span>
            </div>
          </div>

          {/* Social login row */}
          <div className="mt-6 flex flex-col gap-3">
            <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-white hover:border-gray-200 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all group font-medium text-dark/80 hover:text-dark">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-dark/70">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
