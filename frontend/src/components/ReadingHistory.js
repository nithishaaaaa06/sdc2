import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { calculateReadingTime, formatDate } from '../utils';

export default function ReadingHistory({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await api('/api/history', 'GET', null, token);
      setHistory(res || []);
    } catch (e) {
      setMsg('Failed to load reading history');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <div>Please login to view reading history.</div>;
  }

  if (loading) {
    return <div>Loading reading history...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Reading History</h3>
        <button className='button' onClick={loadHistory}>Refresh</button>
      </div>

      {msg && <div style={{ marginBottom: '16px', color: 'var(--error, #dc3545)' }}>{msg}</div>}

      {history.length === 0 ? (
        <div className='card' style={{ padding: '20px', textAlign: 'center' }}>
          <p>You haven't read any articles yet. Start reading to build your history!</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '12px', color: 'var(--text-secondary, #666)' }}>
            Total articles read: {history.length}
          </div>
          {history.map((item, i) => {
            const article = item.article;
            const readingTime = calculateReadingTime(
              (article.description || '') + ' ' + (article.content || '')
            );
            return (
              <div className='card' key={item.id || i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: '8px' }}>
                      {article.title}
                    </div>
                    <div style={{ marginTop: 8, color: 'var(--text-secondary, #666)' }}>
                      {article.description}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.9em', color: 'var(--text-secondary, #666)' }}>
                      {article.source && article.source.name && (
                        <span><strong>Source:</strong> {article.source.name}</span>
                      )}
                      {item.viewedAt && (
                        <span>• Read {formatDate(item.viewedAt)}</span>
                      )}
                      {readingTime > 0 && (
                        <span>• ⏱️ {readingTime} min read</span>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <a 
                        href={article.url} 
                        target='_blank' 
                        rel='noreferrer'
                        style={{ color: 'var(--primary, #007bff)', textDecoration: 'none' }}
                      >
                        Read again →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

