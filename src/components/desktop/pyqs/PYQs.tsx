"use client";
import React, { useState, useEffect, useMemo } from "react";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  FileText, 
  Download, 
  BookOpen,
  History,
  AlertCircle,
  X,
  Maximize2,
  Split,
  CheckCircle2,
  Circle,
  Loader2
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getBaseAttendance } from "@/utils/attendance/attendanceLogic";

const API_BASE = "https://srm-pyq-api.onrender.com";

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department: string | null;
  semester: number | null;
}

interface Paper {
  id: string;
  title: string;
  exam_year: number | null;
  exam_term: string | null;
}

interface FileData {
  id: string;
  public_url: string | null;
}

export default function DesktopPYQs() {
  const { userData } = useApp();
  const [mounted, setMounted] = useState(false);
  const [viewingPapers, setViewingPapers] = useState<{paper: Paper, url: string}[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<Paper[]>([]);
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  
  const PROXY_BASE = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:8000";
    if (window.location.hostname === "localhost") return "http://localhost:8000";
    const backendUrls = (process.env.NEXT_PUBLIC_BACKEND_URLS || "").split(",").map(u => u.trim()).filter(Boolean);
    const prodBackend = backendUrls.find(u => u.startsWith("https"));
    return prodBackend || backendUrls[0] || "http://localhost:8000";
  }, []);

  const fetchProxied = async (path: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams({ path, ...params }).toString();
    return fetch(`${PROXY_BASE}/pyq-proxy?${query}`);
  };

  const [activeTab, setActiveTab] = useState<string | "search">("my-courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const myCourses = useMemo(() => {
    if (!userData?.courses) return [];
    
    // Build a fallback name map from timetable and marks
    const nameMap: Record<string, string> = {};
    
    // 1. From Timetable
    const schedule = userData.timetable || userData.schedule || {};
    Object.values(schedule).forEach((day: any) => {
      if (!day) return;
      Object.values(day).forEach((slot: any) => {
        if (slot && (slot.courseCode || slot.code)) {
          const code = (slot.courseCode || slot.code).split("-")[0].trim();
          const name = slot.courseTitle || slot.name || slot.course;
          if (name && !nameMap[code]) nameMap[code] = name;
        }
      });
    });

    // 2. From Marks
    if (userData.marks) {
      userData.marks.forEach((m: any) => {
        const code = (m.courseCode || m.code || "").trim();
        const name = m.courseTitle || m.title;
        if (code && name && !nameMap[code]) nameMap[code] = name;
      });
    }
    
    // Convert courses object to array and filter out non-course entries
    const courseList = Object.values(userData.courses).filter((c: any) => c && (c.courseCode || c.code));
    
    const seen = new Set();
    return courseList.reduce((acc: any[], c: any) => {
      const fullCode = (c.courseCode || c.code || "").trim();
      const code = fullCode.split("-")[0].trim();
      if (!code || seen.has(code)) return acc;
      
      seen.add(code);
      acc.push({
        id: code,
        code: code,
        title: c.courseTitle || c.title || nameMap[code] || code,
        type: c.type || "Theory",
        credits: c.credits || c.credit || 0
      });
      return acc;
    }, []);
  }, [userData]);

  const fetchPapers = async (courseCode: string) => {
    setLoading(true);
    setError(null);
    setSelectedForCompare([]);
    try {
      const res = await fetchProxied(`/v1/courses/${encodeURIComponent(courseCode)}/papers`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPapers(json.data || []);
    } catch (err: any) {
      setError("couldn't find those papers right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProxied(`/v1/courses`, { q: searchQuery, limit: 20 });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSearchResults(json.data || []);
      setActiveTab("search");
    } catch (err: any) {
      setError("search failed. check your internet?");
    } finally {
      setLoading(false);
    }
  };

  const getDownloadUrl = async (paperId: string) => {
    const res = await fetchProxied(`/v1/papers/${paperId}/files`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const files = json.data as FileData[];
    if (files.length > 0) {
      const fileId = files[0].id;
      const dlRes = await fetchProxied(`/v1/files/${fileId}/download`);
      if (!dlRes.ok) throw new Error();
      const dlJson = await dlRes.json();
      return dlJson.data.download_url as string;
    }
    throw new Error();
  };

  const handleViewPaper = async (paper: Paper) => {
    setIsFetchingFile(true);
    try {
      const url = await getDownloadUrl(paper.id);
      setViewingPapers([{ paper, url }]);
    } catch (err) {
      setError("couldn't open that one.");
    } finally {
      setIsFetchingFile(false);
    }
  };

  const handleLaunchComparison = async () => {
    if (selectedForCompare.length < 2) return;
    setIsFetchingFile(true);
    try {
      const [p1, p2] = selectedForCompare;
      const [url1, url2] = await Promise.all([getDownloadUrl(p1.id), getDownloadUrl(p2.id)]);
      setViewingPapers([{ paper: p1, url: url1 }, { paper: p2, url: url2 }]);
    } catch (err) {
      setError("failed to load comparison view.");
    } finally {
      setIsFetchingFile(false);
    }
  };

  const toggleCompareSelect = (paper: Paper) => {
    setSelectedForCompare(prev => {
      if (prev.find(p => p.id === paper.id)) return prev.filter(p => p.id !== paper.id);
      if (prev.length >= 2) return [prev[1], paper];
      return [...prev, paper];
    });
  };

  if (!mounted) return null;

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      <AnimatePresence>
        {isFetchingFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={32} className="text-theme-highlight animate-spin" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white" style={{ fontFamily: 'var(--font-montserrat)' }}>grabbing your paper...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingPapers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/95 flex flex-col"
          >
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-4 bg-black/40 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-theme-highlight" />
                <h2 className="text-xs font-black text-white lowercase tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {viewingPapers.length === 1 ? viewingPapers[0].paper.title : "Comparison View"}
                </h2>
              </div>
              <div className="w-[1px] h-3 bg-white/10" />
              <button onClick={() => setViewingPapers([])} className="p-1 hover:text-theme-secondary text-white/60 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 flex flex-row gap-1 p-1 bg-black">
              {viewingPapers.map(({ paper, url }, idx) => (
                <div key={`${paper.id}-${idx}`} className="flex-1 h-full relative rounded-xl overflow-hidden bg-white shadow-2xl border border-white/5">
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                    className="w-full h-full border-none"
                    title={paper.title}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        
      <div className="w-full h-12 border-b border-theme-border flex items-center justify-between px-8 bg-theme-surface z-20 shrink-0">
          <div className="flex bg-theme-bg p-1 rounded-xl border border-theme-border shadow-inner gap-1">
            <button onClick={() => setActiveTab("my-courses")} 
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-2 ${activeTab === "my-courses" ? 'bg-theme-text/10 text-theme-text' : 'text-theme-muted hover:bg-theme-text/5'}`}>
              <BookOpen size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>my courses</span>
            </button>
            <button onClick={() => setActiveTab("search")} 
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-2 ${activeTab === "search" ? 'bg-theme-text/10 text-theme-text' : 'text-theme-muted hover:bg-theme-text/5'}`}>
              <Search size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>search</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="search course code..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-theme-bg border border-theme-border rounded-full py-1 pl-4 pr-8 text-[10px] font-bold text-theme-text focus:outline-none focus:border-theme-highlight/50 w-44 transition-all"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              />
              <button onClick={handleSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text">
                <Search size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden min-h-0">
          <div className="w-[300px] h-full border-r border-theme-border relative shrink-0 bg-theme-surface/5">
            <ReactLenis options={{ orientation: 'vertical', smoothWheel: true }} className="absolute inset-0 overflow-y-auto no-scrollbar p-5 flex flex-col gap-2.5">
              <div className="flex items-center gap-4 mb-3 px-2">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {activeTab === "my-courses" ? "Current Semester" : "Search Results"}
                </span>
              </div>
              
              <AnimatePresence mode="popLayout">
                {(activeTab === "my-courses" ? myCourses : searchResults).map((course, idx) => (
                  <motion.div key={`${course.id}-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => {
                      setSelectedCourse(activeTab === "my-courses" ? {
                        id: (course as any).id,
                        course_code: (course as any).code,
                        course_name: (course as any).title,
                        department: null,
                        semester: null
                      } : course as Course);
                      fetchPapers(activeTab === "my-courses" ? (course as any).code : (course as Course).course_code);
                    }}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${selectedCourse?.course_code === (activeTab === "my-courses" ? (course as any).code : (course as Course).course_code) ? 'bg-theme-text/10 text-theme-text shadow-md scale-[1.02] border-theme-highlight/30' : 'bg-transparent hover:bg-theme-text/5'} border border-transparent`}
                  >
                    <span className="text-[7px] font-black uppercase tracking-widest mb-0.5 block opacity-40" style={{ fontFamily: 'var(--font-montserrat)' }}>{(course as any).code || (course as Course).course_code}</span>
                    <h3 className="text-xs font-bold lowercase truncate tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>{(course as any).title || (course as Course).course_name}</h3>
                  </motion.div>
                ))}
              </AnimatePresence>
            </ReactLenis>
          </div>

          <div className="flex-1 relative h-full bg-theme-bg">
            <ReactLenis options={{ orientation: 'vertical', smoothWheel: true }} className="absolute inset-0 overflow-y-auto no-scrollbar p-8 pt-6">
              {selectedCourse ? (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-row justify-between items-center border-b-2 pb-5 gap-8 border-theme-border">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-black text-theme-text lowercase tracking-tighter leading-[1.1] mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>{selectedCourse.course_name}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>{selectedCourse.course_code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompareMode && selectedForCompare.length === 2 && (
                        <button onClick={handleLaunchComparison}
                          className="px-3 py-1.5 bg-theme-highlight text-theme-bg rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-theme-highlight/20"
                          style={{ fontFamily: 'var(--font-montserrat)' }}>
                          <Split size={12} /> launch
                        </button>
                      )}
                      <button onClick={() => { setIsCompareMode(!isCompareMode); setSelectedForCompare([]); }}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${isCompareMode ? 'bg-theme-secondary/10 text-theme-secondary border border-theme-secondary/20' : 'bg-theme-surface border border-theme-border text-theme-text hover:bg-theme-text/5'}`}
                        style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {isCompareMode ? <X size={12} /> : <Split size={12} />}
                        {isCompareMode ? 'cancel' : 'compare'}
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3 opacity-30">
                      <Loader2 size={24} className="text-theme-text animate-spin" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-montserrat)' }}>grabbing papers...</span>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3 text-theme-secondary opacity-80">
                      <AlertCircle size={32} strokeWidth={1.5} />
                      <span className="text-sm font-bold lowercase tracking-tight" style={{ fontFamily: 'var(--font-afacad)' }}>{error}</span>
                    </div>
                  ) : papers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {papers.map((paper, idx) => {
                        const isSelected = selectedForCompare.find(p => p.id === paper.id);
                        return (
                          <div key={`${paper.id}-${idx}`} className={`bg-theme-surface border-2 rounded-[24px] p-5 flex flex-col gap-5 transition-all hover:scale-[1.02] shadow-sm group ${isSelected ? 'border-theme-highlight bg-theme-highlight/[0.03]' : 'border-theme-border hover:border-theme-highlight/30'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="p-2.5 rounded-xl bg-theme-bg text-theme-highlight group-hover:bg-theme-highlight group-hover:text-theme-bg transition-colors">
                                <FileText size={16} />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xs font-bold text-theme-text lowercase tracking-tight leading-tight line-clamp-2 mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>{paper.title}</h3>
                              <div className="flex flex-wrap gap-1">
                                <span className="px-2 py-0.5 rounded-full bg-theme-highlight/10 text-[8px] font-black uppercase text-theme-highlight tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{paper.exam_year || "????"}</span>
                                <span className="px-2 py-0.5 rounded-full bg-theme-text/5 text-[8px] font-black uppercase text-theme-muted tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{paper.exam_term || "UNKNOWN"}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isCompareMode ? (
                                <button onClick={() => toggleCompareSelect(paper)}
                                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isSelected ? 'bg-theme-highlight text-theme-bg shadow-lg' : 'bg-theme-surface border border-theme-border text-theme-text hover:bg-theme-text/5'}`}
                                  style={{ fontFamily: 'var(--font-montserrat)' }}>
                                  {isSelected ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                  {isSelected ? 'selected' : 'select'}
                                </button>
                              ) : (
                                <>
                                  <button onClick={() => handleViewPaper(paper)}
                                    className="flex-1 py-2.5 rounded-xl bg-theme-highlight text-theme-bg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
                                    style={{ fontFamily: 'var(--font-montserrat)' }}>
                                    <Maximize2 size={12} /> view
                                  </button>
                                  <button onClick={async () => { try { const url = await getDownloadUrl(paper.id); window.open(url, "_blank"); } catch { setError("couldn't download that one."); } }}
                                    className="p-2.5 rounded-xl bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text transition-all" title="Download">
                                    <Download size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 gap-3 opacity-30 text-center">
                      <History size={40} strokeWidth={1} />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>nothing here gng</p>
                        <p className="text-[7px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>zero papers for this one.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-32 gap-6 text-center opacity-30">
                  <motion.div 
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="relative"
                  >
                    <BookOpen size={100} strokeWidth={0.5} className="text-theme-text" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-black lowercase tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>pick a course and let's lock in.</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] mt-2" style={{ fontFamily: 'var(--font-montserrat)' }}>search or pick from your semester list</p>
                  </div>
                </div>
              )}
            </ReactLenis>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 pointer-events-none z-0 text-right">
          <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '48px', letterSpacing: '-4px' }}>pyqs</h1>
        </div>
    </div>
  );
}
