import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, UserCheck, FileText, Mail, Phone, MapPin,
  Calendar, CheckCircle2, XCircle, Clock, Download, Users,
  Trash2, RefreshCcw, ShieldCheck, X
} from 'lucide-react';

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Background Check', 'Hired', 'Rejected'];

const Applicants = () => {
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruitment`);
      const data = await response.json();
      setApplicants(data.map(a => ({
        originalId: a._id,
        id: a._id.substring(0, 8).toUpperCase(),
        name: a.fullName,
        email: a.email,
        phone: a.phone,
        role: a.experience,
        region: a.region,
        location: a.city,
        appliedDate: new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: a.status || 'Applied',
        cv: a.cvPath ? a.cvPath.split('/').pop() : null,
        idDoc: a.idPath ? a.idPath.split('/').pop() : null,
      })));
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  const handleUpdateStatus = async (originalId, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recruitment/${originalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchApplicants();
        setSelectedApplicant(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (originalId) => {
    if (!window.confirm('Delete this applicant permanently?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/recruitment/${originalId}`, { method: 'DELETE' });
      setSelectedApplicant(null);
      fetchApplicants();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const downloadCSV = () => {
    if (applicants.length === 0) return;
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Experience', 'Location', 'Region', 'Applied Date', 'Status'];
    const rows = applicants.map(a => [
      a.id, a.name, a.email, a.phone, `"${a.role?.replace(/"/g, '""')}"`, a.location, a.region, a.appliedDate, a.status
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

  const filtered = applicants.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: applicants.length, color: 'text-blue-500', icon: <Users size={20} /> },
          { label: 'Applied', value: applicants.filter(a => a.status === 'Applied').length, color: 'text-amber-500', icon: <Clock size={20} /> },
          { label: 'Interviewing', value: applicants.filter(a => a.status === 'Interviewing').length, color: 'text-purple-500', icon: <UserCheck size={20} /> },
          { label: 'Hired', value: applicants.filter(a => a.status === 'Hired').length, color: 'text-emerald-500', icon: <CheckCircle2 size={20} /> },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h3 className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/30">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 w-full md:w-96">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium w-full text-slate-700"
            />
          </div>
          <div className="flex gap-3 ml-auto">
            <button onClick={fetchApplicants} className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">
              <RefreshCcw size={18} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={downloadCSV} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="px-8 py-5">Applicant</th>
                <th className="px-4 py-5">Role / Experience</th>
                <th className="px-4 py-5">Region</th>
                <th className="px-4 py-5">Applied</th>
                <th className="px-4 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <RefreshCcw size={28} className="animate-spin mx-auto mb-4" /> Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                  No applicants found.
                </td></tr>
              ) : filtered.map(a => (
                <tr key={a.originalId} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                        {a.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-primary-dark">{a.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{a.email}</p>
                        <p className="text-[10px] text-primary font-black">{a.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6 text-sm font-medium text-slate-600 max-w-[160px] truncate">{a.role}</td>
                  <td className="px-4 py-6">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${a.region === 'UK' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {a.region || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-6 text-sm font-medium text-slate-500">{a.appliedDate}</td>
                  <td className="px-4 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-tight ${getStatusStyle(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => setSelectedApplicant(a)} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-primary-dark hover:bg-primary hover:text-white hover:border-primary transition-all">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedApplicant(null)}>
          <div className="bg-white rounded-[48px] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-primary-dark">Applicant Profile</h3>
              <button onClick={() => setSelectedApplicant(null)} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl">
                  {selectedApplicant.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-primary-dark">{selectedApplicant.name}</h4>
                  <p className="text-slate-400 text-sm font-bold">{selectedApplicant.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Mail size={14} />, label: 'Email', val: selectedApplicant.email },
                  { icon: <Phone size={14} />, label: 'Phone', val: selectedApplicant.phone },
                  { icon: <MapPin size={14} />, label: 'Region', val: selectedApplicant.region },
                  { icon: <Calendar size={14} />, label: 'Applied', val: selectedApplicant.appliedDate },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">{item.icon}<span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span></div>
                    <p className="text-sm font-bold text-primary-dark truncate">{item.val}</p>
                  </div>
                ))}
              </div>

              {/* Documents */}
              <div className="grid grid-cols-2 gap-4">
                {selectedApplicant.cv && (
                  <a href={`https://api.cleaniqservices.com/uploads/${selectedApplicant.cv}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary font-black text-sm hover:bg-primary hover:text-white transition-all">
                    <FileText size={18} /> View CV
                  </a>
                )}
                {selectedApplicant.idDoc && (
                  <a href={`https://api.cleaniqservices.com/uploads/${selectedApplicant.idDoc}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary font-black text-sm hover:bg-primary hover:text-white transition-all">
                    <ShieldCheck size={18} /> View ID
                  </a>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(status => (
                    <button key={status} onClick={() => handleUpdateStatus(selectedApplicant.originalId, status)}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        selectedApplicant.status === status
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-primary/30'
                      }`}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button onClick={() => handleDelete(selectedApplicant.originalId)}
                className="w-full py-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all">
                <Trash2 size={16} /> Delete Applicant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;
