import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, MoreVertical, 
  Eye, Calendar, Clock, MapPin, 
  CreditCard, User, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

const Bookings = () => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`);
        const data = await response.json();
        setBookings(data.map(b => ({
          id: b.bookingId,
          customer: `${b.customer.firstName} ${b.customer.lastName}`,
          email: b.customer.email,
          phone: b.customer.phone,
          service: b.service,
          date: new Date(b.schedule.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: b.schedule.timeSlot,
          status: b.status,
          amount: `${b.region === 'UK' ? '£' : '₦'}${b.payment.amount}`,
          address: b.details.address,
          region: b.region
        })));
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Completed': return 'bg-slate-50 text-slate-700 border-slate-100';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
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
            placeholder="Search by ID, name, or email..." 
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={18} /> Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 ml-auto md:ml-0">
            <Download size={18} /> Export
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
                <th className="px-4 py-5">Region</th>
                <th className="px-4 py-5">Status</th>
                <th className="px-4 py-5">Amount</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {booking.customer.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-primary-dark group-hover:text-primary transition-colors">{booking.customer}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{booking.email}</p>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest">{booking.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-bold text-slate-700">{booking.service}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Calendar size={10} /> {booking.date.split(',')[0]}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Clock size={10} /> {booking.time}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${booking.region === 'UK' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {booking.region}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${getStatusStyle(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-6 font-black text-primary-dark">{booking.amount}</td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedBooking(booking)}
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
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-sm text-slate-500 font-medium">Showing <span className="text-primary-dark font-bold">{bookings.length}</span> of <span className="text-primary-dark font-bold">{bookings.length}</span> bookings</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-white transition-all disabled:opacity-50" disabled>
              <ChevronLeft size={18} />
            </button>
            <button className="w-8 h-8 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20">1</button>
            <button className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-primary/30">2</button>
            <button className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-white transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{selectedBooking.id}</span>
                <h3 className="text-2xl font-black text-primary-dark tracking-tight">Booking Details</h3>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary-dark transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Customer & Service Info */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Information</h4>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-black text-primary-dark text-lg">{selectedBooking.customer}</p>
                      <p className="text-sm text-slate-500 font-medium">{selectedBooking.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Information</h4>
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-primary-dark">{selectedBooking.service}</p>
                    <p className="text-xs text-slate-500 mt-1">Full Service Package</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Time & Location */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Calendar size={18} className="text-primary" />
                      <span className="text-sm font-bold">{selectedBooking.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Clock size={18} className="text-primary" />
                      <span className="text-sm font-bold">{selectedBooking.time}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</h4>
                  <div className="flex items-start gap-3 text-slate-600">
                    <MapPin size={18} className="text-primary mt-1 shrink-0" />
                    <span className="text-sm font-bold leading-relaxed">{selectedBooking.address}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Payment Summary */}
              <div className="bg-primary-dark text-white p-6 rounded-[32px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Summary</h4>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                    <CheckCircle2 size={12} className="text-secondary" />
                    <span className="text-[10px] font-black uppercase">Paid via {selectedBooking.region === 'UK' ? 'Stripe' : 'Paystack'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="text-slate-400 font-medium">Total Amount</p>
                  <p className="text-4xl font-black tracking-tight">{selectedBooking.amount}</p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-black text-primary-dark hover:bg-slate-100 transition-all uppercase tracking-widest">
                Reschedule
              </button>
              <button className="flex-1 py-4 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 uppercase tracking-widest">
                Assign Cleaner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
