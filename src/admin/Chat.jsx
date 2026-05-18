import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, MessageSquare, User, Phone, 
  MapPin, Clock, ShieldCheck, AlertCircle, RefreshCw 
} from 'lucide-react';

const Chat = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef(null);

  // Fetch all active worker threads
  const fetchThreads = async (showLoading = false) => {
    if (showLoading) setLoadingThreads(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/messages/active-threads`);
      const data = await response.json();
      setThreads(data);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      if (showLoading) setLoadingThreads(false);
    }
  };

  // Fetch messages in selected thread
  const fetchMessages = async (workerId, showLoading = false) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/messages/worker/${workerId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching thread messages:', error);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Poll for active threads list
  useEffect(() => {
    fetchThreads(true);
    const interval = setInterval(() => {
      fetchThreads(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll selected thread messages
  useEffect(() => {
    if (!selectedThread) return;
    
    fetchMessages(selectedThread.worker._id, false);
    const interval = setInterval(() => {
      fetchMessages(selectedThread.worker._id, false);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [selectedThread]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    setMessages([]);
    fetchMessages(thread.worker._id, true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedThread) return;

    const messageText = inputText;
    setInputText('');
    setSending(true);

    try {
      const payload = {
        senderType: 'Admin',
        workerId: selectedThread.worker._id,
        senderName: 'Office Admin',
        text: messageText
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      // Snappy response: instantly append locally
      setMessages(prev => [...prev, data]);
      fetchThreads(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Search filter
  const filteredThreads = threads.filter(t => {
    const fullName = `${t.worker?.firstName} ${t.worker?.lastName}`.toLowerCase();
    const email = t.worker?.email?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl h-[calc(100vh-140px)] flex flex-col md:flex-row">
      
      {/* Left Pane - Active Threads List */}
      <div className="w-full md:w-[350px] border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
        
        {/* Header Search */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black text-xl text-primary-dark">Cleaner Chats</h2>
            <button 
              onClick={() => fetchThreads(true)} 
              className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all"
              title="Refresh threads"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 rounded-2xl border border-slate-200 focus-within:border-primary/50 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search cleaner name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700"
            />
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingThreads && threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <RefreshCw size={32} className="animate-spin mb-3 text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider">Syncing Support Desk...</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
              <MessageSquare size={36} className="mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No active threads</p>
              <p className="text-xs text-slate-400 mt-1">When cleaners message support from their app, threads will appear here.</p>
            </div>
          ) : (
            filteredThreads.map((t) => {
              const isActive = selectedThread?.worker?._id === t.worker?._id;
              const isLastMessageFromWorker = t.lastSender === 'Worker';

              return (
                <div 
                  key={t._id} 
                  onClick={() => handleSelectThread(t)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 flex items-start gap-3 group relative ${
                    isActive 
                      ? 'bg-secondary text-primary-dark border-secondary shadow-lg shadow-secondary/20' 
                      : 'bg-white hover:bg-slate-100/50 border-slate-200/60 hover:border-slate-300'
                  }`}
                >
                  {/* Status Dot */}
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black ${
                    isActive ? 'bg-primary-dark/10 text-primary-dark' : 'bg-primary/10 text-primary'
                  }`}>
                    {t.worker?.firstName?.[0]}{t.worker?.lastName?.[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-sm font-black truncate ${isActive ? 'text-primary-dark' : 'text-slate-800'}`}>
                        {t.worker?.firstName} {t.worker?.lastName}
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isActive ? 'text-primary-dark/80 font-bold' : 'text-slate-500 font-medium'}`}>
                      {isLastMessageFromWorker && <span className="font-extrabold text-[10px] mr-1 uppercase bg-primary/20 text-primary px-1 py-0.5 rounded">CLEANER</span>}
                      {t.lastMessage}
                    </p>
                  </div>
                  {t.worker?.status === 'Active' && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane - Chat Feed */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {selectedThread ? (
          <>
            {/* Header info */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0 shadow-sm bg-slate-50/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">
                  {selectedThread.worker?.firstName?.[0]}
                </div>
                <div>
                  <h3 className="font-black text-primary-dark text-base leading-tight">
                    {selectedThread.worker?.firstName} {selectedThread.worker?.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {selectedThread.worker?.region || 'UK'}</span>
                    <span className="flex items-center gap-1"><Phone size={12} /> {selectedThread.worker?.phone || 'No phone'}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                selectedThread.worker?.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {selectedThread.worker?.status}
              </span>
            </div>

            {/* Message History Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <RefreshCw size={28} className="animate-spin mb-2 text-primary" />
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
                      <div className={`max-w-[70%] p-4 rounded-3xl shadow-sm border ${
                        isAdmin 
                          ? 'bg-primary text-white border-primary rounded-tr-sm' 
                          : 'bg-white text-slate-800 border-slate-200 rounded-tl-sm'
                      }`}>
                        <p className="text-sm font-bold leading-relaxed">{m.text}</p>
                        <div className={`flex justify-end items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wider ${
                          isAdmin ? 'text-white/70' : 'text-slate-400'
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

            {/* Sticky bottom Send Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white shrink-0 flex items-center gap-3">
              <input 
                type="text" 
                placeholder={`Type a reply to ${selectedThread.worker?.firstName}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 py-4 px-6 bg-slate-100 rounded-2xl border border-slate-200 outline-none font-bold text-sm text-slate-700 focus:border-primary/50 focus:bg-white transition-all"
              />
              <button 
                type="submit" 
                disabled={!inputText.trim() || sending}
                className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:bg-slate-200 disabled:shadow-none"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-secondary rounded-[32px] flex items-center justify-center text-primary mb-6 shadow-xl shadow-secondary/10">
              <MessageSquare size={36} />
            </div>
            <h3 className="font-black text-2xl text-primary-dark">Select a Conversation</h3>
            <p className="text-slate-500 font-medium max-w-sm mt-2 text-sm">
              Click on a cleaner in the thread list on the left to review messages and support them in real-time.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Chat;
