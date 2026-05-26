import React from "react";
import { Link } from "react-router-dom";

const PublicHome = () => {
  const features = [
    {
      title: "Department Isolation",
      desc: "Isolated workspaces for Engineering, CS, and HR divisions, governed by secure role authentication.",
      icon: "🏢",
      color: "from-purple-500/10 to-indigo-500/5 hover:border-purple-500/30 text-purple-400"
    },
    {
      title: "AI Candidate Scanner",
      desc: "Instantly parse resumes, extract skills, and generate tailored diagnostic interview questions.",
      icon: "🤖",
      color: "from-blue-500/10 to-cyan-500/5 hover:border-blue-500/30 text-blue-400"
    },
    {
      title: "Digital Attendance Clock",
      desc: "Validate office presence using secure physical OTP codes, eliminating clock-in abuse.",
      icon: "⏱️",
      color: "from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/30 text-emerald-400"
    },
    {
      title: "Leave Ledgers & Request",
      desc: "Submit leave requests, view active annual limits, and track approvals on isolated timelines.",
      icon: "📅",
      color: "from-rose-500/10 to-red-500/5 hover:border-rose-500/30 text-rose-400"
    },
    {
      title: "Telemetry & Analytics",
      desc: "Evaluate team productivity metrics and attendance trends via elegant visualization graphs.",
      icon: "📊",
      color: "from-amber-500/10 to-orange-500/5 hover:border-amber-500/30 text-amber-400"
    },
    {
      title: "Secure JWT Framework",
      desc: "SHA-256 encrypted cookies and tokens block remote access and maintain system integrity.",
      icon: "🔐",
      color: "from-slate-500/10 to-slate-600/5 hover:border-slate-400/30 text-slate-300"
    }
  ];

  const testimonials = [
    {
      quote: "WorkPulse's department-insulated workflow has completely secured our system access controls.",
      author: "Emma Vance",
      role: "Lead HR Director",
      avatarBg: "from-pink-500 to-rose-500"
    },
    {
      quote: "The automated AI resume scanner saves our recruitment division hours of diagnostic script drafting.",
      author: "Fiona Davis",
      role: "Talent Acquisition Manager",
      avatarBg: "from-purple-500 to-indigo-500"
    },
    {
      quote: "Preventing remote punch spoofing via physical terminal OTP verification solved our attendance leaks.",
      author: "Anoop Yadav",
      role: "Administrator",
      avatarBg: "from-blue-500 to-teal-500"
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden text-white bg-slate-950">
      {/* Background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full filter blur-[150px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full filter blur-[150px] pointer-events-none animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32 z-10 space-y-32">
        {/* HERO SECTION */}
        <div className="text-center space-y-8 max-w-4xl mx-auto animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">WorkPulse Terminal v1.2.0 Active</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
            Streamline Your Team. <br />
            Secure Your Workspace.
          </h1>

          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            The premier department-insulated, AI-powered team management workspace. Designed to eliminate presence spoofing, simplify candidate diagnostics, and audit compliance on automated ledgers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-full shadow-2xl hover:shadow-purple-500/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Enter Workspace Hub
            </Link>
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/20 text-white font-extrabold text-xs uppercase tracking-widest rounded-full transition-all"
            >
              Register Account
            </Link>
          </div>
        </div>

        {/* METRICS PANEL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-3xl bg-white/[0.01] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none"></div>
          {[
            { label: "Attendance Precision", value: "100.0%", icon: "🎯" },
            { label: "Resume Parse Speed", value: "< 1.8s", icon: "⚡" },
            { label: "Active Team Nodes", value: "12 Seeded", icon: "💻" },
            { label: "Data Integrity SLA", value: "99.99%", icon: "🛡️" }
          ].map((m, idx) => (
            <div key={idx} className="text-center space-y-2 relative z-10">
              <span className="text-2xl block">{m.icon}</span>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{m.label}</p>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 font-mono">
                {m.value}
              </h3>
            </div>
          ))}
        </div>

        {/* FEATURES BENTO SECTION */}
        <div className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Core Ecosystem</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Modular Architecture &amp; Control
            </h2>
            <p className="text-white/40 text-xs max-w-md mx-auto leading-relaxed">
              Every tool within WorkPulse is built to comply with high corporate standards and compartmentalized permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-3xl bg-gradient-to-br border border-white/5 shadow-xl flex flex-col justify-between space-y-6 hover:-translate-y-1 transition-all duration-300 group ${f.color}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-all">
                  {f.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm text-white">{f.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TESTIMONIALS SECTION */}
        <div className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Division Endorsements</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Trusted by Managers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 backdrop-blur-2xl flex flex-col justify-between space-y-6 shadow-xl"
              >
                <p className="text-white/70 text-xs italic leading-relaxed font-medium">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${t.avatarBg} text-white font-black text-xs flex items-center justify-center shadow-inner uppercase`}>
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white leading-none">{t.author}</h4>
                    <span className="text-[9px] text-white/30 font-bold uppercase mt-1 block">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CALL TO ACTION */}
        <div className="p-8 md:p-16 rounded-[2.5rem] bg-gradient-to-tr from-purple-900/40 via-indigo-950/20 to-blue-900/40 border border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl"></div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Ready to secure your workspace?
          </h2>
          <p className="text-white/50 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Deploy WorkPulse in minutes and experience zero punch leaks, clean audit books, and automated recruiter candidate pipelines instantly.
          </p>
          <div className="pt-4">
            <Link
              to="/signup"
              className="inline-block px-8 py-4 bg-white hover:bg-white/95 text-slate-950 font-black text-xs uppercase tracking-widest rounded-full transition-all transform hover:-translate-y-0.5 shadow-xl"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
