import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { Heart, MessageSquare, ShieldAlert, Send } from 'lucide-react';

export default function Forum() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !auth.currentUser) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: auth.currentUser.uid,
        title: newTitle.trim(),
        content: newContent.trim(),
        upvotes: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setNewTitle('');
      setNewContent('');
      fetchPosts();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleUpvote = async (postId: string, currentUpvotes: string[]) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const isUpvoted = currentUpvotes.includes(uid);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        upvotes: isUpvoted ? arrayRemove(uid) : arrayUnion(uid)
      });
      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return { ...p, upvotes: isUpvoted ? p.upvotes.filter((id: string) => id !== uid) : [...p.upvotes, uid] };
        }
        return p;
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-dark mb-2">Community Forum</h1>
        <p className="text-dark/60">A safe, anonymous space to share and support each other.</p>
      </header>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-primary mb-4 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Posts are strictly anonymous</span>
        </div>
        
        <form onSubmit={handlePost} className="space-y-4">
          <input
            type="text"
            placeholder="Give your post a title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 outline-none transition-all font-medium"
            required
            maxLength={100}
          />
          <textarea
            placeholder="Share what's on your mind..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl p-4 outline-none transition-all resize-none min-h-[120px]"
            required
            maxLength={2000}
          ></textarea>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPosting}
              className="px-6 py-2.5 bg-dark text-white rounded-xl font-medium tracking-wide transition-all hover:bg-dark/90 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isPosting ? 'Posting...' : 'Post Anonymously'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2].map(i => <div key={i} className="h-40 bg-white rounded-3xl border border-gray-100"></div>)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-10 text-dark/40">No posts yet. Be the first to share!</div>
        ) : (
          posts.map((post) => {
            const hasUpvoted = post.upvotes?.includes(auth.currentUser?.uid);
            return (
              <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all hover:border-primary/20">
                <h3 className="font-serif text-xl font-medium text-dark mb-2">{post.title}</h3>
                <p className="text-dark/80 whitespace-pre-wrap mb-4">{post.content}</p>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                  <span className="text-xs font-medium text-dark/40">
                    {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleUpvote(post.id, post.upvotes || [])}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${hasUpvoted ? 'text-rose-500' : 'text-dark/40 hover:text-rose-500'}`}
                    >
                      <Heart className={`w-5 h-5 ${hasUpvoted ? 'fill-rose-500' : ''}`} />
                      <span>{post.upvotes?.length || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm font-medium text-dark/40 hover:text-primary transition-colors">
                      <MessageSquare className="w-5 h-5" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
