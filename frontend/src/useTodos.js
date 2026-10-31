import { useCallback, useEffect, useRef, useState } from "react";
import { request } from "./api";

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(new Set());
  const busy = useRef(new Set());

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const body = await request("", { signal });
      setTodos(body.todos);
    } catch (error) {
      if (error.name !== "AbortError")
        setError(
          "Could not load your tasks. Check your connection and try again.",
        );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
    return () => controller.abort();
  }, [load]);

  const markPending = (id, value) => {
    if (value) busy.current.add(id);
    else busy.current.delete(id);
    setPending(new Set(busy.current));
  };

  const create = async (values) => {
    setError("");
    try {
      const { todo } = await request("", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setTodos((items) => [todo, ...items]);
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  const update = async (todo, changes) => {
    if (busy.current.has(todo.id)) return false;
    markPending(todo.id, true);
    setError("");
    setTodos((items) =>
      items.map((item) =>
        item.id === todo.id ? { ...item, ...changes } : item,
      ),
    );
    try {
      const result = await request(`/${todo.id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setTodos((items) =>
        items.map((item) => (item.id === todo.id ? result.todo : item)),
      );
      return true;
    } catch (error) {
      setTodos((items) =>
        items.map((item) => (item.id === todo.id ? todo : item)),
      );
      setError(error.message);
      return false;
    } finally {
      markPending(todo.id, false);
    }
  };

  const remove = async (todo) => {
    if (busy.current.has(todo.id)) return false;
    markPending(todo.id, true);
    setError("");
    setTodos((items) => items.filter((item) => item.id !== todo.id));
    try {
      await request(`/${todo.id}`, { method: "DELETE" });
      return true;
    } catch (error) {
      setTodos((items) => [...items, todo]);
      setError(error.message);
      return false;
    } finally {
      markPending(todo.id, false);
    }
  };

  return {
    todos,
    loading,
    error,
    pending,
    create,
    update,
    remove,
    reload: () => load(),
    clearError: () => setError(""),
  };
}
