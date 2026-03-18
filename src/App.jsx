import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Edit, 
  Trash2, 
  Plus, 
  Lock, 
  Unlock, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query
} from 'firebase/firestore';

/** --- DEPLOYMENT CONFIGURATION --- */
const firebaseConfig = typeof window !== 'undefined' && window.__firebase_config 
  ? JSON.parse(window.__firebase_config) 
  : {
      apiKey: "AIzaSyCgU0xJT_OA--3bCGUX3ww8KIQ7PuwWa2s",
      authDomain: "namtanfilm-calendar.firebaseapp.com",
      projectId: "namtanfilm-calendar",
      storageBucket: "namtanfilm-calendar.firebasestorage.app",
      messagingSenderId: "254125959500",
      appId: "1:254125959500:web:284179982632665d0107e9"
    };

const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'namtanfilm-calendar-main';
/** ------------------------------ */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants ---
const CATEGORIES = {
  namtan: { 
    id: 'namtan', 
    label: 'แทนงานเดี่ยวน้ำตาล | Namtan\'s Solo Event', 
    dot: 'bg-blue-500', 
    bg: 'bg-[#f0f5ff]', 
    text: 'text-[#1e40af]', 
    dateBorder: 'border-[#bfdbfe]', 
    dateMonthText: 'text-blue-500' 
  },
  film: { 
    id: 'film', 
    label: 'แทนงานเดี่ยวฟิล์ม | Film\'s Solo Event', 
    dot: 'bg-yellow-400', 
    bg: 'bg-[#fffbeb]', 
    text: 'text-[#9a6400]', 
    dateBorder: 'border-[#fef08a]', 
    dateMonthText: 'text-yellow-500' 
  },
  namtanfilm: { 
    id: 'namtanfilm', 
    label: 'แทนงานคู่ | NamtanFilm\'s Event', 
    dot: 'bg-green-400', 
    bg: 'bg-[#f0fdf4]', 
    text: 'text-[#166534]', 
    dateBorder: 'border-[#bbf7d0]', 
    dateMonthText: 'text-green-500' 
  },
  lunar: { 
    id: 'lunar', 
    label: 'แทนงานLunar | LUNAR\'s Event', 
    dot: 'bg-purple-500', 
    bg: 'bg-[#faf5ff]', 
    text: 'text-[#6b21a8]', 
    dateBorder: 'border-[#e9d5ff]', 
    dateMonthText: 'text-purple-500' 
  }
};

