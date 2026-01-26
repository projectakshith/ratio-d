import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const API_URL = "https://seven4-9-backdoor.onrender.com/api/login";

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');

    localStorage.removeItem("ratiod_user");

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      if (data.success) {

        localStorage.setItem("ratiod_user", JSON.stringify(data));
        
        setTimeout(() => { 
            onLogin(data); 
        }, 800);
      } else {
        throw new Error('Server returned success:false');
      }

    } catch (err) {

      localStorage.removeItem("ratiod_user");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col justify-between p-8 md:p-16 relative bg-[#0c30ff]">
      

      <header className="relative z-10">
         <h1 className="text-5xl md:text-8xl lowercase leading-none tracking-tighter"
             style={{ fontFamily: 'Urbanosta', color: '#ceff1c' }}>
            ratio'd
         </h1>
      </header>

      <main className="relative z-10 w-full max-w-2xl mt-auto pb-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            

            <div className="group relative">
               <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
                  Identification (NetID)
               </label>
               <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white py-4 text-4xl md:text-6xl text-white outline-none focus:border-[#ceff1c] transition-colors placeholder:text-white/20"
                  placeholder="username"
                  style={{ fontFamily: 'Aonic' }}
               />
            </div>

            <div className="group relative">
               <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
                  Passkey
               </label>
               <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white py-4 text-4xl md:text-6xl text-white outline-none focus:border-[#ceff1c] transition-colors placeholder:text-white/20"
                  placeholder="••••••••"
                  style={{ fontFamily: 'Aonic' }}
               />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 font-mono text-xs uppercase flex items-center gap-2">
                   <AlertCircle size={14} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-between border-t border-white pt-6 group disabled:opacity-30"
            >
               <span className="text-4xl md:text-6xl lowercase text-white group-hover:text-[#ceff1c] transition-colors" style={{ fontFamily: 'aonic' }}>
                 {loading ? 'WAIT_' : 'signin'}
               </span>
               {loading ? (
                  <Loader2 className="animate-spin text-white" size={40}/> 
               ) : (
                  <ArrowRight size={48} className="text-white group-hover:text-[#ceff1c] group-hover:translate-x-4 transition-all"/>
               )}
            </button>
        </form>
      </main>
    </div>
  );
};

export default LoginPage;