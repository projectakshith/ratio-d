const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const paths = [
  "src/components/themes/minimalist/calendar/Calendar.tsx",
  "src/components/themes/brutalist/calendar/Calendar.tsx",
];
const baseline = process.argv.includes("--baseline");
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: Symbol("Fragment") };

function loadCalendarDay(path) {
  const instances = new Map();
  const react = {
    memo(component, compare) {
      return (props) => {
        const key = props.item.dateObj.toDateString();
        const previous = instances.get(key);
        if (previous && compare(previous.props, props)) return previous.output;
        const output = component(props);
        instances.set(key, { props, output });
        return output;
      };
    },
  };
  const motion = new Proxy({}, { get: (_, key) => `motion.${String(key)}` });
  const source = baseline ? execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8" }) : fs.readFileSync(path, "utf8");
  const output = ts.transpileModule(`${source}\nexports.__CalendarDay = CalendarDay;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    exports: module.exports, module,
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "framer-motion") return { motion, AnimatePresence: "AnimatePresence" };
      if (name === "lucide-react") return new Proxy({}, { get: (_, key) => String(key) });
      if (name === "next/navigation") return { useRouter: () => ({}) };
      if (name.includes("haptics")) return { Haptics: { selection() {} } };
      if (name.includes("useCalendarData")) return { useCalendarData: () => ({}) };
      if (name.includes("CalendarScheduleCard") || name.includes("calendarSchedule") || name.includes("useClassCancellations") || name.includes("calendar_data.json")) return { default: () => null, getCalendarScheduleItems: () => [] };
      return {};
    },
  }, { filename: path });
  return module.exports.__CalendarDay;
}

function doubleClick(CalendarDay, initialDate, targetDate = initialDate, resetTap = false) {
  const state = { selected: initialDate.toDateString(), lastTap: "", opened: false };
  const render = (date) => {
    const key = date.toDateString();
    const capturedTap = state.lastTap;
    const capturedSelection = state.selected;
    const onClick = (clickedDate) => {
      const clickedKey = clickedDate.toDateString();
      if (capturedTap === clickedKey && capturedSelection === clickedKey) state.opened = true;
      else state.lastTap = clickedKey;
      state.selected = clickedKey;
    };
    return CalendarDay({ item: { day: date.getDate(), dateObj: date, isSelected: state.selected === key, isToday: false, isPast: false }, onClick });
  };
  const click = (date) => render(date).props.onClick(date);
  // Calendar cells exist before interaction; establish an unselected target cell too.
  render(initialDate);
  if (targetDate.toDateString() !== initialDate.toDateString()) render(targetDate);
  if (resetTap) {
    click(targetDate);
    state.lastTap = ""; // resetCalendarTap/goToToday clear the first-tap state.
    state.opened = false;
  }
  click(targetDate);
  click(targetDate);
  return state.opened;
}

for (const path of paths) {
  const selected = new Date(2026, 9, 6), another = new Date(2026, 9, 7);
  try {
    assert.equal(doubleClick(loadCalendarDay(path), selected), true, "initially selected date opens on second click");
    assert.equal(doubleClick(loadCalendarDay(path), selected, another), true, "newly selected date opens on second click");
    assert.equal(doubleClick(loadCalendarDay(path), selected, selected, true), true, "date opens again after tap reset");
    if (baseline) throw new Error("baseline unexpectedly passed");
    console.log(`${path}: initial, changed, and reset-date double clicks pass`);
  } catch (error) {
    if (baseline && error.code === "ERR_ASSERTION") {
      console.log(`${path}: baseline fails as expected (${error.message})`);
      continue;
    }
    throw error;
  }
}