import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openDropdown, setOpenDropdown] = useState(null); // 'Admin' | 'IT' | 'HR' | null

  const role = (user?.role || '').toLowerCase();
  const dept = (user?.department || '').toLowerCase();
  const isSuper = role === 'administrator';
  const hasHR = isSuper || role === 'hr' || (role === 'admin' && dept === 'hr');
  const hasIT = isSuper || role === 'it' || (role === 'admin' && (dept === 'it' || dept === 'it ops'));
  const hasAdmin = isSuper || (role === 'admin' && dept !== 'hr' && dept !== 'it' && dept !== 'it ops');

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 md:px-12 border-b border-white/5 backdrop-blur-2xl bg-slate-950/50 sticky top-0 z-50 shadow-xl shadow-black/20">
      <h1 className="text-xl md:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 hover:opacity-90 transition-all shrink-0">
        <Link to="/">WorkPulse</Link>
      </h1>

      <div className="flex items-center gap-6 md:gap-8 text-sm overflow-visible">
         <div className="flex gap-4 md:gap-6 items-center overflow-visible">
            {user ? (
              // Authenticated portal routes
              <>
                <Link 
                  to="/" 
                  className={`relative py-1.5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 ${
                    isActive('/') ? 'text-purple-400 font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Home
                  {isActive('/') && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                  )}
                </Link>

                {/* Common Workspace Dropdown */}
                <div 
                  className="relative shrink-0 py-1.5"
                  onMouseEnter={() => setOpenDropdown('Common')}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button 
                    onClick={() => toggleDropdown('Common')}
                    className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      openDropdown === 'Common' ? 'text-purple-300' : 'text-white/60 hover:text-purple-300'
                    }`}
                  >
                    Common Workspace <span className={`text-[8px] transition-transform duration-300 ${openDropdown === 'Common' ? 'rotate-180 text-purple-300' : ''}`}>▼</span>
                  </button>
                  
                  <div className={`absolute top-full left-0 mt-2 w-56 bg-slate-950/98 backdrop-blur-3xl border border-white/10 p-3 rounded-2xl shadow-2xl transition-all duration-300 z-50 border-t-purple-500/30 space-y-1 ${
                    openDropdown === 'Common' 
                      ? 'opacity-100 translate-y-0 pointer-events-auto' 
                      : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}>
                    {[
                      { label: 'Shift Check-In', path: '/check-in' },
                      { label: 'Submit Update', path: '/submit-update' },
                      { label: 'Work Analytics', path: '/dashboard' },
                      { label: 'Expenses & Docs', path: '/expenses' },
                      { label: 'Support Tickets', path: '/tickets' },
                      { label: 'Leave & Time Off', path: '/leave' },
                    ].map(item => (
                      <Link 
                        key={item.label}
                        to={item.path}
                        onClick={() => setOpenDropdown(null)}
                        className="block text-left text-[9px] font-bold text-white/50 hover:text-purple-300 py-1.5 px-2 hover:bg-purple-500/10 rounded-lg transition-all uppercase tracking-wider cursor-pointer"
                      >
                        • {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Admin Department Dropdown */}
                {hasAdmin && (
                  <div 
                    className="relative shrink-0 py-1.5"
                    onMouseEnter={() => setOpenDropdown('Admin')}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button 
                      onClick={() => toggleDropdown('Admin')}
                      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        openDropdown === 'Admin' ? 'text-purple-300' : 'text-white/60 hover:text-purple-300'
                      }`}
                    >
                      Admin <span className={`text-[8px] transition-transform duration-300 ${openDropdown === 'Admin' ? 'rotate-180 text-purple-300' : ''}`}>▼</span>
                    </button>
                    
                    <div className={`absolute top-full left-0 mt-2 w-56 bg-slate-950/98 backdrop-blur-3xl border border-white/10 p-3 rounded-2xl shadow-2xl transition-all duration-300 z-50 border-t-purple-500/30 space-y-1 ${
                      openDropdown === 'Admin' 
                        ? 'opacity-100 translate-y-0 pointer-events-auto' 
                        : 'opacity-0 translate-y-2 pointer-events-none'
                    }`}>
                      {[
                        'Admin Hub & Keys',
                        'Asset Management',
                        'Office Inventory Tracking',
                        'Vendor Coordination',
                        'Reminders & Escalations',
                        'Meeting Scheduling',
                        'Expense Auditing Console',
                        'Document Organization',
                      ].map(task => {
                        let path = `/tasks/Admin/${encodeURIComponent(task)}`;
                        if (task === 'Admin Hub & Keys') {
                          path = '/admin/hub';
                        } else if (task === 'Reminders & Escalations') {
                          path = `/tasks/Admin/${encodeURIComponent('Reminders/Escalations')}`;
                        } else if (task === 'Expense Auditing Console') {
                          path = `/tasks/Admin/${encodeURIComponent('Expense Tracking')}`;
                        }
                        return (
                          <Link 
                            key={task}
                            to={path}
                            onClick={() => setOpenDropdown(null)}
                            className="block text-left text-[9px] font-bold text-white/50 hover:text-purple-300 py-1.5 px-2 hover:bg-purple-500/10 rounded-lg transition-all uppercase tracking-wider cursor-pointer"
                          >
                            • {task}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* IT Department Dropdown */}
                {hasIT && (
                  <div 
                    className="relative shrink-0 py-1.5"
                    onMouseEnter={() => setOpenDropdown('IT')}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button 
                      onClick={() => toggleDropdown('IT')}
                      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        openDropdown === 'IT' ? 'text-blue-300' : 'text-white/60 hover:text-blue-300'
                      }`}
                    >
                      IT <span className={`text-[8px] transition-transform duration-300 ${openDropdown === 'IT' ? 'rotate-180 text-blue-300' : ''}`}>▼</span>
                    </button>
                    
                    <div className={`absolute top-full left-0 mt-2 w-60 bg-slate-950/98 backdrop-blur-3xl border border-white/10 p-3 rounded-2xl shadow-2xl transition-all duration-300 z-50 border-t-blue-500/30 space-y-1 ${
                      openDropdown === 'IT' 
                        ? 'opacity-100 translate-y-0 pointer-events-auto' 
                        : 'opacity-0 translate-y-2 pointer-events-none'
                    }`}>
                      {[
                        'Email/Admin Account Management',
                        'DNS/Server Monitoring',
                        'Ticket Handling',
                        'Software/License Tracking',
                        'Backup Monitoring',
                        'Dashboard/Reporting',
                        'Cloud/Admin Console Activities',
                        'System Health Alerts',
                      ].map(task => (
                        <Link 
                          key={task}
                          to={`/tasks/IT/${encodeURIComponent(task)}`}
                          onClick={() => setOpenDropdown(null)}
                          className="block text-left text-[9px] font-bold text-white/50 hover:text-blue-300 py-1.5 px-2 hover:bg-blue-500/10 rounded-lg transition-all uppercase tracking-wider cursor-pointer"
                        >
                          • {task}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* HR Department Dropdown */}
                {hasHR && (
                  <div 
                    className="relative shrink-0 py-1.5"
                    onMouseEnter={() => setOpenDropdown('HR')}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button 
                      onClick={() => toggleDropdown('HR')}
                      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        openDropdown === 'HR' ? 'text-emerald-300' : 'text-white/60 hover:text-emerald-300'
                      }`}
                    >
                      HR <span className={`text-[8px] transition-transform duration-300 ${openDropdown === 'HR' ? 'rotate-180 text-emerald-300' : ''}`}>▼</span>
                    </button>
                    
                    <div className={`absolute top-full left-0 mt-2 w-64 bg-slate-950/98 backdrop-blur-3xl border border-white/10 p-3 rounded-2xl shadow-2xl transition-all duration-300 z-50 border-t-emerald-500/30 space-y-1 max-h-80 overflow-y-auto no-scrollbar ${
                      openDropdown === 'HR' 
                        ? 'opacity-100 translate-y-0 pointer-events-auto' 
                        : 'opacity-0 translate-y-2 pointer-events-none'
                    }`}>
                      {[
                        'Resume Screening',
                        'Interview Scheduling',
                        'Onboarding Workflows',
                        'Attendance Tracking',
                        'Leave Management',
                        'Employee Documentation',
                        'Policy Acknowledgement Tracking',
                        'Training/Task Tracking',
                        'Performance Review Summaries',
                        'Employee Engagement Feedback',
                      ].map(task => (
                        <Link 
                          key={task}
                          to={`/tasks/HR/${encodeURIComponent(task)}`}
                          onClick={() => setOpenDropdown(null)}
                          className="block text-left text-[9px] font-bold text-white/50 hover:text-emerald-300 py-1.5 px-2 hover:bg-emerald-500/10 rounded-lg transition-all uppercase tracking-wider cursor-pointer"
                        >
                          • {task}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Public routes
              <>
                <Link 
                  to="/" 
                  className={`relative py-1.5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 ${
                    isActive('/') ? 'text-purple-400 font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Home
                  {isActive('/') && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                  )}
                </Link>
                <Link 
                  to="/about" 
                  className={`relative py-1.5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 ${
                    isActive('/about') ? 'text-purple-400 font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  About
                  {isActive('/about') && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                  )}
                </Link>
                <Link 
                  to="/contact" 
                  className={`relative py-1.5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 ${
                    isActive('/contact') ? 'text-purple-400 font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Contact
                  {isActive('/contact') && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                  )}
                </Link>
              </>
            )}
         </div>

         {/* Right actions desk */}
         <div className="flex items-center gap-4 border-l border-white/10 pl-4 md:pl-6 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 backdrop-blur-md bg-white/5 border border-white/10 rounded-full shadow-inner">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-white text-[9px] font-extrabold flex items-center justify-center uppercase shadow">
                    {user.name ? user.name.replace(/\s*\(.*\)/, "").charAt(0) : '?'}
                  </div>
                  <span className="text-white/80 text-xs font-bold tracking-tight">{user.name ? user.name.replace(/\s*\(.*\)/, "") : ""}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-purple-300/80 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    {user.role === 'administrator' ? 'Administrator' : (user.department || 'General')}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 rounded-full text-red-400 font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer transform hover:scale-105 active:scale-95 shadow-md shadow-red-500/5 hover:shadow-red-500/10"
                >
                  Log out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-full text-white text-xs font-bold uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-black/10">
                  Log in
                </Link>
              </>
            )}
         </div>
      </div>
    </nav>
  );
};

export default Navbar;
