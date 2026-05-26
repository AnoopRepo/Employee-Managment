import React, { useState, useEffect } from "react";
import { useAuth, API_URL } from "../context/AuthContext";

const LeavePortal = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Leave states
  const [leaveBalances, setLeaveBalances] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState(null);

  // Form states
  const [leaveType, setLeaveType] = useState("Sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveSubmitLoading, setLeaveSubmitLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${token}` };
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const responses = await Promise.all([
        fetch(`${API_URL}/api/leaves/balances?year=${currentYear}`, { headers }),
        fetch(`${API_URL}/api/leaves/my-requests`, { headers }),
        fetch(`${API_URL}/api/attendance/metrics?month=${currentMonth}&year=${currentYear}`, { headers })
      ]);

      const [balRes, reqRes, metricsRes] = responses;

      if (balRes.ok) {
        const balData = await balRes.json();
        setLeaveBalances(balData.balances || {});
      }
      if (reqRes.ok) {
        setLeaveRequests(await reqRes.json());
      }
      if (metricsRes.ok) {
        setMonthlyMetrics(await metricsRes.json());
      }
    } catch (err) {
      console.error(err);
      setError("Unable to synchronize Leave data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (new Date(startDate) > new Date(endDate)) {
      alert("⚠️ Start date cannot be after end date.");
      return;
    }

    setLeaveSubmitLoading(true);
    const payload = {
      leave_type: leaveType,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      reason
    };

    try {
      const res = await fetch(`${API_URL}/api/leaves`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setStartDate("");
        setEndDate("");
        setReason("");
        alert("🚀 Leave request submitted successfully!");
        fetchData();
      } else {
        alert(`Leave Request Failed: ${data.detail || "Please check your balances."}`);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLeaveSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-10 relative overflow-hidden text-white animate-fadeIn">
      {/* Background glow blobs */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto z-10 space-y-10">
        {/* Header Block */}
        <div className="border-b border-white/5 pb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Employee Self-Service Desk</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
            Leave &amp; Time Off Portal
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Submit daily time-off requests, scan remaining annual leave limits, and audit compliance metrics.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Syncing Leave Records...</p>
          </div>
        ) : error ? (
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all cursor-pointer">
              Retry Sync
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Top Balances Ledger */}
            <div className="backdrop-blur-3xl bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="border-b border-white/5 pb-4 mb-6 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 font-sans">Active Leave Ledger</span>
                <span className="text-[10px] font-bold text-white/40 font-mono">CY {new Date().getFullYear()}</span>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Sick", "Casual", "Annual", "Maternity"].map((type) => {
                  const bal = leaveBalances[type] || { total: 0, used: 0, remaining: 0 };
                  const colorMap = {
                    Sick: "hover:border-amber-500/30 text-amber-300",
                    Casual: "hover:border-cyan-500/30 text-cyan-300",
                    Annual: "hover:border-purple-500/30 text-purple-300",
                    Maternity: "hover:border-rose-500/30 text-rose-300"
                  };
                  return (
                    <div key={type} className={`p-5 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col justify-between space-y-4 transition-all duration-300 ${colorMap[type] || "hover:border-white/10"}`}>
                      <div>
                        <span className="px-2 py-0.5 bg-white/5 text-white/60 text-[8px] font-black uppercase tracking-wider rounded">
                          {type} Category
                        </span>
                        <h2 className="text-4xl font-black text-white tracking-tight mt-3">{bal.remaining}</h2>
                        <span className="text-[9px] text-white/30 block mt-1">Days Remaining</span>
                      </div>
                      <div className="text-[10px] text-white/40 border-t border-white/5 pt-3 flex justify-between">
                        <span>Used: {bal.used}</span>
                        <span>Total Limit: {bal.total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly attendance gauge */}
              <div className="mt-8 border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 font-bold uppercase tracking-wider text-[10px]">Monthly Rollcall Consistency</span>
                    <span className="font-mono text-purple-400 font-bold">{monthlyMetrics?.attendance_percentage || "0.00"}%</span>
                  </div>
                  <div className="w-full bg-white/5 border border-white/10 rounded-full h-3.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-all duration-1000"
                      style={{ width: `${monthlyMetrics?.attendance_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-center shrink-0 w-full md:w-auto justify-around">
                  <div className="px-4">
                    <span className="text-white/30 text-[9px] font-black uppercase tracking-widest block">Present</span>
                    <p className="font-mono font-bold text-sm text-emerald-400">{monthlyMetrics?.present_days || 0}</p>
                  </div>
                  <div className="px-4 border-l border-white/5">
                    <span className="text-white/30 text-[9px] font-black uppercase tracking-widest block">Late</span>
                    <p className="font-mono font-bold text-sm text-amber-400">{monthlyMetrics?.late_days || 0}</p>
                  </div>
                  <div className="px-4 border-l border-white/5">
                    <span className="text-white/30 text-[9px] font-black uppercase tracking-widest block">On Leave</span>
                    <p className="font-mono font-bold text-sm text-indigo-400">{monthlyMetrics?.on_leave_days || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Form & History Ledger Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Request Form */}
              <div className="lg:col-span-1">
                <form onSubmit={handleSubmitLeave} className="backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl">
                  <h3 className="text-lg font-extrabold tracking-tight text-white border-b border-white/5 pb-3">Request Time-Off</h3>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Leave Category</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-purple-400 transition cursor-pointer outline-none"
                    >
                      <option value="Sick">🤢 Sick Leave</option>
                      <option value="Casual">✨ Casual Leave</option>
                      <option value="Annual">✈ Annual Vacation</option>
                      <option value="Maternity">👶 Maternity (180 days)</option>
                      <option value="Unpaid">🛑 Unpaid Leave</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Start Date</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-white text-xs outline-none focus:border-purple-400 transition [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">End Date</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-white text-xs outline-none focus:border-purple-400 transition [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Justification Notes</label>
                    <textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain details of this leave request..."
                      rows="3"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-400 transition text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leaveSubmitLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-xl hover:shadow-purple-500/10 transition-all uppercase tracking-wider text-xs cursor-pointer text-center"
                  >
                    {leaveSubmitLoading ? "Transmitting Request..." : "Transmit Request"}
                  </button>
                </form>
              </div>

              {/* History Registry */}
              <div className="lg:col-span-2 backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-white/90">My Time-Off Registry</h3>
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto pr-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Category</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Justification</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Duration</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Status</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {leaveRequests.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-10 text-white/40 text-xs">No time-off requests registered.</td>
                        </tr>
                      ) : (
                        leaveRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-white/[0.01]">
                            <td className="py-3">
                              <span className="font-bold text-xs text-white block">{req.leave_type} Leave</span>
                              <span className="text-[9px] font-mono text-white/40">{new Date(req.start_date).toLocaleDateString()}</span>
                            </td>
                            <td className="py-3 text-xs text-white/60 max-w-xs truncate">{req.reason}</td>
                            <td className="py-3 font-mono text-xs font-bold text-purple-300">{req.duration_days} days</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                req.status === "Approved" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" :
                                req.status === "Rejected" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                                "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3 text-[10px] text-white/40 italic max-w-xs truncate text-right">
                              {req.rejection_reason || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeavePortal;
