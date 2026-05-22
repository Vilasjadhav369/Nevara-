import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Shield, Users, Activity, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalStudents: 0, totalCounselors: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const usersQ = query(collection(db, 'users'));
        const usersSnap = await getDocs(usersQ);
        
        let allUsers: any[] = [];
        let students = 0;
        let counselors = 0;

        usersSnap.forEach(doc => {
          const data = doc.data();
          allUsers.push({ id: doc.id, ...data });
          if (data.role === 'student') students++;
          if (data.role === 'counselor') counselors++;
        });

        setUsers(allUsers);
        setStats({ totalUsers: allUsers.length, totalStudents: students, totalCounselors: counselors });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl mt-6"></div>
    </div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-6xl mx-auto">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-dark font-bold">Admin Dashboard</h1>
          <p className="text-dark/60">Overview of Nevara platform usage and user management.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-dark/50 uppercase tracking-wider mb-1">Total Users</p>
            <h3 className="text-3xl font-black text-dark">{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-dark/50 uppercase tracking-wider mb-1">Students</p>
            <h3 className="text-3xl font-black text-dark">{stats.totalStudents}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-dark/50 uppercase tracking-wider mb-1">Counselors</p>
            <h3 className="text-3xl font-black text-dark">{stats.totalCounselors}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-dark">User Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-dark/50 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-dark">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-dark/70 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      user.role === 'counselor' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-dark/70 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-dark/50">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
