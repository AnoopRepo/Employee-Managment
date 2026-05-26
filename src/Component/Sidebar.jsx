import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ open, setOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [departmentsExpanded, setDepartmentsExpanded] = useState(false);
  const [expandedDept, setExpandedDept] = useState(null); // 'Admin', 'IT', 'HR'
  const [commonExpanded, setCommonExpanded] = useState(false);

  const role = (user?.role || '').toLowerCase();
  const dept = (user?.department || '').toLowerCase();
  const isSuper = role === 'administrator';
  const hasHR = isSuper || role === 'hr' || (role === 'admin' && dept === 'hr');
  const hasIT = isSuper || role === 'it' || (role === 'admin' && (dept === 'it' || dept === 'it ops'));
  const hasAdmin = isSuper || (role === 'admin' && dept !== 'hr' && dept !== 'it' && dept !== 'it ops');

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (setOpen) setOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', label: 'Workspace Home', icon: '🏠' },
  ];

  if (hasHR) {
    menuItems.push({ path: '/hr', label: 'HR Portal', icon: '💼' });
  }

  if (hasAdmin) {
    menuItems.push({ path: '/admin/hub', label: 'Admin Hub', icon: '🔑' });
  }

  menuItems.push({ path: '/about', label: 'About', icon: 'ℹ️' });

  const renderContent = () => (
    <div className="h-full flex flex-col justify-between select-none">
      <div className="space-y-6 overflow-y-auto no-scrollbar flex-1 pb-4">
        {/* Workspace Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-purple-500/20">
            W
          </div>
          <div>
            <h1 className="text-md font-extrabold tracking-tight text-white leading-none">WorkPulse</h1>
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1 block">Workspace Portal</span>
          </div>
        </div>

        {/* User Profile Block */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-white font-black flex items-center justify-center uppercase shadow-inner border border-white/10 shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-white truncate leading-tight">{user?.name ? user.name.replace(/\s*\(.*\)/, "") : ""}</p>
              <p className="text-white/40 text-[10px] truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm ${
              user?.role === 'admin' || user?.role === 'administrator'
                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : user?.role === 'hr'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-green-500/10 text-green-400 border-green-500/20'
            }`}>
              {user?.role}
            </span>
            <span className="text-[9px] text-white/30 font-medium">Session Active</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen && setOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  active
                    ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'bg-transparent border border-transparent text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]"></span>
                )}
              </Link>
            );
          })}

          {/* Common Workspace Collapsible Group */}
          <div className="space-y-1">
            <button
              onClick={() => setCommonExpanded(!commonExpanded)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                commonExpanded 
                  ? 'bg-white/5 text-white' 
                  : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-sm">🌐</span>
              <span>Common Workspace</span>
              <span className="ml-auto text-[8px] transition-transform duration-300" style={{ transform: commonExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </button>

            {commonExpanded && (
              <div className="pl-3.5 space-y-1 border-l border-white/5 ml-4 animate-fadeIn">
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
                    onClick={() => setOpen && setOpen(false)}
                    className="block text-left text-[9px] font-bold text-white/50 hover:text-white py-2 hover:pl-1 transition-all uppercase tracking-wider cursor-pointer font-mono"
                  >
                    - {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Departments Collapsible Group */}
          {(hasHR || hasIT || hasAdmin) && (
            <div className="space-y-1">
              <button
                onClick={() => setDepartmentsExpanded(!departmentsExpanded)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  departmentsExpanded 
                    ? 'bg-white/5 text-white' 
                    : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-sm">🏢</span>
                <span>Departments</span>
                <span className="ml-auto text-[8px] transition-transform duration-300" style={{ transform: departmentsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>

              {departmentsExpanded && (
                <div className="pl-3.5 space-y-1 border-l border-white/5 ml-4 animate-fadeIn">
                  {[
                    { 
                      key: 'Admin', 
                      label: 'Admin', 
                      color: 'text-purple-400',
                      roles: ['admin', 'administrator'],
                      tasks: [
                        'Admin Hub & Keys',
                        'Asset Management',
                        'Office Inventory Tracking',
                        'Vendor Coordination',
                        'Reminders & Escalations',
                        'Meeting Scheduling',
                        'Expense Auditing Console',
                        'Document Organization',
                      ]
                    },
                    { 
                      key: 'IT', 
                      label: 'IT Systems', 
                      color: 'text-blue-400',
                      roles: ['it', 'administrator'],
                      tasks: [
                        'Email/Admin Account Management',
                        'DNS/Server Monitoring',
                        'Ticket Handling',
                        'Software/License Tracking',
                        'Backup Monitoring',
                        'Dashboard/Reporting',
                        'Cloud/Admin Console Activities',
                        'System Health Alerts',
                      ]
                    },
                    { 
                      key: 'HR', 
                      label: 'HR Operations', 
                      color: 'text-emerald-400',
                      roles: ['hr', 'administrator'],
                      tasks: [
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
                      ]
                    }
                  ].filter(d => {
                    if (d.key === 'Admin') return hasAdmin;
                    if (d.key === 'IT') return hasIT;
                    if (d.key === 'HR') return hasHR;
                    return false;
                  }).map(dept => (
                    <div key={dept.key} className="space-y-1">
                      <button
                        onClick={() => setExpandedDept(expandedDept === dept.key ? null : dept.key)}
                        className={`w-full flex items-center justify-between py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-left transition-colors cursor-pointer ${
                          expandedDept === dept.key ? dept.color : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        <span>• {dept.label}</span>
                        <span className="text-[8px]">{expandedDept === dept.key ? '▲' : '▼'}</span>
                      </button>

                      {expandedDept === dept.key && (
                        <div className="pl-2 space-y-1 animate-fadeIn max-h-48 overflow-y-auto no-scrollbar border-l border-white/5 ml-1">
                          {dept.tasks.map(task => {
                            let path = `/tasks/${dept.key}/${encodeURIComponent(task)}`;
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
                                onClick={() => setOpen && setOpen(false)}
                                className="block text-left text-[9px] font-bold text-white/50 hover:text-white py-1 hover:pl-1 transition-all uppercase tracking-wider cursor-pointer font-mono"
                              >
                                - {task}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Logout / Footer Section */}
      <div className="border-t border-white/5 pt-4 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-400 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-md shadow-red-500/5 hover:shadow-red-500/10"
        >
          🚪 Sign Out
        </button>
        <p className="text-[8px] text-center text-white/20 font-semibold tracking-wider mt-3 uppercase">WorkPulse Terminal v1.2.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop overlay (toggled on click for mobile and click-outside closure) */}
      {open && (
        <div 
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-all duration-300 animate-fadeIn"
        />
      )}

      {/* Dynamic Slide-over Sidebar Drawer (hover activated & responsive) */}
      <aside 
        onMouseLeave={() => setOpen(false)}
        className={`fixed top-0 left-0 h-screen w-64 border-r border-white/5 bg-slate-950/90 backdrop-blur-3xl flex flex-col p-6 z-50 transition-transform duration-300 ease-out shadow-2xl ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent()}
      </aside>
    </>
  );
};

export default Sidebar;
