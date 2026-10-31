import { useEffect, useRef, useState } from "react";
import { CalendarDays, Flag, LoaderCircle, Trash2, X } from "lucide-react";

export default function TaskDialog({
  task,
  defaultList,
  onClose,
  onSave,
  onDelete,
}) {
  const dialog = useRef(null);
  const [title, setTitle] = useState(task?.title || "");
  const [notes, setNotes] = useState(task?.notes || "");
  const [list, setList] = useState(task?.list || defaultList || "personal");
  const [priority, setPriority] = useState(task?.priority || "normal");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  async function save(event) {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");
    const success = await onSave({
      title,
      notes,
      list,
      priority,
      due_date: dueDate || null,
    });
    setSaving(false);
    if (success) onClose();
    else
      setError(
        "Your task could not be saved. Your changes are still here; please try again.",
      );
  }

  async function remove() {
    if (!confirmDelete) return setConfirmDelete(true);
    setSaving(true);
    const success = await onDelete(task);
    setSaving(false);
    if (success) onClose();
    else setError("Could not delete this task. Please try again.");
  }

  return (
    <dialog
      ref={dialog}
      className="task-dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !saving) onClose();
      }}
    >
      <form onSubmit={save} className="p-6 sm:p-8">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-1">A LITTLE INTENTION</p>
            <h2
              id="dialog-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {task ? "Task details" : "Something to do"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close task details"
            className="icon-button"
            disabled={saving}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <label className="field-label" htmlFor="task-title">
          Task
        </label>
        <input
          autoFocus
          id="task-title"
          className="form-field mb-5"
          placeholder="What would you like to get done?"
          value={title}
          maxLength={240}
          required
          onChange={(event) => setTitle(event.target.value)}
        />
        <label className="field-label" htmlFor="task-notes">
          Notes <span className="font-normal text-stone-400">· optional</span>
        </label>
        <textarea
          id="task-notes"
          className="form-field mb-5 min-h-28 resize-y"
          placeholder="A few details, a little context…"
          maxLength={4000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="task-list">
              List
            </label>
            <select
              id="task-list"
              className="form-field"
              value={list}
              onChange={(event) => setList(event.target.value)}
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="life">Life admin</option>
            </select>
          </div>
          <div>
            <label
              className="field-label flex items-center gap-2"
              htmlFor="task-date"
            >
              <CalendarDays size={14} /> Due date
            </label>
            <input
              id="task-date"
              type="date"
              className="form-field min-w-0"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          aria-pressed={priority === "high"}
          className={`mt-5 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm ${priority === "high" ? "bg-amber-50 text-amber-800" : "bg-stone-50 text-stone-500"}`}
          onClick={() => setPriority(priority === "high" ? "normal" : "high")}
        >
          <Flag
            size={16}
            fill={priority === "high" ? "currentColor" : "none"}
          />{" "}
          Mark as important
        </button>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
          {task ? (
            <button
              type="button"
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-red-700 hover:bg-red-50"
              onClick={remove}
              disabled={saving}
            >
              <Trash2 size={16} />
              {confirmDelete ? "Confirm delete" : "Delete"}
            </button>
          ) : (
            <span className="text-xs text-stone-400">One small step.</span>
          )}
          <button className="primary-button" disabled={saving || !title.trim()}>
            {saving && <LoaderCircle size={16} className="animate-spin" />}
            {saving ? "Saving…" : task ? "Save changes" : "Add task"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
