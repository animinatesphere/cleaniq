import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Filter, UserCheck, FileText, Mail, Phone, MapPin,
  Calendar, CheckCircle2, XCircle, Clock, Download, Users,
  Trash2, RefreshCcw, ShieldCheck, X, Edit3, Save, Hash, Eye
} from 'lucide-react';

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Background Check', 'Hired', 'Rejected'];

const Applicants = () => {
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editData, setEditData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruitment`);
      const data = await response.json();
      setApplicants(data);
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  const handleUpdate = async (dataOverride = null) => {
    try {
      const payload = (dataOverride && !dataOverride.nativeEvent) ? dataOverride : editData;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recruitment/${selectedApplicant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchApplicants();
        setIsEditing(false);
        setSelectedApplicant(null);
        setStatusMessage({ type: 'success', text: 'Applicant profile synced' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to sync profile' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this applicant permanently?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/recruitment/${id}`, { method: 'DELETE' });
      setSelectedApplicant(null);
      fetchApplicants();
      setStatusMessage({ type: 'success', text: 'Applicant deleted' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to delete applicant' });
    }
  };

  const downloadCSV = () => {
    if (applicants.length === 0) return;
    const headers = ['Full Name', 'Email', 'Phone', 'Role/Exp', 'Location', 'Region', 'Status'];
    const rows = filtered.map(a => [
      a.fullName, a.email, a.phone, `"${a.experience?.replace(/"/g, '""')}"`, a.city, a.region, a.status
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `cleaniq_applicants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyle = (status) => {
    const map = {
      'Applied': 'bg-blue-50 text-blue-700 border-blue-100',
      'Interviewing': 'bg-amber-50 text-amber-700 border-amber-100',
      'Background Check': 'bg-purple-50 text-purple-700 border-purple-100',
      'Hired': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Rejected': 'bg-rose-50 text-rose-700 border-rose-100',
    };
    return map[status] || 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const filtered = useMemo(() => {
    return applicants.filter(a =>
      a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [applicants, search]);

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Notifications - Fixed to viewport for maximum visibility */}
      {statusMessage.text && (
        <div 
          className={`fixed top-10 right-10 z-9999 px-8 py-5 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 font-bold text-sm  transition-all duration-500 transform translate-x-0 ${
            statusMessage.type === 'success' 
            ? 'bg-emerald-500 text-white border-emerald-400' 
            : 'bg-rose-500 text-white border-rose-400'
          }`}
        >
          <div className="bg-white/20 p-2 rounded-xl">
            {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          </div>
          {statusMessage.text}
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark tracking-tighter">Recruitment Command</h1>
          <p className="text-slate-400 font-bold text-sm  mt-1">Manage Your Growing Team</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={downloadCSV} className="btn-secondary px-6 py-3 rounded-2xl flex items-center gap-2"><Download size={18}/> Export CSV</button>
          <button 
            onClick={async () => {
              if (window.confirm('⚠️ WIPE APPLICANTS? This cannot be undone.')) {
                await fetch(`${import.meta.env.VITE_API_URL}/recruitment/all/delete`, { method: 'DELETE' });
                fetchApplicants();
              }
            }}
            className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs  hover:bg-rose-100 transition-all border border-rose-100"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: applicants.length, color: 'text-blue-500', icon: <Users size={20} /> },
          { label: 'Hired', value: applicants.filter(a => a.status === 'Hired').length, color: 'text-emerald-500', icon: <CheckCircle2 size={20} /> },
          { label: 'Pending', value: applicants.filter(a => a.status === 'Applied').length, color: 'text-amber-500', icon: <Clock size={20} /> },
          { label: 'UK Region', value: applicants.filter(a => a.region === 'UK').length, color: 'text-primary', icon: <MapPin size={20} /> },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 ">{s.label}</p>
              <h3 className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Search and Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 w-full md:w-96 group focus-within:border-primary/50 transition-all">
            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
            <input type="text" placeholder="Search applicants..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none text-sm font-bold w-full text-slate-700" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400  bg-slate-50/50">
                <th className="px-8 py-5">Applicant Details</th>
                <th className="px-4 py-5">Role / Location</th>
                <th className="px-4 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(a => (
                <tr key={a._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {a.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-primary-dark group-hover:text-primary transition-colors">{a.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{a.email}</p>
                        <p className="text-[10px] text-primary font-bold tracking-widest">{a.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{a.experience}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold  mt-1">
                      <MapPin size={10} /> {a.city} • {a.region}
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border  shadow-sm ${getStatusStyle(a.status || 'Applied')}`}>
                      {a.status || 'Applied'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedApplicant(a); setEditData(a); setIsEditing(false); }} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleDelete(a._id)} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applicant Detail/Edit Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md" onClick={() => setSelectedApplicant(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-white">
            
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center"><UserCheck size={24}/></div>
                <div>
                  <h3 className="text-2xl font-bold text-primary-dark tracking-tighter">{isEditing ? 'Modify Profile' : 'Talent Profile'}</h3>
                  <p className="text-[10px] font-bold text-primary ">Applicant Intelligence</p>
                </div>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-4 uppercase">Full Name</label>
                      <input type="text" value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-4 uppercase">Email</label>
                      <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-4 uppercase">Phone</label>
                      <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-4 uppercase">Status</label>
                      <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold">
                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-4 uppercase">Role / Experience</label>
                    <textarea value={editData.experience} onChange={e => setEditData({...editData, experience: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold h-24 resize-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                      {selectedApplicant.fullName?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-3xl font-bold text-primary-dark tracking-tighter">{selectedApplicant.fullName}</h4>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                        <MapPin size={14} /> {selectedApplicant.city} • {selectedApplicant.region}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400  mb-1">Contact Email</p>
                      <p className="text-sm font-bold text-primary-dark truncate">{selectedApplicant.email}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400  mb-1">Contact Phone</p>
                      <p className="text-sm font-bold text-primary-dark">{selectedApplicant.phone}</p>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 rounded-2xl md:rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400  mb-3">Role Experience / Motivation</h4>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">{selectedApplicant.experience}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedApplicant.cvPath && (
                      <a href={`https://api.cleaniqservices.com/uploads/${selectedApplicant.cvPath.split('/').pop()}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-4 rounded-3xl bg-primary/5 text-primary font-bold uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                        <FileText size={18} /> View Resume
                      </a>
                    )}
                    {selectedApplicant.idPath && (
                      <a href={`https://api.cleaniqservices.com/uploads/${selectedApplicant.idPath.split('/').pop()}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-4 rounded-3xl bg-primary/5 text-primary font-bold uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                        <ShieldCheck size={18} /> View ID Document
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-xs font-bold text-slate-500 ">Discard</button>
                  <button onClick={() => handleUpdate()} className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-bold  shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                    <Save size={18} /> Save Profile
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { if(window.confirm('Reject this applicant?')) handleUpdate({...selectedApplicant, status: 'Rejected'}); }} className="flex-1 py-5 rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold  hover:bg-rose-100 transition-all">Reject</button>
                  <button onClick={() => setIsEditing(true)} className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-bold  shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                    <Edit3 size={18} /> Modify Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;
