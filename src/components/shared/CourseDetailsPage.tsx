"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface CourseDetailsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseDetailsPage({
  isOpen,
  onClose,
}: CourseDetailsPageProps) {
  const { userData } = useApp();
  const courses = userData?.courses || {};
  
  const groupedCourses = Object.values(courses).reduce((acc: Record<string, any[]>, current: any) => {
    const creds = current.credits || "0";
    if (!acc[creds]) acc[creds] = [];
    if (!acc[creds].find(c => c.code === current.code)) {
      acc[creds].push(current);
    }
    return acc;
  }, {});

  const sortedCreditGroups = Object.keys(groupedCourses).sort((a, b) => Number(b) - Number(a));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-theme-bg text-theme-text z-[2000] flex flex-col"
        >
          <div className="pt-12 pb-4 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
               <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-6 h-6" strokeWidth={2.5} />
              </button>
              <h1 className="text-2xl font-bold tracking-tighter">Courses</h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-2 pb-40">
            {sortedCreditGroups.length > 0 ? (
              sortedCreditGroups.map((credits) => (
                <div key={credits} className="mb-12">
                  <div className="flex items-center gap-4 px-2 mb-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text/30 whitespace-nowrap">
                      {credits} credit courses
                    </h2>
                    <div className="h-[1px] flex-1 bg-theme-border opacity-40" />
                  </div>
                  
                  <div className="space-y-4">
                    {groupedCourses[credits].map((course, idx) => (
                      <motion.div
                        key={course.code}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative px-7 pt-5 pb-6 rounded-[32px] bg-theme-surface border border-theme-border overflow-hidden flex flex-col min-h-[170px]"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text/30">
                            {course.code}
                          </span>
                          <div className="bg-theme-text-10 h-6 px-3 rounded-full flex items-center justify-center">
                            <span 
                              className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap leading-none translate-y-[0.5px] text-theme-muted"
                              style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                            >
                              {course.raw_type || course.type}
                            </span>
                          </div>
                        </div>

                        <h3 
                          className="text-2xl font-black leading-[1.05] tracking-tighter lowercase line-clamp-2 mb-auto"
                          style={{ fontFamily: "var(--font-montserrat)" }}
                        >
                          {course.name.toLowerCase()}
                        </h3>

                        <div className="flex justify-between items-center mt-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-theme-bg flex items-center justify-center text-theme-text/40 border border-theme-border shrink-0">
                              <MapPin size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] text-theme-text/30 uppercase font-black tracking-[0.15em] leading-none mb-1">Venue</span>
                              <span className="text-[13px] font-bold uppercase leading-none">{course.room || "N/A"}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end text-right ml-4 min-w-0">
                             <span className="text-[8px] text-theme-text/30 uppercase font-black tracking-[0.15em] mb-1 leading-none">Faculty</span>
                             <span className="text-[13px] font-bold capitalize leading-none truncate w-full">
                               {course.faculty.toLowerCase()}
                             </span>
                          </div>
                        </div>
                        
                        <div className="absolute top-0 right-0 w-32 h-32 bg-theme-highlight/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-theme-muted space-y-4">
                 <BookOpen size={48} opacity={0.2} />
                 <p className="text-sm font-medium">No courses found.</p>
              </div>
            )}
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-theme-bg via-theme-bg to-transparent pointer-events-none z-10">
             <button
              onClick={onClose}
              className="w-full py-5 rounded-[24px] bg-theme-text text-theme-bg font-black uppercase tracking-[0.2em] text-sm active:scale-95 transition-all pointer-events-auto shadow-2xl"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Back to Settings
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
