import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';

const UserExpenses = () => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Submit Expense Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Travel');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchUserExpenseData = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch both in parallel
      const [expenseRes, docRes] = await Promise.all([
        fetch(`${API_URL}/api/expenses`, { headers }),
        fetch(`${API_URL}/api/documents`, { headers }),
      ]);

      if (!expenseRes.ok) throw new Error('Failed to load expense records');
      setExpenses(await expenseRes.json());
      if (docRes.ok) setDocuments(await docRes.json());

    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to sync records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUserExpenseData();
  }, [token]);

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    const chosenDoc = documents.find(d => d.id === selectedDocId);
    const expensePayload = {
      amount: parseFloat(amount),
      category,
      description,
      date,
      document_id: selectedDocId || null,
      document_title: chosenDoc ? chosenDoc.title : null,
      document_url: chosenDoc ? chosenDoc.file_url : null
    };

    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(expensePayload)
      });

      if (res.ok) {
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setSelectedDocId('');
        fetchUserExpenseData();
        alert('✅ Expense claim submitted successfully for admin audit!');
      } else {
        alert('❌ Failed to submit expense claim.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeletePendingExpense = async (id) => {
    if (!window.confirm('Withdraw this pending expense claim?')) return;
    try {
      const res = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUserExpenseData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Aggregates
  const totalClaimed = expenses.reduce((acc, e) => acc + (e.status === 'Approved' ? e.amount : 0), 0);
  const totalPending = expenses.reduce((acc, e) => acc + (e.status === 'Pending' ? e.amount : 0), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-10 relative overflow-hidden text-white animate-fadeIn">
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full filter blur-[80px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto z-10 space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Self-Service Console</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
            Expenses &amp; Policies
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Submit expense claims for reimbursement and read corporate policy resources published by your administration.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 backdrop-blur-xl bg-white/5 border border-white/5 rounded-2xl">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Synchronizing your dashboard...</p>
          </div>
        ) : error ? (
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchUserExpenseData} className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all cursor-pointer">Retry</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Submit expense form */}
            <div className="lg:col-span-1 space-y-6">
              <form 
                onSubmit={handleSubmitExpense}
                className="backdrop-blur-3xl bg-slate-950/40 border border-white/5 rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl"
              >
                <h3 className="text-lg font-extrabold tracking-tight text-white border-b border-white/5 pb-3">Submit Expense Claim</h3>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Claim Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-purple-400 transition cursor-pointer"
                  >
                    <option value="Travel">✈ Travel &amp; Fuel</option>
                    <option value="Meals">🍽 Meals &amp; Catering</option>
                    <option value="Hardware">💻 Hardware &amp; Accessories</option>
                    <option value="Software">🔧 Software &amp; Licenses</option>
                    <option value="Utilities">💡 Office Utilities &amp; Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Date of Expense</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-400 transition [color-scheme:dark]"
                  />
                </div>

                 <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Supporting Document / Receipt</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:border-purple-400 transition cursor-pointer"
                  >
                    <option value="">-- No Supporting Document --</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>{d.title} ({d.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Reason / Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide itemized detail of purchases..."
                    rows="3"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-xl hover:shadow-purple-500/10 transition-all uppercase tracking-wider text-xs cursor-pointer"
                >
                  {submitLoading ? 'Transmitting claim...' : 'Submit Claim'}
                </button>
              </form>

              {/* Policy Quick Docs */}
              <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400">Library &amp; Policies</h3>
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <p className="text-white/30 text-xs py-4">No published resources listed in directory.</p>
                  ) : (
                    documents.map(d => (
                      <div key={d.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex justify-between items-center gap-4 hover:border-white/10 transition-all">
                        <div>
                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 text-[8px] font-black uppercase rounded">{d.category}</span>
                          <p className="font-bold text-xs text-white mt-1 leading-snug">{d.title}</p>
                        </div>
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] uppercase tracking-wide text-white/80 hover:bg-white/10">Open</a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Expense ledger */}
            <div className="lg:col-span-2 space-y-6">
              {/* Aggregates Dashboard */}
              <div className="grid grid-cols-2 gap-4">
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Reimbursed Cash</span>
                    <h3 className="text-2xl font-extrabold mt-1 text-green-400">${totalClaimed.toFixed(2)}</h3>
                  </div>
                  <div className="text-xl">💰</div>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Pending Review</span>
                    <h3 className="text-2xl font-extrabold mt-1 text-amber-400">${totalPending.toFixed(2)}</h3>
                  </div>
                  <div className="text-xl">⏱️</div>
                </div>
              </div>

              {/* Claims Timeline Table */}
              <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white/90">Claim Status Registry</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Purchase Category</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Description</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Amount</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Status</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30">Remarks</th>
                        <th className="py-2 pb-3 text-[9px] font-black uppercase tracking-widest text-white/30 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-white/40">No expense claims logged.</td>
                        </tr>
                      ) : (
                        expenses.map((e) => (
                          <tr key={e.id} className="hover:bg-white/[0.01]">
                            <td className="py-3.5 pr-2">
                              <span className="font-bold text-xs text-white block">{e.category}</span>
                              <span className="text-[9px] font-mono text-white/40">{e.date}</span>
                            </td>
                            <td className="py-3.5 text-xs text-white/60 max-w-xs truncate">
                              {e.description}
                              {e.document_url && (
                                <a 
                                  href={e.document_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 ml-2 text-[10px] text-purple-400 hover:text-purple-300 font-bold hover:underline"
                                >
                                  📂 Receipt
                                </a>
                              )}
                            </td>
                            <td className="py-3.5 font-mono text-xs font-bold text-purple-300">${e.amount.toFixed(2)}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                e.status === 'Approved' ? 'bg-green-500/10 text-green-300 border-green-500/20' :
                                e.status === 'Rejected' ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                                'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              }`}>
                                {e.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-[10px] text-white/40 italic max-w-xs truncate">{e.comments || '—'}</td>
                            <td className="py-3.5 text-right">
                              {e.status === 'Pending' ? (
                                <button 
                                  onClick={() => handleDeletePendingExpense(e.id)}
                                  className="px-2 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded text-[9px] uppercase tracking-wide font-black"
                                >
                                  Withdraw
                                </button>
                              ) : (
                                <span className="text-xs text-white/20">—</span>
                              )}
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

export default UserExpenses;