const REMARKS = {
  open: { 
    id: 'open', 
    label: 'แทนงานเปิด | Open Event', 
    short: '(O)', 
    bg: 'bg-[#f1f5f9]', 
    text: 'text-gray-700' 
  },
  closed: { 
    id: 'closed', 
    label: 'แทนงานปิด | Closed / Invite-Only', 
    short: '(C)', 
    bg: 'bg-[#f1f5f9]', 
    text: 'text-gray-700' 
  },
  gathering: { 
    id: 'gathering', 
    label: 'แทนการรวมพล | Post-Event Gathering', 
    short: '(G)', 
    bg: 'bg-[#f1f5f9]', 
    text: 'text-gray-700' 
  }
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState(
    Object.keys(CATEGORIES).reduce((acc, key) => ({...acc, [key]: true}), {})
  );
  const [remarkFilters, setRemarkFilters] = useState(
    Object.keys(REMARKS).reduce((acc, key) => ({...acc, [key]: true}), {})
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', categoryId: 'namtan', date: '', time: '', isTBA: false, location: '', remarkId: 'open', keywords: '', hashtags: '', notes: ''
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const eventsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const q = query(eventsCollection);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => filters[event.categoryId] && remarkFilters[event.remarkId])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, filters, remarkFilters]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === 'ntfthnewver#') {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const toggleFilter = (categoryId) => {
    setFilters(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const toggleRemarkFilter = (remarkId) => {
    setRemarkFilters(prev => ({ ...prev, [remarkId]: !prev[remarkId] }));
  };

  // FIXED: Formatting helper to ensure local date is used, not UTC
  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openAddModal = (dateStr = '') => {
    setFormData({
      title: '', categoryId: 'namtan', date: dateStr, time: '', isTBA: false, location: '', remarkId: 'open', keywords: '', hashtags: '', notes: ''
    });
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const openEditModal = (event) => {
    setFormData({ ...event });
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleDelete = async (id) => {
    if (!user) return;
    try {
      const eventDoc = doc(db, 'artifacts', appId, 'public', 'data', 'events', id);
      await deleteDoc(eventDoc);
      setViewingEvent(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Still connecting to database... please wait 2 seconds.");
      return;
    }

    try {
      const eventsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'events');
      if (editingEvent) {
        const eventDoc = doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEvent.id);
        await updateDoc(eventDoc, formData);
      } else {
        await addDoc(eventsCollection, formData);
      }
      setShowEventModal(false);
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving event. Please check your internet connection.");
    }
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null); 
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const getEventsForDay = (date) => {
    if (!date) return [];
    // FIXED: Use local date formatting here as well
    const dateStr = formatLocalDate(date);
    return filteredEvents.filter(e => e.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#111827] font-sans pb-24 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-10 pb-16 space-y-8">
        
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#dbeafe] text-[#3b82f6] rounded-2xl flex items-center justify-center shadow-sm">
              <CalendarIcon size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] md:text-[28px] font-black tracking-tight uppercase">
              NamtanFilm & Lunar Schedule
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {loading && <div className="text-xs font-bold text-gray-400 animate-pulse">SYNCING...</div>}
            {isAdmin ? (
              <button onClick={() => setIsAdmin(false)} className="w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                <Unlock size={22} />
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} className="w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors shadow-sm">
                <Lock size={22} />
              </button>
            )}
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-6">Schedule Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">Artists (Click to Filter)</h4>
              <div className="space-y-3">
                {Object.values(CATEGORIES).map(cat => (
                  <label key={cat.id} className="flex items-center cursor-pointer group">
                    <input type="checkbox" checked={filters[cat.id]} onChange={() => toggleFilter(cat.id)} className="hidden"/>
                    <div className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-200 border ${filters[cat.id] ? `${cat.bg} border-transparent shadow-sm` : 'bg-white border-gray-200 opacity-50 grayscale'} ${filters[cat.id] ? cat.text : 'text-gray-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${cat.dot} flex-shrink-0`}></span>
                      <span className="text-[13px] lg:text-[14px] font-bold whitespace-nowrap truncate">{cat.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">Event Remarks (Click to Filter)</h4>
              <div className="space-y-3">
                {Object.values(REMARKS).map(remark => (
                  <label key={remark.id} className="flex items-center cursor-pointer group">
                    <input type="checkbox" checked={remarkFilters[remark.id]} onChange={() => toggleRemarkFilter(remark.id)} className="hidden"/>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 border ${remarkFilters[remark.id] ? `${remark.bg} border-transparent shadow-sm` : 'bg-white border-gray-200 opacity-50 grayscale'} ${remarkFilters[remark.id] ? remark.text : 'text-gray-400'}`}>
                      <span className={`font-bold text-[13px] lg:text-[14px] min-w-[24px] flex-shrink-0 ${remarkFilters[remark.id] ? 'text-black' : 'text-gray-400'}`}>{remark.short}</span>
                      <span className="text-[13px] lg:text-[14px] font-bold whitespace-nowrap truncate">{remark.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-800 shadow-sm"><ChevronLeft size={24} strokeWidth={2.5}/></button>
            <h2 className="text-2xl md:text-[26px] font-black text-[#111827] tracking-tight uppercase">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-800 shadow-sm"><ChevronRight size={24} strokeWidth={2.5}/></button>
          </div>
          {isAdmin && (
            <div className="flex justify-end mb-4 px-2">
              <button onClick={() => openAddModal()} className="flex items-center gap-2 bg-[#111827] text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors font-bold text-sm"><Plus size={18} strokeWidth={2.5} /> Add Event</button>
            </div>
          )}
          <div className="border border-gray-100 rounded-2xl overflow-hidden mt-4">
            <div className="grid grid-cols-7 bg-gray-100 gap-[1px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-4 bg-white text-center text-[11px] sm:text-[12px] font-bold text-gray-300 uppercase tracking-widest">{day}</div>
              ))}
              {calendarDays.map((date, i) => {
                const dayEvents = getEventsForDay(date);
                const isToday = date && date.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`min-h-[140px] md:min-h-[160px] lg:min-h-[200px] p-2 transition-colors flex flex-col ${!date ? 'bg-white' : isToday ? 'bg-[#fffbeb]' : 'bg-white'} ${date && isAdmin ? 'hover:bg-gray-50 cursor-pointer' : ''}`} onClick={() => { if(date && isAdmin) openAddModal(formatLocalDate(date)) }}>
                    {date && (
                      <div className="flex flex-col h-full">
                        <div className="mb-2 flex justify-start"><span className={`text-[12px] sm:text-[13px] font-bold flex items-center justify-center px-2 py-0.5 rounded-lg min-w-[28px] ${isToday ? 'bg-[#60a5fa] text-white shadow-sm' : 'text-gray-400'}`}>{date.getDate()}</span></div>
                        <div className="space-y-1.5 flex-1">
                          {dayEvents.map(event => {
                            const cat = CATEGORIES[event.categoryId];
                            const remark = REMARKS[event.remarkId];
                            return (
                              <div key={event.id} onClick={(e) => { e.stopPropagation(); setViewingEvent(event); }} className={`px-1.5 py-1 rounded-md border ${cat.dateBorder} ${cat.bg} ${cat.text} cursor-pointer hover:shadow-sm transition-all flex flex-col w-full overflow-hidden`}>
                                <div className="font-bold text-[10px] sm:text-[11px] truncate leading-tight w-full">{remark.id !== 'none' && <span className="font-black mr-1">{remark.short}</span>}{event.title}</div>
                                <div className="flex justify-between items-center w-full text-[9px] sm:text-[10px] font-semibold opacity-80 mt-[2px]"><span className="flex-shrink-0 whitespace-nowrap">{event.isTBA ? 'TBA' : event.time}</span><span className="truncate ml-2 text-right uppercase tracking-tight">{event.location || 'TBA'}</span></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex justify-between items-baseline mb-6 px-2">
            <h2 className="text-[20px] font-black tracking-[0.15em] uppercase text-[#111827]">Monthly Schedule List</h2>
            <span className="text-[15px] font-bold text-gray-400">{filteredEvents.length} Events Scheduled</span>
          </div>
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 text-center text-gray-400 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
              <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-bold">No events scheduled.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredEvents.map(event => {
                const cat = CATEGORIES[event.categoryId];
                const remark = REMARKS[event.remarkId];
                const eventDate = new Date(event.date);
                return (
                  <div key={event.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
                    <div className="flex flex-col md:flex-row gap-6 md:items-center">
                      <div className={`w-[84px] h-[84px] rounded-3xl border-2 ${cat.dateBorder} flex flex-col items-center justify-center flex-shrink-0 bg-white shadow-sm`}><span className={`text-[13px] font-extrabold uppercase tracking-wide ${cat.dateMonthText}`}>{eventDate.toLocaleString('default', { month: 'short' })}</span><span className="text-[32px] font-black text-[#111827] leading-none mt-0.5">{eventDate.getDate()}</span></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2.5"><span className={`w-3 h-3 rounded-full ${cat.dot} shadow-sm`}></span><h3 className="text-[22px] font-black text-[#111827] leading-tight">{event.title}</h3></div>
                        <div className="flex flex-wrap items-center gap-5 text-[15px] font-bold text-gray-500">
                          <div className="flex items-center gap-1.5"><Clock size={18} strokeWidth={2.5} className="text-gray-400" />{event.isTBA ? <span className="text-orange-500">TBA</span> : event.time}</div>
                          <div className="flex items-center gap-1.5"><MapPin size={18} strokeWidth={2.5} className="text-gray-400" />{event.location || 'TBA'}</div>
                        </div>
                      </div>
                      <div className={`px-5 py-2.5 rounded-xl flex items-center gap-2 ${remark.bg} ${remark.text}`}><span className="font-extrabold text-black">{remark.short}</span><span className="font-bold text-[14px]">{remark.label}</span></div>
                    </div>
                    {(event.keywords || event.hashtags || event.notes) && (
                      <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                        {(event.keywords || event.hashtags) && (
                          <div className="space-y-2">
                            {event.keywords && <div className="flex text-[15px]"><span className="font-extrabold text-gray-400 uppercase tracking-wide w-[110px]">Keyword :</span><span className="font-bold text-[#3b82f6]">{event.keywords}</span></div>}
                            {event.hashtags && <div className="flex text-[15px]"><span className="font-extrabold text-gray-400 uppercase tracking-wide w-[110px]">Hashtag :</span><span className="font-bold text-[#3b82f6]">{event.hashtags}</span></div>}
                          </div>
                        )}
                        {event.notes && <div className="bg-[#f8fafc] rounded-2xl p-4 flex items-start gap-3 mt-4"><Info size={20} className="text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} /><p className="text-[14.5px] font-medium text-gray-600 whitespace-pre-wrap leading-relaxed">{event.notes}</p></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-sm relative">
            <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-[#111827]"><Lock size={24}/> Admin Access</h2>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all font-medium text-gray-800" placeholder="Enter password" autoFocus/>
              </div>
              <button type="submit" className="w-full bg-[#111827] text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-colors shadow-sm">Unlock Admin Access</button>
            </form>
          </div>
        </div>
      )}

      {viewingEvent && (() => {
        const cat = CATEGORIES[viewingEvent.categoryId];
        const remark = REMARKS[viewingEvent.remarkId];
        const eventDate = new Date(viewingEvent.date);
        return (
          <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative my-8">
              <button onClick={() => setViewingEvent(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-50 p-2 rounded-full transition-colors"><X size={20}/></button>
              <div className="flex items-start gap-3 mb-6 pr-8"><span className={`w-3.5 h-3.5 mt-2 rounded-full ${cat.dot} flex-shrink-0 shadow-sm`}></span><h2 className="text-2xl font-black text-[#111827] leading-tight">{viewingEvent.title}</h2></div>
              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[13px] font-bold ${cat.bg} ${cat.text}`}>{cat.label.split(' | ')[1]}</span>
                  {remark.id !== 'none' && <span className={`px-3 py-1 rounded-lg text-[13px] font-bold ${remark.bg} ${remark.text}`}>{remark.short} {remark.label.split(' | ')[0]}</span>}
                </div>
                <div className="flex flex-col gap-3 text-[15px] font-bold text-gray-600">
                  <div className="flex items-center gap-2.5"><CalendarIcon size={18} strokeWidth={2.5} className="text-gray-400" /><span>{eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                  <div className="flex items-center gap-2.5"><Clock size={18} strokeWidth={2.5} className="text-gray-400" />{viewingEvent.isTBA ? <span className="text-orange-500">TBA</span> : viewingEvent.time}</div>
                  <div className="flex items-start gap-2.5"><MapPin size={18} strokeWidth={2.5} className="text-gray-400 mt-0.5 flex-shrink-0" /><span className="leading-snug">{viewingEvent.location || 'Location TBA'}</span></div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-3 pt-6 border-t border-gray-100">
                  <button onClick={() => { setViewingEvent(null); openEditModal(viewingEvent); }} className="flex-1 bg-blue-50 text-blue-600 font-bold py-3.5 rounded-2xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"><Edit size={18} strokeWidth={2.5} /> Edit</button>
                  <button onClick={() => handleDelete(viewingEvent.id)} className="flex-1 bg-red-50 text-red-500 font-bold py-3.5 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"><Trash2 size={18} strokeWidth={2.5} /> Delete</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {showEventModal && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 relative flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-2xl font-black text-[#111827] flex items-center gap-3">{editingEvent ? <Edit size={24}/> : <Plus size={24}/>}{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <form id="event-form" onSubmit={handleSaveEvent} className="space-y-8">
                <div>
                  <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">Artist</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(CATEGORIES).map(cat => (
                      <div key={cat.id} onClick={() => setFormData({...formData, categoryId: cat.id})} className={`cursor-pointer border-2 rounded-2xl p-4 transition-all duration-200 flex items-center gap-3 ${formData.categoryId === cat.id ? `${cat.dateBorder} ${cat.bg} shadow-sm scale-[1.02]` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 grayscale opacity-70'}`}>
                        <span className={`w-3 h-3 rounded-full ${cat.dot} flex-shrink-0`}></span>
                        <div><div className={`text-[14px] font-bold ${formData.categoryId === cat.id ? cat.text : 'text-gray-600'}`}>{cat.label.split(' | ')[1]}</div><div className="text-[12px] font-medium text-gray-500 mt-0.5">{cat.label.split(' | ')[0]}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="col-span-1 md:col-span-2"><label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Event Title *</label><input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800" placeholder="e.g. Fanmeet 2026"/></div>
                  <div><label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Date *</label><input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800"/></div>
                  <div>
                    <div className="flex justify-between items-end mb-2"><label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider">Time</label><label className="flex items-center gap-2 text-[13px] font-bold text-gray-600 cursor-pointer"><input type="checkbox" checked={formData.isTBA} onChange={e => setFormData({...formData, isTBA: e.target.checked})} className="rounded text-blue-500 focus:ring-blue-500 border-gray-300 w-4 h-4"/>TBA</label></div>
                    <input type="time" disabled={formData.isTBA} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800 disabled:opacity-50"/>
                  </div>
                  <div className="col-span-1 md:col-span-2"><label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Location</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800" placeholder="Venue, City..."/></div>
                  <div className="col-span-1 md:col-span-2"><label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Event Remark</label><select value={formData.remarkId} onChange={e => setFormData({...formData, remarkId: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800">{Object.values(REMARKS).map(remark => (<option key={remark.id} value={remark.id}>{remark.short} {remark.label}</option>))}</select></div>
                  <div className="col-span-1 md:col-span-2"><label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Keywords</label><input type="text" value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800" /></div>
                  <div className="col-span-1 md:col-span-2"><label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Hashtags</label><input type="text" value={formData.hashtags} onChange={e => setFormData({...formData, hashtags: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800" /></div>
                  <div className="col-span-1 md:col-span-2"><label className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Notes / Additional Info</label><textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-medium text-gray-800"></textarea></div>
                </div>
              </form>
            </div>
            <div className="px-8 py-5 border-t border-gray-100 bg-white rounded-b-3xl flex justify-end gap-3 sticky bottom-0 z-10"><button type="button" onClick={() => setShowEventModal(false)} className="px-6 py-3 text-gray-500 hover:bg-gray-100 font-bold rounded-2xl transition-colors">Cancel</button><button type="submit" form="event-form" className="px-8 py-3 bg-[#111827] text-white font-bold rounded-2xl hover:bg-gray-800 shadow-sm transition-colors">{editingEvent ? 'Update Event' : 'Save Event'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
