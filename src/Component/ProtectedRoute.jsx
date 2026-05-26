import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, hrOnly = false, allowedRoles = null }) => {
  const { user, loading } = useAuth();

  // Premium glassmorphic loading animation
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute w-12 h-12 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-4 text-white/60 tracking-wider text-sm animate-pulse">Verifying Session...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user?.role || '').toLowerCase();
  const dept = (user?.department || '').toLowerCase();
  
  const isAdministrator = role === 'administrator';
  const hasHR = isAdministrator || role === 'hr' || (role === 'admin' && dept === 'hr');
  const hasIT = isAdministrator || role === 'it' || (role === 'admin' && (dept === 'it' || dept === 'it ops'));
  const hasAdmin = isAdministrator || (role === 'admin' && dept !== 'hr' && dept !== 'it' && dept !== 'it ops');

  const isUnauthorized = (
    (hrOnly && !hasHR) ||
    (adminOnly && !hasAdmin) ||
    (allowedRoles && !isAdministrator && !allowedRoles.map(r => r.toLowerCase()).includes(role))
  );

  if (isUnauthorized) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] relative overflow-hidden p-6">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-red-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none"></div>
        
        <div className="relative w-full max-w-md p-8 overflow-hidden backdrop-blur-xl bg-white/5 rounded-2xl border border-red-500/20 shadow-2xl z-10 text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 text-3xl mb-6">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Unauthorized Access</h2>
          <p className="text-white/70 mb-6 text-sm leading-relaxed">
            This workspace requires {adminOnly ? 'administrative' : hrOnly ? 'HR' : 'specific role'} privileges. You do not have permissions to access this page.
          </p>
          <a
            href="/"
            className="inline-block py-2.5 px-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
