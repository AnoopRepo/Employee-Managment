import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';

const AdminUsers = () => {
  const { token, user: loggedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to retrieve user accounts');
      const data = await response.json();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load workspace directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditError('');
    setEditSuccess(false);
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setEditName('');
    setEditEmail('');
    setEditRole('user');
    setEditError('');
    setEditSuccess(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess(false);
    setEditSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, role: editRole })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to update user profile');
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: editName, email: editEmail, role: editRole } : u));
      setEditSuccess(true);
      setTimeout(() => handleCloseEdit(), 1200);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete user account');
      setUsers(users.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const staffCount = users.filter(u => u.role === 'user').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-10 relative overflow-hidden text-white animate-fadeIn">
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto z-10 space-y-10">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Admin Console</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
              User Directory
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Manage all registered accounts, assign privilege roles, and control workspace access.
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
            </svg>
            Sync Roster
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              label: 'Total Registered',
              value: `${totalUsers}`,
              sub: 'Active accounts',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
            },
            {
              label: 'Staff Members',
              value: `${staffCount}`,
              sub: 'Report submissions',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ),
              iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
            },
            {
              label: 'Administrators',
              value: `${adminCount}`,
              sub: 'Elevated privileges',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
            },
          ].map((card) => (
            <div key={card.label} className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-lg hover:border-white/10 hover:bg-white/5 transition-all">
              <div>
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">{card.label}</p>
                <h3 className="text-3xl font-extrabold mt-0.5">{card.value}</h3>
                <p className="text-white/30 text-[10px] mt-0.5">{card.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${card.iconBg}`}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter Controls ── */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Search Directory</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-sm transition-all placeholder:text-white/20"
              />
              <svg className="absolute left-3.5 top-3 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-sm text-white appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
            >
              <option value="All">All Roles</option>
              <option value="user">Staff Member</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        {/* ── Directory Table ── */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-3 text-white/90">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Credentials Registry
            {!loading && (
              <span className="ml-auto text-[10px] font-bold text-white/30 uppercase tracking-widest">
                {filteredUsers.length} of {totalUsers} accounts
              </span>
            )}
          </h2>

          {loading ? (
            <div className="text-center py-20 backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-2xl">
              <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/40 text-sm">Synchronising user registry…</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400">
              <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-sm">{error}</p>
              <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-semibold hover:bg-red-500/30 transition-all cursor-pointer">
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-20 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-white/50 font-semibold">No accounts match your filters</p>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-3.5 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Profile</th>
                      <th className="py-3.5 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Email</th>
                      <th className="py-3.5 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Role</th>
                      <th className="py-3.5 px-6 text-[10px] font-black uppercase tracking-widest text-white/30 hidden lg:table-cell">Account ID</th>
                      <th className="py-3.5 px-6 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {filteredUsers.map((u) => {
                      const isMe = u.id === loggedInUser?.id;
                      return (
                        <tr key={u.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-purple-500/70 to-blue-500/70 flex items-center justify-center font-extrabold text-white uppercase text-xs border border-white/10 shadow-inner">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-sm text-white block leading-tight">{u.name}</span>
                                {isMe && (
                                  <span className="inline-block mt-0.5 text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-white/50">{u.email}</td>
                          <td className="py-4 px-6">
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-red-500/10 text-red-300 border-red-500/20">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Staff
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 hidden lg:table-cell">
                            <span className="font-mono text-[9px] text-white/20 uppercase">{u.id}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 hover:text-purple-300 rounded-lg text-xs font-semibold text-white/70 transition-all cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingUser(u)}
                                disabled={isMe}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                                  isMe
                                    ? 'bg-white/[0.02] border-white/5 text-white/15 cursor-not-allowed'
                                    : 'bg-red-500/5 border-red-500/15 hover:bg-red-500/15 hover:border-red-500/30 text-red-400 cursor-pointer'
                                }`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {isMe ? 'Protected' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-950/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Edit Account</h3>
                  <p className="text-[10px] text-white/40">Modifying: {editingUser.email}</p>
                </div>
              </div>
              <button onClick={handleCloseEdit} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer">
                <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {editError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                  />
                </div>

                {/* Role selector */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Privilege Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'user', label: 'Staff Member', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                      { val: 'admin', label: 'Administrator', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
                    ].map((r) => (
                      <div
                        key={r.val}
                        onClick={() => setEditRole(r.val)}
                        className={`p-3.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                          editRole === r.val
                            ? 'bg-purple-500/10 border-purple-400/50 shadow-[0_0_16px_rgba(168,85,247,0.1)]'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className={editRole === r.val ? 'text-purple-400' : 'text-white/40'}>{r.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/70">{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-xl text-xs font-black uppercase tracking-wider text-white disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-500/10 transition-all"
                  >
                    {editSubmitting ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm bg-slate-950/90 border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500"></div>
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-black text-white mb-2">Delete Account?</h3>
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                This will permanently remove <strong className="text-white">{deletingUser.name}</strong> and all of their submitted daily work reports.
              </p>
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-red-300/80 text-[10px] text-left mb-5 leading-relaxed">
                ⚠ This action is irreversible. All report logs will be cascade-deleted.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingUser(null)}
                  disabled={deleteSubmitting}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteSubmitting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-black uppercase tracking-wider text-white disabled:opacity-50 cursor-pointer shadow-lg shadow-red-500/20 transition-all"
                >
                  {deleteSubmitting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
