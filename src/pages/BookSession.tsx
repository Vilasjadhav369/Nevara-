import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Video, UserCircle2, CheckCircle2, Star } from 'lucide-react';

const THERAPISTS = [
  { id: 'counselor_demo_1', name: 'Dr. Sarah Jenkins', specialty: 'Anxiety & Academic Stress', availability: ['10:00 AM', '02:00 PM', '04:00 PM'] },
  { id: 'counselor_demo_2', name: 'Dr. Michael Chen', specialty: 'Depression & Relationships', availability: ['09:00 AM', '11:30 AM', '03:00 PM'] },
  { id: 'counselor_demo_3', name: 'Dr. Emily Carter', specialty: 'Career Counseling & Transition', availability: ['01:00 PM', '03:30 PM', '05:00 PM'] },
];

export default function BookSession() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Feedback Dialog State
  const [feedbackBookingId, setFeedbackBookingId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, 'bookings'), where('userId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'bookings');
    }
  };

  const handleBook = async () => {
    if (!auth.currentUser || !selectedTherapist || !selectedDate || !selectedTime) return;
    setIsLoading(true);

    try {
      const scheduledAt = new Date(`${selectedDate} ${selectedTime}`).getTime();
      
      await addDoc(collection(db, 'bookings'), {
        userId: auth.currentUser.uid,
        counselorId: selectedTherapist,
        scheduledAt,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      setSuccess(true);
      fetchMyBookings();
      
      // Reset after 3s
      setTimeout(() => {
        setSuccess(false);
        setSelectedTherapist(null);
        setSelectedTime(null);
      }, 3000);
      
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        updatedAt: Date.now()
      });
      fetchMyBookings();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackBookingId) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', feedbackBookingId), {
        rating: feedbackRating,
        feedback: feedbackText,
        updatedAt: Date.now()
      });
      setFeedbackBookingId(null);
      setFeedbackRating(5);
      setFeedbackText('');
      fetchMyBookings();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-serif text-dark mb-2">Book a Session</h1>
        <p className="text-dark/60">Schedule a 1-on-1 virtual consultation with our professional counselors.</p>
      </header>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="font-medium">Success! Your session has been requested.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-serif text-xl font-medium mt-2">1. Select a Counselor</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {THERAPISTS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTherapist(t.id); setSelectedTime(null); }}
                className={`text-left p-6 rounded-2xl transition-all border ${
                  selectedTherapist === t.id 
                    ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary' 
                    : 'bg-white border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-6 h-6 text-dark/40" />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark">{t.name}</h3>
                    <p className="text-xs text-dark/60 font-medium">{t.specialty}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedTherapist && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-4">
              <h2 className="font-serif text-xl font-medium">2. Select Date & Time</h2>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-dark/60 uppercase tracking-wider mb-2">Date</label>
                  <div className="relative max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CalendarIcon className="w-5 h-5 text-dark/40" />
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark/60 uppercase tracking-wider mb-3">Available Time Slots</label>
                  <div className="flex flex-wrap gap-3">
                    {THERAPISTS.find(t => t.id === selectedTherapist)?.availability.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                          selectedTime === time
                            ? 'bg-dark text-white shadow-md'
                            : 'bg-gray-50 border border-gray-200 text-dark/70 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleBook}
                  disabled={!selectedTime || isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white rounded-xl font-bold tracking-wide transition-all shadow-md hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  {isLoading ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:border-l lg:border-white/50 lg:pl-8 space-y-6">
          <h2 className="font-serif text-xl font-medium mt-2">My Bookings</h2>
          {bookings.length === 0 ? (
            <div className="bg-white/50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-sm text-dark/50 font-medium">No active bookings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.sort((a,b) => b.createdAt - a.createdAt).map(b => (
                <div key={b.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded text-dark/70">
                      {b.status}
                    </span>
                    <Video className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-medium text-dark mb-1">Session</p>
                  <p className="text-sm text-dark/60 mb-3">Dr. {THERAPISTS.find(t => t.id === b.counselorId)?.name.split(' ')[1] || 'Counselor'}</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-4 text-sm font-medium text-dark/80 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-primary" /> {new Date(b.scheduledAt).toLocaleDateString(undefined, { month:'short', day:'numeric' })}</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {new Date(b.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                    {b.status !== 'completed' && b.status !== 'cancelled' && (
                      <button onClick={() => handleMarkCompleted(b.id)} className="w-full text-sm font-bold text-dark/60 bg-gray-100 hover:bg-gray-200 py-2 rounded-xl mt-1 transition-colors">
                        Mark Completed
                      </button>
                    )}
                    {b.status === 'completed' && !b.rating && (
                      <button onClick={() => setFeedbackBookingId(b.id)} className="w-full text-sm font-bold text-white bg-dark hover:bg-dark/90 py-2 rounded-xl mt-1 transition-colors shadow-sm">
                        Rate Session
                      </button>
                    )}
                    {b.status === 'completed' && b.rating && (
                      <div className="mt-1 text-sm bg-primary/5 border border-primary/20 text-primary p-3 rounded-xl">
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({length: 5}).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < b.rating ? 'fill-current' : 'text-primary/30 fill-transparent'}`} />
                          ))}
                        </div>
                        {b.feedback && <p className="text-xs italic text-dark/70 mt-1">"{b.feedback}"</p>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {feedbackBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-sm">
            <h3 className="text-xl font-bold text-dark mb-4 drop-shadow-sm">Rate your Session</h3>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setFeedbackRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                  <Star className={`w-8 h-8 ${star <= feedbackRating ? 'fill-primary text-primary' : 'text-gray-300 fill-transparent'}`} />
                </button>
              ))}
            </div>
            <textarea
              className="w-full bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl p-3 outline-none mb-6 resize-none text-sm font-medium"
              rows={3}
              placeholder="Leave a short comment (optional)..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setFeedbackBookingId(null); setFeedbackText(''); setFeedbackRating(5); }}
                className="px-5 py-2.5 rounded-xl font-bold text-dark/60 hover:text-dark hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitFeedback}
                disabled={isLoading}
                className="px-5 py-2.5 bg-dark text-white rounded-xl font-bold hover:bg-dark/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
