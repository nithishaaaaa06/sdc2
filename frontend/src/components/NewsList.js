import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { calculateReadingTime, formatDate } from '../utils';

export default function NewsList({ token }){
  const [category,setCategory]=useState('general');
  const [q,setQ]=useState('');
  const [articles,setArticles]=useState([]);
  const [msg,setMsg]=useState('');

  useEffect(()=>{ fetchNews(); }, [category]);

  async function fetchNews(){
    setMsg('loading...');
    try{
      const res = await api(`/api/news?category=${category}&q=${encodeURIComponent(q)}`);
      setArticles(res.articles || []);
      setMsg('');
    }catch(err){
      setMsg(err.error || 'Failed to fetch');
    }
  }

  async function trackReading(article){
    if(!token) return;
    try{
      await api('/api/history', 'POST', { article: { ...article, category } }, token);
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
      <h3>Top Headlines</h3>
      <div style={{display:'flex',gap:8, marginBottom:8}}>
        <select value={category} onChange={e=>setCategory(e.target.value)} className='input'>
          <option value='general'>General</option>
          <option value='technology'>Technology</option>
          <option value='business'>Business</option>
          <option value='sports'>Sports</option>
          <option value='health'>Health</option>
          <option value='entertainment'>Entertainment</option>
        </select>
        <input className='input' placeholder='Search' value={q} onChange={e=>setQ(e.target.value)} />
        <button className='button' onClick={fetchNews}>Search</button>
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
