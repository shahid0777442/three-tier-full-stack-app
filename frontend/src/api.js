// Thin wrapper around fetch for the REST API.
const BASE = '/api/tasks';

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const listTasks = () => request(BASE);
export const createTask = (task) => request(BASE, { method: 'POST', body: JSON.stringify(task) });
export const updateTask = (id, changes) =>
  request(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
export const deleteTask = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });
