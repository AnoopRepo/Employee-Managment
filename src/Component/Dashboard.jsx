import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';

const Dashboard = () => {
  const { token, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Accordion active state
  const [expandedReportId, setExpandedReportId] = useState(null);

  // Fetch reports from backend
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to retrieve reports');
      }
      const data = await response.json();
      setReports(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load report metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token]);

  // Handle report deletion (Admin only)
  const handleDeleteReport = async (reportId, e) => {
    e.stopPropagation(); // Prevent accordion toggle
    if (!window.confirm('Are you sure you want to delete this status report? This action is irreversible.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Update state
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const toggleAccordion = (id) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  // Filtered reports calculation
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.today_task.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.problems && report.problems.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'All' || 
      report.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesDate = !dateFilter || report.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate Metrics
  const totalReports = filteredReports.length;
  const totalHours = filteredReports.reduce((acc, r) => acc + r.hours, 0);
  const avgCompletion = totalReports > 0 
    ? Math.round(filteredReports.reduce((acc, r) => acc + r.completion, 0) / totalReports) 
    : 0;
  const activeBlockers = filteredReports.filter(r => r.status.toLowerCase() === 'blocked' || r.status.toLowerCase().includes('block')).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-10 relative overflow-hidden text-white animate-fadeIn">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative max-w-7xl mx-auto z-10 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
              Work Analytics Dashboard
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {user?.role === 'admin' 
                ? 'Reviewing all workspace reports logged across the entire developer team.' 
                : 'Tracking your personal daily task submissions and progress logs.'}
            </p>
          </div>
          <button 
            onClick={fetchReports}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
            </svg>
            Refresh Logs
          </button>
        </div>

        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Reports */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-white/10 transition-all">
            <div>
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Total Reports</p>
              <h3 className="text-3xl font-extrabold mt-1">{totalReports} Logs</h3>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Card 2: Total Hours */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-white/10 transition-all">
            <div>
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Tracked Hours</p>
              <h3 className="text-3xl font-extrabold mt-1">{totalHours} Hrs</h3>
            </div>
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Card 3: Avg Completion Rate */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-6 shadow-lg hover:border-white/10 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Avg Completion</p>
                <h3 className="text-3xl font-extrabold mt-1">{avgCompletion}%</h3>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1 mt-4">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-1 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" style={{ width: `${avgCompletion}%` }}></div>
            </div>
          </div>

          {/* Card 4: Active Blockers */}
          <div className={`backdrop-blur-xl bg-white/5 border rounded-2xl p-6 flex items-center justify-between shadow-lg transition-all hover:border-white/10 ${activeBlockers > 0 ? 'border-red-500/30' : 'border-white/5'}`}>
            <div>
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Active Blockers</p>
              <h3 className={`text-3xl font-extrabold mt-1 ${activeBlockers > 0 ? 'text-red-400' : 'text-white'}`}>{activeBlockers}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${activeBlockers > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Analytics Trend Chart */}
        {filteredReports.length > 0 && (
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-white">Productivity Trend Analysis</h3>
                <p className="text-xs text-white/40 mt-1">Comparing tracked hours and checklist completion percentages over your recent updates.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold select-none">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                  Completion %
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  Tracked Hours
                </span>
              </div>
            </div>
            
            {/* SVG Trend Line Chart */}
            <div className="relative w-full h-64 md:h-80 select-none">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  {/* Gradients */}
                  <linearGradient id="compGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0"/>
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Render SVG Paths and areas */}
                {(() => {
                  const chartData = [...filteredReports].reverse().slice(-7);
                  if (chartData.length === 0) return null;

                  const widthStep = 500 / Math.max(chartData.length - 1, 1);
                  
                  // Map values to coordinates
                  const compPoints = chartData.map((d, idx) => ({
                    x: idx * widthStep,
                    y: 180 - (d.completion / 100) * 160
                  }));

                  const hoursPoints = chartData.map((d, idx) => ({
                    x: idx * widthStep,
                    y: 180 - (Math.min(d.hours, 12) / 12) * 160
                  }));

                  const compPath = compPoints.map(p => `${p.x},${p.y}`).join(" L ");
                  const hoursPath = hoursPoints.map(p => `${p.x},${p.y}`).join(" L ");

                  const compArea = `${compPoints[0].x},180 L ${compPath} L ${compPoints[compPoints.length - 1].x},180 Z`;
                  const hoursArea = `${hoursPoints[0].x},180 L ${hoursPath} L ${hoursPoints[hoursPoints.length - 1].x},180 Z`;

                  return (
                    <>
                      {/* Areas */}
                      <path d={`M ${compArea}`} fill="url(#compGradient)" />
                      <path d={`M ${hoursArea}`} fill="url(#hoursGradient)" />

                      {/* Lines */}
                      <path d={`M ${compPath}`} fill="none" stroke="rgb(168, 85, 247)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                      <path d={`M ${hoursPath}`} fill="none" stroke="rgb(34, 211, 238)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />

                      {/* Points / Circles */}
                      {compPoints.map((p, i) => (
                        <g key={`c-${i}`} className="group cursor-pointer">
                          <circle cx={p.x} cy={p.y} r="4.5" fill="rgb(168, 85, 247)" stroke="#0f172a" strokeWidth="2" className="transition-all hover:r-6 duration-300" />
                          <title>{`Completion: ${chartData[i].completion}% on ${chartData[i].date}`}</title>
                        </g>
                      ))}
                      {hoursPoints.map((p, i) => (
                        <g key={`h-${i}`} className="group cursor-pointer">
                          <circle cx={p.x} cy={p.y} r="4" fill="rgb(34, 211, 238)" stroke="#0f172a" strokeWidth="1.5" className="transition-all hover:r-5.5 duration-300" />
                          <title>{`Tracked Time: ${chartData[i].hours} Hrs on ${chartData[i].date}`}</title>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div className="flex justify-between px-2 text-[10px] font-bold text-white/30 uppercase tracking-wider select-none border-t border-white/5 pt-3">
              {(() => {
                const chartData = [...filteredReports].reverse().slice(-7);
                return chartData.map((d, i) => (
                  <span key={`lbl-${i}`} className="truncate max-w-[60px] md:max-w-[100px]">{d.date.slice(5)}</span>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Dashboard Filters Row */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-lg">
          {/* Search bar */}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Search Timeline</label>
            <div className="relative">
              <input
                type="text"
                placeholder={user?.role === 'admin' ? "Search developer, tasks, problems..." : "Search completed tasks, blockers..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-sm transition-all placeholder:text-white/20"
              />
              <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-sm text-white transition-all appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="On Track">🟢 On Track</option>
              <option value="Blocked">🔴 Blocked</option>
              <option value="Completed">🔵 Completed</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Filter by Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-sm transition-all [color-scheme:dark] cursor-pointer"
            />
          </div>
        </div>

        {/* Timeline Reports Segment */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-wide text-white/90">Timeline Logs</h2>
          
          {loading ? (
            <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl">
              <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60 text-sm">Retrieving database metrics...</p>
            </div>
          ) : error ? (
            <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400 shadow-md">
              <span className="text-3xl mb-4 block">❌</span>
              <p className="font-semibold">{error}</p>
              <button onClick={fetchReports} className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all cursor-pointer">Try Again</button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-3xl py-20 px-8 text-center text-white/50 shadow-2xl relative overflow-hidden animate-fadeIn group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
              {/* Dynamic glowing icon */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 text-purple-400 mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 rounded-2xl bg-purple-500/5 blur-md"></div>
                <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-extrabold text-xl text-white tracking-tight">No status logs found</p>
              <p className="text-sm text-white/40 mt-2 max-w-xs mx-auto leading-relaxed">No reports match your active filters or no daily logs have been submitted to the workspace repository.</p>
              <div className="mt-8">
                <Link 
                  to="/" 
                  className="inline-flex px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-purple-500/10 cursor-pointer"
                >
                  📝 Submit First Log
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                const statusStyle = 
                  report.status.toLowerCase() === 'blocked' || report.status.toLowerCase().includes('block')
                    ? 'bg-red-500/10 text-red-300 border-red-500/20 shadow-red-500/5'
                    : report.status.toLowerCase() === 'completed'
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20 shadow-blue-500/5'
                      : 'bg-green-500/10 text-green-300 border-green-500/20 shadow-green-500/5';
                
                return (
                  <div 
                    key={report.id}
                    onClick={() => toggleAccordion(report.id)}
                    className={`backdrop-blur-3xl border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg hover:shadow-black/25 ${
                      isExpanded 
                        ? 'bg-slate-950/60 border-purple-500/30 scale-[1.002]' 
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Collapsed Header Summary */}
                    <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-extrabold text-white uppercase border border-white/20 shadow-inner">
                          {report.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-white leading-tight">{report.user_name}</h4>
                            {user?.role === 'admin' && (
                              <span className="text-[9px] bg-white/5 text-white/55 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest font-black">Staff</span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {report.date}
                          </p>
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-3 gap-6 lg:gap-12 flex-1 lg:max-w-xl">
                        {/* Tracked Shift */}
                        <div>
                          <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest block">Hours Logged</span>
                          <span className="font-bold text-white mt-1 text-sm block flex items-center gap-1">
                            ⏱️ {report.hours} Hrs
                          </span>
                        </div>

                        {/* Completion rate bar */}
                        <div>
                          <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest block">Completion</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-white text-sm">{report.completion}%</span>
                            <div className="w-16 bg-white/10 h-1 rounded-full overflow-hidden hidden sm:block">
                              <div className="bg-gradient-to-r from-purple-400 to-indigo-400 h-1 rounded-full" style={{ width: `${report.completion}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Custom Status badge */}
                        <div className="self-center lg:self-auto">
                          <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest block mb-1">Status</span>
                          <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${statusStyle}`}>
                            {report.status}
                          </span>
                        </div>
                      </div>

                      {/* Operations / Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                        {user?.role === 'admin' && (
                          <button
                            onClick={(e) => handleDeleteReport(report.id, e)}
                            className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-red-400 transition-colors shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                            title="Purge record"
                          >
                            🗑️ Delete
                          </button>
                        )}
                        <span className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-transform duration-300 text-xs ${isExpanded ? 'rotate-180 text-purple-400 border-purple-500/20' : 'text-white/40'}`}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Detailed Accordion slide-down */}
                    {isExpanded && (
                      <div className="border-t border-white/5 p-6 bg-slate-950/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        
                        {/* Tasks Completed Today */}
                        <div className="border-l-2 border-emerald-500/40 pl-4 py-0.5 space-y-1">
                          <h5 className="font-black text-emerald-400 text-[10px] uppercase tracking-widest">Tasks Completed Today</h5>
                          <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{report.today_task}</p>
                        </div>

                        {/* Plan for Tomorrow */}
                        <div className="border-l-2 border-blue-500/40 pl-4 py-0.5 space-y-1">
                          <h5 className="font-black text-blue-400 text-[10px] uppercase tracking-widest">Plan for Tomorrow</h5>
                          <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{report.next_day_task}</p>
                        </div>

                        {/* Challenges / Blockers */}
                        {report.problems && (
                          <div className="border-l-2 border-red-500/40 pl-4 py-0.5 space-y-1">
                            <h5 className="font-black text-red-400 text-[10px] uppercase tracking-widest">Challenges & Blockers</h5>
                            <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{report.problems}</p>
                          </div>
                        )}

                        {/* Achievements */}
                        {report.achievements && (
                          <div className="border-l-2 border-yellow-500/40 pl-4 py-0.5 space-y-1 md:col-span-2">
                            <h5 className="font-black text-yellow-400 text-[10px] uppercase tracking-widest">Key Achievements</h5>
                            <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{report.achievements}</p>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
