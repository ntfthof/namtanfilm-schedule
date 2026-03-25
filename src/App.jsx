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
  ChevronDown, 
  ChevronUp, 
  Info, 
  Filter, 
  Hash, 
  Tag, 
  Copy, 
  Check, 
  CalendarCheck 
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

// --- Constants (Soft Dye Palette) ---
const CATEGORIES = {
  namtan: { 
    id: 'namtan', 
    label: 'แทนงานเดี่ยวน้ำตาล | Namtan\'s Solo Event', 
    dot: 'bg-blue-500', 
    bg: 'bg-blue-50/50', 
    text: 'text-blue-600', 
    border: 'border-blue-100',
    dateBorder: 'border-[#bfdbfe]', 
    dateMonthText: 'text-blue-500' 
  },
  film: { 
    id: 'film', 
    label: 'แทนงานเดี่ยวฟิล์ม | Film\'s Solo Event', 
    dot: 'bg-yellow-500', 
    bg: 'bg-amber-50/50', 
    text: 'text-amber-700', 
    border: 'border-amber-100',
    dateBorder: 'border-[#fef08a]', 
    dateMonthText: 'text-yellow-500' 
  },
  namtanfilm: { 
    id: 'namtanfilm', 
    label: 'แทนงานคู่ | NamtanFilm\'s Event', 
    dot: 'bg-green-500', 
    bg: 'bg-emerald-50/50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-100',
    dateBorder: 'border-[#bbf7d0]', 
    dateMonthText: 'text-green-500' 
  },
  lunar: { 
    id: 'lunar', 
    label: 'แทนงานLUNAR | LUNAR\'s Event', 
    dot: 'bg-purple-500', 
    bg: 'bg-purple-50/50', 
    text: 'text-purple-700', 
    border: 'border-purple-100',
    dateBorder: 'border-[#e9d5ff]', 
    dateMonthText: 'text-purple-500' 
  },
  namtanfilmlunar: {
    id: 'namtanfilmlunar',
    label: 'แทนงานนตฟ & LUNAR | NTF & LUNAR\'s Event',
    dot: 'bg-pink-500',
    bg: 'bg-pink-50/50',
    text: 'text-pink-600',
    border: 'border-pink-100',
    dateBorder: 'border-[#fbcfe8]', 
    dateMonthText: 'text-pink-500'
  }
};

