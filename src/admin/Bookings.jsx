import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Filter, Download, 
  Eye, Calendar, Clock, MapPin, 
  User, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Trash2, Edit3, Save, X,
  Phone, Mail, Hash, DollarSign, Info
} from 'lucide-react';

const Bookings = () => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editData, setEditData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleDelete = async (id, bookingId) => {
    if (window.confirm(`Are you sure you want to delete booking ${bookingId}?`)) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchBookings();
          if (selectedBooking?._id === id) setSelectedBooking(null);
          setStatusMessage({ type: 'success', text: 'Booking deleted successfully' });
        }
      } catch (error) {
        setStatusMessage({ type: 'error', text: 'Failed to delete booking' });
      }
    }
  };

  const handleUpdate = async (dataOverride = null) => {
    try {
      // Safety check: Ensure we don't accidentally send the click event object
      const payload = (dataOverride && !dataOverride.nativeEvent) ? dataOverride : editData;
      console.log('📡 Syncing Payload:', payload);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${selectedBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server rejected the update');
      }

      fetchBookings();
      setIsEditing(false);
      setSelectedBooking(null);
      setStatusMessage({ type: 'success', text: 'Booking synced successfully' });
    } catch (error) {
      console.error('❌ Sync Error:', error);
      setStatusMessage({ type: 'error', text: `Failed: ${error.message}` });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Confirmed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
      'Completed': 'bg-blue-50 text-blue-600 border-blue-100',
      'Cancelled': 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return colors[status] || 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      b.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bookings, searchTerm]);

  const downloadCSV = () => {
    const headers = ['Booking ID', 'Customer', 'Email', 'Phone', 'Service', 'Date', 'Time Slot', 'Arrival Request', 'Status', 'Amount', 'Address'];
    const rows = filteredBookings.map(b => [
      b.bookingId,
      `${b.customer.firstName} ${b.customer.lastName}`,
      b.customer.email,
      b.customer.phone,
      b.service,
      new Date(b.schedule.date).toLocaleDateString(),
      b.schedule.timeSlot,
      b.schedule.preferredTime || 'Any',
      b.status,
      b.payment.amount,
      `"${b.details.address.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cleaniq_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Notifications - Fixed to viewport for maximum visibility */}
      {statusMessage.text && (
        <div 
          className={`fixed top-10 right-10 z-[9999] px-8 py-5 rounded-[32px] border shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 font-black text-sm uppercase tracking-widest transition-all duration-500 transform translate-x-0 ${
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
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary-dark tracking-tighter">Command Center</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Real-time Booking Oversight</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={downloadCSV} className="btn-secondary px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-200">
            <Download size={18}/> Export CSV
          </button>
          <button 
            onClick={async () => {
              if (window.confirm('⚠️ NUCLEAR OPTION: Delete ALL bookings? This cannot be undone.')) {
                await fetch(`${import.meta.env.VITE_API_URL}/bookings/all/delete`, { method: 'DELETE' });
                fetchBookings();
              }
            }}
            className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 w-full md:w-96 group focus-within:border-primary/50 transition-all">
            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or booking ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold w-full text-slate-700" 
            />
          </div>
          <button className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-primary transition-all ml-auto"><Filter size={20}/></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                <th className="px-8 py-5">Customer / ID</th>
                <th className="px-4 py-5">Service</th>
                <th className="px-4 py-5">Date / Time</th>
                <th className="px-4 py-5">Status</th>
                <th className="px-4 py-5">Amount</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : filteredBookings.map(b => (
                <tr key={b._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                        {b.customer.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-primary-dark group-hover:text-primary transition-colors">{b.customer.firstName} {b.customer.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.bookingId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-bold text-slate-700">{b.service}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{b.details.frequency}</p>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-bold text-slate-700">{new Date(b.schedule.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-tight">{b.schedule.timeSlot} {b.schedule.preferredTime ? `(${b.schedule.preferredTime})` : ''}</p>
                  </td>
                  <td className="px-4 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-tight shadow-sm ${getStatusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-6 font-black text-primary-dark">
                    {b.region === 'UK' ? '£' : '₦'}{b.payment.amount}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedBooking(b); setEditData(b); setIsEditing(false); }}
                        className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b._id, b.bookingId)}
                        className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                      >
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

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-white">
            
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"><Hash size={24}/></div>
                <div>
                  <h3 className="text-2xl font-black text-primary-dark tracking-tighter">{isEditing ? 'Edit Parameters' : 'Entry Intelligence'}</h3>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedBooking.bookingId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {isEditing ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Customer First Name</label>
                      <input type="text" value={editData.customer.firstName} onChange={(e) => setEditData({...editData, customer: {...editData.customer, firstName: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Customer Last Name</label>
                      <input type="text" value={editData.customer.lastName} onChange={(e) => setEditData({...editData, customer: {...editData.customer, lastName: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Phone</label>
                      <input type="text" value={editData.customer.phone} onChange={(e) => setEditData({...editData, customer: {...editData.customer, phone: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Status</label>
                      <select value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold">
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Date</label>
                      <input 
                        type="date" 
                        value={editData.schedule?.date ? editData.schedule.date.split('T')[0] : ''} 
                        onChange={(e) => setEditData({...editData, schedule: {...editData.schedule, date: e.target.value}})} 
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Amount Paid ({editData.region === 'UK' ? '£' : '₦'})</label>
                      <input type="number" value={editData.payment?.amount} onChange={(e) => setEditData({...editData, payment: {...editData.payment, amount: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Time Slot</label>
                      <select value={editData.schedule?.timeSlot} onChange={(e) => setEditData({...editData, schedule: {...editData.schedule, timeSlot: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm">
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Specific Arrival Time</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 9:30 AM"
                        value={editData.schedule?.preferredTime || ''} 
                        onChange={(e) => setEditData({...editData, schedule: {...editData.schedule, preferredTime: e.target.value}})} 
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Full Address</label>
                    <textarea value={editData.details?.address} onChange={(e) => setEditData({...editData, details: {...editData.details, address: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold h-24 resize-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Special Instructions / Notes</label>
                    <textarea 
                      value={editData.details?.notes || ''} 
                      onChange={(e) => setEditData({...editData, details: {...editData.details, notes: e.target.value}})} 
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold h-24 resize-none text-sm" 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                      <Mail size={20} className="text-primary mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Email</p>
                      <p className="text-xs font-bold text-primary-dark truncate">{selectedBooking.customer.email}</p>
                    </div>
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                      <Phone size={20} className="text-primary mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Contact</p>
                      <p className="text-xs font-bold text-primary-dark">{selectedBooking.customer.phone}</p>
                    </div>
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                      <DollarSign size={20} className="text-primary mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Payment</p>
                      <p className="text-xs font-black text-primary-dark">{selectedBooking.region === 'UK' ? '£' : '₦'}{selectedBooking.payment.amount}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Info size={20}/></div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Overview</h4>
                          <p className="font-bold text-primary-dark">{selectedBooking.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Calendar size={20}/></div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointment</h4>
                          <p className="font-bold text-primary-dark">{new Date(selectedBooking.schedule.date).toDateString()}</p>
                          <p className="text-xs text-slate-500 font-medium">Slot: {selectedBooking.schedule.timeSlot} {selectedBooking.schedule.preferredTime ? `(${selectedBooking.schedule.preferredTime})` : ''}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mt-1"><MapPin size={20}/></div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistics</h4>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">{selectedBooking.details.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.details.notes && (
                    <div className="p-8 rounded-[40px] bg-amber-50 border border-amber-100 flex gap-6 items-center">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <Edit3 size={32} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Customer Instructions</h4>
                        <p className="text-sm font-bold text-amber-900 italic leading-relaxed">"{selectedBooking.details.notes}"</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
                  <button onClick={() => handleUpdate()} className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                    <Save size={18} /> Sync Changes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      if(window.confirm('Mark this booking as Cancelled?')){
                        handleUpdate({...selectedBooking, status: 'Cancelled'});
                      }
                    }}
                    className="flex-1 py-5 rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                  >
                    Cancel Booking
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                  >
                    <Edit3 size={18} /> Modify Entry
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

export default Bookings;
