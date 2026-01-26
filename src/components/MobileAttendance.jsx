import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, animate, LayoutGroup } from 'framer-motion'
import { AlertCircle, Zap, Calendar, X } from 'lucide-react'
import { flavorText } from '../utils/flavortext'

const Counter = ({ value, color }) => {
  const nodeRef = useRef()
  const prevValue = useRef(0)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => {
        node.textContent = Math.floor(v) + '%'
      }
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value])

  return <span ref={nodeRef} className={color} />
}

const MarginCounter = ({ value, color }) => {
  const nodeRef = useRef()
  const prevValue = useRef(0)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => {
        node.textContent = Math.floor(v)
      }
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value])

  return <span ref={nodeRef} className={color} />
}

const MobileAttendance = ({ data }) => {
  const rawAttendance = Array.isArray(data?.attendance)
    ? data.attendance
    : []

  const sortedAttendance = useMemo(() => {
    return rawAttendance
      .map((subject, index) => {
        const pct = parseFloat(subject?.percent || '0')
        let category =
          pct < 75 ? 'cooked' : pct >= 85 ? 'safe' : 'danger'
        const list =
          flavorText.header?.[category] ||
          flavorText.header?.danger ||
          ['...']
        const stableBadge =
          list[Math.floor(Math.random() * list.length)].toLowerCase()

        return {
          id: index,
          title: String(subject?.title || 'unknown'),
          code: String(subject?.code || ''),
          percentage: String(subject?.percent || '0'),
          conducted: parseInt(subject?.conducted || 0),
          present:
            parseInt(subject?.conducted || 0) -
            parseInt(subject?.absent || 0),
          badge: category,
          tagline: stableBadge
        }
      })
      .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage))
  }, [rawAttendance])

  const [selectedId, setSelectedId] = useState(null)
  const [predictMode, setPredictMode] = useState(false)
  const [introMode, setIntroMode] = useState(true)
  const itemRefs = useRef([])

  const [bunkMode, setBunkMode] = useState(true)
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 604800000).toISOString().split('T')[0]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroMode(false)
    }, 900)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (sortedAttendance.length > 0 && selectedId === null) {
      setSelectedId(sortedAttendance[0].id)
    }
  }, [sortedAttendance])

  const handleScroll = e => {
    if (predictMode || introMode) return
    const container = e.target
    const triggerZone = container.getBoundingClientRect().top + 60

    let closestItem = null
    let minDistance = Infinity

    itemRefs.current.forEach((el, index) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const distance = Math.abs(triggerZone - rect.top)
      if (distance < minDistance) {
        minDistance = distance
        closestItem = sortedAttendance[index].id
      }
    })

    if (closestItem !== null && closestItem !== selectedId) {
      setSelectedId(closestItem)
      if (navigator.vibrate) navigator.vibrate(12)
    }
  }

  const activeSubject =
    sortedAttendance.find(s => s.id === selectedId) ||
    sortedAttendance[0]

  const getStatus = (pct, conducted, present) => {
    const p = parseFloat(pct)
    if (p >= 75) {
      const margin = Math.floor(present / 0.75 - conducted)
      return {
        val: Math.max(0, margin),
        label: 'margin',
        safe: true,
        textColor: 'text-[#050505]',
        lineColor: 'bg-[#050505]'
      }
    }
    const needed = Math.ceil((0.75 * conducted - present) / 0.25)
    return {
      val: Math.max(0, needed),
      label: 'recover',
      safe: false,
      textColor: 'text-[#050505]',
      lineColor: 'bg-white'
    }
  }

  const currentStat = getStatus(
    activeSubject.percentage,
    activeSubject.conducted,
    activeSubject.present
  )

  if (sortedAttendance.length === 0) return null

  return (
    <motion.div
      initial={{ x: '-20%' }}
      animate={{ x: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="h-[100dvh] w-full flex flex-col bg-[#f5f6fc] text-[#050505] font-sans relative overflow-hidden"
    >
      <LayoutGroup>
        <motion.div
          layout
          className={`w-full relative z-30 shadow-xl overflow-hidden flex flex-col ${
            introMode ? 'fixed inset-0 h-full' : 'h-[70%]'
          }`}
          animate={{
            backgroundColor: currentStat.safe ? '#ceff1c' : '#ff003c'
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
            }}
          />

          <AnimatePresence>
            {introMode ? (
              <motion.div
                key="intro"
                transition={{ duration: 0.35, ease: 'easeOut' }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 flex flex-col justify-between p-8"
              >
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-6xl font-black lowercase tracking-tighter text-[#050505] text-center mt-20"
                  style={{ fontFamily: 'Urbanosta' }}
                >
                  {activeSubject.badge}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  className="text-xl font-bold lowercase text-[#050505] text-center mb-20 leading-tight"
                  style={{ fontFamily: 'Aonic' }}
                >
                  {activeSubject.tagline}
                </motion.p>
              </motion.div>
            ) : !predictMode ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col h-full justify-between p-8 relative z-10"
              >
                <div className="flex justify-between items-start mt-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5">
                    {currentStat.safe ? (
                      <Zap size={12} fill="black" />
                    ) : (
                      <AlertCircle size={12} fill="black" stroke="black" />
                    )}
                    <span className="font-mono text-[10px] lowercase tracking-widest font-bold text-black/60">
                      {activeSubject.badge}
                    </span>
                  </div>

                  <button
                    onClick={() => setPredictMode(true)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Calendar size={12} />
                    <span className="font-mono text-[10px] lowercase tracking-widest font-bold">
                      predict
                    </span>
                  </button>
                </div>

                <div className="my-auto">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-[25vw] leading-none font-black tracking-tighter ${currentStat.textColor}`}
                      style={{ fontFamily: 'Urbanosta' }}
                    >
                      <MarginCounter
                        value={currentStat.val}
                        color={currentStat.textColor}
                      />
                      h
                    </span>
                    <span
                      className={`text-l font-bold lowercase opacity-40 translate-y-1 ${currentStat.textColor}`}
                      style={{ fontFamily: 'Aonic' }}
                    >
                      {currentStat.label}
                    </span>
                  </div>
                </div>

                <div className="pb-2">
                  <h3
                    className={`text-3xl font-bold lowercase leading-none mb-2 pt-1 py-1 line-clamp-2 overflow-hidden max-h-[2.5em] ${currentStat.textColor}`}
                    style={{ fontFamily: 'Aonic' }}
                  >
                    {activeSubject.title.toLowerCase()}
                  </h3>

                  <div className="w-full h-[3px] bg-black/10 mb-2 relative overflow-hidden rounded-full">
                    <motion.div
                      className={`h-full ${currentStat.lineColor}`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          parseFloat(activeSubject.percentage),
                          100
                        )}%`
                      }}
                      transition={{ duration: 0.6, ease: 'circOut' }}
                    />
                  </div>

                  <span
                    className={`block text-[10px] font-mono font-bold lowercase mt-1 ${currentStat.textColor} opacity-60`}
                  >
                    {activeSubject.present}/{activeSubject.conducted} sessions
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="predict"
                className="h-full w-full bg-[#050505] absolute inset-0 z-50 p-8 flex flex-col text-white"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3
                    className="text-xl font-black lowercase tracking-tighter text-[#ceff1c]"
                    style={{ fontFamily: 'Urbanosta' }}
                  >
                    future_sim
                  </h3>
                  <button
                    onClick={() => setPredictMode(false)}
                    className="p-2 bg-white/10 rounded-full text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      <motion.div
        animate={{ opacity: introMode ? 0 : 1, y: introMode ? 50 : 0 }}
        className="flex-1 overflow-y-auto bg-[#f5f6fc] custom-scrollbar pb-32 snap-y snap-mandatory snap-always scroll-smooth"
        onScroll={handleScroll}
      >
        <div className="px-6 py-2 flex flex-col gap-8 pt-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-[#050505]/40 mb-[-10px] block">
            /// {predictMode ? 'predicted_impact' : 'watchlist'}
          </span>

          {sortedAttendance.map((subject, index) => {
            const isSelected = subject.id === selectedId
            let dPct = predictMode
              ? ((subject.present + (bunkMode ? 0 : 1)) /
                  (subject.conducted + 1)) *
                100
              : subject.percentage
            let dStat = getStatus(
              dPct,
              subject.conducted,
              subject.present
            )

            return (
              <motion.div
                key={subject.id}
                ref={el => (itemRefs.current[index] = el)}
                onClick={() => {
                  if (!predictMode) setSelectedId(subject.id)
                }}
                className={`group relative w-full cursor-pointer transition-all duration-500 ease-out snap-center snap-always ${
                  isSelected
                    ? 'opacity-100 scale-100'
                    : 'opacity-30 scale-[0.98] grayscale'
                }`}
              >
                <div className="flex justify-between items-end mb-2">
                  <h4
                    className={`text-xl font-bold lowercase truncate max-w-[65%] ${
                      predictMode ? 'opacity-60' : ''
                    }`}
                    style={{ fontFamily: 'Aonic' }}
                  >
                    {subject.title.toLowerCase()}
                  </h4>
                  <span
                    className={`text-3xl font-black transition-colors duration-500 ${
                      dStat.safe ? 'text-[#050505]' : 'text-[#ff003c]'
                    }`}
                    style={{ fontFamily: 'Urbanosta' }}
                  >
                    {Math.floor(dPct)}%
                  </span>
                </div>

                <div className="w-full h-[1px] bg-[#050505]/10 relative mb-2">
                  <div
                    className={`h-[2px] absolute top-[-0.5px] left-0 transition-colors duration-500 ${
                      dStat.safe ? 'bg-[#050505]' : 'bg-[#ff003c]'
                    }`}
                    style={{ width: `${Math.min(dPct, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-[#050505]/50 lowercase">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        dStat.safe ? 'bg-[#ceff1c]' : 'bg-[#ff003c]'
                      }`}
                    />
                    <span>{subject.code.toLowerCase()}</span>
                  </div>
                  <span
                    className={
                      dStat.safe
                        ? 'text-[#050505]/50'
                        : 'text-[#ff003c]/70'
                    }
                  >
                    {dStat.val}h {dStat.label}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MobileAttendance
