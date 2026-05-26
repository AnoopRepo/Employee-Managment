import React, { useState, useEffect } from "react";
import { useAuth, API_URL } from "../context/AuthContext";

const AttendancePortal = () => {
  const { token, user } = useAuth();
  
  // Basic states
  const [todayRecord, setTodayRecord] = useState(null);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [syncError, setSyncError] = useState("");

  // OTP Modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  // Navigation tab: 'personal' or 'supervisor'
  const [activeTab, setActiveTab] = useState("personal");

  // History & Telemetry states
  const [personalHistory, setPersonalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Supervisor panel states
  const [teamRoster, setTeamRoster] = useState([]);
  const [rosterMetrics, setRosterMetrics] = useState({ total_active: 0, present: 0, late: 0, on_leave: 0 });
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  // Employee history drill-down modal states
  const [selectedColleague, setSelectedColleague] = useState(null);
  const [colleagueHistory, setColleagueHistory] = useState([]);
  const [loadingColleagueHist, setLoadingColleagueHist] = useState(false);

  const isSupervisor = user?.role === "admin" || user?.role === "hr";

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString());
      setDateStr(
        d.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceStatus = async () => {
    if (!token) return;
    try {
      setSyncError("");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/api/attendance/history`, { headers });
      if (response.ok) {
        const histData = await response.json();
        const todayStr = new Date().toISOString().split("T")[0];
        setTodayRecord(histData.find((h) => h.date === todayStr) || null);
      } else {
        setSyncError("Failed to synchronize active attendance status.");
      }
    } catch (err) {
      console.error(err);
      setSyncError("Unable to reach attendance systems.");
    }
  };

  const fetchPersonalHistory = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/api/attendance/history`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPersonalHistory(data);
      }
    } catch (err) {
      console.error("Error fetching personal history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchTeamRoster = async () => {
    if (!token || !isSupervisor) return;
    setLoadingRoster(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_URL}/api/attendance/today`, { headers });
      if (response.ok) {
        const data = await response.json();
        setTeamRoster(data.records || []);
        setRosterMetrics(data.metrics || { total_active: 0, present: 0, late: 0, on_leave: 0 });
      }
    } catch (err) {
      console.error("Error fetching team roster:", err);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchAttendanceStatus();
      fetchPersonalHistory();
      if (isSupervisor) {
        fetchTeamRoster();
      }
    }
  }, [token]);

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Please enter a valid 6-digit code.");
      return;
    }

    setClockInLoading(true);
    setOtpError("");

    try {
      const res = await fetch(
        `${API_URL}/api/attendance/check-in?otp=${otpValue}&ip_address=192.168.1.1`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("🟢 Check-in successful! Have a productive day.");
        setShowOtpModal(false);
        setOtpValue("");
        fetchAttendanceStatus();
        fetchPersonalHistory();
        if (isSupervisor) fetchTeamRoster();
      } else {
        setOtpError(data.detail || "Failed to check in. Please verify the code.");
      }
    } catch (err) {
      setOtpError("Network error. Please try again.");
    } finally {
      setClockInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setClockInLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/attendance/check-out?ip_address=192.168.1.1`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("🔴 Clock-out registered. Thank you for your work!");
        fetchAttendanceStatus();
        fetchPersonalHistory();
        if (isSupervisor) fetchTeamRoster();
      } else {
        alert(`Error: ${data.detail || "Failed to clock out"}`);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setClockInLoading(false);
    }
  };

  const handleInspectColleague = async (colleague) => {
    setSelectedColleague(colleague);
    setLoadingColleagueHist(true);
    setColleagueHistory([]);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(
        `${API_URL}/api/attendance/employee/${colleague.employee_id}`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        setColleagueHistory(data);
      } else {
        alert("Failed to load colleague history logs.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching employee details.");
    } finally {
      setLoadingColleagueHist(false);
    }
  };

  // Helper: calculate shift duration
  const calculateShiftHours = (checkIn, checkOut) => {
    if (!checkIn) return "-";
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diffMs = end - start;
    if (diffMs < 0) return "-";
    const hours = diffMs / (1000 * 60 * 60);
    return `${hours.toFixed(1)} hrs`;
  };

  // Helper: format standard time
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return "-";
    }
  };

  // Helper: format date beautifully
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const [year, month, day] = dateStr.split("-");
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Filter team members based on search queries and department selectors
  const filteredRoster = teamRoster.filter((colleague) => {
    const matchesSearch =
      colleague.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      colleague.employee_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      deptFilter === "All" || colleague.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 relative overflow-hidden text-white animate-fadeIn">
      {/* Background neon elements */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto z-10 space-y-8">
        
        {/* Header Block */}
        <div className="border-b border-white/5 pb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Shift Presence Terminal</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
              Attendance &amp; Check-In
            </h1>
            <p className="text-white/40 text-xs mt-1">
              Register daily shift clock-in/out via OTP and inspect role-gated shift logs.
            </p>
          </div>

          {/* Role Pill */}
          <div className="self-start md:self-auto flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-white/40">Active Access Gate:</span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-glow">
              🛡️ {user?.role}
            </span>
          </div>
        </div>

        {syncError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center">
            ⚠️ {syncError}
          </div>
        )}

        {/* TOP PANEL: Daily Punch Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Digital Clock Card */}
          <div className="md:col-span-5 backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full filter blur-xl"></div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Shift Clock</span>
                <span className="px-2 py-0.5 rounded font-black text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">
                  LIVE TELEMETRY
                </span>
              </div>

              {/* Digital Clock Display */}
              <div className="text-center py-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1.5 shadow-inner">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-blue-300 tracking-widest font-mono">
                  {timeStr || "00:00:00 AM"}
                </h2>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
                  {dateStr || "Loading..."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setOtpError("");
                    setOtpValue("");
                    setShowOtpModal(true);
                  }}
                  disabled={clockInLoading || !!todayRecord?.check_in_time}
                  className="py-3 bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/25 hover:border-emerald-500/40 text-emerald-400 disabled:opacity-20 disabled:pointer-events-none rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg text-center"
                >
                  Check In
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={
                    clockInLoading ||
                    !todayRecord?.check_in_time ||
                    !!todayRecord?.check_out_time
                  }
                  className="py-3 bg-rose-500/15 border border-rose-500/20 hover:bg-rose-500/25 hover:border-rose-500/40 text-rose-400 disabled:opacity-20 disabled:pointer-events-none rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg text-center"
                >
                  Check Out
                </button>
              </div>
            </div>

            <div className="text-[9px] text-white/30 font-medium mt-5 border-t border-white/5 pt-3">
              💡 Physical token check active. Check-ins are bound to physical server configurations.
            </div>
          </div>

          {/* Today's Stats & Telemetry */}
          <div className="md:col-span-7 backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full filter blur-2xl"></div>

            <div className="space-y-4">
              <div className="border-b border-white/5 pb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Telemetry Feed</span>
                <h2 className="text-lg font-bold text-white mt-0.5">Active Punch Log</h2>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Registered User:</span>
                  <span className="font-bold text-white font-mono">{user?.name} ({user?.department})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Check-In Timestamp:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {todayRecord?.check_in_time ? formatTime(todayRecord.check_in_time) : "Not clocked in"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Check-Out Timestamp:</span>
                  <span className="font-bold text-rose-400 font-mono">
                    {todayRecord?.check_out_time ? formatTime(todayRecord.check_out_time) : "Not clocked out"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                  <span className="text-white/40">Present Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded font-black text-[8px] uppercase tracking-wider ${
                      todayRecord?.status === "Late"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : todayRecord?.status === "Present"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : todayRecord?.status === "OnLeave"
                        ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    {todayRecord?.status || "Offline"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl space-y-0.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase block">Check-In IP</span>
                  <span className="font-bold text-xs text-indigo-300 font-mono block">
                    {todayRecord?.check_in_ip || "192.168.1.1"}
                  </span>
                </div>
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl space-y-0.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase block">Active Hours</span>
                  <span className="font-bold text-xs text-indigo-300 font-mono block">
                    {todayRecord ? calculateShiftHours(todayRecord.check_in_time, todayRecord.check_out_time) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB CONTROLLERS & DATA BOARDS */}
        <div className="space-y-4">
          
          {/* Navigation Tabs (Only rendered for Supervisor roles) */}
          {isSupervisor && (
            <div className="flex border-b border-white/5 gap-6">
              <button
                onClick={() => setActiveTab("personal")}
                className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "personal"
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-white/40 hover:text-white/75"
                }`}
              >
                📁 Personal History Ledger
              </button>
              <button
                onClick={() => setActiveTab("supervisor")}
                className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "supervisor"
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-white/40 hover:text-white/75"
                }`}
              >
                👥 Department Roster Control
              </button>
            </div>
          )}

          {/* TAB CONTENT: Personal History Ledger */}
          {(activeTab === "personal" || !isSupervisor) && (
            <div className="backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Your Past Shift Attendance Logs</h3>
                  <p className="text-[10px] text-white/40">Review personal check-in/out timestamps and resolved IP telemetry.</p>
                </div>
                <button
                  onClick={fetchPersonalHistory}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-lg text-[10px] uppercase font-bold tracking-wider transition"
                >
                  🔄 Sync Logs
                </button>
              </div>

              {loadingHistory ? (
                <div className="text-center py-12 text-white/40 text-xs">
                  <span className="inline-block animate-spin mr-2">⚙️</span> Syncing ledger files...
                </div>
              ) : personalHistory.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-xs border border-dashed border-white/5 rounded-2xl">
                  No attendance records logged in the past 30 days. Complete today's punch to start!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 uppercase font-black tracking-widest text-[9px]">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 px-4">Status</th>
                        <th className="pb-3 px-4">Punch In</th>
                        <th className="pb-3 px-4">Punch Out</th>
                        <th className="pb-3 px-4">IP Host Address</th>
                        <th className="pb-3 px-4">Hours</th>
                        <th className="pb-3 pl-4">Logs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-white/85">
                      {personalHistory.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 pr-4 font-sans font-semibold text-white">
                            {formatDate(item.date)}
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-wider ${
                                item.status === "Late"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : item.status === "Present"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-emerald-400">
                            {formatTime(item.check_in_time)}
                          </td>
                          <td className="py-3.5 px-4 text-rose-400">
                            {formatTime(item.check_out_time)}
                          </td>
                          <td className="py-3.5 px-4 text-white/60">
                            {item.check_in_ip || "-"}
                          </td>
                          <td className="py-3.5 px-4 text-purple-300 font-sans font-bold">
                            {calculateShiftHours(item.check_in_time, item.check_out_time)}
                          </td>
                          <td className="py-3.5 pl-4 font-sans text-[10px]">
                            {item.is_early_departure && (
                              <span className="text-amber-400/80">⚠️ Early Exit</span>
                            )}
                            {!item.is_early_departure && item.check_out_time && (
                              <span className="text-emerald-400/80">✅ Full Shift</span>
                            )}
                            {!item.check_out_time && (
                              <span className="text-white/30 italic animate-pulse">Running...</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Department Supervisor Control Board */}
          {activeTab === "supervisor" && isSupervisor && (
            <div className="space-y-6">
              
              {/* Metrics Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Active Today", val: rosterMetrics.total_active, theme: "border-purple-500/30 text-purple-300 bg-purple-500/5" },
                  { label: "On Time", val: rosterMetrics.present, theme: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
                  { label: "Late Punch", val: rosterMetrics.late, theme: "border-amber-500/30 text-amber-300 bg-amber-500/5" },
                  { label: "On Approved Leave", val: rosterMetrics.on_leave, theme: "border-indigo-500/30 text-indigo-300 bg-indigo-500/5" }
                ].map((stat, idx) => (
                  <div key={idx} className={`p-4 border rounded-2xl backdrop-blur-2xl shadow-xl flex flex-col justify-between ${stat.theme}`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">{stat.label}</span>
                    <span className="text-2xl font-black block mt-2">{stat.val}</span>
                  </div>
                ))}
              </div>

              {/* Roster Table Container */}
              <div className="backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6">
                
                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Department Roster Logs</h3>
                    <p className="text-[10px] text-white/40">Review today's real-time check-in actions inside your boundary.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search Field */}
                    <input
                      type="text"
                      placeholder="Search colleagues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-1.5 bg-white/[0.02] border border-white/10 rounded-lg text-xs outline-none text-white focus:border-purple-500 transition w-44"
                    />

                    {/* Department Selector (Only enabled for administrator role) */}
                    {user?.role === 'administrator' ? (
                      <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs outline-none text-white focus:border-purple-500 transition cursor-pointer"
                      >
                        <option value="All">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="IT Ops">IT Ops</option>
                        <option value="HR">HR</option>
                        <option value="Customer Support">Customer Support</option>
                      </select>
                    ) : (
                      <span className="px-2.5 py-1.5 bg-white/5 border border-white/5 text-white/60 rounded-lg text-xs font-semibold">
                        🏫 {user?.department}
                      </span>
                    )}

                    <button
                      onClick={fetchTeamRoster}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs transition"
                      title="Sync Roster"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                {/* Team Roster List */}
                {loadingRoster ? (
                  <div className="text-center py-12 text-white/40 text-xs">
                    <span className="inline-block animate-spin mr-2">⚙️</span> Synchronizing company rosters...
                  </div>
                ) : filteredRoster.length === 0 ? (
                  <div className="text-center py-12 text-white/30 text-xs border border-dashed border-white/5 rounded-2xl">
                    No colleagues matched your filters in today's register.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-white/40 uppercase font-black tracking-widest text-[9px]">
                          <th className="pb-3 pr-4">Colleague Details</th>
                          {user?.role === 'administrator' && <th className="pb-3 px-4">Department</th>}
                          <th className="pb-3 px-4">Today's Status</th>
                          <th className="pb-3 px-4">Punch In</th>
                          <th className="pb-3 px-4">Punch Out</th>
                          <th className="pb-3 px-4">IP Telemetry</th>
                          <th className="pb-3 pl-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/85">
                        {filteredRoster.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-white/[0.02] transition">
                            <td className="py-3.5 pr-4">
                              <div className="font-semibold text-white">{item.employee_name}</div>
                              <div className="text-[10px] text-white/40 font-mono">{item.employee_email}</div>
                            </td>
                            {user?.role === 'administrator' && (
                              <td className="py-3.5 px-4 font-mono font-medium text-white/60">
                                {item.department}
                              </td>
                            )}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-wider ${
                                  item.status === "Late"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : item.status === "Present"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : item.status === "OnLeave"
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                    : "bg-white/5 text-white/30 border border-white/10"
                                }`}
                              >
                                {item.status || "Not Checked In"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-emerald-400">
                              {item.check_in_time ? formatTime(item.check_in_time) : "-"}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-rose-400">
                              {item.check_out_time ? formatTime(item.check_out_time) : "-"}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-white/50">
                              {item.check_in_ip || "-"}
                            </td>
                            <td className="py-3.5 pl-4 text-right">
                              <button
                                onClick={() => handleInspectColleague(item)}
                                className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 font-bold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                              >
                                🔍 History
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OTP Presence Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div 
            onClick={() => setShowOtpModal(false)}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-md backdrop-blur-3xl bg-slate-950/80 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl animate-scaleIn z-10">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center text-xl mx-auto mb-2">
                🔒
              </div>
              <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-blue-300">
                Office Presence Verification
              </h2>
              <p className="text-[11px] text-white/50 leading-relaxed max-w-xs mx-auto">
                Please enter the active 6-digit attendance code displayed on the physical office system screen.
              </p>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-6">
              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 123456"
                  value={otpValue}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ""); // Allow only digits
                    setOtpValue(val);
                  }}
                  className="w-full text-center tracking-[0.7em] pl-4 font-mono font-black text-2xl py-3 bg-white/[0.02] border border-white/10 rounded-2xl text-purple-300 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                />
              </div>

              {otpError && (
                <p className="text-[11px] text-red-400 text-center bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                  ⚠️ {otpError}
                </p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clockInLoading || otpValue.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  {clockInLoading ? "Verifying..." : "Verify & Punch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Colleague History Drill-down Drawer/Modal */}
      {selectedColleague && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div 
            onClick={() => setSelectedColleague(null)}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-3xl backdrop-blur-3xl bg-slate-950/90 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-scaleIn z-10 text-white">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-purple-400 font-black">Attendance Dossier</span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  👤 {selectedColleague.employee_name}
                </h3>
                <p className="text-[11px] text-white/40 font-mono mt-0.5">
                  {selectedColleague.employee_email} • Department: {selectedColleague.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedColleague(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition border border-white/10 text-white font-black text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {loadingColleagueHist ? (
              <div className="text-center py-16 text-white/40 text-xs">
                <span className="inline-block animate-spin mr-2">⚙️</span> Syncing historical ledger logs...
              </div>
            ) : colleagueHistory.length === 0 ? (
              <div className="text-center py-16 text-white/30 text-xs border border-dashed border-white/5 rounded-2xl">
                No past shift history found for this colleague in the past 30 days.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-white/40 uppercase font-black tracking-widest border-b border-white/5 pb-2">
                  📅 Recent 30-Day Punch Sheets
                </div>

                <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-white/40 uppercase font-black tracking-widest text-[9px] pb-2">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Clock In</th>
                        <th className="pb-2">Clock Out</th>
                        <th className="pb-2">IP Telemetry</th>
                        <th className="pb-2 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-white/80">
                      {colleagueHistory.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-white/[0.02] transition">
                          <td className="py-2.5 font-sans font-semibold text-white">
                            {formatDate(log.date)}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-wider ${
                                log.status === "Late"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : log.status === "Present"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-emerald-400">
                            {formatTime(log.check_in_time)}
                          </td>
                          <td className="py-2.5 text-rose-400">
                            {formatTime(log.check_out_time)}
                          </td>
                          <td className="py-2.5 text-white/40">
                            {log.check_in_ip || "-"}
                          </td>
                          <td className="py-2.5 text-right text-purple-300 font-sans font-bold">
                            {calculateShiftHours(log.check_in_time, log.check_out_time)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedColleague(null)}
                className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-white/5 transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePortal;
