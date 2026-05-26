import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Access helper ────────────────────────────────────────────────────────────
// "administrator" can access everything.
// Department roles (admin / it / hr) access only their own section.
// Regular employees see only the General section.
const canAccess = (shortcut, userRole) => {
  if (!shortcut.roles) return true; // public — no restriction
  if (userRole === "administrator") return true; // super admin
  return shortcut.roles.map((r) => r.toLowerCase()).includes(userRole);
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const GENERAL_SHORTCUTS = [
  {
    title: "Submit Daily Update",
    desc: "Log hours, shift reports, milestones, and schedule planned tasks.",
    path: "/submit-update",
    icon: "📝",
    color: "from-purple-500/10 to-indigo-500/5 hover:border-purple-500/30 text-purple-300",
    badge: "Tasks",
  },
  {
    title: "Shift Check-In",
    desc: "Register daily shift presence, validate physical OTP codes, and checkout.",
    path: "/check-in",
    icon: "⏱️",
    color: "from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/30 text-emerald-300",
    badge: "Tasks",
  },
  {
    title: "Work Analytics",
    desc: "Review platform telemetry trend statistics, consistency, and report logs.",
    path: "/dashboard",
    icon: "📊",
    color: "from-blue-500/10 to-cyan-500/5 hover:border-blue-500/30 text-blue-300",
    badge: "Self-Service",
  },
  {
    title: "Leave & Time Off",
    desc: "Track leave balance limits, request time-off, or review attendance history.",
    path: "/leave",
    icon: "📅",
    color: "from-rose-500/10 to-pink-500/5 hover:border-rose-500/30 text-rose-300",
    badge: "Self-Service",
  },
  {
    title: "Support Tickets",
    desc: "Raise system assistance queries or resolve division-level operations.",
    path: "/tickets",
    icon: "🎫",
    color: "from-amber-500/10 to-orange-500/5 hover:border-amber-500/30 text-amber-300",
    badge: "Self-Service",
  },
  {
    title: "Expenses & Docs",
    desc: "Submit claim invoices and audit official reimbursement files.",
    path: "/expenses",
    icon: "💵",
    color: "from-rose-500/10 to-red-500/5 hover:border-rose-500/30 text-rose-300",
    badge: "Self-Service",
  },
  {
    title: "About System",
    desc: "Review framework modules, dependencies, and database connection metrics.",
    path: "/about",
    icon: "ℹ️",
    color: "from-slate-500/10 to-slate-600/5 hover:border-slate-400/30 text-slate-300",
    badge: "System",
  },
];

// Department sections — each includes its portal card + all task cards
const DEPT_SECTIONS = [
  {
    key: "admin",
    label: "Admin",
    icon: "🏛️",
    roles: ["admin", "administrator"],
    accent: "purple",
    tagColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    borderColor: "border-purple-500/20",
    bgColor: "bg-purple-500/[0.04]",
    cardColor: "from-purple-500/10 to-indigo-500/5 hover:border-purple-500/30 text-purple-300",
    items: [
      {
        title: "Admin Hub & Keys",
        desc: "Manage systemic access controls, user definitions, and credential audits.",
        path: "/admin/hub",
        icon: "🔑",
        badge: "Portal",
        roles: ["admin", "administrator"],
      },
      {
        title: "Asset Management",
        desc: "Track company hardware allocations, manage physical inventory custody.",
        path: `/tasks/Admin/${encodeURIComponent("Asset Management")}`,
        icon: "💼",
        roles: ["admin", "administrator"],
      },
      {
        title: "Office Inventory Tracking",
        desc: "Monitor office materials, kitchen items, and stationery supplies.",
        path: `/tasks/Admin/${encodeURIComponent("Office Inventory Tracking")}`,
        icon: "📦",
        roles: ["admin", "administrator"],
      },
      {
        title: "Vendor Coordination",
        desc: "Maintain profiles, services and ping connection status for system suppliers.",
        path: `/tasks/Admin/${encodeURIComponent("Vendor Coordination")}`,
        icon: "🤝",
        roles: ["admin", "administrator"],
      },
      {
        title: "Reminders & Escalations",
        desc: "Override pending actions and resolve administrative workflow bottlenecks.",
        path: `/tasks/Admin/${encodeURIComponent("Reminders/Escalations")}`,
        icon: "⏰",
        roles: ["admin", "administrator"],
      },
      {
        title: "Meeting Scheduling",
        desc: "Coordinate boardroom reservations and dispatch calendar notifications.",
        path: `/tasks/Admin/${encodeURIComponent("Meeting Scheduling")}`,
        icon: "📅",
        roles: ["admin", "administrator"],
      },
      {
        title: "Expense Auditing Console",
        desc: "Fulfill employee reimbursement claims and log office utility expenditures.",
        path: `/tasks/Admin/${encodeURIComponent("Expense Tracking")}`,
        icon: "💵",
        roles: ["admin", "administrator"],
      },
      {
        title: "Document Organization",
        desc: "Publish files, categorize resources, and manage corporate repositories.",
        path: `/tasks/Admin/${encodeURIComponent("Document Organization")}`,
        icon: "📂",
        roles: ["admin", "administrator"],
      },
    ],
  },
  {
    key: "it",
    label: "Information Technology",
    icon: "💻",
    roles: ["it", "administrator"],
    accent: "blue",
    tagColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/[0.04]",
    cardColor: "from-blue-500/10 to-cyan-500/5 hover:border-blue-500/30 text-blue-300",
    items: [
      {
        title: "Email & Admin Accounts",
        desc: "Maintain accounts, assign directory access and audit operational credentials.",
        path: `/tasks/IT/${encodeURIComponent("Email/Admin Account Management")}`,
        icon: "📧",
        roles: ["it", "administrator"],
      },
      {
        title: "DNS & Server Monitoring",
        desc: "Track cloud server loads, evaluate latency and verify hosting health logs.",
        path: `/tasks/IT/${encodeURIComponent("DNS/Server Monitoring")}`,
        icon: "🌐",
        roles: ["it", "administrator"],
      },
      {
        title: "Ticket Handling",
        desc: "Fulfill workspace maintenance requests and technical support queries.",
        path: `/tasks/IT/${encodeURIComponent("Ticket Handling")}`,
        icon: "🎫",
        roles: ["it", "administrator"],
      },
      {
        title: "Software & Licenses",
        desc: "Audit office platform subscriptions, manage keys and tracking metrics.",
        path: `/tasks/IT/${encodeURIComponent("Software/License Tracking")}`,
        icon: "🔑",
        roles: ["it", "administrator"],
      },
      {
        title: "Backup Monitoring",
        desc: "Manage systemic snapshot storage pools, verify encryption validation.",
        path: `/tasks/IT/${encodeURIComponent("Backup Monitoring")}`,
        icon: "💾",
        roles: ["it", "administrator"],
      },
      {
        title: "IT Reporting Dashboards",
        desc: "Review workspace activity metrics, security summaries, and system logs.",
        path: `/tasks/IT/${encodeURIComponent("Dashboard/Reporting")}`,
        icon: "📊",
        roles: ["it", "administrator"],
      },
      {
        title: "Cloud Console Activities",
        desc: "Audit cloud identity provider boundaries and administrative operations.",
        path: `/tasks/IT/${encodeURIComponent("Cloud/Admin Console Activities")}`,
        icon: "☁️",
        roles: ["it", "administrator"],
      },
      {
        title: "System Health Alerts",
        desc: "Examine infrastructure uptime statistics and platform telemetry charts.",
        path: `/tasks/IT/${encodeURIComponent("System Health Alerts")}`,
        icon: "🔔",
        roles: ["it", "administrator"],
      },
    ],
  },
  {
    key: "hr",
    label: "Human Resources",
    icon: "👥",
    roles: ["hr", "administrator"],
    accent: "emerald",
    tagColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/[0.04]",
    cardColor: "from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/30 text-emerald-300",
    items: [
      {
        title: "HR Portal",
        desc: "Review candidate resumes with AI scanners, track team consistency, and approve leave requests.",
        path: "/hr",
        icon: "💼",
        badge: "Portal",
        roles: ["hr", "administrator"],
      },
      {
        title: "Resume Screening (AI)",
        desc: "Analyze applicant files using our premium semantic match scanners.",
        path: `/tasks/HR/${encodeURIComponent("Resume Screening")}`,
        icon: "📄",
        roles: ["hr", "administrator"],
      },
      {
        title: "Interview Scheduling",
        desc: "Coordinate interview rooms and schedule live candidate meetings.",
        path: `/tasks/HR/${encodeURIComponent("Interview Scheduling")}`,
        icon: "👤",
        roles: ["hr", "administrator"],
      },
      {
        title: "Onboarding Workflows",
        desc: "Organize employee account activation schedules and orientation logs.",
        path: `/tasks/HR/${encodeURIComponent("Onboarding Workflows")}`,
        icon: "🚀",
        roles: ["hr", "administrator"],
      },
      {
        title: "Attendance Audits",
        desc: "Review daily shift consistency metrics and location log sheets.",
        path: `/tasks/HR/${encodeURIComponent("Attendance Tracking")}`,
        icon: "⏱️",
        roles: ["hr", "administrator"],
      },
      {
        title: "Leave Management Portal",
        desc: "Process time-off claims and audit annual balances.",
        path: `/tasks/HR/${encodeURIComponent("Leave Management")}`,
        icon: "📅",
        roles: ["hr", "administrator"],
      },
      {
        title: "Employee Documentation",
        desc: "Track tax vouchers, credentials and official hiring files.",
        path: `/tasks/HR/${encodeURIComponent("Employee Documentation")}`,
        icon: "📂",
        roles: ["hr", "administrator"],
      },
      {
        title: "Policy Acknowledgements",
        desc: "Track missing compliance acknowledgments and handbook validations.",
        path: `/tasks/HR/${encodeURIComponent("Policy Acknowledgement Tracking")}`,
        icon: "📜",
        roles: ["hr", "administrator"],
      },
      {
        title: "Training Coordination",
        desc: "Schedule safety training courses and track progress limits.",
        path: `/tasks/HR/${encodeURIComponent("Training/Task Tracking")}`,
        icon: "🎓",
        roles: ["hr", "administrator"],
      },
      {
        title: "Performance Reviews",
        desc: "Log quarterly consistent score logs and summarize key results.",
        path: `/tasks/HR/${encodeURIComponent("Performance Review Summaries")}`,
        icon: "🏆",
        roles: ["hr", "administrator"],
      },
      {
        title: "Engagement Feedback",
        desc: "Track employee consistency charts and check engagement scores.",
        path: `/tasks/HR/${encodeURIComponent("Employee Engagement Feedback")}`,
        icon: "💬",
        roles: ["hr", "administrator"],
      },
    ],
  },
];

// ─── Card Component ────────────────────────────────────────────────────────────
const ShortcutCard = ({ sc, cardColor, userRole }) => {
  const accessible = canAccess(sc, userRole);
  const color = sc.color || cardColor || "from-white/5 to-white/0 hover:border-white/20 text-white/60";
  const Card = accessible ? Link : "div";

  return (
    <Card
      to={accessible ? sc.path : undefined}
      className={`group relative p-5 backdrop-blur-2xl bg-gradient-to-br border border-white/5 rounded-2xl shadow-lg flex flex-col justify-between gap-3 transition-all duration-300 ${
        accessible
          ? `hover:-translate-y-1 hover:shadow-xl cursor-pointer ${color}`
          : "opacity-40 cursor-not-allowed bg-slate-950/30"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-base shadow-inner group-hover:scale-110 transition-transform">
          {sc.icon}
        </div>
        <div className="flex items-center gap-1.5">
          {sc.badge && (
            <span className="text-[8px] font-black uppercase tracking-widest text-white/25 border border-white/[0.08] px-1.5 py-0.5 rounded-full">
              {sc.badge}
            </span>
          )}
          {accessible ? (
            <span className="text-[9px] text-white/20 font-bold group-hover:translate-x-0.5 transition-transform">➔</span>
          ) : (
            <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">🔒</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-extrabold text-sm text-white leading-snug">{sc.title}</h4>
        <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{sc.desc}</p>
      </div>
    </Card>
  );
};

// ─── Common Workspace Section ────────────────────────────────────────────────
const CommonWorkspaceSection = ({ userRole }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-purple-500/[0.04] overflow-hidden">
      {/* Header — click to collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-6 py-4 cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600">
            🌐
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-purple-300">
              Self-Service
            </p>
            <h3 className="text-sm font-extrabold text-white leading-none">Common Workspace</h3>
          </div>
          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-300 border-purple-500/20">
            {GENERAL_SHORTCUTS.length} tools
          </span>
        </div>
        <span
          className={`text-white/30 text-xs transition-transform duration-300 shrink-0 ml-2 ${
            !collapsed ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Grid */}
      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="h-px bg-white/5 mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {GENERAL_SHORTCUTS.map((sc, i) => (
              <ShortcutCard key={i} sc={sc} cardColor="" userRole={userRole} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
const DeptSection = ({ section, userRole, userDept }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = userRole === "administrator";

  // Dept-specific admin access: role=admin + matching department
  const isHRAdmin  = userRole === "admin" && userDept === "hr";
  const isITAdmin  = userRole === "admin" && (userDept === "it" || userDept === "it ops");
  const isGenAdmin = userRole === "admin" && !isHRAdmin && !isITAdmin;

  const hasAccess =
    isAdmin
    || section.roles.includes(userRole)
    || (section.key === "hr"    && isHRAdmin)
    || (section.key === "it"    && isITAdmin)
    || (section.key === "admin" && isGenAdmin);

  if (!hasAccess) return null;

  return (
    <div className={`rounded-3xl border ${section.borderColor} ${section.bgColor} overflow-hidden`}>
      {/* Header — click to collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-6 py-4 cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-lg bg-gradient-to-br ${
              section.accent === "purple"
                ? "from-purple-500 to-indigo-600"
                : section.accent === "blue"
                ? "from-blue-500 to-cyan-600"
                : "from-emerald-500 to-teal-600"
            }`}
          >
            {section.icon}
          </div>
          <div className="text-left">
            <p className={`text-[9px] font-black uppercase tracking-widest ${section.tagColor.split(" ")[1]}`}>
              Department
            </p>
            <h3 className="text-sm font-extrabold text-white leading-none">{section.label}</h3>
          </div>
          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${section.tagColor}`}>
            {section.items.length} items
          </span>
          {isAdmin && (
            <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
              👑 Full Access
            </span>
          )}
        </div>
        <span
          className={`text-white/30 text-xs transition-transform duration-300 shrink-0 ml-2 ${
            !collapsed ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Grid */}
      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="h-px bg-white/5 mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {section.items.map((sc, i) => (
              <ShortcutCard
                key={i}
                sc={sc}
                cardColor={section.cardColor}
                userRole={userRole}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Home = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const userRole = (user?.role || "").toLowerCase();
  const userDept  = (user?.department || "").toLowerCase();
  const isAdmin   = userRole === "administrator";

  // Dept-specific admin flags
  const isHRAdmin  = userRole === "admin" && userDept === "hr";
  const isITAdmin  = userRole === "admin" && (userDept === "it" || userDept === "it ops");
  const isGenAdmin = userRole === "admin" && !isHRAdmin && !isITAdmin;

  // Determine which dept sections this user should see
  const visibleSections = DEPT_SECTIONS.filter((s) => {
    if (isAdmin) return true;
    if (s.roles.includes(userRole)) return true;
    if (s.key === "hr"    && isHRAdmin)  return true;
    if (s.key === "it"    && isITAdmin)  return true;
    if (s.key === "admin" && isGenAdmin) return true;
    return false;
  });
  const hasDeptAccess = visibleSections.length > 0;

  // Flat list for search (general + all dept items the user can see)
  const searchableItems = [
    ...GENERAL_SHORTCUTS,
    ...visibleSections.flatMap((s) => s.items),
  ];

  const searchResults = searchQuery.trim()
    ? searchableItems.filter((sc) => {
        const q = searchQuery.toLowerCase();
        return sc.title.toLowerCase().includes(q) || sc.desc.toLowerCase().includes(q);
      })
    : [];

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 lg:p-10 relative overflow-hidden text-white animate-fadeIn">
      {/* Ambient glow */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />
      <div
        className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse"
        style={{ animationDelay: "3s" }}
      />

      <div className="relative max-w-7xl mx-auto z-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="border-b border-white/5 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">
              Workspace Landing Hub
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
              Welcome, {user?.name ? user.name.replace(/\s*\(.*\)/, "") : "Employee"}
            </h1>
            <p className="text-white/40 text-sm">
              Your central launchpad — portals and task consoles organised by department.
            </p>
          </div>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="relative max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
          <input
            type="text"
            placeholder={
              hasDeptAccess
                ? "Search portals and tasks across your department…"
                : "Search workspace portals…"
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Search Results ───────────────────────────────────────────────── */}
        {isSearching && (
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              Search Results · {searchResults.length} found
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] space-y-2">
                <span className="text-3xl block">🛸</span>
                <h4 className="font-bold text-white/60">No portals matched</h4>
                <p className="text-xs text-white/30">Try a different keyword.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {searchResults.map((sc, i) => (
                  <ShortcutCard key={i} sc={sc} cardColor="" userRole={userRole} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Common Workspace (always visible, never hidden) ─────────────── */}
        {!isSearching && (
          <>
            {/* ── Common Workspace (collapsible panel) ────────────────── */}
            <CommonWorkspaceSection userRole={userRole} />

            {/* ── Department Sections (only if user has a dept role) ────── */}
            {hasDeptAccess && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-orange-400" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-white/50">
                    Department Consoles
                  </h2>
                  {isAdmin && (
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                      All Departments Unlocked
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {DEPT_SECTIONS.map((section) => (
                    <DeptSection key={section.key} section={section} userRole={userRole} userDept={userDept} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="pt-6 border-t border-white/5 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[10px] text-white/20 font-semibold tracking-wider uppercase">
            ⚡ WorkPulse · Secure Division Insulation Active
          </p>
          <div className="flex gap-4 text-[10px] text-white/20 font-semibold uppercase tracking-wider">
            <Link to="/about" className="hover:text-white/50 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-white/50 transition-colors">Contact</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;