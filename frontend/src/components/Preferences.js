import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Preferences({ token }) {
  const [preferences, setPreferences] = useState({
    favoriteCategories: [],
    favoriteSources: [],
    readingStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const availableCategories = [
    'general', 'technology', 'business', 'sports', 
    'health', 'entertainment', 'science'
  ];

  useEffect(() => {
    if (token) {
      loadPreferences();
    }
  }, [token]);

  async function loadPreferences() {
    setLoading(true);
    try {
      const prefs = await api('/api/preferences', 'GET', null, token);
      setPreferences(prefs);
    } catch (e) {
      setMsg('Failed to load preferences');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    setMsg('');
    try {
      await api('/api/preferences', 'PUT', {
        favoriteCategories: preferences.favoriteCategories,
        favoriteSources: preferences.favoriteSources
      }, token);
      setMsg('Preferences saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg('Failed to save preferences');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(category) {
    setPreferences(prev => ({
      ...prev,
      favoriteCategories: prev.favoriteCategories.includes(category)
        ? prev.favoriteCategories.filter(c => c !== category)
        : [...prev.favoriteCategories, category]
    }));
  }

  function addSource() {
    const source = prompt('Enter a news source name (e.g., BBC, CNN, TechCrunch):');
    if (source && source.trim()) {
      setPreferences(prev => ({
        ...prev,
        favoriteSources: prev.favoriteSources.includes(source.trim())
          ? prev.favoriteSources
          : [...prev.favoriteSources, source.trim()]
      }));
    }
  }

  function removeSource(source) {
    setPreferences(prev => ({
      ...prev,
      favoriteSources: prev.favoriteSources.filter(s => s !== source)
    }));
  }

  if (!token) {
    return <div>Please login to manage preferences.</div>;
  }

  if (loading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <div>
      <h3>Your Preferences</h3>
      
      {msg && (
        <div className='card' style={{ 
          marginBottom: '16px', 
          padding: '12px',
          backgroundColor: msg.includes('saved') ? 'var(--success-bg, #d4edda)' : 'var(--error-bg, #f8d7da)'
        }}>
          {msg}
        </div>
      )}

      <div className='card' style={{ marginBottom: '16px', padding: '16px' }}>
        <h4 style={{ marginTop: 0 }}>Reading Statistics</h4>
        <div style={{ fontSize: '1.2em' }}>
          <strong>🔥 Reading Streak:</strong> {preferences.readingStreak || 0} day{preferences.readingStreak !== 1 ? 's' : ''}
        </div>
        <div style={{ marginTop: '8px', color: 'var(--text-secondary, #666)' }}>
          Keep reading daily to maintain your streak!
        </div>
      </div>

      <div className='card' style={{ marginBottom: '16px', padding: '16px' }}>
        <h4 style={{ marginTop: 0 }}>Favorite Categories</h4>
        <p style={{ color: 'var(--text-secondary, #666)' }}>
          Select categories you're most interested in. This helps us personalize your feed.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {availableCategories.map(cat => (
            <button
              key={cat}
              className='button'
              onClick={() => toggleCategory(cat)}
              style={{
                backgroundColor: preferences.favoriteCategories.includes(cat)
                  ? 'var(--primary, #007bff)'
                  : 'var(--button-bg, #e0e0e0)',
                color: preferences.favoriteCategories.includes(cat)
                  ? 'white'
                  : 'var(--text, #333)'
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
              {preferences.favoriteCategories.includes(cat) && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      <div className='card' style={{ marginBottom: '16px', padding: '16px' }}>
        <h4 style={{ marginTop: 0 }}>Favorite Sources</h4>
        <p style={{ color: 'var(--text-secondary, #666)' }}>
          Add news sources you prefer. Articles from these sources will be prioritized in your feed.
        </p>
        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
          <button className='button' onClick={addSource}>
            + Add Source
          </button>
        </div>
        {preferences.favoriteSources.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {preferences.favoriteSources.map((source, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--card-bg, #f5f5f5)',
                  borderRadius: '4px'
                }}
              >
                <span>{source}</span>
                <button
                  onClick={() => removeSource(source)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2em',
                    color: 'var(--error, #dc3545)'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary, #666)', fontStyle: 'italic' }}>
            No favorite sources yet. Click "Add Source" to add some.
          </div>
        )}
      </div>

      <button
        className='button'
        onClick={savePreferences}
        disabled={saving}
        style={{
          padding: '12px 24px',
          fontSize: '1em',
          backgroundColor: 'var(--primary, #007bff)',
          color: 'white'
        }}
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}