const REMARKS = {
  open: { 
    id: 'open', 
    label: 'แทนงานเปิด | Open Event', 
    short: '(O)', 
    bg: 'bg-emerald-50/50', 
    text: 'text-emerald-500',
    border: 'border-emerald-100'
  },
  closed: { 
    id: 'closed', 
    label: 'แทนงานปิด | Closed / Invite-Only Event', 
    short: '(C)', 
    bg: 'bg-rose-50/50', 
    text: 'text-rose-500',
    border: 'border-rose-100'
  },
  gathering: { 
    id: 'gathering', 
    label: 'แทนการรวมพล | Post-Event Gathering', 
    short: '(G)', 
    bg: 'bg-indigo-50/50', 
    text: 'text-indigo-500', 
    border: 'border-indigo-100'
  },
  onair: { 
    id: 'onair', 
    label: 'ซีรีส์ออนแอร์ | Series On Air', 
    short: '(ON AIR)', 
    bg: 'bg-cyan-50/50', 
    text: 'text-cyan-500', 
    border: 'border-cyan-100'
  },
  live: { 
    id: 'live', 
    label: 'ไลฟ์สด | Live Stream / Broadcast', 
    short: '(LIVE)', 
    bg: 'bg-cyan-50/50', 
    text: 'text-cyan-500', 
    border: 'border-cyan-100'
  },
  tv: { 
    id: 'tv', 
    label: 'รายการทีวี | Variety Show / Appearance', 
    short: '(TV)', 
    bg: 'bg-cyan-50/50', 
    text: 'text-cyan-500', 
    border: 'border-cyan-100'
  }
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function App() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLegendOpen, setIsLegendOpen] = useState(false); 
  
  // Quick Date Jump State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  
  // Active Archive State
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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

  const sortEventsByTime = (a, b) => {
    const aIsTBA = a.isTBA || !a.time;
    const bIsTBA = b.isTBA || !b.time;

    if (aIsTBA && !bIsTBA) return 1;
    if (!aIsTBA && bIsTBA) return -1;
    if (aIsTBA && bIsTBA) return 0;
    return a.time.localeCompare(b.time);
  };

  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredEvents = useMemo(() => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();

    return events
      .filter(event => {
        const [eYear, eMonth] = event.date.split('-').map(Number);
        const matchesMonth = eYear === year && (eMonth - 1) === monthIndex;
        return filters[event.categoryId] && remarkFilters[event.remarkId] && matchesMonth;
      })
      .sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return sortEventsByTime(a, b);
      });
  }, [events, filters, remarkFilters, currentMonth]);

  // Grouping logic with Active Archive (Option A)
  const { upcomingGrouped, pastGrouped, isCurrentMonth, todayStr, pastCount } = useMemo(() => {
    const today = new Date();
    const tStr = formatLocalDate(today);
    const selectedYear = currentMonth.getFullYear();
    const selectedMonth = currentMonth.getMonth();
    const isCurrent = today.getFullYear() === selectedYear && today.getMonth() === selectedMonth;

    const upcoming = {};
    const past = {};
    let pCount = 0;

    filteredEvents.forEach(event => {
      if (isCurrent) {
        if (event.date >= tStr) {
          if (!upcoming[event.date]) upcoming[event.date] = [];
          upcoming[event.date].push(event);
        } else {
          if (!past[event.date]) past[event.date] = [];
          past[event.date].push(event);
          pCount++;
        }
      } else {
        if (!upcoming[event.date]) upcoming[event.date] = [];
        upcoming[event.date].push(event);
      }
    });

    return { 
      upcomingGrouped: Object.entries(upcoming).sort((a, b) => a[0].localeCompare(b[0])), 
      pastGrouped: Object.entries(past).sort((a, b) => b[0].localeCompare(a[0])),
      isCurrentMonth: isCurrent,
      todayStr: tStr,
      pastCount: pCount
    };
  }, [filteredEvents, currentMonth]);

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

  const handleCopyTrending = (event) => {
    if (!event.keywords && !event.hashtags) return;
    
    const parts = [];
    if (event.keywords) parts.push(event.keywords.trim());
    if (event.hashtags) {
      const tags = event.hashtags.split(/[\s,]+/).filter(t => t.trim());
      tags.forEach(tag => {
        parts.push(tag.startsWith('#') ? tag : `#${tag}`);
      });
    }
    
    const textToCopy = parts.join('\n');
    
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
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
      alert("Still connecting to database...");
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
    }
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  
  const jumpToDate = (monthIdx, year) => {
    setCurrentMonth(new Date(year, monthIdx, 1));
    setShowDatePicker(false);
    setShowPastEvents(false); 
  };

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
    const dateStr = formatLocalDate(date);
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const renderEventListGroup = (groupedData) => {
    return groupedData.map(([date, dayEvents]) => {
      const eventDate = new Date(date);
      const firstEventTheme = CATEGORIES[dayEvents[0].categoryId];
      const isPast = date < todayStr;

      return (
        <div key={date} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-6 md:p-8">
          <div className="flex flex-col gap-0">
            {dayEvents.map((event, idx) => {
              const cat = CATEGORIES[event.categoryId];
              const remark = REMARKS[event.remarkId];

              return (
                <div key={event.id} className={`flex flex-col md:flex-row gap-6 md:gap-10 ${idx > 0 ? 'pt-0.5 md:pt-6 mt-8 border-t border-gray-100' : ''}`}>
                  
                  <div className="flex-shrink-0">
                    {idx === 0 ? (
                      <div className="flex items-center justify-between md:block w-full md:w-auto">
                        <div className={`w-[80px] h-[80px] md:w-[94px] md:h-[94px] rounded-3xl border-2 ${firstEventTheme.dateBorder} flex flex-col items-center justify-center bg-white shadow-sm flex-shrink-0`}>
                          <span className={`text-[11px] md:text-[13px] font-extrabold uppercase tracking-wide ${firstEventTheme.dateMonthText}`}>{eventDate.toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-[30px] md:text-[36px] font-black text-[#111827] leading-none mt-0.5">{eventDate.getDate()}</span>
                        </div>
                        
                        <div className="md:hidden flex flex-row flex-wrap items-center justify-end gap-1.5 ml-4 flex-1">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cat.bg} ${cat.text} ${cat.border} transition-colors whitespace-nowrap max-w-full justify-end`}>
                            <span className={`w-1 h-1 rounded-full ${cat.dot} flex-shrink-0`}></span>
                            <span className="break-words whitespace-normal text-right">{cat.label}</span>
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${remark.bg} ${remark.text} ${remark.border} transition-colors whitespace-nowrap max-w-full justify-end`}>
                            <span className="opacity-70 flex-shrink-0">{remark.short}</span>
                            <span className="break-words whitespace-normal text-right">{remark.label}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="hidden md:block w-[94px]"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`flex flex-col md:flex-row items-start justify-between gap-2 md:gap-6`}>
                      <div className="min-w-0 flex-1 w-full">
                        <h3 className="text-[20px] md:text-[23px] font-black text-[#000000] cursor-pointer leading-tight break-words hover:text-blue-700 transition-colors" onClick={() => setViewingEvent(event)}>
                          {event.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-[14px] md:text-[15px] font-bold text-gray-500 mt-2 md:mt-2.5 bg-transparent border-none p-0 rounded-none">
                          {(event.time || event.isTBA) && (
                            <div className="flex items-center gap-2 flex-shrink-0 font-black">
                              <Clock size={17} strokeWidth={2.5} className="text-gray-400" />
                              {event.isTBA ? <span className="text-orange-500">TBA</span> : event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-start gap-2 min-w-0 flex-1 font-black">
                              <MapPin size={17} strokeWidth={2.5} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-snug break-words whitespace-normal">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={`flex-shrink-0 w-full md:w-auto mt-3 md:mt-0 gap-1.5 flex flex-col items-end md:items-end ${idx === 0 ? 'hidden md:flex' : 'flex'}`}>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold border ${cat.bg} ${cat.text} ${cat.border} transition-colors whitespace-nowrap max-w-full justify-end`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot} flex-shrink-0`}></span>
                          <span className="break-words whitespace-normal text-right">{cat.label}</span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold border ${remark.bg} ${remark.text} ${remark.border} transition-colors max-w-full justify-end`}>
                          <span className="opacity-70 flex-shrink-0">{remark.short}</span>
                          <span className="break-words whitespace-normal text-right">{remark.label}</span>
                        </div>
                      </div>
                    </div>

                    {(event.keywords || event.hashtags || event.notes) && (
                      <div className="space-y-4 mt-4 md:mt-5">
                        <div className="grid grid-cols-1 gap-y-3">
                          {event.keywords && (
                            <div className="flex items-start gap-3 text-[14px] min-w-0">
                              <span className="font-black text-gray-400 uppercase tracking-widest text-[9px] bg-gray-50 px-2 py-1 rounded-md border border-gray-100 flex-shrink-0 mt-0.5">Keyword</span>
                              <span className="font-bold text-blue-600/80 break-words flex-1 min-w-0 whitespace-normal">{event.keywords}</span>
                            </div>
                          )}
                          {event.hashtags && (
                            <div className="flex items-start gap-3 text-[14px] min-w-0">
                              <span className="font-black text-gray-400 uppercase tracking-widest text-[9px] bg-gray-50 px-2 py-1 rounded-md border border-gray-100 flex-shrink-0 mt-0.5">Hashtag</span>
                              <span className="font-bold text-blue-600/80 italic break-words flex-1 min-w-0 whitespace-normal">{event.hashtags}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          {event.notes ? (
                            <div className="bg-[#f8fafc] rounded-2xl p-4 flex items-start gap-3 border border-gray-100 overflow-hidden flex-1 w-full">
                              <Info size={18} className="text-gray-400/60 mt-1 flex-shrink-0" strokeWidth={3} />
                              <p className="text-[14px] font-medium text-gray-600/90 whitespace-pre-wrap leading-relaxed break-words flex-1 min-w-0">{event.notes}</p>
                            </div>
                          ) : <div className="flex-1"></div>}
                          
                          {!isPast && (event.keywords || event.hashtags) && (
                            <button 
                              onClick={() => handleCopyTrending(event)}
                              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm border ${copiedId === event.id ? 'bg-emerald-500 text-white border-transparent' : 'bg-gray-900 text-white border-transparent hover:bg-gray-800 active:scale-95'}`}
                            >
                              {copiedId === event.id ? <Check size={16} /> : <Copy size={16} />}
                              {copiedId === event.id ? 'Copied!' : 'Copy for X'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#111827] font-sans pb-24 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-10 pb-16 space-y-8">
        
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 font-black uppercase tracking-tight">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#dbeafe] text-[#3b82f6] rounded-2xl flex items-center justify-center shadow-sm">
              <CalendarIcon size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[22px] md:text-[28px] text-gray-900 leading-tight">
                NamtanFilm & LUNAR Schedule
              </h1>
              <div className="text-[12px] md:text-[14px] text-gray-400 font-bold tracking-[0.05em] mt-0.5">
                By: <a 
                  href="https://linktr.ee/NamtanFilmFC" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors inline-block"
                >
                  NAMTANFILM TH OFFICIAL
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loading && <div className="text-xs font-bold text-gray-400 animate-pulse tracking-widest">Syncing...</div>}
            <button onClick={() => setIsLegendOpen(!isLegendOpen)} className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm uppercase transition-all shadow-sm border ${isLegendOpen ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'}`}>
              <Filter size={18} /> {isLegendOpen ? 'Hide Filters' : 'Show Filters'} {isLegendOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isAdmin ? (
              <button onClick={() => setIsAdmin(false)} className="w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm"><Unlock size={22} /></button>
            ) : (
              <button onClick={() => setShowLogin(true)} className="w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors shadow-sm"><Lock size={22} /></button>
            )}
          </div>
        </header>

        {isLegendOpen && (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 shadow-[0_4px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Schedule Filter System (CLICK TO FILTER)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.1em] mb-4">Artists</h4>
                <div className="space-y-2">
                  {Object.values(CATEGORIES).map(cat => (
                    <label key={cat.id} className="flex items-center cursor-pointer group">
                      <input type="checkbox" checked={filters[cat.id]} onChange={() => toggleFilter(cat.id)} className="hidden"/>
                      <div className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl transition-all duration-200 border ${filters[cat.id] ? `${cat.bg} ${cat.border} shadow-sm` : 'bg-white border-gray-100 opacity-50 grayscale'} ${filters[cat.id] ? cat.text : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.dot} flex-shrink-0`}></span>
                        <span className="text-[12px] lg:text-[13px] font-bold">{cat.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.1em] mb-4">Event Remarks</h4>
                <div className="space-y-2">
                  {Object.values(REMARKS).map(remark => (
                    <label key={remark.id} className="flex items-center cursor-pointer group">
                      <input type="checkbox" checked={remarkFilters[remark.id]} onChange={() => toggleRemarkFilter(remark.id)} className="hidden"/>
                      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 border ${remarkFilters[remark.id] ? `${remark.bg} ${remark.border} shadow-sm` : 'bg-white border-gray-100 opacity-50 grayscale'} ${remarkFilters[remark.id] ? remark.text : 'text-gray-400'}`}>
                        <span className="font-black text-[12px] lg:text-[13px] min-w-[20px] flex-shrink-0">{remark.short}</span>
                        <span className="text-[12px] lg:text-[13px] font-bold">{remark.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-800 shadow-sm"><ChevronLeft size={24} strokeWidth={2.5}/></button>
            <button 
              onClick={() => {
                setPickerYear(currentMonth.getFullYear());
                setShowDatePicker(true);
              }}
              className="group flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-50 transition-all"
            >
              <h2 className="text-2xl md:text-[26px] font-black text-[#111827] tracking-tight uppercase group-hover:text-blue-600">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <ChevronDown size={20} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-y-0.5 transition-all" />
            </button>
            <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-800 shadow-sm"><ChevronRight size={24} strokeWidth={2.5}/></button>
          </div>
          
          <div className="border border-gray-100 rounded-2xl overflow-hidden mt-4">
            <div className="grid grid-cols-7 bg-gray-100 gap-[1px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-4 bg-white text-center text-[11px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-widest">{day}</div>
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
                                <div className="font-bold text-[10px] sm:text-[11px] truncate leading-tight w-full">
                                  {remark && remark.id !== 'none' && <span className={`font-black mr-1 ${remark.text}`}>{remark.short}</span>}
                                  {event.title}
                                </div>
                                <div className="flex justify-between items-center w-full text-[9px] sm:text-[10px] font-semibold opacity-80 mt-[2px]"><span className="flex-shrink-0 whitespace-nowrap">{event.isTBA ? 'TBA' : event.time}</span><span className="truncate ml-2 text-right uppercase tracking-tight">{event.location || ''}</span></div>
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
            <h2 className="text-[20px] font-black tracking-[0.15em] uppercase text-[#111827]">
              Monthly Schedule List
            </h2>
            <span className="text-[15px] font-bold text-gray-400">{filteredEvents.length} Events Total</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 text-center text-gray-400 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
              <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-bold">No events scheduled for this month.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* CURRENT MONTH SUB-HEADER */}
              {isCurrentMonth && (
                <div className="px-2 -mb-2">
                  <span className="font-black uppercase tracking-[0.2em] text-[11px] text-blue-600/60 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100">Upcoming Events</span>
                </div>
              )}

              <div className="space-y-6">
                {upcomingGrouped.length > 0 ? (
                  renderEventListGroup(upcomingGrouped)
                ) : isCurrentMonth ? (
                  /* EMPTY STATE FOR NO MORE CURRENT UPCOMING EVENTS */
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center text-gray-400 shadow-sm border-dashed">
                    <CalendarCheck size={32} className="mx-auto mb-3 opacity-20 text-blue-500" strokeWidth={2.5} />
                    <p className="text-sm font-black uppercase tracking-[0.15em] text-gray-500">No more upcoming events currently scheduled.</p>
                    <p className="text-[11px] font-bold mt-1 text-gray-400 uppercase tracking-widest">Stay tuned for updates.</p>
                  </div>
                ) : null}
              </div>

              {isCurrentMonth && pastGrouped.length > 0 && (
                <div className="space-y-6 pt-4">
                  <button 
                    onClick={() => setShowPastEvents(!showPastEvents)}
                    className="w-full flex items-center justify-between p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                        <Clock size={18} />
                      </div>
                      <span className="font-black uppercase tracking-widest text-xs text-gray-400 group-hover:text-gray-900 transition-colors">
                        Show Past Events of {MONTHS[currentMonth.getMonth()]} ({pastCount})
                      </span>
                    </div>
                    {showPastEvents ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                  </button>

                  {showPastEvents && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                      {renderEventListGroup(pastGrouped)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDatePicker && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Select Month</h2>
              <button onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl mb-6">
              <button onClick={() => setPickerYear(pickerYear - 1)} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-600"><ChevronLeft size={24}/></button>
              <span className="text-2xl font-black text-gray-900 tracking-widest">{pickerYear}</span>
              <button onClick={() => setPickerYear(pickerYear + 1)} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-600"><ChevronRight size={24}/></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MONTHS.map((month, idx) => {
                const isSelected = currentMonth.getMonth() === idx && currentMonth.getFullYear() === pickerYear;
                return (
                  <button 
                    key={month}
                    onClick={() => jumpToDate(idx, pickerYear)}
                    className={`py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-wider transition-all border ${isSelected ? 'bg-blue-600 text-white border-transparent shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:text-blue-600'}`}
                  >
                    {month.substring(0, 3)}
                  </button>
                );
              })}
            </div>
            <button onClick={() => jumpToDate(new Date().getMonth(), new Date().getFullYear())} className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-colors">Go to Today</button>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-in zoom-in-95">
            <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-[#111827] uppercase"><Lock size={24}/> Admin Access</h2>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[13px] font-black text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-medium text-gray-800" placeholder="Enter password" autoFocus/>
              </div>
              <button type="submit" className="w-full bg-[#111827] text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-colors shadow-sm uppercase">Unlock Admin Access</button>
            </form>
          </div>
        </div>
      )}

      {viewingEvent && (() => {
        const cat = CATEGORIES[viewingEvent.categoryId];
        const remark = REMARKS[viewingEvent.remarkId];
        const eventDate = new Date(viewingEvent.date);
        const isPast = viewingEvent.date < todayStr;
        return (
          <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden relative animate-in zoom-in-95 font-black">
              <div className="px-8 pt-8 pb-4 sticky top-0 bg-white z-20 flex justify-between items-start border-b border-gray-50">
                <div className="flex items-start gap-3 pr-8">
                  <span className={`w-3.5 h-3.5 mt-2 rounded-full ${cat.dot} flex-shrink-0 shadow-sm`}></span>
                  <h2 className="text-2xl font-black text-[#000000] leading-tight uppercase tracking-tight break-words flex-1 min-w-0">{viewingEvent.title}</h2>
                </div>
                <button onClick={() => setViewingEvent(null)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-2 rounded-full transition-colors flex-shrink-0"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar font-black">
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 gap-4 text-[15px] text-gray-600 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3"><CalendarIcon size={18} strokeWidth={2.5} className="text-gray-400 flex-shrink-0" /><span>{eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                    {(viewingEvent.time || viewingEvent.isTBA) && (
                      <div className="flex items-center gap-3">
                        <Clock size={18} strokeWidth={2.5} className="text-gray-400 flex-shrink-0" />
                        {viewingEvent.isTBA ? <span className="text-orange-500">TIME TBA</span> : viewingEvent.time}
                      </div>
                    )}
                    {viewingEvent.location && (
                      <div className="flex items-start gap-3">
                        <MapPin size={18} strokeWidth={2.5} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-snug break-words flex-1 min-w-0 whitespace-normal">{viewingEvent.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row flex-wrap items-center gap-2 mb-2">
                    <span className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border ${cat.bg} ${cat.text} ${cat.border} whitespace-nowrap`}>{cat.label}</span>
                    {remark.id !== 'none' && <span className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border ${remark.bg} ${remark.text} ${remark.border} whitespace-nowrap`}>{remark.short} {remark.label}</span>}
                  </div>
                  {(viewingEvent.keywords || viewingEvent.hashtags || viewingEvent.notes) && (
                    <div className="space-y-4 pt-6 border-t border-gray-100 min-w-0">
                      {viewingEvent.keywords && (
                        <div className="flex gap-4">
                          <Tag size={16} className="text-gray-400 mt-1 flex-shrink-0" strokeWidth={3} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Keyword</p>
                            <p className="text-sm font-bold text-blue-600/90 leading-tight break-words whitespace-normal">{viewingEvent.keywords}</p>
                          </div>
                        </div>
                      )}
                      {viewingEvent.hashtags && (
                        <div className="flex gap-4">
                          <Hash size={16} className="text-gray-400 mt-1 flex-shrink-0" strokeWidth={3} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hashtags</p>
                            <p className="text-sm font-bold text-blue-600/90 italic leading-tight break-words whitespace-normal">{viewingEvent.hashtags}</p>
                          </div>
                        </div>
                      )}
                      {viewingEvent.notes && (
                        <div className="flex gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                          <Info size={16} className="text-gray-400 mt-1 flex-shrink-0" strokeWidth={3} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-[14px] font-medium text-gray-600 whitespace-pre-wrap leading-relaxed break-words">{viewingEvent.notes}</p>
                          </div>
                        </div>
                      )}

                      {!isPast && (viewingEvent.keywords || viewingEvent.hashtags) && (
                        <div className="pt-4 flex justify-end">
                          <button 
                            onClick={() => handleCopyTrending(viewingEvent)}
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm border ${copiedId === viewingEvent.id ? 'bg-emerald-500 text-white border-transparent' : 'bg-gray-900 text-white border-transparent hover:bg-gray-800 active:scale-95'}`}
                          >
                            {copiedId === viewingEvent.id ? <Check size={18} /> : <Copy size={18} />}
                            {copiedId === viewingEvent.id ? 'Copied!' : 'Copy for X'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6 sticky bottom-0 bg-white">
                    <button onClick={() => { setViewingEvent(null); openEditModal(viewingEvent); }} className="flex-1 bg-blue-50 text-blue-600 font-bold py-3.5 rounded-2xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm font-black"><Edit size={18} strokeWidth={2.5} /> Edit</button>
                    <button onClick={() => handleDelete(viewingEvent.id)} className="flex-1 bg-red-50 text-red-500 font-black py-3.5 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm font-black"><Trash2 size={18} strokeWidth={2.5} /> Delete</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showEventModal && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 relative flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10 font-black uppercase tracking-tight">
              <h2 className="text-2xl text-[#111827] flex items-center gap-3">{editingEvent ? <Edit size={24}/> : <Plus size={24}/>}{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar font-black">
              <form id="event-form" onSubmit={handleSaveEvent} className="space-y-8">
                <div>
                  <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4">Artist</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(CATEGORIES).map(cat => (
                      <div key={cat.id} onClick={() => setFormData({...formData, categoryId: cat.id})} className={`cursor-pointer border-2 rounded-2xl p-4 transition-all duration-200 flex items-center gap-3 ${formData.categoryId === cat.id ? `${cat.dateBorder} ${cat.bg} shadow-sm scale-[1.02]` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 grayscale opacity-70'}`}>
                        <span className={`w-3 h-3 rounded-full ${cat.dot} flex-shrink-0`}></span>
                        <div className={`text-[14px] font-bold ${formData.categoryId === cat.id ? cat.text : 'text-gray-600'}`}>{cat.label.split(' | ')[0]}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 font-black tracking-tight">
                  <div className="col-span-1 md:col-span-2 uppercase"><label className="block text-[13px] text-gray-400 tracking-widest mb-2">Event Title *</label><input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800" /></div>
                  <div className="uppercase"><label className="block text-[13px] text-gray-400 tracking-widest mb-2">Date *</label><input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800"/></div>
                  <div className="uppercase">
                    <div className="flex justify-between items-end mb-2 font-black"><label className="block text-[13px] text-gray-400 tracking-widest">Time</label><label className="flex items-center gap-2 text-[13px] font-bold text-gray-600 cursor-pointer"><input type="checkbox" checked={formData.isTBA} onChange={e => setFormData({...formData, isTBA: e.target.checked})} className="rounded text-blue-500 focus:ring-blue-500 border-gray-300 w-4 h-4"/>TBA</label></div>
                    <input type="time" disabled={formData.isTBA} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800 disabled:opacity-50"/>
                  </div>
                  <div className="col-span-1 md:col-span-2 uppercase"><label className="block text-[13px] text-gray-400 tracking-widest mb-2">Location</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800" /></div>
                  <div className="col-span-1 md:col-span-2 uppercase"><label className="block text-[13px] text-gray-400 tracking-widest mb-2">Event Remark</label><select value={formData.remarkId} onChange={e => setFormData({...formData, remarkId: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800">{Object.values(REMARKS).map(remark => (<option key={remark.id} value={remark.id}>{remark.label}</option>))}</select></div>
                  <div className="col-span-1 md:col-span-2 uppercase"><label className="block text-[13px] text-gray-400 tracking-widest mb-2">Keyword</label><input type="text" value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800"  /></div>
                  <div className="col-span-1 md:col-span-2 uppercase"><label className="block text-[13px] text-gray-400 tracking-widest mb-2">Hashtags</label><input type="text" value={formData.hashtags} onChange={e => setFormData({...formData, hashtags: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-bold text-gray-800" /></div>
                  <div className="col-span-1 md:col-span-2 uppercase"><label className="block text-[13px] text-gray-400 tracking-widest mb-2">Notes</label><textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-medium text-gray-800" ></textarea></div>
                </div>
              </form>
            </div>
            <div className="px-8 py-5 border-t border-gray-100 bg-white rounded-b-3xl flex justify-end gap-3 sticky bottom-0 z-10 uppercase font-black"><button type="button" onClick={() => setShowEventModal(false)} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors font-black">Cancel</button><button type="submit" form="event-form" className="px-8 py-3 bg-[#111827] text-white rounded-2xl hover:bg-gray-800 shadow-sm transition-colors font-black">{editingEvent ? 'Update Event' : 'Save Event'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
