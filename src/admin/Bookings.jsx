import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Filter, Download, 
  Eye, Calendar, Clock, MapPin, 
  User, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Trash2, Edit3, Save, X
} from 'lucide-react';

const Bookings = () => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editData, setEditData] = useState({});

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
        }
      } catch (error) {
        alert('Failed to delete booking');
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${selectedBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        fetchBookings();
        setIsEditing(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      alert('Failed to update booking');
    }
  };

  const downloadCSV = () => {
    if (bookings.length === 0) return;
    const headers = ['Booking ID', 'Customer', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Amount', 'Address', 'Region'];
    const rows = filteredBookings.map(b => [
      b.bookingId, 
      `${b.customer.firstName} ${b.customer.lastName}`, 
      b.customer.email, 
      b.customer.phone, 
      b.service, 
      new Date(b.schedule.date).toLocaleDateString(), 
      b.schedule.timeSlot, 
      b.status, 
      b.payment.amount, 
      `"${b.details.address?.replace(/"/g, '""')}"`, 
      b.region
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `cleaniq_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bookings, searchTerm]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Completed': return 'bg-slate-50 text-slate-700 border-slate-100';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 group focus-within:border-primary/50 transition-all w-full md:w-96">
          <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, or email..." 
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Download size={18} /> Export
          </button>
          <button 
            onClick={async () => {
              if (window.confirm('⚠️ WARNING: This will PERMANENTLY DELETE ALL bookings. Are you 100% sure?')) {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/all/delete`, { method: 'DELETE' });
                if (res.ok) fetchBookings();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-sm font-bold hover:bg-rose-100 transition-all ml-auto md:ml-0"
          >
            <Trash2 size={18} /> Clear All
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="px-8 py-5">Customer Details</th>
                <th className="px-4 py-5">Service / Date</th>
                <th className="px-4 py-5">Status</th>
                <th className="px-4 py-5">Amount</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-primary-dark group-hover:text-primary transition-colors">{b.customer.firstName} {b.customer.lastName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{b.customer.email}</p>
                      <div className="flex gap-2 items-center">
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest">{b.bookingId}</p>
                        <span className="text-slate-300">•</span>
                        <p className="text-[10px] text-slate-600 font-black tracking-widest">{b.customer.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-bold text-slate-700">{b.service}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(b.schedule.date).toLocaleDateString()} at {b.schedule.timeSlot}</p>
                  </td>
                  <td className="px-4 py-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${getStatusStyle(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-6 font-black text-primary-dark">
                    {b.region === 'UK' ? '£' : '₦'}{b.payment.amount}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedBooking(b);
                          setEditData(b);
                          setIsEditing(false);
                        }}
                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b._id, b.bookingId)}
                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
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

      {/* Detail & Edit Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{selectedBooking.bookingId}</span>
                <h3 className="text-2xl font-black text-primary-dark tracking-tight">
                  {isEditing ? 'Edit Booking' : 'Booking Details'}
                </h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Booking Status</label>
                      <select 
                        value={editData.status}
                        onChange={(e) => setEditData({...editData, status: e.target.value})}
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Date</label>
                      <input 
                        type="date"
                        value={editData.schedule.date.split('T')[0]}
                        onChange={(e) => setEditData({...editData, schedule: {...editData.schedule, date: e.target.value}})}
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Address</label>
                    <textarea 
                      value={editData.details.address}
                      onChange={(e) => setEditData({...editData, details: {...editData.details, address: e.target.value}})}
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold h-24"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer</h4>
                      <p className="font-bold text-primary-dark">{selectedBooking.customer.firstName} {selectedBooking.customer.lastName}</p>
                      <p className="text-sm text-slate-500">{selectedBooking.customer.email}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service</h4>
                      <p className="font-bold text-primary-dark">{selectedBooking.service}</p>
                      <p className="text-sm text-slate-500">{selectedBooking.details.frequency}</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-primary" />
                      <span className="text-sm font-bold text-primary-dark">{new Date(selectedBooking.schedule.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-primary" />
                      <span className="text-sm font-bold text-primary-dark">{selectedBooking.schedule.timeSlot}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-primary mt-1" />
                    <p className="text-sm font-bold text-slate-600">{selectedBooking.details.address}</p>
                  </div>
                  {selectedBooking.details.notes && (
                    <div className="p-6 rounded-[32px] bg-amber-50 border border-amber-100 space-y-2">
                      <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Customer Notes / Instructions</h4>
                      <p className="text-sm font-bold text-amber-900 leading-relaxed italic">"{selectedBooking.details.notes}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-500 uppercase">Cancel</button>
                  <button onClick={handleUpdate} className="flex-1 py-4 rounded-2xl bg-primary text-white text-sm font-black uppercase shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    <Save size={18} /> Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleDelete(selectedBooking._id, selectedBooking.bookingId)}
                    className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={24} />
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-4 rounded-2xl bg-primary text-white text-sm font-black uppercase shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} /> Edit Booking
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
