import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Search, MessageSquare, User, Phone,
  MapPin, Clock, ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react';

const Chat = () => {
  const [activeTab, setActiveTab] = useState('cleaners');
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef(null);

  const fetchThreads = async (showLoading = false) => {
    if (showLoading) setLoadingThreads(true);
    try {
      const endpoint = activeTab === 'cleaners'
        ? `${import.meta.env.VITE_API_URL}/messages/active-threads`
        : `${import.meta.env.VITE_API_URL}/customer-chat/admin/threads`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setThreads(data);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      if (showLoading) setLoadingThreads(false);
    }
  };

  const fetchMessages = async (thread, showLoading = false) => {
    if (!thread) return;
    if (showLoading) setLoadingMessages(true);
    try {
      const endpoint = activeTab === 'cleaners'
        ? `${import.meta.env.VITE_API_URL}/messages/worker/${thread.worker?._id}`
        : `${import.meta.env.VITE_API_URL}/customer-chat/admin/thread/${thread._id}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching thread messages:', error);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    setSelectedThread(null);
    setMessages([]);
    setInputText('');
    setSearchQuery('');
    fetchThreads(true);
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedThread) return;

    fetchMessages(selectedThread, false);
    const interval = setInterval(() => {
      fetchMessages(selectedThread, false);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedThread, activeTab]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    setMessages([]);
    fetchMessages(thread, true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedThread) return;

    const messageText = inputText;
    setInputText('');
    setSending(true);

    try {
      let response;
      if (activeTab === 'cleaners') {
        const payload = {
          senderType: 'Admin',
          workerId: selectedThread.worker?._id,
          senderName: 'Office Admin',
          text: messageText
        };
        response = await fetch(`${import.meta.env.VITE_API_URL}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const payload = {
          text: messageText,
          senderName: 'Office Admin'
        };
        response = await fetch(`${import.meta.env.VITE_API_URL}/customer-chat/${selectedThread._id}/admin-reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      setMessages(prev => [...prev, data]);
      fetchThreads(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = threads.filter(t => {
    if (activeTab === 'cleaners') {
      const fullName = `${t.worker?.firstName || ''} ${t.worker?.lastName || ''}`.toLowerCase();
      const email = t.worker?.email?.toLowerCase() || '';
      return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    } else {
      const fullName = `${t.booking?.customer?.firstName || ''} ${t.booking?.customer?.lastName || ''}`.toLowerCase();
      const email = (t.customerEmail || '').toLowerCase();
      const bookingId = (t._id || '').toLowerCase();
      const service = (t.booking?.service || '').toLowerCase();
      return (
        fullName.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase()) ||
        bookingId.includes(searchQuery.toLowerCase()) ||
        service.includes(searchQuery.toLowerCase())
      );
    }
  });

  return (
    <div className="bg-[#0B2D22] border border-white/7 rounded-4xl overflow-hidden shadow-2xl h-[calc(100vh-140px)] flex flex-col md:flex-row">

      <div className="w-full md:w-87.5 border-r border-white/7 flex flex-col h-full bg-[#071D16]">

        <div className="p-6 border-b border-white/10 bg-[#0B2D22]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex bg-[#071D16] p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('cleaners')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'cleaners'
                    ? 'bg-[#0B2D22] text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Cleaners
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'customers'
                    ? 'bg-[#0B2D22] text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Customers
              </button>
            </div>
            <button
              onClick={() => fetchThreads(true)}
              className="p-2 text-white/40 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-all"
              title="Refresh threads"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#071D16] rounded-2xl border border-white/10 focus-within:border-emerald-500/50 transition-all">
            <Search size={18} className="text-white/40" />
            <input
              type="text"
              placeholder={activeTab === 'cleaners' ? "Search cleaner name..." : "Search customer, booking, service..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium w-full text-white placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingThreads && threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <RefreshCw size={32} className="animate-spin mb-3 text-emerald-400" />
              <p className="text-xs font-bold uppercase tracking-wider">Syncing Support Desk...</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40 text-center px-4">
              <MessageSquare size={36} className="mb-2 text-white/25" />
              <p className="text-sm font-bold text-white/70">No active threads</p>
              <p className="text-xs text-white/40 mt-1">
                {activeTab === 'cleaners'
                  ? 'When cleaners message support from their app, threads will appear here.'
                  : 'When customers message support from their account dashboard, threads will appear here.'
                }
              </p>
            </div>
          ) : (
            filteredThreads.map((t) => {
              const isActive = activeTab === 'cleaners'
                ? selectedThread?.worker?._id === t.worker?._id
                : selectedThread?._id === t._id;
              const isLastMessageFromUser = activeTab === 'cleaners'
                ? t.lastSender === 'Worker'
                : t.lastSender === 'Customer';

              const initials = activeTab === 'cleaners'
                ? `${t.worker?.firstName?.[0] || ''}${t.worker?.lastName?.[0] || ''}`
                : `${t.booking?.customer?.firstName?.[0] || ''}${t.booking?.customer?.lastName?.[0] || ''}` || t.customerEmail?.[0]?.toUpperCase() || 'C';

              const displayName = activeTab === 'cleaners'
                ? `${t.worker?.firstName} ${t.worker?.lastName}`
                : `${t.booking?.customer?.firstName || ''} ${t.booking?.customer?.lastName || ''}`.trim() || t.customerEmail;

              return (
                <div
                  key={t._id}
                  onClick={() => handleSelectThread(t)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 flex items-start gap-3 group relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-white border-emerald-500/20 shadow-lg'
                      : 'bg-[#0B2D22] hover:bg-[#0A2A1F] border-white/7 hover:border-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black ${
                    isActive ? 'bg-white/5 text-white' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-sm font-black truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
                        {displayName}
                      </p>
                      <span className="text-[10px] text-white/40 font-bold">
                        {t.lastMessageTime ? new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {activeTab === 'customers' && (
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isActive ? 'text-white/70' : 'text-emerald-400'}`}>
                        {t.booking?.service} ({t._id})
                      </p>
                    )}
                    <p className={`text-xs truncate ${isActive ? 'text-white/80 font-bold' : 'text-white/40 font-medium'}`}>
                      {isLastMessageFromUser && (
                        <span className="font-extrabold text-[10px] mr-1 uppercase bg-emerald-500/15 text-emerald-400 px-1 py-0.5 rounded">
                          {activeTab === 'cleaners' ? 'CLEANER' : 'CUSTOMER'}
                        </span>
                      )}
                      {t.lastMessage}
                    </p>
                  </div>
                  {activeTab === 'cleaners' && t.worker?.status === 'Active' && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full border border-[#071D16]" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#0B2D22] relative">
        {selectedThread ? (
          <>
            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0 bg-[#071D16]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-lg">
                  {activeTab === 'cleaners'
                    ? selectedThread.worker?.firstName?.[0]
                    : (selectedThread.booking?.customer?.firstName?.[0] || selectedThread.customerEmail?.[0] || 'C')
                  }
                </div>
                <div>
                  <h3 className="font-black text-white text-base leading-tight">
                    {activeTab === 'cleaners'
                      ? `${selectedThread.worker?.firstName} ${selectedThread.worker?.lastName}`
                      : `${selectedThread.booking?.customer?.firstName || ''} ${selectedThread.booking?.customer?.lastName || ''}`.trim() || selectedThread.customerEmail
                    }
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-white/40 font-bold uppercase tracking-wider">
                    {activeTab === 'cleaners' ? (
                      <>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {selectedThread.worker?.region || 'UK'}</span>
                        <span className="flex items-center gap-1"><Phone size={12} /> {selectedThread.worker?.phone || 'No phone'}</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck size={12} /> Booking: {selectedThread._id}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {selectedThread.booking?.schedule?.date ? new Date(selectedThread.booking.schedule.date).toLocaleDateString() : 'No date'}</span>
                        {selectedThread.booking?.assignedWorkerName && (
                          <span className="flex items-center gap-1"><User size={12} /> Cleaner: {selectedThread.booking.assignedWorkerName}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'cleaners'
                  ? (selectedThread.worker?.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25')
                  : (selectedThread.booking?.status === 'Cancelled' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' : selectedThread.booking?.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-blue-500/15 text-blue-400 border border-blue-500/25')
              }`}>
                {activeTab === 'cleaners'
                  ? selectedThread.worker?.status
                  : selectedThread.booking?.status
              }
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#071D16]">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <RefreshCw size={28} className="animate-spin mb-2 text-emerald-400" />
                  <p className="text-xs font-bold uppercase tracking-wider">Loading Conversation...</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.senderType === 'Admin';

                  return (
                    <div
                      key={m._id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                        isAdmin
                          ? 'bg-emerald-500/20 text-white rounded-2xl'
                          : 'bg-white/[0.07] text-white/80 rounded-2xl'
                      }`}>
                        <p className="text-sm font-bold leading-relaxed">{m.text}</p>
                        <div className={`flex justify-end items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wider ${
                          isAdmin ? 'text-white/70' : 'text-white/40'
                        }`}>
                          <Clock size={10} />
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-[#071D16] border-t border-white/7 shrink-0 flex items-center gap-3">
              <input
                type="text"
                placeholder={activeTab === 'cleaners'
                  ? `Type a reply to ${selectedThread.worker?.firstName}...`
                  : `Type a reply to ${selectedThread.booking?.customer?.firstName || 'customer'}...`
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 py-4 px-6 bg-white/5 rounded-2xl border border-white/10 outline-none font-bold text-sm text-white placeholder:text-white/20 focus:border-emerald-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all disabled:bg-white/10 disabled:shadow-none"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-4xl flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10">
              <MessageSquare size={36} />
            </div>
            <h3 className="font-black text-2xl text-white">Select a Conversation</h3>
            <p className="text-white/40 font-medium max-w-sm mt-2 text-sm">
              {activeTab === 'cleaners'
                ? 'Click on a cleaner in the thread list on the left to review messages and support them in real-time.'
                : 'Click on a customer in the thread list on the left to review messages and support them in real-time.'
              }
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Chat;
