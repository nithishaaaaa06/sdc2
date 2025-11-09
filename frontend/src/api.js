const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export async function api(path, method='GET', body=null, token=null) {
  const headers = { 'Content-Type':'application/json' };
  if (token) headers['Authorization'] = 'Bearer '+token;
  const res = await fetch(API_BASE+path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(()=>null);
  if (!res.ok) throw data || { error:'Request failed' };
  return data;
}
