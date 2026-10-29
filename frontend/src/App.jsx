import { useEffect, useMemo, useState } from 'react';
import { listTasks, createTask, updateTask, deleteTask } from './api.js';

const PRIORITIES = ['low', 'medium', 'high'];
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'To do' },
  { id: 'done', label: 'Done' },
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const done = tasks.filter((t) => t.done).length;
    return { all: tasks.length, done, active: tasks.length - done };
  }, [tasks]);

  const visible = tasks.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done
  );

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setError('');
    try {
      const created = await createTask({ title: trimmed, priority });
      setTasks((prev) => [created, ...prev]);
      setTitle('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(task) {
    setError('');
    try {
      const updated = await updateTask(task._id, { done: !task.done });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    setError('');
    try {
      await deleteTask(task._id);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="shell">
      <header className="masthead">
        <div>
          <h1>three-tier full-stack-app</h1>
          <p className="subtitle">Taskboard</p>
        </div>
        <p className="tally" aria-live="polite">
          {counts.active} to do, {counts.done} done
        </p>
      </header>

      <form className="composer" onSubmit={handleAdd}>
        <label className="sr-only" htmlFor="new-title">Task title</label>
        <input
          id="new-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          maxLength={140}
          autoComplete="off"
        />
        <label className="sr-only" htmlFor="new-priority">Priority</label>
        <select id="new-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p} priority</option>
          ))}
        </select>
        <button type="submit" disabled={!title.trim()}>Add task</button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <nav className="filters" aria-label="Filter tasks">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={filter === f.id ? 'active' : ''}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label} <span>{counts[f.id]}</span>
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="empty">Loading tasks…</p>
      ) : visible.length === 0 ? (
        <p className="empty">
          {tasks.length === 0 ? 'No tasks yet. Add your first one above.' : 'Nothing in this view.'}
        </p>
      ) : (
        <ul className="list">
          {visible.map((task) => (
            <li key={task._id} className={`item p-${task.priority} ${task.done ? 'is-done' : ''}`}>
              <input
                type="checkbox"
                id={`t-${task._id}`}
                checked={task.done}
                onChange={() => handleToggle(task)}
              />
              <label htmlFor={`t-${task._id}`}>{task.title}</label>
              <span className="badge">{task.priority}</span>
              <button
                type="button"
                className="remove"
                onClick={() => handleDelete(task)}
                aria-label={`Delete ${task.title}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
