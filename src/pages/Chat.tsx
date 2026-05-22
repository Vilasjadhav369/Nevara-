import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { Send, UserCircle2 } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // We use a fixed counselor ID for the prototype
  const MOCK_COUNSELOR_ID = 'counselor_demo_123';
  const roomId = auth.currentUser ? `${auth.currentUser.uid}_${MOCK_COUNSELOR_ID}` : '';

  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'chats', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${roomId}/messages`);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser || !roomId) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', roomId, 'messages'), {
        roomId,
        senderId: auth.currentUser.uid,
        content: msgText,
        createdAt: Date.now()
      });
      // Mock counselor auto-reply for demo purposes
      if (messages.length === 0 || Math.random() > 0.5) {
        setTimeout(async () => {
          try {
            await addDoc(collection(db, 'chats', roomId, 'messages'), {
              roomId,
              senderId: MOCK_COUNSELOR_ID,
              content: "I hear you. How does that make you feel?",
              createdAt: Date.now()
            });
          } catch(e) {}
        }, 3000);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chats/${roomId}/messages`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full max-w-4xl mx-auto flex flex-col pt-2 pb-4">
      <header className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-dark mb-1">Live Chat</h1>
          <p className="text-dark/60 text-sm">You are chatting with Dr. Sarah (Counselor)</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs font-bold text-dark/60 uppercase tracking-wider">Online</span>
        </div>
      </header>

      <div className="flex-1 bg-white border border-gray-100 rounded-3xl overflow-hidden flex flex-col shadow-sm relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        
        {/* Messages view */}
        <div className="flex-1 p-6 overflow-y-auto z-10 flex flex-col gap-4">
          <div className="text-center my-6">
            <span className="bg-gray-100 text-dark/40 text-xs px-3 py-1 rounded-full font-medium">Session Started</span>
          </div>

          {messages.map((msg, idx) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <UserCircle2 className="w-5 h-5 text-accent" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`px-4 py-3 rounded-2xl ${
                        isMe 
                          ? 'bg-dark text-white rounded-tr-sm' 
                          : 'bg-gray-100 text-dark rounded-tl-sm'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-dark/30 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-gray-100 z-10 shrink-0">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl px-4 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-xl bg-primary text-white flex flex-shrink-0 items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-primary/20"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
