import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, auth, storage, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { Camera, Save, UserCircle, Sun, Moon, LogOut } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [dndStart, setDndStart] = useState('');
  const [dndEnd, setDndEnd] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setName(data.name || '');
          setDndStart(data.dndStart || '22:00');
          setDndEnd(data.dndEnd || '07:00');
          const theme = data.themePreference;
          const dark = theme === 'dark';
          setIsDark(dark);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    };
    fetchProfile();
  }, []);

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

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !name.trim()) return;
    if (name === profile.name && dndStart === profile.dndStart && dndEnd === profile.dndEnd) return;
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    if (!auth.currentUser || !name.trim()) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { 
        name, 
        dndStart,
        dndEnd,
        updatedAt: Date.now() 
      });
      await updateProfile(auth.currentUser, { displayName: name });
      setProfile({ ...profile, name, dndStart, dndEnd });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    
    setUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { avatarUrl: url, updatedAt: Date.now() });
      await updateProfile(auth.currentUser, { photoURL: url });
      setProfile({ ...profile, avatarUrl: url });
    } catch (err) {
      console.error('Error uploading avatar:', err);
      // Fallback for demo if storage rules reject
      alert("Could not upload to Storage. Please check Storage rules.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!profile) {
    return <div className="p-8"><div className="animate-pulse w-full max-w-sm h-64 bg-gray-100 rounded-3xl"></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-serif text-dark mb-2">Profile Details</h1>
        <p className="text-dark/60">Manage your personal information.</p>
      </header>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 pb-8 border-b border-gray-100">
          <div className="relative group">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-gray-50 shadow-sm">
                <UserCircle className="w-16 h-16 text-primary/50" />
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-dark hover:bg-dark/90 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105 active:scale-95">
              {uploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-dark">{profile.name}</h2>
            <p className="text-dark/50 font-medium mb-2">{auth.currentUser?.email}</p>
            <span className="inline-block bg-accent/20 text-teal-800 tracking-wider text-xs font-bold uppercase px-3 py-1 rounded-md">
              {profile.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveClick} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-dark/70 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all font-medium"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-dark/70 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={auth.currentUser?.email || ''}
              disabled
              className="w-full bg-gray-100 border border-transparent rounded-xl px-4 py-3 text-dark/50 cursor-not-allowed font-medium"
            />
            <p className="text-xs text-dark/40 mt-2">Email address cannot be changed directly.</p>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-dark mb-4">Notification Preferences</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-dark/70 uppercase tracking-wider mb-2">DND Start Time</label>
                <input
                  type="time"
                  value={dndStart}
                  onChange={(e) => setDndStart(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark/70 uppercase tracking-wider mb-2">DND End Time</label>
                <input
                  type="time"
                  value={dndEnd}
                  onChange={(e) => setDndEnd(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all font-medium"
                />
              </div>
            </div>
            <p className="text-xs text-dark/50 mt-3">During Do Not Disturb hours, you won't receive notification alerts or gentle check-ins.</p>
          </div>

          <div className="pt-4 pb-8 border-b border-gray-100">
            <button
              type="submit"
              disabled={isSaving || (name === profile.name && dndStart === profile.dndStart && dndEnd === profile.dndEnd)}
              className="px-8 py-3.5 bg-dark text-white rounded-xl font-bold tracking-wide transition-all shadow-md hover:bg-dark/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="pt-2">
            <h3 className="text-lg font-bold text-dark mb-4">Account & Adjustments</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-3 text-dark">
                  {isDark ? <Sun className="w-5 h-5 text-dark/70" /> : <Moon className="w-5 h-5 text-dark/70" />}
                  <span className="font-medium text-dark">{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => auth.signOut()}
                className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
              >
                <div className="flex items-center gap-3 text-red-600">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-sm"
          >
            <h3 className="text-xl font-bold text-dark mb-4 drop-shadow-sm">Confirm Changes</h3>
            <p className="text-dark/70 mb-8 font-medium">Are you sure you want to save these changes?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-dark/60 hover:text-dark hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSave}
                className="px-5 py-2.5 bg-dark text-white rounded-xl font-bold hover:bg-dark/90 transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
