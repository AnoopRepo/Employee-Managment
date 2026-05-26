import React from "react";

const About = () => {
  const systemMetrics = [
    { label: "Core Platform", value: "WorkPulse Workspace Terminal" },
    { label: "Current Version", value: "v1.2.0 (Stable)" },
    { label: "Frontend Stack", value: "React 19, Vite 8, Tailwind CSS" },
    { label: "Backend Core", value: "FastAPI, Python 3.11, Uvicorn" },
    { label: "Primary Database", value: "MongoDB Atlas Cloud Cluster" },
    { label: "Security Layer", value: "Bcrypt Hashing, SHA-256 JWT OTP" },
  ];

  const officeDirectory = [
    { department: "IT & System Ops", lead: "Anoop Yadav (Administrator)", staffCount: "2 Active Members" },
    { department: "Engineering Team", lead: "Anoop Yadav (Eng Admin)", staffCount: "2 Active Members" },
    { department: "Human Resources (HR)", lead: "Grace HR Admin", staffCount: "2 Active Members" },
    { department: "Customer Support (CS)", lead: "Sam Support Admin", staffCount: "2 Active Members" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-10 relative overflow-hidden text-white flex justify-center items-center">
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="relative w-full max-w-4xl z-10 space-y-8 animate-fadeIn">
        {/* Header Block */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">System Information Ledger</p>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
            About WorkPulse Portal
          </h1>
          <p className="text-white/50 text-xs max-w-md mx-auto">
            Review core architecture metadata, physical office directory specifications, and platform telemetry.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Platform telemetry */}
          <div className="backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full filter blur-xl"></div>
            
            <div className="border-b border-white/5 pb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Spec 01</span>
              <h3 className="text-md font-bold text-white mt-0.5">Platform Telemetry &amp; Specs</h3>
            </div>

            <div className="space-y-4">
              {systemMetrics.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-white/[0.02] pb-2 last:border-0 last:pb-0">
                  <span className="text-white/40 font-medium">{m.label}</span>
                  <span className="font-bold text-white font-mono text-[11px] bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Office Directory */}
          <div className="backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full filter blur-xl"></div>

            <div className="border-b border-white/5 pb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Spec 02</span>
              <h3 className="text-md font-bold text-white mt-0.5">Workspace Directory</h3>
            </div>

            <div className="space-y-4">
              {officeDirectory.map((d, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-white/[0.02] pb-2 last:border-0 last:pb-0 gap-4">
                  <div>
                    <span className="font-bold text-white block">{d.department}</span>
                    <span className="text-[10px] text-white/40 block mt-0.5">Lead: {d.lead}</span>
                  </div>
                  <span className="shrink-0 font-bold text-[9px] tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                    {d.staffCount}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="backdrop-blur-xl bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-center text-[10px] text-white/30 font-semibold tracking-wider uppercase">
          🔒 System Access Boundaries Monitored Under SHA-256 OTP Protocols
        </div>
      </div>
    </div>
  );
};

export default About;
