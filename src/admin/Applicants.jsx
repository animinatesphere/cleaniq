import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, UserCheck, FileText, Mail, Phone, MapPin,
  CheckCircle2, XCircle, Clock, Download, Users,
  Trash2, ShieldCheck, X, Edit3, Save, UserPlus,
  FileCheck, AlertTriangle,
} from 'lucide-react';
import StatDetailDrawer from "./StatDetailDrawer";

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Background Check', 'Hired', 'Rejected'];

const DOC_URL = (p) => p ? `https://api.cleaniqservices.com/${p.replace(/\\/g, '/')}` : null;

const DocLink = ({ path, label, icon: Icon }) => {
  const url = DOC_URL(path);
  if (!url) return (
    <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/25 text-xs font-bold">
      <AlertTriangle size={14} /> {label} — Not uploaded
    </div>
  );
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all">
      <Icon size={14} /> View {label}
    </a>
  );
};

const Applicants = () => {
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editData, setEditData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [hiring, setHiring] = useState(false);
  const [drawer, setDrawer] = useState(null);

  useEffect(() => {
    if (statusMessage.text) {
      const t = setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(t);
    }
  }, [statusMessage]);

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recruitment`);
      setApplicants(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  const handleUpdate = async (dataOverride = null) => {
    try {
      const payload = (dataOverride && !dataOverride.nativeEvent) ? dataOverride : editData;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recruitment/${selectedApplicant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchApplicants();
        setIsEditing(false);
        setSelectedApplicant(null);
        setStatusMessage({ type: 'success', text: 'Applicant profile updated' });
      }
    } catch { setStatusMessage({ type: 'error', text: 'Failed to update profile' }); }
  };

  const handleHire = async () => {
    if (!window.confirm(`Hire ${selectedApplicant.fullName}?\n\nThis will:\n• Create a worker account with login credentials\n• Send the login email to ${selectedApplicant.email}\n• Mark the application as Hired`)) return;
    setHiring(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recruitment/${selectedApplicant._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Hired' }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchApplicants();
        setSelectedApplicant(null);
        setStatusMessage({ type: 'success', text: `✅ ${selectedApplicant.fullName} hired! Worker account created & login email sent.` });
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Hire failed' });
      }
    } catch { setStatusMessage({ type: 'error', text: 'Network error during hire' }); }
    finally { setHiring(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this applicant permanently?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/recruitment/${id}`, { method: 'DELETE' });
      setSelectedApplicant(null);
      fetchApplicants();
      setStatusMessage({ type: 'success', text: 'Applicant deleted' });
    } catch { setStatusMessage({ type: 'error', text: 'Delete failed' }); }
  };

  const downloadCSV = () => {
    if (!filtered.length) return;
    const headers = ['Full Name', 'Email', 'Phone', 'Experience', 'City', 'Region', 'Status', 'Right to Work Code'];
    const rows = filtered.map(a => [
      `"${a.fullName}"`, a.email, a.phone || '',
      `"${(a.experience || '').replace(/"/g, '""')}"`,
      a.city || '', a.region || '', a.status || '', a.rightToWorkCode || '',
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `cleaniq_applicants_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getStatusStyle = (s) => ({
    Applied: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    Pending: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    Interviewing: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    'Background Check': 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    Hired: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    Rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  }[s] || 'bg-white/10 text-white/60 border-white/10');

  const docScore = (a) => [a.cvPath, a.idPath, a.rightToWorkPath, a.dbsCheckPath].filter(Boolean).length;

  const filtered = useMemo(() => applicants.filter(a =>
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  ), [applicants, search]);

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Toast */}
      {statusMessage.text && (
        <div className={`fixed top-10 right-10 z-9999 px-8 py-5 rounded-2xl border shadow-2xl flex items-center gap-4 font-bold text-sm transition-all ${
          statusMessage.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          {statusMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0B2D22] p-6 md:p-8 rounded-2xl border border-white/7 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter">Recruitment</h1>
          <p className="text-white/40 font-bold text-sm mt-1">Review applications & hire workers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={downloadCSV} className="bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl font-bold text-sm px-6 py-3 flex items-center gap-2 transition-all">
            <Download size={18}/> Export CSV
          </button>
          <button onClick={async () => {
            if (window.confirm('⚠️ Delete ALL applicants? This cannot be undone.')) {
              await fetch(`${import.meta.env.VITE_API_URL}/recruitment/all/delete`, { method: 'DELETE' });
              fetchApplicants();
            }
          }} className="px-6 py-3 bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 rounded-xl font-bold text-xs transition-all">
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: applicants.length, color: 'text-blue-400', icon: <Users size={20}/> },
          { label: 'Hired', value: applicants.filter(a => a.status === 'Hired').length, color: 'text-emerald-400', icon: <CheckCircle2 size={20}/> },
          { label: 'Pending Review', value: applicants.filter(a => ['Applied','Pending','Interviewing','Background Check'].includes(a.status)).length, color: 'text-amber-400', icon: <Clock size={20}/> },
          { label: 'Rejected', value: applicants.filter(a => a.status === 'Rejected').length, color: 'text-rose-400', icon: <XCircle size={20}/> },
        ].map((s, i) => {
          const drawerItems =
            s.label === 'Total' ? applicants
            : s.label === 'Hired' ? applicants.filter(a => a.status === 'Hired')
            : s.label === 'Pending Review' ? applicants.filter(a => ['Applied','Pending','Interviewing','Background Check'].includes(a.status))
            : applicants.filter(a => a.status === 'Rejected');
          const drawerColor =
            s.label === 'Hired' ? 'emerald'
            : s.label === 'Rejected' ? 'rose'
            : s.label === 'Pending Review' ? 'amber'
            : 'blue';
          return (
            <div
              key={i}
              className="bg-[#0B2D22] p-6 rounded-2xl border border-white/7 flex items-center justify-between cursor-pointer"
              onClick={() => setDrawer({
                title: s.label === 'Total' ? 'All Applicants' : `${s.label} Applicants`,
                subtitle: `${s.value} applicant${s.value !== 1 ? 's' : ''}`,
                items: drawerItems,
                renderItem: (a) => (
                  <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-white/50">
                        {(a.fullName||"?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/85 truncate">{a.fullName}</p>
                      <p className="text-xs text-white/40 truncate">{a.email} · {a.appliedFor || "Cleaner"}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-400 shrink-0">{a.status}</span>
                  </div>
                ),
                accentColor: drawerColor,
              })}
            >
              <div>
                <p className="text-[10px] font-bold text-white/40">{s.label}</p>
                <h3 className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</h3>
              </div>
              <div className="p-3 bg-white/[0.03] rounded-2xl">{s.icon}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/7 flex items-center gap-4 bg-white/[0.03]">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 w-full md:w-96 group focus-within:border-emerald-500/50 transition-all">
            <Search size={18} className="text-white/40 group-focus-within:text-emerald-400 transition-colors"/>
            <input type="text" placeholder="Search applicants..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold w-full text-white/80 placeholder:text-white/20"/>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-white/40 font-bold text-sm">Loading applicants…</div>
        ) : !filtered.length ? (
          <div className="p-12 text-center text-white/40 font-bold text-sm">No applicants found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white/40 text-xs font-semibold uppercase tracking-wide bg-white/[0.03]">
                  <th className="px-8 py-5">Applicant</th>
                  <th className="px-4 py-5">Documents</th>
                  <th className="px-4 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(a => (
                  <tr key={a._id} className="group hover:bg-white/[0.04] transition-colors cursor-pointer border-b border-white/[0.04]" onClick={() => { setSelectedApplicant(a); setEditData(a); setIsEditing(false); }}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">
                          {a.fullName?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{a.fullName}</p>
                            {a.source === 'Website' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-blue-500/15 text-blue-400 border border-blue-500/25">
                                Website
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/40 font-bold">{a.email}</p>
                          <p className="text-[10px] text-emerald-400 font-bold">{a.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { path: a.idPath, label: 'ID' },
                          { path: a.rightToWorkPath, label: 'RTW' },
                          { path: a.dbsCheckPath, label: 'DBS' },
                          { path: a.cvPath, label: 'CV' },
                        ].map(d => (
                          <span key={d.label} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${d.path ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-white/25 border-white/10'}`}>
                            {d.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border shadow-sm ${getStatusStyle(a.status || 'Applied')}`}>
                        {a.status || 'Applied'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(a._id); }}
                          className="p-3 rounded-xl bg-white/5 text-white/40 hover:bg-rose-500/15 hover:text-rose-400 transition-all">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Edit Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedApplicant(null); setIsEditing(false); }}/>
          <div className="relative w-full max-w-2xl bg-[#0B2D22] rounded-2xl shadow-2xl overflow-hidden border border-white/10">

            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
                  <UserCheck size={24}/>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{isEditing ? 'Edit Application' : 'Application Review'}</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide">
                    Applied {new Date(selectedApplicant.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={() => { setSelectedApplicant(null); setIsEditing(false); }}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-rose-400 transition-colors">
                <X size={20}/>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', key: 'fullName', type: 'text' },
                      { label: 'Email', key: 'email', type: 'email' },
                      { label: 'Phone', key: 'phone', type: 'text' },
                      { label: 'City', key: 'city', type: 'text' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase">{f.label}</label>
                        <input type={f.type} value={editData[f.key] || ''} onChange={e => setEditData({ ...editData, [f.key]: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:border-emerald-500/50 focus:outline-none"/>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase">Status</label>
                    <select value={editData.status || 'Applied'} onChange={e => setEditData({ ...editData, status: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:border-emerald-500/50 focus:outline-none">
                      {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase">Experience / Notes</label>
                    <textarea value={editData.experience || ''} onChange={e => setEditData({ ...editData, experience: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm h-24 resize-none focus:border-emerald-500/50 focus:outline-none"/>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile */}
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-2xl font-bold">
                      {selectedApplicant.fullName?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-white">{selectedApplicant.fullName}</h4>
                      <p className="text-sm text-white/40">{selectedApplicant.city} · {selectedApplicant.region}</p>
                      <span className={`mt-1 inline-block px-3 py-1 rounded-lg text-[10px] font-bold border ${getStatusStyle(selectedApplicant.status)}`}>
                        {selectedApplicant.status}
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/7">
                      <p className="text-[10px] font-bold text-white/40 mb-1">Email</p>
                      <p className="text-sm font-bold text-white/80 break-all">{selectedApplicant.email}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/7">
                      <p className="text-[10px] font-bold text-white/40 mb-1">Phone</p>
                      <p className="text-sm font-bold text-white/80">{selectedApplicant.phone || '—'}</p>
                    </div>
                  </div>

                  {/* Right to Work code */}
                  {selectedApplicant.rightToWorkCode && (
                    <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/25">
                      <p className="text-[10px] font-bold text-amber-400 mb-1">RIGHT TO WORK SHARE CODE</p>
                      <p className="text-base font-bold tracking-widest text-amber-300">{selectedApplicant.rightToWorkCode}</p>
                      <a href={`https://www.gov.uk/prove-right-to-work`} target="_blank" rel="noreferrer"
                        className="text-[10px] text-amber-400 underline mt-1 inline-block">Verify on gov.uk →</a>
                    </div>
                  )}

                  {/* Experience */}
                  {selectedApplicant.experience && (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/7">
                      <p className="text-[10px] font-bold text-white/40 mb-2">Experience</p>
                      <p className="text-sm font-bold text-white/60 leading-relaxed">{selectedApplicant.experience}</p>
                    </div>
                  )}

                  {/* Documents */}
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase mb-3">Uploaded Documents</p>
                    <div className="space-y-2">
                      <DocLink path={selectedApplicant.idPath} label="UK Identity Document" icon={ShieldCheck}/>
                      <DocLink path={selectedApplicant.rightToWorkPath} label="Right to Work Document" icon={FileCheck}/>
                      <DocLink path={selectedApplicant.dbsCheckPath} label="DBS Check Certificate" icon={ShieldCheck}/>
                      <DocLink path={selectedApplicant.cvPath} label="CV / Resume" icon={FileText}/>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedApplicant.additionalNotes && (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/7">
                      <p className="text-[10px] font-bold text-white/40 mb-2">Additional Notes</p>
                      <p className="text-sm text-white/60">{selectedApplicant.additionalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 bg-white/[0.03] flex gap-3 flex-wrap">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/40">
                    Discard
                  </button>
                  <button onClick={() => handleUpdate()} className="flex-1 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all">
                    <Save size={16}/> Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { if (window.confirm('Reject this applicant?')) handleUpdate({ ...selectedApplicant, status: 'Rejected' }); }}
                    className="px-5 py-4 bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 rounded-xl text-xs font-bold transition-all">
                    Reject
                  </button>
                  <button onClick={() => setIsEditing(true)}
                    className="px-5 py-4 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                    <Edit3 size={14}/> Edit
                  </button>
                  {selectedApplicant.status !== 'Hired' && (
                    <button onClick={handleHire} disabled={hiring}
                      className="flex-1 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                      {hiring ? 'Creating account…' : <><UserPlus size={16}/> Hire & Create Worker Account</>}
                    </button>
                  )}
                  {selectedApplicant.status === 'Hired' && (
                    <div className="flex-1 py-4 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 size={16}/> Worker account already created
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <StatDetailDrawer
        isOpen={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.title || ""}
        subtitle={drawer?.subtitle || ""}
        items={drawer?.items || []}
        renderItem={drawer?.renderItem}
        onViewAll={drawer?.onViewAll}
        accentColor={drawer?.accentColor || "emerald"}
      />
    </div>
  );
};

export default Applicants;
