import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import AdminUsers from './AdminUsers';

const AdminHub = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  // Backend States
  const [assets, setAssets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedulerViewMode, setSchedulerViewMode] = useState('grid');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form modals state
  const [activeModal, setActiveModal] = useState(null); // 'asset', 'inventory', 'vendor', 'reminder', 'meeting', 'doc', 'expense-audit'
  const [selectedItem, setSelectedItem] = useState(null); // used for audits or edits

  // ─── FORM STATES ───
  // Asset Form
  const [assetName, setAssetName] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [assetAssigned, setAssetAssigned] = useState('');
  const [assetStatus, setAssetStatus] = useState('Available');
  const [assetPurchaseDate, setAssetPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetValue, setAssetValue] = useState(0);

  // Inventory Form
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState('');
  const [invQuantity, setInvQuantity] = useState(0);
  const [invUnit, setInvUnit] = useState('pcs');
  const [invMinThreshold, setInvMinThreshold] = useState(5);
  const [invLocation, setInvLocation] = useState('Main Cabinet');

  // Vendor Form
  const [vName, setVName] = useState('');
  const [vContact, setVContact] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vServices, setVServices] = useState('');
  const [vStart, setVStart] = useState('');
  const [vEnd, setVEnd] = useState('');
  const [vStatus, setVStatus] = useState('Active');

  // Reminder Form
  const [remTitle, setRemTitle] = useState('');
  const [remDesc, setRemDesc] = useState('');
  const [remType, setRemType] = useState('Reminder');
  const [remTarget, setRemTarget] = useState('');
  const [remDueDate, setRemDueDate] = useState('');

  // Meeting Form
  const [meetTitle, setMeetTitle] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('');
  const [meetRoom, setMeetRoom] = useState('Conference Room A');
  const [meetDate, setMeetDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetStart, setMeetStart] = useState('10:00');
  const [meetEnd, setMeetEnd] = useState('11:00');
  const [meetAttendees, setMeetAttendees] = useState('');

  // Document Form
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Policy');
  const [docDesc, setDocDesc] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docPublic, setDocPublic] = useState(true);

  // Expense Audit Comments
  const [auditComment, setAuditComment] = useState('');

  // Fetch all database metrics in parallel
  const fetchHubData = async () => {
    try {
      setLoading(true);
      setError('');

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fire all requests in parallel — dramatically faster than sequential awaits
      const [
        userRes, assetRes, invRes, vendorRes,
        reminderRes, meetingRes, expenseRes, docRes, reportsRes
      ] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/admin/assets`, { headers }),
        fetch(`${API_URL}/api/admin/inventory`, { headers }),
        fetch(`${API_URL}/api/admin/vendors`, { headers }),
        fetch(`${API_URL}/api/admin/reminders`, { headers }),
        fetch(`${API_URL}/api/meetings`, { headers }),
        fetch(`${API_URL}/api/admin/expenses`, { headers }),
        fetch(`${API_URL}/api/documents`, { headers }),
        fetch(`${API_URL}/api/reports`, { headers }),
      ]);

      if (userRes.ok)     setUsersList(await userRes.json());
      if (assetRes.ok)    setAssets(await assetRes.json());
      if (invRes.ok)      setInventory(await invRes.json());
      if (vendorRes.ok)   setVendors(await vendorRes.json());
      if (reminderRes.ok) setReminders(await reminderRes.json());
      if (meetingRes.ok)  setMeetings(await meetingRes.json());
      if (expenseRes.ok)  setExpenses(await expenseRes.json());
      if (docRes.ok)      setDocuments(await docRes.json());
      if (reportsRes.ok)  setReports(await reportsRes.json());

    } catch (err) {
      console.error(err);
      setError('Unable to load Admin Hub data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchHubData();
    }
  }, [token, user]);

  // ─── API HANDLERS ───

  // ASSETS
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    const assignedUser = usersList.find(u => u.id === assetAssigned);
    const assetPayload = {
      name: assetName,
      serial_number: assetSerial,
      category: assetCategory,
      assigned_to: assetAssigned || null,
      assigned_name: assignedUser ? assignedUser.name : null,
      status: assetAssigned ? 'Assigned' : assetStatus,
      purchase_date: assetPurchaseDate,
      value: parseFloat(assetValue)
    };

    try {
      const url = selectedItem
        ? `${API_URL}/api/admin/assets/${selectedItem.id}`
        : `${API_URL}/api/admin/assets`;
      const method = selectedItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(assetPayload)
      });

      if (res.ok) {
        fetchHubData();
        closeModal();
      } else {
        alert('Failed to save asset records.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/assets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchHubData();
    } catch (err) {
      alert(err.message);
    }
  };

  // INVENTORY
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    const invPayload = {
      name: invName,
      category: invCategory,
      quantity: parseInt(invQuantity),
      unit: invUnit,
      min_threshold: parseInt(invMinThreshold),
      location: invLocation
    };

    try {
      const url = selectedItem
        ? `${API_URL}/api/admin/inventory/${selectedItem.id}`
        : `${API_URL}/api/admin/inventory`;
      const method = selectedItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(invPayload)
      });

      if (res.ok) {
        fetchHubData();
        closeModal();
      } else {
        alert('Failed to save inventory item.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteInventory = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchHubData();
    } catch (err) {
      alert(err.message);
    }
  };

  // VENDORS
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    const vendorPayload = {
      name: vName,
      contact_name: vContact,
      email: vEmail,
      phone: vPhone,
      services: vServices,
      contract_start: vStart,
      contract_end: vEnd,
      status: vStatus
    };

    try {
      const url = selectedItem
        ? `${API_URL}/api/admin/vendors/${selectedItem.id}`
        : `${API_URL}/api/admin/vendors`;
      const method = selectedItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorPayload)
      });

      if (res.ok) {
        fetchHubData();
        closeModal();
      } else {
        alert('Failed to save vendor details.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/vendors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchHubData();
    } catch (err) {
      alert(err.message);
    }
  };

  // REMINDERS
  const handleSaveReminder = async (e) => {
    e.preventDefault();
    const targetUserObj = usersList.find(u => u.id === remTarget);
    const remPayload = {
      title: remTitle,
      description: remDesc,
      type: remType,
      target_user: remTarget || null,
      target_name: targetUserObj ? targetUserObj.name : null,
      status: 'Pending',
      due_date: remDueDate
    };

    try {
      const res = await fetch(`${API_URL}/api/admin/reminders`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(remPayload)
      });

      if (res.ok) {
        fetchHubData();
        closeModal();
      } else {
        alert('Failed to save reminder.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveReminder = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reminders/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchHubData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/reminders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchHubData();
    } catch (err) {
      alert(err.message);
    }
  };

  // MEETINGS
  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    const meetPayload = {
      title: meetTitle,
      agenda: meetAgenda,
      room: meetRoom,
      date: meetDate,
      start_time: meetStart,
      end_time: meetEnd,
      attendees: meetAttendees.split(',').map(a => a.trim()).filter(Boolean)
    };

    try {
      const res = await fetch(`${API_URL}/api/admin/meetings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(meetPayload)
      });

      if (res.ok) {
        fetchHubData();
        closeModal();
      } else {
        alert('Failed to schedule meeting room.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm('Cancel this meeting?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/meetings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchHubData();
    } catch (err) {
      alert(err.message);
    }
  };

  // EXPENSES AUDIT
  const handleAuditExpense = async (statusVal) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/expenses/${selectedItem.id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusVal, comments: auditComment })
      });

      if (res.ok) {
        fetchHubData();
        closeModal();
      } else {
        alert('Failed to finalize expense audit.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // DOCUMENTS
  const handleSaveDoc = async (e) => {
    e.preventDefault();
    const docPayload = {
      title: docTitle,
      category: docCategory,
      description: docDesc,
      file_url: docUrl,
      is_public: docPublic
    };

    try {
      const res = await fetch(`${API_URL}/api/admin/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(docPayload)
      });

      if (res.ok) {
        fetchHubData();
        closeModal();
      } else {
        alert('Failed to upload document.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchHubData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Helpers
  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
    setAuditComment('');

    // reset form fields
    setAssetName(''); setAssetSerial(''); setAssetCategory(''); setAssetAssigned(''); setAssetStatus('Available'); setAssetValue(0);
    setInvName(''); setInvCategory(''); setInvQuantity(0); setInvMinThreshold(5); setInvLocation('Main Cabinet');
    setVName(''); setVContact(''); setVEmail(''); setVPhone(''); setVServices(''); setVStart(''); setVEnd(''); setVStatus('Active');
    setRemTitle(''); setRemDesc(''); setRemType('Reminder'); setRemTarget(''); setRemDueDate('');
    setMeetTitle(''); setMeetAgenda(''); setMeetRoom('Conference Room A'); setMeetStart('10:00'); setMeetEnd('11:00'); setMeetAttendees('');
    setDocTitle(''); setDocCategory('Policy'); setDocDesc(''); setDocUrl(''); setDocPublic(true);
  };

  const openEditAsset = (a) => {
    setSelectedItem(a);
    setAssetName(a.name);
    setAssetSerial(a.serial_number);
    setAssetCategory(a.category);
    setAssetAssigned(a.assigned_to || '');
    setAssetStatus(a.status);
    setAssetPurchaseDate(a.purchase_date);
    setAssetValue(a.value);
    setActiveModal('asset');
  };

  const openEditInventory = (i) => {
    setSelectedItem(i);
    setInvName(i.name);
    setInvCategory(i.category);
    setInvQuantity(i.quantity);
    setInvUnit(i.unit);
    setInvMinThreshold(i.min_threshold);
    setInvLocation(i.location);
    setActiveModal('inventory');
  };

  const openEditVendor = (v) => {
    setSelectedItem(v);
    setVName(v.name);
    setVContact(v.contact_name);
    setVEmail(v.email);
    setVPhone(v.phone);
    setVServices(v.services);
    setVStart(v.contract_start);
    setVEnd(v.contract_end);
    setVStatus(v.status);
    setActiveModal('vendor');
  };

  // Calculations for Stats
  const totalAssetsValue = assets.reduce((acc, a) => acc + a.value, 0);
  const totalAssignedAssets = assets.filter(a => a.status === 'Assigned').length;
  const lowStockCount = inventory.filter(i => i.quantity <= i.min_threshold).length;
  const activeContractsCount = vendors.filter(v => v.status === 'Active').length;
  const pendingRemindersCount = reminders.filter(r => r.status === 'Pending').length;
  const totalExpenseSum = expenses.reduce((acc, e) => acc + (e.status === 'Approved' ? e.amount : 0), 0);
  const pendingExpenseCount = expenses.filter(e => e.status === 'Pending').length;

  // ─── MEETING HOURLY SCHEDULER UTILS ───
  const parseTimeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    const clean = timeStr.trim().toLowerCase();

    let hours = 0;
    let minutes = 0;

    if (clean.includes('am') || clean.includes('pm')) {
      const isPM = clean.includes('pm');
      const matches = clean.replace(/[ap]m/, '').trim().split(':');
      hours = parseInt(matches[0], 10);
      minutes = matches[1] ? parseInt(matches[1], 10) : 0;

      if (hours === 12) {
        hours = isPM ? 12 : 0;
      } else if (isPM) {
        hours += 12;
      }
    } else {
      const matches = clean.split(':');
      hours = parseInt(matches[0], 10);
      minutes = matches[1] ? parseInt(matches[1], 10) : 0;
    }

    return hours + minutes / 60;
  };

  const detectConflicts = (meetingsList) => {
    const conflicts = new Set();
    const groups = {};

    meetingsList.forEach(m => {
      const key = `${m.date}__${m.room}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    Object.values(groups).forEach(groupMeetings => {
      for (let i = 0; i < groupMeetings.length; i++) {
        for (let j = i + 1; j < groupMeetings.length; j++) {
          const m1 = groupMeetings[i];
          const m2 = groupMeetings[j];

          const s1 = parseTimeToDecimal(m1.start_time);
          const e1 = parseTimeToDecimal(m1.end_time);
          const s2 = parseTimeToDecimal(m2.start_time);
          const e2 = parseTimeToDecimal(m2.end_time);

          if (s1 < e2 && s2 < e1) {
            conflicts.add(m1.id);
            conflicts.add(m2.id);
          }
        }
      }
    });

    return conflicts;
  };

  // ─── VISUAL ANALYTICS COMPUTATIONS ───
  const reportsCount = reports.length;
  const onTrackReports = reports.filter(r => r.status && r.status.toLowerCase() === 'on track').length;
  const completedReports = reports.filter(r => r.status && r.status.toLowerCase() === 'completed').length;
  const blockedReports = reports.filter(r => r.status && (r.status.toLowerCase() === 'blocked' || r.status.toLowerCase().includes('block'))).length;
  const otherReports = reportsCount - (onTrackReports + completedReports + blockedReports);

  const pctOnTrack = reportsCount > 0 ? Math.round((onTrackReports / reportsCount) * 100) : 0;
  const pctCompleted = reportsCount > 0 ? Math.round((completedReports / reportsCount) * 100) : 0;
  const pctBlocked = reportsCount > 0 ? Math.round((blockedReports / reportsCount) * 100) : 0;
  const pctOther = reportsCount > 0 ? Math.round((otherReports / reportsCount) * 100) : 0;

  const circ = 251.32;
  const dashOnTrack = (pctOnTrack / 100) * circ;
  const dashCompleted = (pctCompleted / 100) * circ;
  const dashBlocked = (pctBlocked / 100) * circ;
  const dashOther = (pctOther / 100) * circ;

  const offsetOnTrack = 0;
  const offsetCompleted = -dashOnTrack;
  const offsetBlocked = -(dashOnTrack + dashCompleted);
  const offsetOther = -(dashOnTrack + dashCompleted + dashBlocked);

  const getDepartmentForUser = (name, email) => {
    if (!email) return "Engineering";
    const mail = email.toLowerCase();
    const nm = name ? name.toLowerCase() : "";
    if (mail.includes('admin') || mail.includes('ops') || nm.includes('admin')) return "IT Ops";
    if (mail.includes('qa') || mail.includes('test') || nm.includes('test')) return "Quality Assurance";
    if (mail.includes('sales') || mail.includes('market') || nm.includes('sales')) return "Sales & Marketing";
    if (mail.includes('staff') || mail.includes('support')) return "Customer Support";
    return "Engineering";
  };

  const deptCounts = {
    "Engineering": 0,
    "IT Ops": 0,
    "Quality Assurance": 0,
    "Sales & Mktg": 0,
    "Customer Support": 0
  };

  reports.forEach(r => {
    const userObj = usersList.find(u => u.name === r.user_name || u.id === r.user_id);
    let dept = getDepartmentForUser(r.user_name, userObj?.email);
    if (dept === "Sales & Marketing") dept = "Sales & Mktg";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const maxDeptCount = Math.max(...Object.values(deptCounts), 4);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-10 relative overflow-hidden text-white animate-fadeIn">
      {/* Background radial blurs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative max-w-7xl mx-auto z-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Administrative Terminal</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
              Admin Hub
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Coordinating inventory, tracking core assets, vendor contracts, scheduled meetings, and office expenses.
            </p>
          </div>
          <button
            onClick={fetchHubData}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            🔄 Sync Terminal
          </button>
        </div>

        {/* Dynamic Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2 overflow-x-auto select-none">
          {[
            { id: 'stats', label: '📊 Overview' },
            { id: 'users', label: '👥 Users' },
            { id: 'assets', label: '💼 Assets' },
            { id: 'inventory', label: '📦 Inventory' },
            { id: 'vendors', label: '🤝 Vendors' },
            { id: 'reminders', label: '⏰ Reminders' },
            { id: 'meetings', label: '📅 Rooms' },
            { id: 'expenses', label: '💵 Expenses' },
            { id: 'docs', label: '📂 Documents' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-purple-500/25 border border-purple-500/35 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : 'bg-white/[0.02] border border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Syncing console datastreams...</p>
          </div>
        ) : error ? (
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400 shadow-md">
            <span className="text-3xl mb-4 block">❌</span>
            <p className="font-semibold">{error}</p>
            <button onClick={fetchHubData} className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all cursor-pointer">Retry</button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ──────────────────────────────────────────────────────────────────
                TAB 1: STATS OVERVIEW
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'stats' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Metric Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Assets value */}
                  <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-white/10 transition-all">
                    <div>
                      <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Asset Value</p>
                      <h3 className="text-3xl font-extrabold mt-1">${totalAssetsValue.toLocaleString()}</h3>
                      <p className="text-white/30 text-[10px] mt-1">{totalAssignedAssets} assigned</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-400">💼</div>
                  </div>

                  {/* Card 2: Low stocks */}
                  <div className={`backdrop-blur-xl bg-white/5 border rounded-2xl p-6 flex items-center justify-between shadow-lg transition-all hover:border-white/10 ${lowStockCount > 0 ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-white/5'}`}>
                    <div>
                      <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Low Stock Supplies</p>
                      <h3 className={`text-3xl font-extrabold mt-1 ${lowStockCount > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{lowStockCount} Items</h3>
                      <p className="text-white/30 text-[10px] mt-1">Requires replenishment</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${lowStockCount > 0 ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>📦</div>
                  </div>

                  {/* Card 3: Expenses */}
                  <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-white/10 transition-all">
                    <div>
                      <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Approved Expenses</p>
                      <h3 className="text-3xl font-extrabold mt-1">${totalExpenseSum.toLocaleString()}</h3>
                      <p className="text-white/30 text-[10px] mt-1">{pendingExpenseCount} audits pending</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 text-purple-400">💵</div>
                  </div>

                  {/* Card 4: Reminders */}
                  <div className="backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-white/10 transition-all">
                    <div>
                      <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Pending Actions</p>
                      <h3 className="text-3xl font-extrabold mt-1">{pendingRemindersCount} Tasks</h3>
                      <p className="text-white/30 text-[10px] mt-1">{activeContractsCount} active contracts</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20 text-cyan-400">⏰</div>
                  </div>
                </div>

                {/* ─── PREMIUM SVG ANALYTICS COMMAND BOARD ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Donut Chart Card */}
                  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-transparent opacity-60"></div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Daily Status Distribution</h3>
                      <p className="text-xs text-white/40 mt-1">Status reports categorized by completion progress & blockers.</p>
                    </div>

                    {reportsCount === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-white/30 text-xs font-semibold">
                        <span>📊 No report logs submitted yet.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                        {/* Circular Donut SVG */}
                        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />

                            {/* Segment 1: On Track */}
                            {pctOnTrack > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke="rgb(52, 211, 153)"
                                strokeWidth="12"
                                strokeDasharray={`${dashOnTrack} ${circ}`}
                                strokeDashoffset={offsetOnTrack}
                                strokeLinecap="round"
                                className="transition-all duration-500 hover:stroke-[14px]"
                              />
                            )}

                            {/* Segment 2: Completed */}
                            {pctCompleted > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke="rgb(96, 165, 250)"
                                strokeWidth="12"
                                strokeDasharray={`${dashCompleted} ${circ}`}
                                strokeDashoffset={offsetCompleted}
                                strokeLinecap="round"
                                className="transition-all duration-500 hover:stroke-[14px]"
                              />
                            )}

                            {/* Segment 3: Blocked */}
                            {pctBlocked > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke="rgb(248, 113, 113)"
                                strokeWidth="12"
                                strokeDasharray={`${dashBlocked} ${circ}`}
                                strokeDashoffset={offsetBlocked}
                                strokeLinecap="round"
                                className="transition-all duration-500 hover:stroke-[14px]"
                              />
                            )}

                            {/* Segment 4: Other */}
                            {pctOther > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke="rgb(168, 85, 247)"
                                strokeWidth="12"
                                strokeDasharray={`${dashOther} ${circ}`}
                                strokeDashoffset={offsetOther}
                                strokeLinecap="round"
                                className="transition-all duration-500 hover:stroke-[14px]"
                              />
                            )}
                          </svg>

                          {/* Inner stats readout */}
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-white tracking-tighter">{reportsCount}</span>
                            <span className="text-[8px] font-black uppercase text-white/30 tracking-widest mt-0.5">Total Logs</span>
                          </div>
                        </div>

                        {/* Donut Legend */}
                        <div className="flex-1 space-y-3 w-full">
                          {[
                            { label: 'On Track', pct: pctOnTrack, count: onTrackReports, colorClass: 'bg-emerald-400', textClass: 'text-emerald-300' },
                            { label: 'Completed', pct: pctCompleted, count: completedReports, colorClass: 'bg-blue-400', textClass: 'text-blue-300' },
                            { label: 'Blocked', pct: pctBlocked, count: blockedReports, colorClass: 'bg-red-400', textClass: 'text-red-300' },
                            { label: 'Other', pct: pctOther, count: otherReports, colorClass: 'bg-purple-400', textClass: 'text-purple-300' }
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center text-xs text-white/60 bg-white/[0.01] hover:bg-white/[0.03] p-2 rounded-xl transition-all border border-white/5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${item.colorClass}`}></span>
                                <span className="font-semibold text-white/70">{item.label}</span>
                              </div>
                              <div className="text-right">
                                <span className={`font-black ${item.textClass}`}>{item.pct}%</span>
                                <span className="text-white/30 text-[9px] ml-1.5">({item.count})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vertical Bar Chart Card */}
                  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent opacity-60"></div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Department Submissions</h3>
                      <p className="text-xs text-white/40 mt-1">Relative volume of report activity across corporate departments.</p>
                    </div>

                    {reportsCount === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-white/30 text-xs font-semibold">
                        <span>📊 No reports logged across departments.</span>
                      </div>
                    ) : (
                      <div className="w-full h-44 relative mt-4">
                        <svg className="w-full h-full" viewBox="0 0 400 170" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
                            </linearGradient>
                          </defs>

                          {/* Grid horizontal guidelines */}
                          <line x1="20" y1="20" x2="380" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="20" y1="75" x2="380" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="20" y1="130" x2="380" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                          {/* Bars */}
                          {Object.entries(deptCounts).map(([dept, count], idx) => {
                            const barW = 28;
                            const spacing = 70;
                            const x = 35 + idx * spacing;
                            const barH = (count / maxDeptCount) * 110;
                            const y = 130 - barH;

                            return (
                              <g key={dept} className="group cursor-pointer">
                                {/* Invisible interactive hover block */}
                                <rect x={x - 10} y="10" width={barW + 20} height="130" fill="transparent" />

                                {/* Background guide track */}
                                <rect x={x} y="20" width={barW} height="110" fill="rgba(255,255,255,0.01)" rx="4" />

                                {/* Glowing bar */}
                                <rect
                                  x={x}
                                  y={y}
                                  width={barW}
                                  height={barH}
                                  fill="url(#barGlow)"
                                  rx="4"
                                  className="transition-all duration-300 group-hover:fill-purple-400 group-hover:filter group-hover:blur-[1px]"
                                />

                                {/* Text value bubble */}
                                <text
                                  x={x + barW / 2}
                                  y={y - 6}
                                  textAnchor="middle"
                                  fill="rgb(168, 85, 247)"
                                  fontSize="9"
                                  fontWeight="900"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity font-mono"
                                >
                                  {count}
                                </text>
                                <text
                                  x={x + barW / 2}
                                  y={145}
                                  textAnchor="middle"
                                  fill="rgba(255,255,255,0.4)"
                                  fontSize="8"
                                  fontWeight="700"
                                  className="uppercase tracking-wider group-hover:fill-white transition-colors"
                                >
                                  {dept.split(' ')[0].slice(0, 5)}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-grid with quick details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Low Inventory Stock Monitor */}
                  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white/90">Low Stock Alert Dashboard</h3>
                    <div className="space-y-3">
                      {inventory.filter(i => i.quantity <= i.min_threshold).length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-6">🟢 All office inventory quantities are above minimum thresholds.</p>
                      ) : (
                        inventory.filter(i => i.quantity <= i.min_threshold).map(i => (
                          <div key={i.id} className="flex justify-between items-center p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                            <div>
                              <p className="font-bold text-sm text-white">{i.name}</p>
                              <p className="text-[10px] text-white/40">Location: {i.location} | Unit: {i.unit}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-400 font-extrabold text-sm">{i.quantity} Left</p>
                              <p className="text-[9px] text-white/40">Threshold: {i.min_threshold}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: Upcoming Scheduled Meetings */}
                  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white/90">Upcoming Room Bookings</h3>
                    <div className="space-y-3">
                      {meetings.length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-6">📂 No scheduled meetings booked today.</p>
                      ) : (
                        meetings.slice(0, 4).map(m => (
                          <div key={m.id} className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                            <div>
                              <p className="font-bold text-sm text-white">{m.title}</p>
                              <p className="text-[10px] text-white/40">{m.room} | Organizer: {m.organizer_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-purple-400 font-extrabold text-xs">{m.start_time} - {m.end_time}</p>
                              <p className="text-[9px] text-white/40">{m.date}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                TAB 2: USER DIRECTORY
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="animate-fadeIn">
                <AdminUsers />
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                TAB 3: ASSET MANAGER
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'assets' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white/90">Asset Catalog</h2>
                  <button
                    onClick={() => { closeModal(); setActiveModal('asset'); }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    ➕ Log Asset
                  </button>
                </div>

                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Asset / Category</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Serial</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Value</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Assigned To</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Status</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {assets.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-white/40">No company assets logged in repository.</td>
                        </tr>
                      ) : (
                        assets.map((a) => (
                          <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-bold text-sm text-white block">{a.name}</span>
                              <span className="text-[10px] text-white/40 uppercase">{a.category}</span>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs text-white/50">{a.serial_number}</td>
                            <td className="py-4 px-6 font-mono text-xs text-purple-300">${a.value.toFixed(2)}</td>
                            <td className="py-4 px-6 text-sm text-white/70">{a.assigned_name || '—'}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${a.status === 'Available' ? 'bg-green-500/10 text-green-300 border-green-500/20' :
                                  a.status === 'Assigned' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                                    'bg-red-500/10 text-red-300 border-red-500/20'
                                }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => openEditAsset(a)} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold">Edit</button>
                                <button onClick={() => handleDeleteAsset(a.id)} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                TAB 4: OFFICE INVENTORY
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white/90">Office Inventory</h2>
                  <button
                    onClick={() => { closeModal(); setActiveModal('inventory'); }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    ➕ Log Supply
                  </button>
                </div>

                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Item / Category</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Quantity</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Min. Threshold</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Location</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Last Updated</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-white/40">No office supplies registered.</td>
                        </tr>
                      ) : (
                        inventory.map((i) => {
                          const isLow = i.quantity <= i.min_threshold;
                          return (
                            <tr key={i.id} className={`hover:bg-white/[0.02] transition-colors ${isLow ? 'bg-red-500/[0.01]' : ''}`}>
                              <td className="py-4 px-6">
                                <span className="font-bold text-sm text-white block">{i.name}</span>
                                <span className="text-[10px] text-white/40 uppercase">{i.category}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`font-bold text-sm ${isLow ? 'text-red-400 font-black' : 'text-white'}`}>{i.quantity} {i.unit}</span>
                                {isLow && <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 text-[8px] font-black uppercase rounded-full">Low Stock</span>}
                              </td>
                              <td className="py-4 px-6 font-mono text-xs text-white/50">{i.min_threshold} {i.unit}</td>
                              <td className="py-4 px-6 text-sm text-white/70">{i.location}</td>
                              <td className="py-4 px-6 font-mono text-[10px] text-white/40">{new Date(i.last_updated).toLocaleString()}</td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => openEditInventory(i)} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold">Edit</button>
                                  <button onClick={() => handleDeleteInventory(i.id)} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                TAB 5: VENDORS
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'vendors' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white/90">Vendor Coordination</h2>
                  <button
                    onClick={() => { closeModal(); setActiveModal('vendor'); }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    ➕ Log Vendor
                  </button>
                </div>

                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Vendor Name</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Contact Person</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Email & Phone</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Services Provided</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Contract Dates</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Status</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {vendors.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-10 text-white/40">No external vendors registered.</td>
                        </tr>
                      ) : (
                        vendors.map((v) => (
                          <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6 font-bold text-sm text-white">{v.name}</td>
                            <td className="py-4 px-6 text-sm text-white/70">{v.contact_name}</td>
                            <td className="py-4 px-6">
                              <span className="text-xs text-white/60 block">{v.email}</span>
                              <span className="text-[10px] font-mono text-white/45">{v.phone}</span>
                            </td>
                            <td className="py-4 px-6 text-sm text-white/70">{v.services}</td>
                            <td className="py-4 px-6 text-xs text-white/50 font-mono">
                              <div>Start: {v.contract_start}</div>
                              <div>End: {v.contract_end}</div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${v.status === 'Active' ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'
                                }`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => openEditVendor(v)} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold">Edit</button>
                                <button onClick={() => handleDeleteVendor(v.id)} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                TAB 6: REMINDERS & ESCALATIONS
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'reminders' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white/90">Reminders & Escalations</h2>
                  <button
                    onClick={() => { closeModal(); setActiveModal('reminder'); }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    ➕ Post Reminder
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reminders.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-white/40">No reminders or escalations found.</div>
                  ) : (
                    reminders.map((r) => (
                      <div
                        key={r.id}
                        className={`backdrop-blur-xl border rounded-2xl p-5 space-y-4 hover:border-white/10 transition-all ${r.status === 'Resolved' ? 'bg-white/[0.01] border-white/5 opacity-60' :
                            r.type === 'Escalation' ? 'bg-red-500/[0.03] border-red-500/20' : 'bg-white/[0.03] border-white/5'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${r.type === 'Escalation' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}>
                              {r.type}
                            </span>
                            <h3 className="font-bold text-base text-white mt-2">{r.title}</h3>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.status === 'Resolved' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                            {r.status}
                          </span>
                        </div>

                        <p className="text-sm text-white/60 leading-relaxed">{r.description}</p>

                        <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-white/40">
                          <div>
                            <div>Target: <span className="text-white/60 font-semibold">{r.target_name || 'All Staff'}</span></div>
                            <div>Due: <span className="text-white/60 font-mono">{r.due_date}</span></div>
                          </div>
                          <div className="flex gap-2">
                            {r.status === 'Pending' && (
                              <button onClick={() => handleResolveReminder(r.id)} className="px-2 py-1 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded font-bold uppercase text-[9px]">Resolve</button>
                            )}
                            <button onClick={() => handleDeleteReminder(r.id)} className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded font-bold uppercase text-[9px]">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                TAB 7: MEETING ROOMS SCHEDULER
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'meetings' && (() => {
              const rooms = [
                { id: 'Conference Room A', label: 'Boardroom A', seats: '12 seats' },
                { id: 'Conference Room B', label: 'Dev Room B', seats: '6 seats' },
                { id: 'Huddle Pod C', label: 'Huddle Pod C', seats: '4 seats' }
              ];

              return (
                <div className="space-y-6 animate-fadeIn">
                  {/* Premium Scheduler Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSchedulerViewMode('grid')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${schedulerViewMode === 'grid'
                            ? 'bg-purple-500/25 border border-purple-500/35 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                            : 'bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        📅 Timeline Grid
                      </button>
                      <button
                        onClick={() => setSchedulerViewMode('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${schedulerViewMode === 'table'
                            ? 'bg-purple-500/25 border border-purple-500/35 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                            : 'bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        📋 Standard Table
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-white/40">Date:</span>
                        <input
                          type="date"
                          value={calendarDate}
                          onChange={(e) => setCalendarDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-purple-300 outline-none cursor-pointer [color-scheme:dark]"
                        />
                      </div>
                      <button
                        onClick={() => { closeModal(); setActiveModal('meeting'); }}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-purple-500/20"
                      >
                        ➕ Book Room
                      </button>
                    </div>
                  </div>

                  {schedulerViewMode === 'grid' ? (
                    <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden space-y-6">
                      {/* Grid Header showing Active Date */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                          <span className="text-xs md:text-sm font-bold text-white">
                            Timeline Overview — {new Date(calendarDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-white/40">
                          {meetings.filter(m => m.date === calendarDate).length} Bookings Today
                        </span>
                      </div>

                      {/* Timeline Scroll Container */}
                      <div className="overflow-x-auto">
                        <div className="min-w-[760px]">
                          {/* Column Headers */}
                          <div className="grid grid-cols-[5rem_1fr_1fr_1fr] border-b border-white/5 pb-3 mb-1 select-none">
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/30 text-center flex items-center justify-center">TIME</div>
                            {rooms.map(room => (
                              <div key={room.id} className="text-center">
                                <span className="text-xs font-bold text-white block">{room.label}</span>
                                <span className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">{room.seats}</span>
                              </div>
                            ))}
                          </div>

                          {/* Main Hour Timeline Grid */}
                          <div className="relative h-[540px] grid grid-cols-[5rem_1fr_1fr_1fr] bg-white/[0.01] rounded-2xl border border-white/[0.03] overflow-hidden">
                            {/* Time Slots Labels Column */}
                            <div className="relative border-r border-white/5 h-full select-none">
                              {Array.from({ length: 10 }).map((_, i) => {
                                const hr = 9 + i;
                                const ampm = hr >= 12 ? 'PM' : 'AM';
                                const displayHr = hr > 12 ? hr - 12 : hr;
                                const timeLabel = `${displayHr}:00 ${ampm}`;
                                return (
                                  <div
                                    key={i}
                                    style={{ top: `${i * 60}px` }}
                                    className="absolute left-0 right-0 h-[20px] flex items-center justify-center -translate-y-1/2"
                                  >
                                    <span className="text-[9px] font-black tracking-wider font-mono text-white/40">{timeLabel}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Horizontal Grid lines overlay across room columns */}
                            <div className="absolute inset-0 pointer-events-none z-0">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                  key={i}
                                  style={{ top: `${i * 60}px` }}
                                  className="absolute left-[5rem] right-0 border-t border-white/[0.04]"
                                />
                              ))}
                            </div>

                            {/* Room Columns */}
                            {rooms.map((room) => {
                              const roomMeetings = meetings.filter(
                                (m) => m.date === calendarDate && m.room === room.id
                              );
                              const conflictSet = detectConflicts(meetings);

                              return (
                                <div key={room.id} className="relative border-r border-white/5 last:border-r-0 h-full bg-gradient-to-b from-white/[0.01] to-transparent">
                                  {roomMeetings.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Available</span>
                                    </div>
                                  )}

                                  {/* Render Meetings inside room column */}
                                  {roomMeetings.map((m) => {
                                    const startDec = parseTimeToDecimal(m.start_time);
                                    const endDec = parseTimeToDecimal(m.end_time);

                                    // Clamp display between 9 AM and 6 PM
                                    const displayStart = Math.max(9.0, Math.min(18.0, startDec));
                                    const displayEnd = Math.max(9.0, Math.min(18.0, endDec));
                                    const duration = displayEnd - displayStart;

                                    if (duration <= 0) return null;

                                    const topPx = (displayStart - 9.0) * 60;
                                    const heightPx = duration * 60;
                                    const isConflict = conflictSet.has(m.id);

                                    return (
                                      <div
                                        key={m.id}
                                        style={{
                                          top: `${topPx + 4}px`,
                                          height: `${heightPx - 8}px`,
                                        }}
                                        className={`absolute left-2 right-2 rounded-2xl border p-3 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group cursor-pointer z-10 ${isConflict
                                            ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-950/20 text-red-300 hover:border-red-400 z-20 animate-pulse'
                                            : 'border-purple-500/20 bg-purple-500/10 hover:border-purple-500/40 text-purple-200 hover:bg-purple-500/15'
                                          }`}
                                      >
                                        <div className="relative h-full flex flex-col justify-between">
                                          {/* Direct cancellations trigger trigger on timeline hover */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteMeeting(m.id);
                                            }}
                                            className="absolute top-0 right-0 w-4 h-4 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-full flex items-center justify-center text-[8px] font-black opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer"
                                            title="Cancel Booking"
                                          >
                                            ✕
                                          </button>

                                          <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                              {isConflict && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0"></span>
                                              )}
                                              <h4 className="text-xs font-bold tracking-tight truncate pr-4 text-white">
                                                {m.title}
                                              </h4>
                                            </div>

                                            <p className="text-[9px] font-bold uppercase text-white/50 tracking-wider font-mono">
                                              {m.start_time} - {m.end_time}
                                            </p>
                                          </div>

                                          <div className="flex items-center justify-between text-[8px] border-t border-white/5 pt-1.5 mt-1 select-none">
                                            <span className="text-white/40 truncate max-w-[65%] font-medium">
                                              👤 {m.organizer_name}
                                            </span>
                                            {isConflict ? (
                                              <span className="text-red-400 font-extrabold uppercase tracking-widest text-[7px] animate-pulse">
                                                Conflict
                                              </span>
                                            ) : (
                                              <span className="text-purple-400 font-extrabold uppercase tracking-widest text-[7px]">
                                                Booked
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Fallback List Workbench Table */
                    <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden animate-fadeIn">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Meeting / Room</th>
                            <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Agenda</th>
                            <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Organizer</th>
                            <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Attendees</th>
                            <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Date & Time</th>
                            <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {meetings.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-10 text-white/40">No scheduled meetings.</td>
                            </tr>
                          ) : (
                            meetings.map((m) => (
                              <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-4 px-6">
                                  <span className="font-bold text-sm text-white block">{m.title}</span>
                                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded font-bold uppercase tracking-wider inline-block mt-1">{m.room}</span>
                                </td>
                                <td className="py-4 px-6 text-sm text-white/70 max-w-xs truncate">{m.agenda}</td>
                                <td className="py-4 px-6 text-sm text-white/70">{m.organizer_name}</td>
                                <td className="py-4 px-6">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {m.attendees.map((a, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/60 text-[9px] font-mono rounded">{a}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-purple-300">
                                  <div>{m.date}</div>
                                  <div className="text-[10px] text-white/40 mt-0.5">{m.start_time} - {m.end_time}</div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <button onClick={() => handleDeleteMeeting(m.id)} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold cursor-pointer">Cancel</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ──────────────────────────────────────────────────────────────────
                TAB 8: EXPENSE AUDITING
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'expenses' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white/90">Expense Audit Desk</h2>
                  <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/25 rounded-full text-xs font-black uppercase text-purple-400">Total Capital: ${totalExpenseSum.toLocaleString()} approved</span>
                </div>

                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Staff Member</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Category & Date</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Description</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Amount</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Status</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30">Comments</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-white/30 text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-10 text-white/40">No expense claims logged.</td>
                        </tr>
                      ) : (
                        expenses.map((e) => (
                          <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6 font-bold text-sm text-white">{e.user_name}</td>
                            <td className="py-4 px-6 text-xs text-white/50 font-mono">
                              <span className="font-bold text-white/80 block">{e.category}</span>
                              {e.date}
                            </td>
                            <td className="py-4 px-6 text-sm text-white/60 max-w-xs truncate">{e.description}</td>
                            <td className="py-4 px-6 font-mono text-sm text-purple-300 font-extrabold">${e.amount.toFixed(2)}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${e.status === 'Approved' ? 'bg-green-500/10 text-green-300 border-green-500/20' :
                                  e.status === 'Rejected' ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                                    'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                }`}>
                                {e.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-white/40 italic">{e.comments || '—'}</td>
                            <td className="py-4 px-6 text-right">
                              {e.status === 'Pending' ? (
                                <button
                                  onClick={() => { setSelectedItem(e); setAuditComment(''); setActiveModal('expense-audit'); }}
                                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 rounded-lg text-xs font-bold uppercase cursor-pointer"
                                >
                                  ⚖ Audit
                                </button>
                              ) : (
                                <span className="text-xs text-white/30">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                TAB 9: DOCUMENTS ORGANIZATION
                ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'docs' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white/90">Document Library</h2>
                  <button
                    onClick={() => { closeModal(); setActiveModal('doc'); }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    ➕ Register Doc
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-white/40">No company documents logged in library.</div>
                  ) : (
                    documents.map((d) => (
                      <div key={d.id} className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-white/10 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[8px] font-black uppercase rounded">{d.category}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${d.is_public ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                              {d.is_public ? 'Public' : 'Confidential'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-base text-white">{d.title}</h3>
                          <p className="text-xs text-white/50">{d.description || 'No overview summary logged.'}</p>
                        </div>

                        <div className="border-t border-white/5 pt-4 mt-2 flex justify-between items-center text-[10px] text-white/40">
                          <div>
                            <div>Logged by: <span className="text-white/60 font-semibold">{d.created_by}</span></div>
                            <div>Date: <span className="text-white/60 font-mono">{new Date(d.created_at).toLocaleDateString()}</span></div>
                          </div>
                          <div className="flex gap-2">
                            <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded font-extrabold uppercase text-[9px]">Open Link</a>
                            <button onClick={() => handleDeleteDoc(d.id)} className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded font-extrabold uppercase text-[9px]">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          FORMS MODALS
          ────────────────────────────────────────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-950/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                {activeModal === 'asset' ? (selectedItem ? 'Modify Asset Profile' : 'Catalog New Asset') :
                  activeModal === 'inventory' ? (selectedItem ? 'Adjust Inventory Supply' : 'Log New Supply Item') :
                    activeModal === 'vendor' ? (selectedItem ? 'Modify Vendor Account' : 'Log External Vendor') :
                      activeModal === 'reminder' ? 'Post Actions / Escalation' :
                        activeModal === 'meeting' ? 'Reserve Conference Room' :
                          activeModal === 'doc' ? 'Publish Corporate Doc' :
                            'Expense Audit Board'}
              </h3>
              <button onClick={closeModal} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer">
                ❌
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto space-y-4">

              {/* ASSET FORM */}
              {activeModal === 'asset' && (
                <form onSubmit={handleSaveAsset} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Asset Name</label>
                      <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} required placeholder="e.g. MacBook Pro 16" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Serial Number</label>
                      <input type="text" value={assetSerial} onChange={(e) => setAssetSerial(e.target.value)} required placeholder="e.g. C02D98X..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Category</label>
                      <input type="text" value={assetCategory} onChange={(e) => setAssetCategory(e.target.value)} required placeholder="e.g. Hardware, Furniture" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Purchase Value ($)</label>
                      <input type="number" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} required min="0" placeholder="e.g. 1999" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Purchase Date</label>
                      <input type="date" value={assetPurchaseDate} onChange={(e) => setAssetPurchaseDate(e.target.value)} required className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Status</label>
                      <select value={assetStatus} onChange={(e) => setAssetStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm select-none">
                        <option value="Available">🟢 Available</option>
                        <option value="Under Repair">🛠 Under Repair</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Assign To (Staff Member)</label>
                    <select value={assetAssigned} onChange={(e) => setAssetAssigned(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm">
                      <option value="">— Unassigned / Free Asset —</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl text-xs font-extrabold uppercase text-white transition-all">Save Asset</button>
                  </div>
                </form>
              )}

              {/* INVENTORY FORM */}
              {activeModal === 'inventory' && (
                <form onSubmit={handleSaveInventory} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Supply Name</label>
                      <input type="text" value={invName} onChange={(e) => setInvName(e.target.value)} required placeholder="e.g. A4 Copy Paper" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Category</label>
                      <input type="text" value={invCategory} onChange={(e) => setInvCategory(e.target.value)} required placeholder="e.g. Stationery, Pantry" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Quantity</label>
                      <input type="number" value={invQuantity} onChange={(e) => setInvQuantity(e.target.value)} required min="0" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Unit</label>
                      <input type="text" value={invUnit} onChange={(e) => setInvUnit(e.target.value)} required placeholder="boxes, pcs" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Min. Threshold</label>
                      <input type="number" value={invMinThreshold} onChange={(e) => setInvMinThreshold(e.target.value)} required min="0" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Storage Location</label>
                    <input type="text" value={invLocation} onChange={(e) => setInvLocation(e.target.value)} required placeholder="e.g. Cabinet B, Pantry Shelf" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl text-xs font-extrabold uppercase text-white transition-all">Save Item</button>
                  </div>
                </form>
              )}

              {/* VENDOR FORM */}
              {activeModal === 'vendor' && (
                <form onSubmit={handleSaveVendor} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Vendor/Company Name</label>
                      <input type="text" value={vName} onChange={(e) => setVName(e.target.value)} required placeholder="e.g. Super Cleaners Inc" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Contact Person</label>
                      <input type="text" value={vContact} onChange={(e) => setVContact(e.target.value)} required placeholder="e.g. John Doe" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Contact Email</label>
                      <input type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} required placeholder="e.g. sales@superclean.com" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Contact Phone</label>
                      <input type="text" value={vPhone} onChange={(e) => setVPhone(e.target.value)} required placeholder="e.g. 555-0199" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Services/Products Provided</label>
                    <textarea value={vServices} onChange={(e) => setVServices(e.target.value)} required placeholder="e.g. Weekly deep cleaning services, supply office cleaning items..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none h-20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Contract Start</label>
                      <input type="date" value={vStart} onChange={(e) => setVStart(e.target.value)} required className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Contract End</label>
                      <input type="date" value={vEnd} onChange={(e) => setVEnd(e.target.value)} required className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Status</label>
                      <select value={vStatus} onChange={(e) => setVStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm">
                        <option value="Active">🟢 Active</option>
                        <option value="Inactive">🔴 Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl text-xs font-extrabold uppercase text-white transition-all">Save Vendor</button>
                  </div>
                </form>
              )}

              {/* REMINDER FORM */}
              {activeModal === 'reminder' && (
                <form onSubmit={handleSaveReminder} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Topic / Title</label>
                    <input type="text" value={remTitle} onChange={(e) => setRemTitle(e.target.value)} required placeholder="e.g. Finalize Q2 Status Report submissions" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Description</label>
                    <textarea value={remDesc} onChange={(e) => setRemDesc(e.target.value)} required placeholder="Outline details of what needs resolving..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none h-20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Type</label>
                      <select value={remType} onChange={(e) => setRemType(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm">
                        <option value="Reminder">⏰ General Reminder</option>
                        <option value="Escalation">🚨 Critical Escalation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Due Date</label>
                      <input type="date" value={remDueDate} onChange={(e) => setRemDueDate(e.target.value)} required className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm [color-scheme:dark]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Target Account (Optional)</label>
                    <select value={remTarget} onChange={(e) => setRemTarget(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm">
                      <option value="">— Broadcast to All Staff —</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl text-xs font-extrabold uppercase text-white transition-all">Save Reminder</button>
                  </div>
                </form>
              )}

              {/* MEETING ROOM FORM */}
              {activeModal === 'meeting' && (
                <form onSubmit={handleSaveMeeting} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Meeting Title</label>
                    <input type="text" value={meetTitle} onChange={(e) => setMeetTitle(e.target.value)} required placeholder="e.g. Bi-Weekly Dev Alignment" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Meeting Agenda</label>
                    <textarea value={meetAgenda} onChange={(e) => setMeetAgenda(e.target.value)} required placeholder="e.g. Aligning frontend styles, review open API branches..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none h-20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Conference Room</label>
                      <select value={meetRoom} onChange={(e) => setMeetRoom(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm">
                        <option value="Conference Room A">Boardroom A (12 Seats)</option>
                        <option value="Conference Room B">Dev Room B (6 Seats)</option>
                        <option value="Huddle Pod C">Huddle Pod C (4 Seats)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Date</label>
                      <input type="date" value={meetDate} onChange={(e) => setMeetDate(e.target.value)} required className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm [color-scheme:dark]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Start Time</label>
                      <input type="time" value={meetStart} onChange={(e) => setMeetStart(e.target.value)} required className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">End Time</label>
                      <input type="time" value={meetEnd} onChange={(e) => setMeetEnd(e.target.value)} required className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm [color-scheme:dark]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Invite Attendees (Comma Separated Emails/Names)</label>
                    <input type="text" value={meetAttendees} onChange={(e) => setMeetAttendees(e.target.value)} placeholder="e.g. user@domain.com, guest@company.com" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl text-xs font-extrabold uppercase text-white transition-all">Schedule Meeting</button>
                  </div>
                </form>
              )}

              {/* DOCUMENT FORM */}
              {activeModal === 'doc' && (
                <form onSubmit={handleSaveDoc} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Document Title</label>
                    <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} required placeholder="e.g. Employee Handbook 2026" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Category</label>
                      <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm">
                        <option value="Policy">⚖ Policy Document</option>
                        <option value="Guide">📖 Practical Guide</option>
                        <option value="Template">📝 File Template</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Access Control</label>
                      <select value={docPublic ? 'true' : 'false'} onChange={(e) => setDocPublic(e.target.value === 'true')} className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm">
                        <option value="true">🟢 Public (All Staff)</option>
                        <option value="false">🔴 Confidential (Admin Only)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Document Description</label>
                    <textarea value={docDesc} onChange={(e) => setDocDesc(e.target.value)} placeholder="Provide a brief summary of document contents..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none h-16" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Document File/Reference Link URL</label>
                    <input type="url" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} required placeholder="e.g. https://drive.google.com/..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl text-xs font-extrabold uppercase text-white transition-all">Publish Doc</button>
                  </div>
                </form>
              )}

              {/* EXPENSE AUDIT WORKFLOW */}
              {activeModal === 'expense-audit' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs text-white/45">
                      <span>Submitted by: <strong>{selectedItem.user_name}</strong></span>
                      <span className="font-mono text-purple-300 font-extrabold">${selectedItem.amount.toFixed(2)}</span>
                    </div>
                    <div className="font-bold text-sm">{selectedItem.category}</div>
                    <p className="text-xs text-white/70">{selectedItem.description}</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Audit Remarks / Comments</label>
                    <textarea value={auditComment} onChange={(e) => setAuditComment(e.target.value)} placeholder="Provide rationale for approval/rejection decision..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-purple-400 outline-none h-20" />
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-white/5">
                    <button onClick={closeModal} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase">Cancel</button>
                    <button onClick={() => handleAuditExpense('Rejected')} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 rounded-xl text-xs font-black uppercase">❌ Reject Claim</button>
                    <button onClick={() => handleAuditExpense('Approved')} className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-xs font-black uppercase text-white">✅ Approve Claim</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminHub;
