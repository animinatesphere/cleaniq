import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, UserCheck, 
  FileText, Mail, Phone, MapPin, 
  Calendar, CheckCircle2, XCircle, 
  Clock, Download, ChevronRight, Eye,Users
} from 'lucide-react';

const Applicants = () => {
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/recruitment`);
        const data = await response.json();
        setApplicants(data.map(a => ({
          id: a._id.substring(0, 8),
          name: a.fullName,
          email: a.email,
          phone: a.phone,
          role: a.experience,
          location: a.city,
          appliedDate: new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: a.status,
          docs: (a.cvPath ? 1 : 0) + (a.idPath ? 1 : 0),
          cvUrl: a.cvPath ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/${a.cvPath}` : null,
          idUrl: a.idPath ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/${a.idPath}` : null,
        })));
      } catch (error) {
        console.error('Error fetching applicants:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Interviewing': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Background Check': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Hired': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Total Applicants', value: applicants.length, icon: <Users size={20} className="text-blue-500" /> },
          { title: 'In Review', value: applicants.filter(a => a.status === 'Applied').length, icon: <Clock size={20} className="text-amber-500" /> },
          { title: 'Hired Total', value: applicants.filter(a => a.status === 'Hired').length, icon: <CheckCircle2 size={20} className="text-emerald-500" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-2xl font-black text-primary-dark">{stat.value}</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 group focus-within:border-primary/50 transition-all w-full md:w-96">
            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter size={18} /> Region
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Clock size={18} /> Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="px-8 py-5">Applicant</th>
                <th className="px-4 py-5">Desired Role</th>
                <th className="px-4 py-5">Location</th>
                <th className="px-4 py-5">Status</th>
                <th className="px-4 py-5">Docs</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applicants.map((app) => (
                <tr key={app.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-primary-dark group-hover:text-primary transition-colors">{app.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{app.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-bold text-slate-700">{app.role}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Applied: {app.appliedDate}</p>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                      <MapPin size={14} className="text-slate-400" />
                      {app.location}
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${getStatusStyle(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-1 text-slate-500 font-bold">
                      <FileText size={16} />
                      <span className="text-sm">{app.docs}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedApplicant(app)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <Eye size={18} />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md" onClick={() => setSelectedApplicant(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{selectedApplicant.id}</span>
                <h3 className="text-2xl font-black text-primary-dark tracking-tight">Applicant Profile</h3>
              </div>
              <button 
                onClick={() => setSelectedApplicant(null)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary-dark transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl border-2 border-white shadow-lg">
                  {selectedApplicant.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-primary-dark leading-tight">{selectedApplicant.name}</h4>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{selectedApplicant.role}</p>
                  <div className={`mt-3 inline-flex text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${getStatusStyle(selectedApplicant.status)}`}>
                    {selectedApplicant.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-700">{selectedApplicant.email}</p>
                  </div>
                </div>
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-bold text-slate-700">{selectedApplicant.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedApplicant.cvUrl && (
                    <a 
                      href={selectedApplicant.cvUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 leading-none">Curriculum Vitae (CV)</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">View File</p>
                        </div>
                      </div>
                      <Download size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                    </a>
                  )}
                  {selectedApplicant.idUrl && (
                    <a 
                      href={selectedApplicant.idUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 leading-none">Identity Document</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">View File</p>
                        </div>
                      </div>
                      <Download size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-black text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all uppercase tracking-widest">
                Reject
              </button>
              <button className="flex-1 py-4 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 uppercase tracking-widest">
                Move to Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;
