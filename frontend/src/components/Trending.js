import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { calculateReadingTime, formatDate } from '../utils';

export default function Trending({ token }){
  const [articles,setArticles]=useState([]);
  const [msg,setMsg]=useState('');
  const [country,setCountry]=useState('us');

  useEffect(()=>{ fetchTrending(); }, [country]);

  async function fetchTrending(){
    setMsg('loading...');
    try{
      const res = await api(`/api/trending?country=${encodeURIComponent(country)}`);
      setArticles(res.articles || []);
      setMsg('');
    }catch(err){
      setMsg(err.error || 'Failed to fetch trending');
    }
  }

  async function trackReading(article){
    if(!token) return;
    try{
      await api('/api/history', 'POST', { article }, token);
    }catch(e){
      console.error('Failed to track reading', e);
    }
  }

  async function save(article){
    if(!token){ alert('Login to save.'); return; }
    try{
      await api('/api/bookmarks','POST',{ article }, token);
      alert('Saved to bookmarks');
    }catch(e){ alert(e.error || 'Failed'); }
  }

  function handleArticleClick(article){
    trackReading(article);
    window.open(article.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div>
      <h3>Trending</h3>
      <div style={{display:'flex',gap:8, marginBottom:8}}>
        <select value={country} onChange={e=>setCountry(e.target.value)} className='input'>
          <option value='us'>United States</option>
          <option value='gb'>United Kingdom</option>
          <option value='in'>India</option>
          <option value='au'>Australia</option>
          <option value='ca'>Canada</option>
        </select>
        <button className='button' onClick={fetchTrending}>Refresh</button>
      </div>
      {msg && <div>{msg}</div>}
      {articles.map((a, i)=>{
        const readingTime = calculateReadingTime((a.description || '') + ' ' + (a.content || ''));
        return (
          <div className='card' key={i} style={{marginBottom: '12px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div style={{flex: 1}}>
                <div style={{fontWeight:600, fontSize: '1.1em', marginBottom: '8px', cursor: 'pointer'}}
                  onClick={() => handleArticleClick(a)}>
                  {a.title}
                </div>
                <div style={{marginTop:8, color: 'var(--text-secondary, #666)'}}>{a.description}</div>
                <div style={{marginTop:8, display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.9em', color: 'var(--text-secondary, #666)'}}>
                  {a.source && a.source.name && <span><strong>Source:</strong> {a.source.name}</span>}
                  {a.publishedAt && <span>• {formatDate(a.publishedAt)}</span>}
                  {readingTime > 0 && <span>• ⏱️ {readingTime} min read</span>}
                </div>
                <div style={{marginTop:8}}>
                  <a 
                    href={a.url} 
                    target='_blank' 
                    rel='noreferrer'
                    onClick={() => handleArticleClick(a)}
                    style={{color: 'var(--primary, #007bff)', textDecoration: 'none'}}
                  >
                    Read more →
                  </a>
                </div>
              </div>
              <div style={{marginLeft: '12px'}}>
                <button className='button' onClick={()=>save(a)}>Save</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


