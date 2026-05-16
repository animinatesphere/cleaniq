import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Eye, Hash, MapPin, Clock, Car, Info, Home as HomeIcon, Zap, Mail, Phone, DollarSign, Database, X, Trash2, Edit3, Save, Plus, Minus, Download, Calendar as CalIcon, ShieldAlert, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';

const AdminCalendar = ({ bookings, onToggleDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const days = [];
  const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const startDay = startDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return bookings.filter(b => {
      if (!b.schedule?.date) return false;
      const bDate = new Date(b.schedule.date);
      const bStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}-${String(bDate.getDate()).padStart(2, '0')}`;
      return bStr === dStr;
    });
  };

  return (
    <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm animate-in fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-2xl font-black text-primary-dark tracking-tighter">
            {currentMonth.toLocaleString('default', { month: 'long' })} <span className="text-primary">{currentMonth.getFullYear()}</span>
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Click any date to Block/Unblock</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200"><ChevronLeft size={20} /></button>
          <button onClick={handleNextMonth} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200"><ChevronRight size={20} /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] font-black text-slate-300 uppercase text-center py-2">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-3">
        {days.map((date, i) => {
          const dayBookings = getBookingsForDate(date);
          const isBlocked = dayBookings.some(b => b.status === 'Blackout' || b.customer?.firstName === 'ADMIN_BLOCK');
          const hasBookings = dayBookings.some(b => b.status !== 'Blackout' && b.customer?.firstName !== 'ADMIN_BLOCK');

          return (
            <div key={i} className="aspect-square">
              {date ? (
                <button
                  onClick={() => onToggleDate(date, isBlocked)}
                  className={`w-full h-full rounded-[24px] flex flex-col items-center justify-center transition-all relative border-2 group
                    ${isBlocked ? 'bg-rose-50 border-rose-200 text-rose-500' : hasBookings ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400 hover:border-primary/30'}
                  `}
                >
                  <span className="text-sm font-black">{date.getDate()}</span>
                  {isBlocked && <span className="text-[7px] font-black uppercase absolute bottom-2">Blocked</span>}
                  {hasBookings && !isBlocked && <span className="text-[7px] font-black uppercase absolute bottom-2">{dayBookings.length} Bookings</span>}
                </button>
              ) : <div className="w-full h-full" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Bookings = () => {
  const [view, setView] = useState('list'); // 'list' or 'availability'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editData, setEditData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

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
    } catch (error) { console.error('Error fetching bookings:', error); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const toggleAvailability = async (date, isCurrentlyBlocked) => {
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (isCurrentlyBlocked) {
      const block = bookings.find(b => {
        if (b.customer?.firstName !== 'ADMIN_BLOCK') return false;
        const bDate = new Date(b.schedule.date);
        return `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}-${String(bDate.getDate()).padStart(2, '0')}` === dStr;
      });
      if (block) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/bookings/${block._id}`, { method: 'DELETE' });
          setStatusMessage({ type: 'success', text: `Unlocked ${dStr}` });
          fetchBookings();
        } catch (e) { console.error(e); }
      }
    } else {
      const payload = {
        bookingId: `LOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: { firstName: 'ADMIN_BLOCK', lastName: 'SYSTEM', email: 'admin@cleaniq.com', phone: '000' },
        service: 'Availability Block',
        status: 'Blackout',
        schedule: { date: dStr, timeSlot: 'All Day' },
        payment: { amount: 0, status: 'N/A' }
      };
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setStatusMessage({ type: 'success', text: `Blocked ${dStr}` });
        fetchBookings();
      } catch (e) { console.error(e); }
    }
  };

  const handleDelete = async (id, bookingId) => {
    if (window.confirm(`Are you sure you want to delete booking ${bookingId}?`)) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchBookings();
          if (selectedBooking?._id === id) setSelectedBooking(null);
          setStatusMessage({ type: 'success', text: 'Booking deleted successfully' });
        }
      } catch (error) { setStatusMessage({ type: 'error', text: 'Failed to delete booking' }); }
    }
  };

  const handleUpdate = async (dataOverride = null) => {
    try {
      const payload = (dataOverride && !dataOverride.nativeEvent) ? dataOverride : editData;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${selectedBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Server rejected the update');
      fetchBookings();
      setIsEditing(false);
      setSelectedBooking(null);
      setStatusMessage({ type: 'success', text: 'Booking synced successfully' });
    } catch (error) { setStatusMessage({ type: 'error', text: `Failed: ${error.message}` }); }
  };

  const exportToCSV = () => {
    const headers = ['Booking ID', 'Customer', 'Email', 'Phone', 'Service', 'Date', 'Time Slot', 'Price', 'Currency', 'Status', 'Address'];
    const rows = bookings.filter(b => b.status !== 'Blackout').map(b => [
      b.bookingId,
      `${b.customer?.firstName} ${b.customer?.lastName}`,
      b.customer?.email,
      b.customer?.phone,
      b.service,
      new Date(b.schedule?.date).toLocaleDateString(),
      b.schedule?.timeSlot,
      b.payment?.amount,
      b.payment?.currency,
      b.status,
      b.details?.address?.replace(/,/g, ' ')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CleanIQ_Bookings_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      b.status !== 'Blackout' && (
        b.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [bookings, searchTerm]);

  const getStatusColor = (status) => {
    const colors = { 'Confirmed': 'bg-emerald-50 text-emerald-600 border-emerald-100', 'Pending': 'bg-amber-50 text-amber-600 border-amber-100', 'Completed': 'bg-blue-50 text-blue-600 border-blue-100', 'Cancelled': 'bg-rose-50 text-rose-600 border-rose-100' };
    return colors[status] || 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const getPropertyData = (b) => {
    if (!b) return {};
    const data = {};
    const extras = b.details?.extras;
    const roomNames = ['Bedroom', 'Bathroom', 'Cloakroom', 'Kitchen', 'Utility Room', 'Reception Room', 'Conservatory', 'Living Room'];
    
    if (Array.isArray(extras)) {
      extras.forEach(item => {
        if (typeof item === 'string') {
          roomNames.forEach(rn => {
            if (item.toLowerCase().includes(rn.toLowerCase())) {
              const qtyMatch = item.match(/\(x(\d+)\)/);
              data[rn] = qtyMatch ? parseInt(qtyMatch[1]) : 1;
            }
          });
        }
      });
    }
    return data;
  };

  const getExtrasData = (b) => {
    if (!b) return {};
    const data = {};
    const extras = b.details?.extras;
    const roomNames = ['Bedroom', 'Bathroom', 'Cloakroom', 'Kitchen', 'Utility Room', 'Reception Room', 'Conservatory', 'Living Room', 'Parking', 'Entry', 'Pet on premises', 'Instructions'];
    
    if (Array.isArray(extras)) {
      extras.forEach(item => {
        if (typeof item === 'string') {
          const isRoomOrLogistics = roomNames.some(rn => item.toLowerCase().includes(rn.toLowerCase()));
          if (!isRoomOrLogistics) {
            const name = item.split(' (x')[0];
            const qtyMatch = item.match(/\(x(\d+)\)/);
            data[name] = qtyMatch ? parseInt(qtyMatch[1]) : 1;
          }
        }
      });
    }
    return data;
  };

  const getPetInfo = (b) => {
    if (!b) return null;
    if (Array.isArray(b.details?.extras)) {
      const petEntry = b.details.extras.find(e => typeof e === 'string' && e.toLowerCase().startsWith('pet on premises:'));
      if (petEntry) return petEntry.split(':')[1]?.trim() || null;
    }
    return null;
  };

  const getNotes = (b) => {
    if (!b) return '';
    const baseNotes = b.details?.notes || b.notes || b.meta?.notes || b.specialInstructions || '';
    if (baseNotes) return baseNotes;
    
    if (Array.isArray(b.details?.extras)) {
      const noteTag = b.details.extras.find(e => typeof e === 'string' && (e.includes('Instructions:') || e.includes('DATA_NOTES:') || e.includes('📝 NOTE:')));
      if (noteTag) return noteTag.split(':')[1].trim();
    }
    return '';
  };

  // Search every possible path the preferredTime could have been saved
  const getPreferredTime = (b) => {
    if (!b) return '';
    return b.schedule?.preferredTime 
      || b.details?.preferredTime 
      || b.meta?.preferredTime 
      || b.preferredTime 
      || '';
  };

  const getLogistics = (b) => {
    if (!b) return { parking: 'Not specified', access: 'Not specified' };
    let parking = b.details?.parking || b.parking || 'Not specified';
    let access = b.details?.keyAccess || b.keyAccess || 'Not specified';
    if (Array.isArray(b.details?.extras)) {
      const pTag = b.details.extras.find(e => typeof e === 'string' && (e.includes('DATA_PARKING:') || e.includes('🚗 PARKING:')));
      const aTag = b.details.extras.find(e => typeof e === 'string' && (e.includes('DATA_ACCESS:') || e.includes('🔑 ACCESS:')));
      if (pTag) parking = pTag.split(':')[1].trim();
      if (aTag) access = aTag.split(':')[1].trim();
    }
    return { parking, access };
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {statusMessage.text && (
        <div className="fixed top-10 right-10 z-100 px-8 py-5 rounded-[32px] border shadow-2xl bg-primary-dark text-white font-black text-sm uppercase tracking-widest animate-in slide-in-from-right">
          {statusMessage.text}
        </div>
      )}

      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary-dark tracking-tighter">Command Center</h1>
          <div className="flex gap-4 mt-2">
            <button onClick={() => setView('list')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${view === 'list' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>Booking List</button>
            <button onClick={() => setView('availability')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${view === 'availability' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>Manage Availability</button>
          </div>
        </div>
        <div className="flex gap-3">
          {view === 'list' && <button onClick={exportToCSV} className="p-4 px-8 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all font-black text-[10px] uppercase tracking-widest border border-slate-200 flex items-center gap-2"><Download size={16}/> Export CSV</button>}
          <button onClick={fetchBookings} className="p-4 px-8 rounded-2xl bg-primary text-white hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest border-none shadow-lg shadow-primary/20">Refresh Data</button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 w-full md:w-96">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Search bookings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent outline-none text-sm font-bold w-full" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-8 py-5">Customer</th>
                  <th className="px-4 py-5">Service</th>
                  <th className="px-4 py-5">Date</th>
                  <th className="px-4 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center font-black text-slate-400 uppercase tracking-widest">Loading...</td></tr>
                ) : filteredBookings.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center font-black text-slate-300 uppercase tracking-widest">No matching entries</td></tr>
                ) : filteredBookings.map(b => (
                  <tr key={b._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-primary-dark">{b.customer?.firstName} {b.customer?.lastName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.bookingId}</p>
                    </td>
                    <td className="px-4 py-6">
                      <p className="text-sm font-bold text-slate-700">{b.service}</p>
                      <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{getPropertyData(b)['Bedroom'] || 0} Bed • {b.details?.duration || 0}h Clean</p>
                    </td>
                    <td className="px-4 py-6 text-sm font-bold text-slate-700">
                      {new Date(b.schedule?.date).toLocaleDateString()}<br/>
                      <span className="text-[10px] text-primary uppercase">{b.schedule?.timeSlot}</span>
                    </td>
                    <td className="px-4 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-tight ${getStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedBooking(b); setEditData(b); setIsEditing(false); setShowRaw(false); }} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"><Eye size={18} /></button>
                        <button onClick={() => handleDelete(b._id, b.bookingId)} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminCalendar bookings={bookings} onToggleDate={toggleAvailability} />
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden border-4 border-white flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg"><Hash size={24}/></div>
                <div><h3 className="text-2xl font-black text-primary-dark tracking-tighter">{isEditing ? 'Edit Parameters' : 'Entry Intelligence'}</h3><p className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedBooking.bookingId}</p></div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {isEditing ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase">First Name</label><input type="text" value={editData.customer?.firstName || ''} onChange={(e) => setEditData({...editData, customer: {...editData.customer, firstName: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Last Name</label><input type="text" value={editData.customer?.lastName || ''} onChange={(e) => setEditData({...editData, customer: {...editData.customer, lastName: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Phone</label><input type="text" value={editData.customer?.phone || ''} onChange={(e) => setEditData({...editData, customer: {...editData.customer, phone: e.target.value}})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Status</label><select value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"><option value="Confirmed">Confirmed</option><option value="Pending">Pending</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></div>
                  </div>
                  <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-black text-primary-dark uppercase tracking-widest">Pricing & Logistics</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Total Price ({editData.payment?.currency})</label><div className="relative"><DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"/><input type="number" value={editData.payment?.amount || 0} onChange={(e) => setEditData({...editData, payment: {...editData.payment, amount: parseFloat(e.target.value)}})} className="w-full p-4 pl-10 rounded-2xl bg-white border border-slate-200 font-black text-lg" /></div></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Booking Date</label><input type="date" value={editData.schedule?.date ? new Date(editData.schedule.date).toISOString().split('T')[0] : ''} onChange={(e) => setEditData({...editData, schedule: {...editData.schedule, date: e.target.value}})} className="w-full p-4 rounded-2xl bg-white border border-slate-200 font-bold" /></div>
                    </div>
                    <div className="space-y-1 pt-4"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Special Instructions</label><textarea value={getNotes(editData)} onChange={(e) => setEditData({...editData, details: {...editData.details, notes: e.target.value}})} className="w-full p-4 rounded-xl bg-white border border-slate-200 font-bold text-xs h-24 resize-none" /></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center"><Mail size={20} className="text-primary mx-auto mb-2" /><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Email</p><p className="text-xs font-bold text-primary-dark truncate">{selectedBooking.customer?.email}</p></div>
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center"><Phone size={20} className="text-primary mx-auto mb-2" /><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Contact</p><p className="text-xs font-bold text-primary-dark">{selectedBooking.customer?.phone}</p></div>
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center"><DollarSign size={20} className="text-primary mx-auto mb-2" /><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Payment</p><p className="text-xs font-black text-primary-dark">{selectedBooking.payment?.currency === 'GBP' ? '£' : '₦'}{selectedBooking.payment?.amount}</p></div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mt-1 shrink-0"><MapPin size={20}/></div><div><h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Address</h4><p className="font-bold text-primary-dark leading-tight">{selectedBooking.details?.address}</p></div></div>
                      <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><Clock size={20}/></div><div><h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration & Arrival Timing</h4><p className="font-bold text-primary-dark">{selectedBooking.details?.duration || 0}h Clean ({selectedBooking.service})</p><p className="text-[11px] font-black text-slate-500 uppercase mt-1">Slot: {{ 'Morning': 'Morning (8am – 12pm)', 'Afternoon': 'Afternoon (12pm – 4pm)', 'Evening': 'Evening (4pm – 8pm)' }[selectedBooking.schedule?.timeSlot] || selectedBooking.schedule?.timeSlot || 'Not set'}</p><p className="text-[11px] font-black text-primary uppercase mt-1">Requested Arrival: {getPreferredTime(selectedBooking) || 'Not specified'}</p></div></div>
                      <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 mt-1"><Info size={20}/></div><div><h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Notes / Instructions</h4><p className="text-xs font-bold text-slate-500 leading-relaxed italic">"{getNotes(selectedBooking) || 'No instructions provided'}"</p></div></div>
                    </div>
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HomeIcon size={14} className="text-primary" /> Property Rooms</h4>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {Object.entries(getPropertyData(selectedBooking)).map(([key, qty]) => qty > 0 ? (<div key={key} className="flex justify-between bg-white p-2 rounded-lg border border-slate-100 font-bold"><span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span><span className="text-primary">x{qty}</span></div>) : null)}
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-primary" /> Extra Services</h4>
                        <div className="space-y-2">
                          {Object.entries(getExtrasData(selectedBooking)).map(([name, qty]) => (
                            <div key={name} className="flex justify-between items-center text-xs font-bold text-slate-600"><span>{name}</span><span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-black">✓</span></div>
                          ))}
                        </div>
                      </div>
                      {getPetInfo(selectedBooking) && (
                        <div className={`p-5 rounded-[24px] border-2 flex items-center gap-4 ${
                          getPetInfo(selectedBooking) === 'Yes'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className="text-2xl">{getPetInfo(selectedBooking) === 'Yes' ? '🐶' : '🚫'}</span>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pet on Premises</p>
                            <p className={`font-black text-sm ${ getPetInfo(selectedBooking) === 'Yes' ? 'text-amber-600' : 'text-slate-500' }`}>
                              {getPetInfo(selectedBooking) === 'Yes' ? 'Yes — pet-friendly cleaning required' : 'No pets'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest">Discard</button>
                  <button onClick={() => handleUpdate()} className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"><Save size={18} /> Sync Changes</button>
                </>
              ) : (
                <>
                  <button onClick={() => { if(window.confirm('Cancel this booking?')) handleUpdate({...selectedBooking, status: 'Cancelled'}); }} className="flex-1 py-5 rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all">Cancel Booking</button>
                  <button onClick={() => setIsEditing(true)} className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"><Edit3 size={18} /> Modify Entry</button>
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
