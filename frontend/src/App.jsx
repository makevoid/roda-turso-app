import { useEffect, useRef, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  Flag,
  Inbox,
  Leaf,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Sun,
  Sunrise,
  X,
} from "lucide-react";
import { useTodos } from "./useTodos";
import TaskDialog from "./TaskDialog";

const lists = {
  personal: {
    label: "Personal",
    color: "bg-[#dce8d7] text-[#506b46]",
    dot: "bg-[#7a9d69]",
  },
  work: {
    label: "Work",
    color: "bg-[#e9e5f2] text-[#7b6695]",
    dot: "bg-[#a08ab9]",
  },
  life: {
    label: "Life admin",
    color: "bg-[#f6e9d4] text-[#9b783e]",
    dot: "bg-[#cba368]",
  },
};
const views = [
  { id: "all", label: "All tasks", icon: Inbox },
  { id: "today", label: "Today", icon: Sun },
  { id: "upcoming", label: "Upcoming", icon: CalendarDays },
  { id: "important", label: "Important", icon: Flag },
  { id: "completed", label: "Completed", icon: CircleCheck },
];

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dueLabel(value, today) {
  if (value === today) return "Today";
  const tomorrow = new Date(`${today}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDate(tomorrow)) return "Tomorrow";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function Garden() {
  return (
    <svg
      className="garden"
      viewBox="0 0 310 185"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="226" cy="67" r="39" fill="#e1e5b8" />
      <circle cx="226" cy="67" r="55" stroke="#dce1bf" strokeDasharray="3 7" />
      <path
        d="M35 168C70 126 125 137 163 145C202 153 241 128 290 154"
        stroke="#c2cdb4"
        strokeWidth="1.5"
      />
      <path
        d="M122 158C127 125 129 82 116 43"
        stroke="#55735a"
        strokeWidth="2"
      />
      <path
        d="M122 112C89 112 70 90 74 69C101 72 119 86 122 112Z"
        fill="#9dad8c"
      />
      <path
        d="M125 93C151 93 171 72 165 51C143 56 125 70 125 93Z"
        fill="#6d8966"
      />
      <path
        d="M118 65C95 62 87 42 95 24C115 30 121 43 118 65Z"
        fill="#bdc8a5"
      />
      <path
        d="M126 140C151 140 175 121 173 101C149 103 132 117 126 140Z"
        fill="#a6b594"
      />
      <path
        d="M204 158C198 138 204 115 219 100"
        stroke="#678061"
        strokeWidth="2"
      />
      <path
        d="M204 135C185 132 178 120 184 107C198 110 205 120 204 135Z"
        fill="#b3c1a0"
      />
      <path
        d="M208 121C228 124 244 110 241 96C222 97 211 105 208 121Z"
        fill="#88a07d"
      />
      <ellipse cx="162" cy="167" rx="71" ry="4" fill="#cfdbbd" opacity=".55" />
      <path d="m50 66 2-6 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#8d9f74" />
      <path
        d="m271 117 1.5-4.5 1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5Z"
        fill="#9ba97b"
      />
    </svg>
  );
}

function TaskRow({ todo, today, busy, onToggle, onEdit, onPriority }) {
  const category = lists[todo.list];
  const overdue = todo.due_date && todo.due_date < today && !todo.completed;
  return (
    <li className={`task-row group ${todo.completed ? "is-complete" : ""}`}>
      <button
        className="check-hit"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={`${todo.completed ? "Reopen" : "Complete"} ${todo.title}`}
        disabled={busy}
        onClick={onToggle}
      >
        <span className={`task-checkbox ${todo.completed ? "checked" : ""}`}>
          {todo.completed && <Check size={13} strokeWidth={3} />}
        </span>
      </button>
      <button
        className="min-w-0 flex-1 py-4 text-left"
        disabled={busy}
        onClick={onEdit}
        aria-label={`Edit ${todo.title}`}
      >
        <span
          className={`block break-words text-[14px] font-medium sm:text-[15px] ${todo.completed ? "text-stone-400 line-through decoration-stone-300" : "text-ink"}`}
        >
          {todo.title}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className={`rounded-md px-2 py-0.5 ${category.color}`}>
            {category.label}
          </span>
          {todo.due_date && (
            <span
              className={`flex items-center gap-1 ${overdue ? "text-[#bb715c]" : "text-stone-400"}`}
            >
              <CalendarDays size={11} />
              {dueLabel(todo.due_date, today)}
              {overdue ? " · overdue" : ""}
            </span>
          )}
          {todo.notes && (
            <span className="max-w-44 truncate text-stone-400">
              {todo.notes}
            </span>
          )}
        </span>
      </button>
      <button
        className={`icon-button shrink-0 ${todo.priority === "high" ? "text-[#b39656]" : "text-stone-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"}`}
        aria-label={`${todo.priority === "high" ? "Unmark" : "Mark"} ${todo.title} as important`}
        aria-pressed={todo.priority === "high"}
        onClick={onPriority}
        disabled={busy}
      >
        <Flag
          size={15}
          fill={todo.priority === "high" ? "currentColor" : "none"}
        />
      </button>
      <button
        className="icon-button -ml-2 shrink-0 text-stone-400"
        aria-label={`Details for ${todo.title}`}
        onClick={onEdit}
        disabled={busy}
      >
        {busy ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <MoreHorizontal size={18} />
        )}
      </button>
    </li>
  );
}

export default function App() {
  const {
    todos,
    loading,
    error,
    pending,
    create,
    update,
    remove,
    reload,
    clearError,
  } = useTodos();
  const [view, setView] = useState("all");
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editor, setEditor] = useState(null);
  const [today, setToday] = useState(localDate());
  const quickInput = useRef(null);
  const searchInput = useRef(null);
  const remaining = todos.filter((todo) => !todo.completed).length;
  const completed = todos.length - remaining;
  const percent = todos.length
    ? Math.round((completed / todos.length) * 100)
    : 0;

  useEffect(() => {
    const timer = setInterval(() => setToday(localDate()), 60000);
    function shortcuts(event) {
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) &&
        !document.querySelector("dialog[open]")
      ) {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", shortcuts);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", shortcuts);
    };
  }, []);

  function matchesView(todo, target) {
    if (lists[target]) return todo.list === target;
    if (target === "today") return todo.due_date === today;
    if (target === "upcoming") return todo.due_date > today;
    if (target === "important") return todo.priority === "high";
    if (target === "completed") return todo.completed;
    return true;
  }

  function navigate(target) {
    setView(target);
    setFilter(target === "completed" ? "completed" : "active");
    setQuery("");
  }

  const selected = todos.filter((todo) => matchesView(todo, view));
  const visible = selected
    .filter(
      (todo) =>
        (filter === "all" || todo.completed === (filter === "completed")) &&
        `${todo.title} ${todo.notes}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.completed !== b.completed)
        return Number(a.completed) - Number(b.completed);
      if (sort === "due")
        return (
          (a.due_date || "9999").localeCompare(b.due_date || "9999") ||
          b.created_at.localeCompare(a.created_at)
        );
      if (sort === "priority")
        return (
          Number(b.priority === "high") - Number(a.priority === "high") ||
          b.created_at.localeCompare(a.created_at)
        );
      return b.created_at.localeCompare(a.created_at);
    });
  const viewLabel =
    lists[view]?.label || views.find((item) => item.id === view)?.label;
  const defaultList = lists[view] ? view : "personal";

  async function quickAdd(event) {
    event.preventDefault();
    if (!title.trim() || creating) return;
    setCreating(true);
    const success = await create({
      title,
      list: defaultList,
      ...(view === "today" ? { due_date: today } : {}),
      ...(view === "important" ? { priority: "high" } : {}),
    });
    setCreating(false);
    if (success) {
      setTitle("");
      setQuery("");
      setFilter("active");
      if (view === "completed" || view === "upcoming") setView("all");
      quickInput.current?.focus();
    }
  }

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sidebar hidden lg:flex">
        <a
          href="/"
          className="mb-11 flex items-center gap-3 px-3"
          aria-label="Daylight home"
        >
          <span className="brand-icon">
            <Sunrise size={25} strokeWidth={1.7} />
          </span>
          <span className="brand-name">
            daylight<span className="text-[#89a57d]">.</span>
          </span>
        </a>
        <div className="mb-3 px-4 text-[10px] font-semibold tracking-[.15em] text-[#9b9e93]">
          YOUR SPACE
        </div>
        <nav aria-label="Main navigation" className="space-y-1">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "selected" : ""}`}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span className="flex-1 text-left">{label}</span>
              <span className="nav-count">
                {
                  todos.filter(
                    (todo) =>
                      matchesView(todo, id) &&
                      (id === "completed" || !todo.completed),
                  ).length
                }
              </span>
            </button>
          ))}
        </nav>
        <div className="mb-3 mt-9 flex items-center justify-between px-4 text-[10px] font-semibold tracking-[.15em] text-[#9b9e93]">
          MY LISTS <span className="text-xs tracking-normal">03</span>
        </div>
        <nav aria-label="Task lists" className="space-y-1">
          {Object.entries(lists).map(([id, list]) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "selected" : ""}`}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <span className={`mx-1 h-2.5 w-2.5 rounded-[3px] ${list.dot}`} />
              <span className="flex-1 text-left">{list.label}</span>
              <span className="text-xs text-stone-400">
                {
                  todos.filter((todo) => todo.list === id && !todo.completed)
                    .length
                }
              </span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-12">
          <div className="rounded-2xl border border-[#e5e9de] bg-[#f1f4eb] p-4">
            <Leaf size={20} className="mb-3 text-[#7b936c]" />
            <p className="text-[13px] font-medium text-[#607350]">
              A little progress, every day.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#939b86]">
              Big things start with small steps.
              <br />
              You’re in the right place.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4e8db] text-xs font-semibold text-[#657759]">
              M
            </span>
            <div>
              <p className="text-xs font-semibold">My workspace</p>
              <p className="mt-0.5 text-[10px] text-stone-400">
                A little space for your day
              </p>
            </div>
            <ChevronRight size={15} className="ml-auto text-stone-400" />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-20 items-center justify-between gap-4 border-b border-line bg-white/60 px-5 sm:px-10 lg:px-12">
          <div className="flex items-center gap-2.5 text-xs text-stone-400">
            <span className="brand-icon h-8! w-8! rounded-xl! lg:hidden">
              <Sunrise size={20} />
            </span>
            <span className="hidden sm:inline">My workspace</span>
            <ChevronRight size={13} className="hidden sm:block" />
            <span className="font-medium text-ink">{viewLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <CalendarDays size={15} strokeWidth={1.5} />
            <time dateTime={today}>
              {new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>
        </header>
        <main className="mx-auto max-w-[1080px] px-5 pt-8 pb-28 sm:px-10 sm:pt-10 lg:px-12 lg:pb-12">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs text-[#8c9580]">
                <Sun size={15} /> A FRESH LITTLE START
              </p>
              <h1 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[36px]">
                Make space for your day<span className="text-[#8fa276]">.</span>
              </h1>
              <p className="mt-2.5 text-[13px] text-stone-400 sm:text-sm">
                Less on your mind. More room for what matters.
              </p>
            </div>
            <button
              className="primary-button mt-5 hidden shrink-0 sm:flex"
              onClick={() => setEditor({})}
            >
              <Plus size={17} /> New task
            </button>
          </div>

          <section
            className="hero-panel relative mb-7 overflow-hidden rounded-[20px] border border-[#e2e8d5] bg-[#eef2e4] px-6 py-7 sm:px-8"
            aria-label="Your progress"
          >
            <div className="relative z-10 max-w-[65%] sm:max-w-[60%]">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#dce4cb] bg-white/50 px-2.5 py-1 text-[10px] font-medium text-[#6f8058]">
                <Sparkles size={11} /> ONE THING AT A TIME
              </span>
              <h2 className="hero-title text-[23px] leading-tight tracking-tight sm:text-[28px]">
                Small steps.
                <br />A little more possibility.
              </h2>
              <p className="mt-3 max-w-72 text-xs leading-relaxed text-[#7e8b70] sm:text-[13px]">
                You don’t have to do it all today.
                <br className="hidden sm:block" /> Just make a little room for
                progress.
              </p>
              <div className="mt-5 flex max-w-64 items-center gap-3">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#dce4cc]"
                  role="progressbar"
                  aria-label="Completed tasks"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-[#849c69] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#7e8b70]">
                  {percent}% done
                </span>
              </div>
            </div>
            <Garden />
          </section>

          <div className="mb-8 grid grid-cols-3 gap-2.5 sm:gap-4">
            {[
              {
                label: "To get done",
                value: remaining,
                icon: Inbox,
                color: "bg-[#f0f2e9] text-[#86976e]",
              },
              {
                label: "Completed",
                value: completed,
                icon: CheckCheck,
                color: "bg-[#edf3ed] text-[#7d9c7b]",
              },
              {
                label: "Due today",
                value: todos.filter(
                  (todo) => !todo.completed && todo.due_date === today,
                ).length,
                icon: Sun,
                color: "bg-[#f9f2e5] text-[#b7a16c]",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="flex flex-col items-start gap-2 rounded-2xl border border-line bg-white p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon size={18} strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-xl font-semibold leading-none tracking-tight">
                    {loading ? "—" : value.toString().padStart(2, "0")}
                  </p>
                  <p className="mt-1.5 text-[10px] text-stone-400 sm:text-xs">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <nav
            className="mobile-views -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-2 lg:hidden"
            aria-label="Browse tasks"
          >
            {[
              ...views,
              ...Object.entries(lists).map(([id, list]) => ({
                id,
                label: list.label,
              })),
            ].map(({ id, label }) => (
              <button
                key={id}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-xs ${view === id ? "border-[#d5dfc8] bg-[#eaf0e0] text-[#536b40]" : "border-line bg-white text-stone-500"}`}
                onClick={() => navigate(id)}
                aria-current={view === id ? "page" : undefined}
              >
                {label}
              </button>
            ))}
          </nav>

          <section aria-label="Task list">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
                {viewLabel}
                <span className="rounded-md bg-[#eef0e8] px-2 py-0.5 text-[11px] font-normal text-[#8c947e]">
                  {selected.length}
                </span>
              </h2>
              <label className="flex items-center gap-1.5 text-xs text-stone-400">
                <ArrowDownWideNarrow size={14} />
                <span className="sr-only">Sort tasks</span>
                <select
                  className="min-h-10 max-w-36 cursor-pointer bg-transparent text-xs outline-offset-2"
                  aria-label="Sort tasks"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="due">Due date</option>
                  <option value="priority">Importance</option>
                </select>
              </label>
            </div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line">
              <div className="flex gap-5" role="group" aria-label="Task status">
                {(view === "completed"
                  ? ["completed"]
                  : ["active", "all", "completed"]
                ).map((value) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={`relative min-h-11 pb-3 text-xs capitalize ${filter === value ? "font-semibold text-[#577144] after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-[#7e9567]" : "text-stone-400"}`}
                  >
                    {value === "active"
                      ? "To do"
                      : value === "all"
                        ? "All"
                        : "Completed"}
                  </button>
                ))}
              </div>
              <label className="mb-2 flex min-h-10 w-full items-center gap-2 rounded-lg border border-line bg-white px-3 sm:w-48">
                <Search size={14} className="shrink-0 text-stone-400" />
                <input
                  ref={searchInput}
                  type="search"
                  aria-label="Search tasks"
                  className="w-full min-w-0 bg-transparent py-2 text-xs outline-none placeholder:text-stone-400"
                  placeholder="Search tasks…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <kbd className="text-[10px] text-stone-300">/</kbd>
              </label>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-800"
              >
                <span className="flex-1">{error}</span>
                <button
                  className="min-h-10 font-semibold underline"
                  onClick={reload}
                >
                  Retry
                </button>
                <button
                  className="icon-button"
                  aria-label="Dismiss error"
                  onClick={clearError}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <form
              onSubmit={quickAdd}
              className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-[#cdd8c1] bg-[#f3f6ed] py-2 pr-2 pl-3.5 transition focus-within:border-[#80976a] focus-within:ring-2 focus-within:ring-[#e3e9d9]"
            >
              <Plus size={19} className="shrink-0 text-[#8b9e77]" />
              <input
                ref={quickInput}
                aria-label="New task title"
                maxLength={240}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[#95a187]"
                placeholder="Add a task. Make a little room."
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={creating}
              />
              <button
                className="flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-[#6d8357] hover:bg-[#e6eddb] disabled:opacity-40"
                disabled={creating || !title.trim()}
              >
                {creating ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Add task</span>
                    <ArrowRight size={16} />
                  </>
                )}
                <span className="sr-only sm:hidden">Add task</span>
              </button>
            </form>

            {loading ? (
              <div
                role="status"
                aria-label="Loading tasks"
                className="space-y-3"
              >
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-xl bg-[#eef0e9]"
                  />
                ))}
              </div>
            ) : visible.length ? (
              <ul className="overflow-hidden rounded-2xl border border-line bg-white">
                {visible.map((todo) => (
                  <TaskRow
                    key={todo.id}
                    todo={todo}
                    today={today}
                    busy={pending.has(todo.id)}
                    onToggle={() =>
                      update(todo, { completed: !todo.completed })
                    }
                    onEdit={() => setEditor(todo)}
                    onPriority={() =>
                      update(todo, {
                        priority: todo.priority === "high" ? "normal" : "high",
                      })
                    }
                  />
                ))}
              </ul>
            ) : (
              <div className="empty-state rounded-2xl border border-line bg-white px-6 py-12 text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] border border-[#e5eadc] bg-[#f3f6ed]">
                  <Leaf
                    size={25}
                    strokeWidth={1.3}
                    className="text-[#91a27e]"
                  />
                </span>
                <h3 className="text-base font-medium tracking-tight">
                  {query
                    ? "A little too specific?"
                    : filter === "completed"
                      ? "Good things take a first step."
                      : todos.length
                        ? "A little breathing room."
                        : "A fresh page, just for you."}
                </h3>
                <p className="mx-auto mt-2 max-w-64 text-xs leading-relaxed text-stone-400">
                  {query
                    ? "Try another search, or check a different list."
                    : filter === "completed"
                      ? "The tasks you finish will find a home here."
                      : todos.length
                        ? "No tasks here right now. Enjoy the space, or add something new."
                        : "Capture the little things on your mind. Your first task is a great place to start."}
                </p>
                {!query && filter !== "completed" && (
                  <button
                    onClick={() => quickInput.current?.focus()}
                    className="mx-auto mt-4 flex min-h-11 items-center gap-1.5 text-xs font-medium text-[#7d9166]"
                  >
                    <Plus size={14} /> Add your{" "}
                    {todos.length ? "next" : "first"} task
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 px-1 text-[10px] text-stone-400">
              <span aria-live="polite">
                {visible.length} {visible.length === 1 ? "task" : "tasks"} ·{" "}
                {selected.filter((todo) => !todo.completed).length} left to do
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${error ? "bg-amber-400" : pending.size || creating ? "animate-pulse bg-[#a2b18f]" : "bg-[#a2b18f]"}`}
                />
                {error
                  ? "Connection needs attention"
                  : pending.size || creating
                    ? "Saving changes…"
                    : loading
                      ? "Connecting…"
                      : "You’re up to date"}
              </span>
            </div>
          </section>
          <footer className="mt-12 flex items-center justify-center gap-2 text-[10px] text-[#a5ab9b]">
            <Sunrise size={14} strokeWidth={1.3} /> A little more clarity. A
            little more daylight.
          </footer>
        </main>
      </div>
      <div className="mobile-bar fixed right-0 bottom-0 left-0 z-20 flex items-center justify-between border-t border-line bg-[#fafbf7]/95 px-5 pt-3 backdrop-blur sm:hidden">
        <span className="flex items-center gap-2 text-xs text-[#7f8c70]">
          <Leaf size={16} /> One thing at a time.
        </span>
        <button className="primary-button" onClick={() => setEditor({})}>
          <Plus size={18} /> New task
        </button>
      </div>
      {editor && (
        <TaskDialog
          key={editor.id || "new"}
          task={editor.id ? editor : null}
          defaultList={defaultList}
          onClose={() => setEditor(null)}
          onSave={async (values) => {
            if (editor.id) return update(editor, values);
            const success = await create(values);
            if (success) {
              setView(values.list);
              setFilter("active");
              setQuery("");
            }
            return success;
          }}
          onDelete={remove}
        />
      )}
    </div>
  );
}
