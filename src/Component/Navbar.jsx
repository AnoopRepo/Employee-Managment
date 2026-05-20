import React from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="w-full h-16 flex items-center justify-between px-8 md:px-12 border-b border-white/5 backdrop-blur-2xl bg-slate-950/50 sticky top-0 z-50 shadow-xl shadow-black/20">
      <h1 className="text-xl md:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 hover:opacity-90 transition-all">
        <Link to="/">WorkPulse</Link>
      </h1>

      <div className="flex items-center gap-8 text-sm">
         <div className="flex gap-6 items-center">
            {user && (
              <>
                <Link 
                  to="/" 
                  className={`relative py-1.5 transition-all text-xs font-semibold uppercase tracking-wider ${
                    isActive('/') ? 'text-purple-400 font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Submit Update
                  {isActive('/') && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                  )}
                </Link>
                <Link 
                  to="/dashboard" 
                  className={`relative py-1.5 transition-all text-xs font-semibold uppercase tracking-wider ${
                    isActive('/dashboard') ? 'text-purple-400 font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Dashboard
                  {isActive('/dashboard') && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                  )}
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/users" 
                    className={`relative py-1.5 transition-all text-xs font-semibold uppercase tracking-wider ${
                      isActive('/admin/users') ? 'text-purple-400 font-bold' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Directory
                    {isActive('/admin/users') && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                    )}
                  </Link>
                )}
              </>
            )}
            <Link 
              to="/about" 
              className={`relative py-1.5 transition-all text-xs font-semibold uppercase tracking-wider ${
                isActive('/about') ? 'text-purple-400 font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              About
              {isActive('/about') && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
              )}
            </Link>
         </div>

         <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            {user ? (
              <div className="flex items-center gap-4">
                {/* User Profile Tag */}
                <div className="px-3 py-1.5 backdrop-blur-md bg-white/5 border border-white/10 rounded-full flex items-center gap-2 shadow-inner">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-white text-[9px] font-extrabold flex items-center justify-center uppercase shadow">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-white/80 text-xs font-bold tracking-tight">{user.name}</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm ${
                    user.role === 'admin' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {user.role}
                  </span>
                </div>
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 rounded-full text-red-400 font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer transform hover:scale-105 active:scale-95 shadow-md shadow-red-500/5 hover:shadow-red-500/10"
                >
                  Log out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-white/60 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors">
                  Log in
                </Link>
                <Link to="/signup" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-full text-white text-xs font-bold uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-black/10">
                  Sign up
                </Link>
              </>
            )}
         </div>
      </div>
    </nav>
  );
};

export default Navbar;

