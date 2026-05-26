import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';

const Tickets = () => {
  const { user, token } = useAuth();

  // State Management
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation Tabs
  // Defaults to department queue if not admin, otherwise all tickets
  const defaultTab = user?.role === 'admin' ? 'all' : 'my-dept';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [statusTab, setStatusTab] = useState('Open'); // 'Open' or 'Closed'

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolvingTicket, setResolvingTicket] = useState(null);

  // Form Fields - Create Ticket
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDept, setTargetDept] = useState('IT Ops');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields - Resolve Ticket
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvingSubmit, setResolvingSubmit] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Fetch Tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || 'Failed to retrieve tickets.');
      }
    } catch (err) {
      setError('Network error - backend server is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token]);

  // Handle Ticket Submission
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          target_department: targetDept,
          priority
        })
      });

      if (response.ok) {
        // Reset and refresh
        setTitle('');
        setDescription('');
        setTargetDept('IT Ops');
        setPriority('Medium');
        setShowCreateModal(false);
        fetchTickets();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.detail || 'Could not log support ticket.');
      }
    } catch (err) {
      alert('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Ticket Resolution
  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolutionNotes || !resolvingTicket) return;
    setResolvingSubmit(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets/${resolvingTicket.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resolution_notes: resolutionNotes
        })
      });

      if (response.ok) {
        setResolutionNotes('');
        setResolvingTicket(null);
        setSelectedTicket(null);
        fetchTickets();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.detail || 'Could not resolve support ticket.');
      }
    } catch (err) {
      alert('Network error occurred.');
    } finally {
      setResolvingSubmit(false);
    }
  };

  // Handle Admin Delete Ticket
  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this ticket? This action is irreversible.')) return;
    try {
      const response = await fetch(`${API_URL}/api/tickets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setSelectedTicket(null);
        fetchTickets();
      } else {
        alert('Failed to delete ticket.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  // Filtered lists
  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      // 1. Tab filtration
      const inMyDept = ticket.target_department.toLowerCase() === (user?.department || '').toLowerCase();
      const raisedByMe = ticket.user_id === user?.id;

      if (activeTab === 'my-dept' && !inMyDept) return false;
      if (activeTab === 'my-raised' && !raisedByMe) return false;
      // 'all' includes everything, so no filtering on raiser/department

      // 2. Status filtration (Open vs Closed)
      if (statusTab === 'Open' && ticket.status !== 'Open') return false;
      if (statusTab === 'Closed' && ticket.status !== 'Closed') return false;

      // 3. Priority filtration
      if (priorityFilter !== 'All' && ticket.priority !== priorityFilter) return false;

      // 4. Search term filtration (title, desc, employee name)
      if (searchTerm) {
        const cleanSearch = searchTerm.toLowerCase();
        const matchesTitle = ticket.title.toLowerCase().includes(cleanSearch);
        const matchesDesc = ticket.description.toLowerCase().includes(cleanSearch);
        const matchesRaiser = ticket.user_name.toLowerCase().includes(cleanSearch);
        const matchesDept = ticket.target_department.toLowerCase().includes(cleanSearch);
        return matchesTitle || matchesDesc || matchesRaiser || matchesDept;
      }

      return true;
    });
  };

  const filteredTicketsList = getFilteredTickets();

  // Metrics Counters
  const countOpen = tickets.filter(t => t.status === 'Open').length;
  const countMyDept = tickets.filter(t => t.status === 'Open' && t.target_department.toLowerCase() === (user?.department || '').toLowerCase()).length;
  const countMyRaised = tickets.filter(t => t.status === 'Open' && t.user_id === user?.id).length;
  const countClosed = tickets.filter(t => t.status === 'Closed').length;

  // Render Priority Pill
  const renderPriorityBadge = (p) => {
    switch (p) {
      case 'Critical':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)] animate-pulse">🚨 Critical</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">⚡ High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">📘 Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🟢 Low</span>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-10 relative overflow-hidden text-white animate-fadeIn">
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative max-w-7xl mx-auto z-10 space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Workspace Helpdesk</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
              Support Tickets
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Raise operational issues or technical blockers, route them to target departments, and track resolutions.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTickets}
              className="flex items-center justify-center w-11 h-11 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-sm"
              title="Refresh Queue"
            >
              🔄
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/10 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              🎟️ Raise Support Ticket
            </button>
          </div>
        </div>

        {/* User Workspace Info Banner */}
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
            <span>Employee: <strong className="text-white">{user?.name}</strong></span>
            <span className="text-white/20">|</span>
            <span>Department: <strong className="text-purple-400">{user?.department || 'Unassigned'}</strong></span>
          </div>
          <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider self-start sm:self-auto">
            Role: {user?.role}
          </span>
        </div>

        {/* Support Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Active Tickets</p>
            <h3 className="text-2xl md:text-3xl font-extrabold mt-1 text-indigo-300">{countOpen}</h3>
            <span className="text-[9px] text-white/20">Total unresolved items</span>
            <div className="absolute right-4 bottom-4 text-2xl opacity-10">🎫</div>
          </div>
          
          <div className={`backdrop-blur-xl bg-white/5 border rounded-2xl p-5 shadow-lg relative overflow-hidden group transition-all ${countMyDept > 0 ? 'border-amber-500/20 bg-amber-500/[0.01]' : 'border-white/5'}`}>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">My Dept Queue</p>
            <h3 className={`text-2xl md:text-3xl font-extrabold mt-1 ${countMyDept > 0 ? 'text-amber-400 animate-pulse' : 'text-white/70'}`}>{countMyDept}</h3>
            <span className="text-[9px] text-white/20">Assigned to {user?.department || 'your department'}</span>
            <div className="absolute right-4 bottom-4 text-2xl opacity-10">🏢</div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">My Raised Tickets</p>
            <h3 className="text-2xl md:text-3xl font-extrabold mt-1 text-purple-400">{countMyRaised}</h3>
            <span className="text-[9px] text-white/20">Pending issues logged by you</span>
            <div className="absolute right-4 bottom-4 text-2xl opacity-10">🙋‍♂️</div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Resolved Tickets</p>
            <h3 className="text-2xl md:text-3xl font-extrabold mt-1 text-emerald-400">{countClosed}</h3>
            <span className="text-[9px] text-white/20">Issues resolved & closed</span>
            <div className="absolute right-4 bottom-4 text-2xl opacity-10">✅</div>
          </div>
        </div>

        {/* Search, Filter, Tab Navigation Row */}
        <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Queue Categories */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-black/25 rounded-2xl border border-white/5 self-start select-none">
              {user?.department && (
                <button
                  onClick={() => setActiveTab('my-dept')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    activeTab === 'my-dept'
                      ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                      : 'bg-transparent text-white/45 hover:text-white/80'
                  }`}
                >
                  🏢 My Dept Queue
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('my-raised')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === 'my-raised'
                    ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'bg-transparent text-white/45 hover:text-white/80'
                }`}
              >
                🙋‍♂️ Raised By Me
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    activeTab === 'all'
                      ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                      : 'bg-transparent text-white/45 hover:text-white/80'
                  }`}
                >
                  🔑 All Corporate Queue
                </button>
              )}
            </div>

            {/* Open / Closed Status Filter */}
            <div className="flex items-center gap-1 bg-black/20 p-1 border border-white/5 rounded-xl self-start">
              {['Open', 'Closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusTab(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    statusTab === s
                      ? 'bg-white/10 text-white shadow-inner'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {s === 'Open' ? `🟢 Open` : `✅ Closed`}
                </button>
              ))}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-400/50 transition"
                />
                <span className="absolute left-3.5 top-2.5 text-xs text-white/20">🔍</span>
              </div>

              {/* Priority Select */}
              <div className="relative w-full sm:w-44">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none appearance-none cursor-pointer [color-scheme:dark]"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-[8px] text-white/40">▼</div>
              </div>
            </div>
          </div>

          {/* Ticket Listing Queue */}
          {loading ? (
            <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60 text-sm">Synchronizing helpdesk datastreams...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400">
              <span className="text-3xl mb-3 block">⚠️</span>
              <p className="font-semibold">{error}</p>
              <button
                onClick={fetchTickets}
                className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/30 transition-all cursor-pointer"
              >
                Retry Stream
              </button>
            </div>
          ) : filteredTicketsList.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              <span className="text-3xl block">🏷️</span>
              <h4 className="font-extrabold text-sm text-white/70 uppercase tracking-widest">No Tickets Found</h4>
              <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                There are no {statusTab.toLowerCase()} tickets matched inside this category. If you have an active blocker, raise an ticket to notify support staff.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTicketsList.map((ticket) => {
                const isMyDept = ticket.target_department.toLowerCase() === (user?.department || '').toLowerCase();
                const canHandle = ticket.status === 'Open' && (user?.role === 'admin' || isMyDept);

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="backdrop-blur-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] p-5 rounded-2xl transition-all duration-300 relative overflow-hidden group shadow-lg cursor-pointer flex flex-col justify-between min-h-[170px]"
                  >
                    {/* Glowing highlight for active/critical tickets */}
                    {ticket.status === 'Open' && ticket.priority === 'Critical' && (
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
                    )}
                    
                    <div className="space-y-3">
                      {/* Top Row: Meta info */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          🎯 {ticket.target_department}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {renderPriorityBadge(ticket.priority)}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="font-extrabold text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {ticket.title}
                        </h3>
                        <p className="text-white/50 text-[11px] leading-relaxed line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Raiser Details & Actions */}
                    <div className="border-t border-white/5 pt-3.5 mt-4 flex items-center justify-between text-[10px] text-white/40">
                      <div>
                        <span>By <strong className="text-white/60 font-semibold">{ticket.user_name}</strong></span>
                        <span className="mx-1.5">•</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {canHandle ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolvingTicket(ticket);
                          }}
                          className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 text-amber-400 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all cursor-pointer"
                        >
                          ⚡ Resolve
                        </button>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border ${
                          ticket.status === 'Open' 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {ticket.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── CREATE TICKET MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg backdrop-blur-3xl bg-slate-950/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slideRight">
            <div className="h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
            
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                  Raise Support Ticket
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white cursor-pointer transition text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Ticket Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Server down, VPN connectivity blocker..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Describe the Issue</label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Please provide explicit details of the blocker or support request so target staff can reproduce and fix it..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition leading-relaxed"
                  ></textarea>
                </div>

                {/* Grid row: Target Dept & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Target Department */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Target Department</label>
                    <div className="relative">
                      <select
                        value={targetDept}
                        onChange={(e) => setTargetDept(e.target.value)}
                        className="w-full pl-3 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none appearance-none cursor-pointer [color-scheme:dark]"
                      >
                        <option value="IT Ops">IT Ops</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                        <option value="Customer Support">Customer Support</option>
                        <option value="Sales & Marketing">Sales & Marketing</option>
                        <option value="HR & Finance">HR & Finance</option>
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none text-[8px] text-white/40">▼</div>
                    </div>
                  </div>

                  {/* Priority Select */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Severity / Priority</label>
                    <div className="relative">
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full pl-3 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none appearance-none cursor-pointer [color-scheme:dark]"
                      >
                        <option value="Low">Low (General Query)</option>
                        <option value="Medium">Medium (Standard Issue)</option>
                        <option value="High">High (High Blockage)</option>
                        <option value="Critical">Critical (System Blocker)</option>
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none text-[8px] text-white/40">▼</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-white/5 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Transmitting...' : 'Log Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── TICKET DETAILS SIDE DRAWER ─── */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-end z-45 animate-fadeIn">
          {/* Dismiss overlay */}
          <div onClick={() => setSelectedTicket(null)} className="absolute inset-0 cursor-pointer"></div>
          
          <div className="relative w-full max-w-lg h-full bg-slate-950/95 border-l border-white/10 p-6 md:p-8 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl animate-slideRight">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <span className="text-[8px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-md">
                    Ticket details
                  </span>
                  <span className="text-[10px] text-white/30 ml-2 font-mono">{selectedTicket.id}</span>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white cursor-pointer transition text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Status & Priority Row */}
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider border ${
                  selectedTicket.status === 'Open'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                }`}>
                  {selectedTicket.status}
                </span>
                {renderPriorityBadge(selectedTicket.priority)}
                <span className="text-white/30 text-xs font-medium ml-auto">
                  Created {new Date(selectedTicket.created_at).toLocaleString()}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-3 bg-white/[0.01] border border-white/5 p-5 rounded-2xl leading-relaxed">
                <h2 className="text-md font-extrabold text-white">{selectedTicket.title}</h2>
                <div className="text-xs text-white/60 whitespace-pre-wrap font-medium leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Stakeholders Info Box */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-1">
                  <span className="text-[8px] font-black uppercase text-white/30 tracking-wider">Logged By</span>
                  <p className="font-bold text-xs text-white truncate">{selectedTicket.user_name}</p>
                  <p className="text-[10px] text-white/40 truncate">{selectedTicket.user_email}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-1">
                  <span className="text-[8px] font-black uppercase text-white/30 tracking-wider">Target Dept</span>
                  <p className="font-bold text-xs text-purple-400 truncate">🏢 {selectedTicket.target_department}</p>
                  <p className="text-[9px] text-white/30">Support Routing</p>
                </div>
              </div>

              {/* Resolution details if closed */}
              {selectedTicket.status === 'Closed' && (
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                    <span className="text-emerald-400">✔️</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">Resolution Log</h4>
                      <p className="text-[9px] text-white/40">Resolved at {new Date(selectedTicket.resolved_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3.5">
                    <div className="text-xs text-white/70 leading-relaxed italic">
                      " {selectedTicket.resolution_notes} "
                    </div>
                    <div className="text-[10px] text-white/40 border-t border-emerald-500/10 pt-2.5">
                      Handled By: <strong className="text-white/60 font-semibold">{selectedTicket.handled_by_name}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions for active ticket */}
            <div className="border-t border-white/5 pt-4 mt-8 flex flex-col gap-2.5">
              {selectedTicket.status === 'Open' && (selectedTicket.target_department.toLowerCase() === (user?.department || '').toLowerCase() || user?.role === 'admin') && (
                <button
                  onClick={() => setResolvingTicket(selectedTicket)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer text-center"
                >
                  ⚡ Handle &amp; Close Issue
                </button>
              )}

              {user?.role === 'admin' && (
                <button
                  onClick={() => handleDeleteTicket(selectedTicket.id)}
                  className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer"
                >
                  🗑️ Purge Ticket Record
                </button>
              )}

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESOLVE TICKET MODAL ─── */}
      {resolvingTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md backdrop-blur-3xl bg-slate-950/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-md font-extrabold text-amber-400">
                    Resolve Support Ticket
                  </h3>
                  <p className="text-[10px] text-white/40 mt-0.5">Title: {resolvingTicket.title}</p>
                </div>
                <button
                  onClick={() => setResolvingTicket(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white cursor-pointer transition text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleResolveTicket} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Resolution Notes</label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Enter explicit remarks detailing how this issue was resolved/handled. These notes will be logged and visible to the raising employee..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition leading-relaxed"
                  ></textarea>
                </div>

                <div className="flex gap-3 border-t border-white/5 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setResolvingTicket(null)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resolvingSubmit}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {resolvingSubmit ? 'Filing Resolution...' : 'Resolve & Close'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
