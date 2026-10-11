const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) request = path.join(root, "src", request.slice(2));
  return originalResolve.call(this, request, parent, isMain, options);
};
require.extensions[".ts"] = require.extensions[".tsx"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, filename);
};
Module._load = function (request, parent, isMain) {
  if (request === "framer-motion") {
    return {
      motion: new Proxy({}, {
        get: (_, tag) => ({ ...props }) => {
          const { variants, initial, animate, transition, ...domProps } = props;
          return React.createElement(tag, domProps);
        },
      }),
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const ScheduleGrid = require("../src/components/themes/minimalist/dashboard/ScheduleGrid.tsx").default;
const { getDashboardDisplayedDate } = require("../src/utils/dashboard/dashboardDisplayedDate.ts");

const slot = {
  id: "class-1", active: true, courseCode: "CS101", slot: "A1", time: "09:00 - 10:00",
  sub: "cs", room: "r1", isCurrent: true,
};
const cancellation = { "cs101|A1": { dayOrders: [2], dates: [] } };
const render = (cancelledClasses, overrides = {}) => renderToStaticMarkup(React.createElement(ScheduleGrid, {
  displayGrid: [slot], selectedDay: 2, currentDayOrder: 2, isHoliday: false,
  cancelledClasses, ...overrides,
}));
const countCancellationLabels = (html) => (html.match(/aria-label="Cancelled"/g) || []).length;

const recurring = render(cancellation);
assert.equal(countCancellationLabels(recurring), 1, "recurring day-order cancellation renders a cancellation label");
assert.equal((recurring.match(/>\(cancelled\)<\/span>/g) || []).length, 1, "the cancellation label includes parentheses");
assert.ok(recurring.indexOf("(cancelled)") > recurring.indexOf(slot.time), "the cancellation label appears after the time");
assert.doesNotMatch(recurring, /status-boxbg-safe/, "cancelled current class loses active green styling");
assert.equal(countCancellationLabels(render(cancellation, { selectedDay: 3 })), 0, "a different day order does not inherit a recurring cancellation");

const exactDateRule = { "cs101|A1": { dayOrders: [], dates: ["2026-10-08"] } };
assert.equal(countCancellationLabels(render(exactDateRule, { cancellationDate: "2026-10-08" })), 1, "exact date cancellation renders a cancellation label");
assert.equal(countCancellationLabels(render(exactDateRule, { cancellationDate: "2026-10-09" })), 0, "different date does not inherit a one-off cancellation");
assert.equal(countCancellationLabels(render({})), 0, "a class without a cancellation stays unmarked");
assert.equal(countCancellationLabels(render({}, { cancellationDate: "2026-10-08" })), 0, "clearing cancellation removes the cancellation label");
assert.equal(countCancellationLabels(render(cancellation, { displayGrid: [slot, { ...slot, id: "extra-1" }] })), 2, "extra slots use the same cancellation rendering");

const today = new Date(2026, 9, 6);
const calendar = [
  { date: new Date(2026, 9, 7), dayOrder: 1 },
  { date: new Date(2026, 9, 8), dayOrder: 2 },
  { date: new Date(2026, 9, 13), dayOrder: 2 },
];
assert.equal(getDashboardDisplayedDate(calendar, 2, 1, true, today).getDate(), 8, "holiday dashboard resolves the nearest upcoming occurrence of selected order");
assert.equal(getDashboardDisplayedDate(calendar, 1, 1, false, today).getDate(), 6, "today's selected order uses today's date");
assert.equal(getDashboardDisplayedDate(calendar, 5, 1, true, today), null, "orders with no upcoming calendar occurrence have no date cancellation target");

console.log("Dashboard cancellation checks passed.");
