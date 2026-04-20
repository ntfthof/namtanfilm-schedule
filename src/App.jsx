import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Edit, 
  Trash2, 
  Plus, 
  Lock,
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
  CalendarCheck,
  Coffee
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

// --- SAFE HELPER FUNCTIONS (Prevents React Script Errors) ---
const getCategory = (id) => CATEGORIES[id] || CATEGORIES.namtan;
const getRemark = (id) => REMARKS[id] || REMARKS.open;

// SAFELY PARSES STRINGS INTO DATES WITHOUT CRASHING
const parseSafeDate = (dateStr) => {
  try {
    const str = String(dateStr || '');
    const parts = str.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d);
      }
    }
  } catch (e) {
    console.error("Date parse error", e);
  }
  return new Date(); // Fallback to today to avoid crashes
};

// NEW: VISUAL UI FORMATTER FOR HASHTAGS
const formatDisplayHashtags = (hashtags) => {
  if (!hashtags) return '';
  const tags = String(hashtags).split(/[\s,]+/).filter(t => t.trim());
  return tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLegendOpen, setIsLegendOpen] = useState(false); 
  
  // NEW: Secret Ninja Clicks for Admin
  const [secretClicks, setSecretClicks] = useState(0);

  // NEW: Swipe & Mouse Drag Gestures for Mobile and Desktop
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const MIN_SWIPE_DISTANCE = 50;

  // Quick Date Jump State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  
  // Active Archive & Week View State
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(null);
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

  // Handle Ninja Login Clicks Reset Timer
  useEffect(() => {
    let timeout;
    if (secretClicks > 0 && secretClicks < 5) {
      timeout = setTimeout(() => setSecretClicks(0), 2000);
    }
    return () => clearTimeout(timeout);
  }, [secretClicks]);

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
    
    // Safety check forcing string conversion
    const timeA = String(a.time || '');
    const timeB = String(b.time || '');
    return timeA.localeCompare(timeB);
  };

  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // ALWAYS VISIBLE TODAY EVENTS
  const todaysEvents = useMemo(() => {
    return events
      .filter(e => {
        const catId = getCategory(e.categoryId).id;
        const remId = getRemark(e.remarkId).id;
        return e.date === todayStr && filters[catId] && remarkFilters[remId];
      })
      .sort(sortEventsByTime);
  }, [events, todayStr, filters, remarkFilters]);

  const filteredEvents = useMemo(() => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();

    return events
      .filter(event => {
        const eventDateStr = String(event.date || '');
        const parts = eventDateStr.split('-');
        let matchesMonth = false;
        
        if (parts.length === 3) {
          const eYear = Number(parts[0]);
          const eMonth = Number(parts[1]);
          matchesMonth = eYear === year && (eMonth - 1) === monthIndex;
        }

        const catId = getCategory(event.categoryId).id;
        const remId = getRemark(event.remarkId).id;
        return filters[catId] && remarkFilters[remId] && matchesMonth;
      })
      .sort((a, b) => {
        const dateA = String(a.date || '');
        const dateB = String(b.date || '');
        const dateDiff = dateA.localeCompare(dateB);
        if (dateDiff !== 0) return dateDiff;
        return sortEventsByTime(a, b);
      });
  }, [events, filters, remarkFilters, currentMonth]);

  // SMART SWIPE LOGIC: Get all events happening on the exact same day as the currently viewed event
  const sameDayEvents = useMemo(() => {
    if (!viewingEvent) return [];
    return events
      .filter(e => {
        const catId = getCategory(e.categoryId).id;
        const remId = getRemark(e.remarkId).id;
        return e.date === viewingEvent.date && filters[catId] && remarkFilters[remId];
      })
      .sort(sortEventsByTime);
  }, [viewingEvent, events, filters, remarkFilters]);

  // SAFE TOUCH & MOUSE HANDLERS
  const handleDragStart = (clientX) => {
    setDragStart(clientX);
    setDragEnd(null);
  };

  const handleDragMove = (clientX) => {
    if (dragStart !== null) {
      setDragEnd(clientX);
    }
  };

  const handleDragEnd = () => {
    if (!dragStart || !dragEnd) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const distance = dragStart - dragEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if ((isLeftSwipe || isRightSwipe) && sameDayEvents.length > 1) {
      const currentIndex = sameDayEvents.findIndex(e => e.id === viewingEvent.id);
      if (isLeftSwipe && currentIndex !== -1 && currentIndex < sameDayEvents.length - 1) {
        setViewingEvent(sameDayEvents[currentIndex + 1]);
      }
      if (isRightSwipe && currentIndex > 0) {
        setViewingEvent(sameDayEvents[currentIndex - 1]);
      }
    }
    
    setDragStart(null);
    setDragEnd(null);
  };

  // Grouping logic with Active Archive
  const { upcomingGrouped, pastGrouped, isCurrentMonth, pastCount, upcomingCount } = useMemo(() => {
    const today = new Date();
    const tStr = formatLocalDate(today);
    const selectedYear = currentMonth.getFullYear();
    const selectedMonth = currentMonth.getMonth();
    const isCurrent = today.getFullYear() === selectedYear && today.getMonth() === selectedMonth;

    const upcoming = {};
    const past = {};
    let pCount = 0;
    let uCount = 0;

    filteredEvents.forEach(event => {
      const eventDateStr = String(event.date || '');
      if (isCurrent) {
        if (eventDateStr >= tStr) {
          if (!upcoming[eventDateStr]) upcoming[eventDateStr] = [];
          upcoming[eventDateStr].push(event);
          uCount++;
        } else {
          if (!past[eventDateStr]) past[eventDateStr] = [];
          past[eventDateStr].push(event);
          pCount++;
        }
      } else {
        if (!upcoming[eventDateStr]) upcoming[eventDateStr] = [];
        upcoming[eventDateStr].push(event);
        uCount++;
      }
    });

    return { 
      upcomingGrouped: Object.entries(upcoming).sort((a, b) => String(a[0]).localeCompare(String(b[0]))), 
      pastGrouped: Object.entries(past).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      isCurrentMonth: isCurrent,
      pastCount: pCount,
      upcomingCount: uCount
    };
  }, [filteredEvents, currentMonth]);

  const handleSecretClick = () => {
    setSecretClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowLogin(true);
        return 0;
      }
      return next;
    });
  };

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
    if (event.keywords) parts.push(String(event.keywords).trim());
    if (event.hashtags) {
      // Split the tags by spaces or commas
      const tags = String(event.hashtags).split(/[\s,]+/).filter(t => t.trim());
      // Add the # to each tag
      const formattedTags = tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`);
      // Join them together with a SPACE instead of stacking them
      parts.push(formattedTags.join(' ')); 
    }
    
    // Join the Keyword (top line) and the Hashtag group (bottom line) with ONE new line
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

  const handleDuplicate = (eventToCopy) => {
    setFormData({
      title: eventToCopy.title || '',
      categoryId: eventToCopy.categoryId || 'namtan',
      date: eventToCopy.date || '',
      time: eventToCopy.time || '',
      isTBA: eventToCopy.isTBA || false,
      location: eventToCopy.location || '',
      remarkId: eventToCopy.remarkId || 'open',
      keywords: eventToCopy.keywords || '',
      hashtags: eventToCopy.hashtags || '',
      notes: eventToCopy.notes || ''
    });
    setEditingEvent(null); // Force it to act like a new creation
    setViewingEvent(null); // Close the viewing modal
    setShowEventModal(true); // Open the creation modal
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

  const nextMonth = () => { 
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); 
    setSelectedWeekIdx(null); // Reset week view
  };
  
  const prevMonth = () => { 
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); 
    setSelectedWeekIdx(null); // Reset week view
  };
  
  const jumpToDate = (monthIdx, year) => {
    setCurrentMonth(new Date(year, monthIdx, 1));
    setShowDatePicker(false);
    setShowPastEvents(false); 
    setSelectedWeekIdx(null); // Reset week view
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

  // Option A: Split calendar days into 7-day week chunks for the filter pills
  const calendarWeeks = useMemo(() => {
    const wks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      wks.push(calendarDays.slice(i, i + 7));
    }
    return wks;
  }, [calendarDays]);

  const getEventsForDay = (date) => {
    if (!date) return [];
    const dateStr = formatLocalDate(date);
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const renderEventListGroup = (groupedData) => {
    return groupedData.map(([dateStr, dayEvents]) => {
      // Safe Date Parsing Replacement
      const eventDate = parseSafeDate(dateStr || formatLocalDate(new Date()));
      const firstEventTheme = getCategory(dayEvents[0].categoryId);

      return (
        <div key={dateStr} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-6 md:p-8">
          <div className="flex flex-col gap-0">
            {dayEvents.map((event, idx) => {
              const cat = getCategory(event.categoryId);
              const remark = getRemark(event.remarkId);

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
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cat.bg} ${cat.text} ${cat.border} transition-colors whitespace-nowrap max-w-full justify-end`}>
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
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold border ${cat.bg} ${cat.text} ${cat.border} transition-colors whitespace-nowrap max-w-full justify-end`}>
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
                              {/* 1. APPLIED TO LIST VIEW UI HERE */}
                              <span className="font-bold text-blue-600/80 italic break-words flex-1 min-w-0 whitespace-normal">{formatDisplayHashtags(event.hashtags)}</span>
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
                          
                          {/* Safe check for isPast replaced with strict string compare */}
                          {(dateStr >= todayStr) && (event.keywords || event.hashtags) && (
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
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-6 pb-16 flex flex-col gap-5 md:gap-7">
        
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6 font-black uppercase tracking-tight">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#dbeafe] text-[#3b82f6] rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <CalendarIcon size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              {/* ADMIN SECRET LOGIN: Tap Title 5 Times */}
              <h1 
                onClick={handleSecretClick}
                className="text-[22px] md:text-[28px] text-gray-900 leading-tight cursor-pointer select-none touch-manipulation"
                title="NamtanFilm Schedule"
              >
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

            {/* ADMIN LOGOUT BUTTON: Only visible when logged in! */}
            {isAdmin && (
              <button 
                onClick={() => setIsAdmin(false)} 
                className="px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black text-sm uppercase transition-all shadow-sm border border-red-100 hover:bg-red-100 hover:border-red-200"
              >
                Log Out
              </button>
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

        {/* --- HAPPENING TODAY SECTION (HORIZONTAL SWIPE) --- */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            {todaysEvents.length > 0 ? (
              <>
                <span className="relative flex h-3 w-3 mt-[-2px]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h2 className="text-[16px] md:text-lg font-black tracking-widest uppercase text-gray-900">Happening Today</h2>
                <span className="text-[10px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md uppercase tracking-widest ml-2">{todaysEvents.length} Event{todaysEvents.length !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <Coffee size={18} className="text-gray-400" strokeWidth={2.5}/>
                <h2 className="text-[15px] md:text-[16px] font-black tracking-widest uppercase text-gray-500">Happening Today</h2>
              </>
            )}
          </div>

          {todaysEvents.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 custom-scrollbar">
              {todaysEvents.map(event => {
                const cat = getCategory(event.categoryId);
                const remark = getRemark(event.remarkId);
                
                return (
                  <div 
                    key={event.id} 
                    onClick={() => setViewingEvent(event)}
                    className={`flex-shrink-0 ${todaysEvents.length === 1 ? 'w-full' : 'w-[85vw]'} sm:w-[320px] snap-center bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex flex-col gap-4`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black border ${cat.bg} ${cat.text} ${cat.border}`}>
                          {cat.label.split(' | ')[0]}
                        </div>
                        {remark && (
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black border ${remark.bg} ${remark.text} ${remark.border}`}>
                            {remark.short}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-black text-gray-400 flex items-center gap-1.5 uppercase tracking-widest flex-shrink-0 ml-2">
                        <Clock size={13} strokeWidth={3}/> {event.isTBA ? 'TBA' : event.time}
                      </span>
                    </div>
                    
                    <h3 className="text-[17px] font-black text-gray-900 leading-snug line-clamp-2">{event.title}</h3>
                    
                    {/* NEW SECTION: Location, Tags, Notes Prompt, and Copy Button grouped together at bottom with even spacing */}
                    <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-gray-50">
                      
                      {/* 1. Location */}
                      {event.location && (
                        <div className="flex items-start gap-2 text-[12px] font-bold text-gray-500">
                          <MapPin size={15} className="text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      {/* 2. Keyword */}
                      {event.keywords && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag size={14} className="text-gray-400 flex-shrink-0" strokeWidth={2.5} />
                          <span className="text-[11px] font-bold text-blue-600/80 truncate">
                            {event.keywords}
                          </span>
                        </div>
                      )}

                      {/* 3. Hashtags */}
                      {event.hashtags && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Hash size={14} className="text-gray-400 flex-shrink-0" strokeWidth={2.5} />
                          {/* 2. APPLIED TO HAPPENING TODAY CARD HERE */}
                          <span className="text-[11px] font-bold text-blue-600/80 truncate">
                            {formatDisplayHashtags(event.hashtags)}
                          </span>
                        </div>
                      )}

                      {/* 4. Notes Prompt */}
                      {event.notes && (
                        <div className="flex items-center gap-2 text-[12px] font-bold text-blue-500/90">
                          <Info size={15} className="flex-shrink-0" strokeWidth={2.5} />
                          <span className="italic">Click to see notes...</span>
                        </div>
                      )}
                      
                      {/* 5. Copy Button */}
                      {(event.keywords || event.hashtags) && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevents the card from opening when copying
                            handleCopyTrending(event); 
                          }}
                          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copiedId === event.id ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'}`}
                          title="Copy full trending tags"
                        >
                          {copiedId === event.id ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={3} />}
                          {copiedId === event.id ? 'Copied to Clipboard' : 'Copy Trending Tags'}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-2">
              <div className="bg-white rounded-[2rem] border border-gray-100 p-6 flex items-center gap-4 shadow-sm opacity-70">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <CalendarIcon size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-gray-900 tracking-tight">No Official Schedule</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Take a break and rest! 🤍❤️‍🩹</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* --- END HAPPENING TODAY --- */}

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
              {calendarWeeks.map((week, wIdx) => {
                if (selectedWeekIdx !== null && selectedWeekIdx !== wIdx) return null;
                
                return (
                  <React.Fragment key={wIdx}>
                    {week.map((date, dIdx) => {
                      const i = wIdx * 7 + dIdx;
                      const dayEvents = getEventsForDay(date);
                      const isToday = date && date.toDateString() === new Date().toDateString();
                      const isSelectedWeek = selectedWeekIdx === wIdx;

                      // RESTORED: Parent container onClick for Admins to easily add events by tapping the background
                      return (
                        <div 
                          key={i} 
                          onClick={() => { if(date && isAdmin) openAddModal(formatLocalDate(date)) }}
                          className={`min-h-[140px] md:min-h-[160px] lg:min-h-[200px] p-2 transition-colors flex flex-col ${!date ? 'bg-white' : isSelectedWeek ? 'bg-blue-50/30 ring-1 ring-blue-100 ring-inset' : isToday ? 'bg-[#fffbeb]' : 'bg-white'} ${date && isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        >
                          {date && (
                            <div className="flex flex-col h-full">
                              <div className="mb-2 flex justify-start">
                                <span className={`text-[12px] sm:text-[13px] font-bold flex items-center justify-center px-2 py-0.5 rounded-lg min-w-[28px] ${isSelectedWeek ? 'bg-blue-500 text-white shadow-sm' : isToday ? 'bg-[#60a5fa] text-white shadow-sm' : 'text-gray-400'}`}>
                                  {date.getDate()}
                                </span>
                              </div>

                              <div className="space-y-1.5 flex-1">
                                {dayEvents.map(event => {
                                  const cat = getCategory(event.categoryId);
                                  const remark = getRemark(event.remarkId);
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
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 px-2 gap-4">
            <h2 className="text-[20px] font-black tracking-[0.15em] uppercase text-[#111827]">
              Monthly Schedule List
            </h2>
            <span className="text-[15px] font-bold text-gray-400 flex-shrink-0">{filteredEvents.length} Events Total</span>
          </div>

          {/* --- WEEK FILTER PILLS --- */}
          <div className="flex overflow-x-auto gap-2 pb-4 mb-2 custom-scrollbar px-2">
            <button 
              onClick={() => setSelectedWeekIdx(null)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedWeekIdx === null ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
            >
              ALL
            </button>
            {calendarWeeks.map((week, idx) => {
              const validDays = week.filter(d => d !== null);
              if (validDays.length === 0) return null; // skip empty weeks at start/end of month
              return (
                <button 
                  key={idx}
                  onClick={() => setSelectedWeekIdx(idx)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedWeekIdx === idx ? 'bg-blue-600 text-white shadow-sm border border-transparent' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                >
                  WK {idx + 1}
                </button>
              );
            })}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 text-center text-gray-400 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
              <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-bold">No events scheduled for this month.</p>
            </div>
          ) : selectedWeekIdx !== null ? (
            /* --- FOCUS MODE: SPECIFIC WEEK VIEW --- */
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="relative flex items-center bg-blue-50 border border-blue-100 p-5 sm:p-6 rounded-[2rem] shadow-sm">
                 <button 
                    onClick={() => setSelectedWeekIdx(null)} 
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 text-blue-400 hover:text-blue-700 bg-white hover:bg-blue-100 p-1.5 sm:p-2 rounded-full transition-all shadow-sm border border-blue-100 active:scale-95"
                    title="Close Focus Mode"
                 >
                    <X size={16} strokeWidth={3} />
                 </button>
                 <div className="flex items-center gap-4 pr-8 sm:pr-12">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-[16px] shadow-md flex-shrink-0">
                       WK {selectedWeekIdx + 1}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                       <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">
                         Focus Mode : Week View
                       </span>
                       <div className="flex items-center gap-3 flex-wrap mt-0.5">
                         <span className="text-[14px] sm:text-[16px] font-black text-blue-900 tracking-tight">
                            {(() => {
                              const currentWeek = calendarWeeks[selectedWeekIdx] || [];
                              const weekDates = currentWeek.filter(d => d);
                              if (weekDates.length === 0) return '';
                              const start = weekDates[0];
                              const end = weekDates[weekDates.length - 1];
                              return `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`;
                            })()}
                         </span>
                         {(() => {
                            const currentWeek = calendarWeeks[selectedWeekIdx] || [];
                            const targetDates = currentWeek.filter(d => d).map(formatLocalDate);
                            const count = filteredEvents.filter(e => targetDates.includes(String(e.date || ''))).length;
                            return (
                              <span className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm">
                                {count} Event{count !== 1 ? 's' : ''}
                              </span>
                            );
                         })()}
                       </div>
                    </div>
                 </div>
              </div>

              {(() => {
                 const currentWeek = calendarWeeks[selectedWeekIdx] || [];
                 const targetDates = currentWeek.filter(d => d).map(formatLocalDate);
                 const viewEvents = filteredEvents.filter(e => targetDates.includes(String(e.date || '')));
                 
                 if (viewEvents.length === 0) {
                    return (
                       <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center text-gray-400 shadow-sm border-dashed">
                          <CalendarIcon size={32} className="mx-auto mb-3 opacity-20 text-blue-500" strokeWidth={2.5} />
                          <p className="text-sm font-black uppercase tracking-[0.15em] text-gray-500">
                            No events scheduled in this week.
                          </p>
                          <p className="text-[11px] font-bold mt-1 text-gray-400 uppercase tracking-widest">Select another week or show full month.</p>
                       </div>
                    );
                 }
                 
                 // Group the filtered events by date so we can reuse the render logic cleanly
                 const viewGrouped = {};
                 viewEvents.forEach(e => {
                   const eventDateStr = String(e.date || '');
                   if (!viewGrouped[eventDateStr]) viewGrouped[eventDateStr] = [];
                   viewGrouped[eventDateStr].push(e);
                 });
                 const sortedViewGrouped = Object.entries(viewGrouped).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
                 
                 return renderEventListGroup(sortedViewGrouped);
              })()}
            </div>
          ) : (
            /* --- DEFAULT MODE: UPCOMING / PAST ARCHIVE --- */
            <div className="space-y-4">
              {/* CURRENT MONTH SUB-HEADER */}
              {isCurrentMonth && (
                <div className="px-2 -mb-2">
                  <span className="font-black uppercase tracking-[0.2em] text-[11px] text-blue-600/60 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100">
                    Upcoming Events ({upcomingCount})
                  </span>
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
                <div className="space-y-6">
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
        const cat = getCategory(viewingEvent.categoryId);
        const remark = getRemark(viewingEvent.remarkId);
        
        // SAFE DATE FIX: Parses the string securely and avoids 'Invalid Date' crashes
        const eventDateStr = String(viewingEvent.date || todayStr);
        const eventDate = parseSafeDate(eventDateStr);

        // Where am I in the list of events for today?
        const currentIndex = sameDayEvents.findIndex(e => e.id === viewingEvent.id);

        return (
          <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            
            {/* ADDED SWIPE & MOUSE GESTURE HANDLERS TO MODAL CONTAINER */}
            <div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-w-[95vw] flex flex-col h-auto max-h-[90vh] overflow-hidden relative animate-in zoom-in-95 font-black"
              onTouchStart={(e) => { if (e.targetTouches?.length > 0) handleDragStart(e.targetTouches[0].clientX); }}
              onTouchMove={(e) => { if (e.targetTouches?.length > 0) handleDragMove(e.targetTouches[0].clientX); }}
              onTouchEnd={handleDragEnd}
              onMouseDown={(e) => handleDragStart(e.clientX)}
              onMouseMove={(e) => handleDragMove(e.clientX)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              
              {/* SMART SWIPE DOTS NAVIGATION: Only visible if multiple events exist today */}
              {sameDayEvents.length > 1 && (
                <div className="flex justify-center gap-2 pt-6 pb-2 bg-white z-40">
                  {sameDayEvents.map((evt, idx) => (
                    <div 
                      key={evt.id} 
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-[#111827] scale-[1.3]' : 'bg-gray-200'}`} 
                    />
                  ))}
                </div>
              )}

              {/* Header adjusts padding based on whether dots are present */}
              <div className={`px-8 ${sameDayEvents.length > 1 ? 'pt-2' : 'pt-8'} pb-4 bg-white border-b border-gray-50 flex justify-between items-start flex-nowrap z-30`}>
                <div className="flex items-start gap-3 pr-4 min-w-0 flex-1">
                  <span className={`w-3.5 h-3.5 mt-2 rounded-full ${cat.dot} flex-shrink-0 shadow-sm`}></span>
                  <h2 className="text-2xl font-black text-[#000000] leading-tight uppercase tracking-tight break-words flex-1 min-w-0">
                    {viewingEvent.title}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* LAPTOP/PC ONLY: Explicit Next/Prev Buttons */}
                  {sameDayEvents.length > 1 && (
                    <div className="hidden sm:flex items-center gap-1 bg-gray-50 p-1 rounded-2xl shadow-sm border border-gray-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); if (currentIndex > 0) setViewingEvent(sameDayEvents[currentIndex - 1]); }}
                        disabled={currentIndex === 0}
                        className={`p-1.5 rounded-xl transition-colors ${currentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                        title="Previous Event"
                      >
                        <ChevronLeft size={16} strokeWidth={3}/>
                      </button>
                      <div className="w-px h-4 bg-gray-200"></div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if (currentIndex < sameDayEvents.length - 1) setViewingEvent(sameDayEvents[currentIndex + 1]); }}
                        disabled={currentIndex === sameDayEvents.length - 1}
                        className={`p-1.5 rounded-xl transition-colors ${currentIndex === sameDayEvents.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                        title="Next Event"
                      >
                        <ChevronRight size={16} strokeWidth={3}/>
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setViewingEvent(null)} 
                    className="text-gray-400 hover:text-gray-800 bg-gray-50 p-2.5 rounded-2xl transition-colors shadow-sm border border-gray-100"
                  >
                    <X size={20} strokeWidth={2.5}/>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar font-black">
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 gap-4 text-[15px] text-gray-600 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3"><CalendarIcon size={18} strokeWidth={2.5} className="text-gray-400 flex-shrink-0" /><span>{eventDate.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
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
                            {/* 3. APPLIED TO EVENT MODAL HERE */}
                            <p className="text-sm font-bold text-blue-600/90 italic leading-tight break-words whitespace-normal">{formatDisplayHashtags(viewingEvent.hashtags)}</p>
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

                      {/* Safe String Checks for the past event evaluation */}
                      {(String(viewingEvent.date || '') >= todayStr) && (viewingEvent.keywords || viewingEvent.hashtags) && (
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

                {/* ADMIN ACTIONS: Now with Duplicate Button */}
                {isAdmin && (
                  <div className="flex gap-2 pt-6 border-t border-gray-100 mt-6 sticky bottom-0 bg-white">
                    <button onClick={() => { setViewingEvent(null); openEditModal(viewingEvent); }} className="flex-1 bg-blue-50 text-blue-600 font-bold py-3.5 rounded-2xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm font-black text-[13px] uppercase tracking-wider">
                      <Edit size={16} strokeWidth={2.5} /> Edit
                    </button>
                    <button onClick={() => handleDuplicate(viewingEvent)} className="flex-1 bg-emerald-50 text-emerald-600 font-bold py-3.5 rounded-2xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 shadow-sm font-black text-[13px] uppercase tracking-wider">
                      <Copy size={16} strokeWidth={2.5} /> Copy
                    </button>
                    <button onClick={() => handleDelete(viewingEvent.id)} className="flex-1 bg-red-50 text-red-500 font-black py-3.5 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm font-black text-[13px] uppercase tracking-wider">
                      <Trash2 size={16} strokeWidth={2.5} /> Delete
                    </button>
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
