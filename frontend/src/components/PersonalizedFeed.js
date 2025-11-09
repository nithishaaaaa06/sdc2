import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { calculateReadingTime, formatDate } from '../utils';

export default function PersonalizedFeed({ token }) {
  const [articles, setArticles] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadPreferences();
      fetchRecommendations();
    }
  }, [token]);

  async function fetchRecommendations() {
    setLoading(true);
    setMsg('Loading personalized recommendations...');
    try {
      const res = await api('/api/recommendations', 'GET', null, token);
      setArticles(res.articles || []);
      // Merge recommendation preferences with user preferences
      const recPrefs = res.preferences || {};
      setPreferences(prev => ({ ...prev, ...recPrefs }));
      setMsg('');
    } catch (err) {
      setMsg(err.error || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }

  async function loadPreferences() {
    try {
      const prefs = await api('/api/preferences', 'GET', null, token);
      setPreferences(prev => ({ ...prev, ...prefs }));
    } catch (e) {
      console.error('Failed to load preferences', e);
    }
  }

  async function trackReading(article) {
    try {
      await api('/api/history', 'POST', { article }, token);
    } catch (e) {
      console.error('Failed to track reading', e);
    }
  }

  async function save(article) {
    if (!token) {
      alert('Login to save.');
      return;
    }
    try {
      await api('/api/bookmarks', 'POST', { article }, token);
      alert('Saved to bookmarks');
    } catch (e) {
      alert(e.error || 'Failed');
    }
  }

  function handleArticleClick(article) {
    trackReading(article);
    window.open(article.url, '_blank', 'noopener,noreferrer');
  }

  if (!token) {
    return <div>Please login to view personalized recommendations.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Your Personalized Feed</h3>
        <button className='button' onClick={fetchRecommendations} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {(preferences.readingStreak > 0 || (preferences.categories && preferences.categories.length > 0) || (preferences.sources && preferences.sources.length > 0)) && (
        <div className='card' style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--card-bg, #f5f5f5)' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {preferences.readingStreak > 0 && (
              <div>
                <strong>🔥 Reading Streak:</strong> {preferences.readingStreak} day{preferences.readingStreak > 1 ? 's' : ''}
              </div>
            )}
            {preferences.categories && preferences.categories.length > 0 && (
              <div>
                <strong>Top Categories:</strong> {preferences.categories.slice(0, 3).join(', ')}
              </div>
            )}
            {preferences.sources && preferences.sources.length > 0 && (
              <div>
                <strong>Top Sources:</strong> {preferences.sources.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {msg && <div style={{ marginBottom: '16px' }}>{msg}</div>}

      {articles.length === 0 && !loading && (
        <div className='card' style={{ padding: '20px', textAlign: 'center' }}>
          <p>No recommendations yet. Start reading articles to get personalized recommendations!</p>
        </div>
      )}

      {articles.map((article, i) => {
        const readingTime = calculateReadingTime(
          (article.description || '') + ' ' + (article.content || '')
        );
        return (
          <div className='card' key={i} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: '8px', cursor: 'pointer' }}
                  onClick={() => handleArticleClick(article)}>
                  {article.title}
                </div>
                <div style={{ marginTop: 8, color: 'var(--text-secondary, #666)' }}>
                  {article.description}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.9em', color: 'var(--text-secondary, #666)' }}>
                  {article.source && article.source.name && (
                    <span><strong>Source:</strong> {article.source.name}</span>
                  )}
                  {article.publishedAt && (
                    <span>• {formatDate(article.publishedAt)}</span>
                  )}
                  {readingTime > 0 && (
                    <span>• ⏱️ {readingTime} min read</span>
                  )}
                  {article.recommendationScore > 0 && (
                    <span style={{ color: 'var(--primary, #007bff)' }}>• ⭐ Highly Recommended</span>
                  )}
                </div>
                <div style={{ marginTop: 8 }}>
                  <a 
                    href={article.url} 
                    target='_blank' 
                    rel='noreferrer'
                    onClick={() => handleArticleClick(article)}
                    style={{ color: 'var(--primary, #007bff)', textDecoration: 'none' }}
                  >
                    Read more →
                  </a>
                </div>
              </div>
              <div style={{ marginLeft: '12px' }}>
                <button className='button' onClick={() => save(article)}>Save</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

