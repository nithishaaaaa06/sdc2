import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Bookmarks({ token }){
  const [items,setItems]=useState([]);

  useEffect(()=>{ if(token) load(); }, [token]);

  async function load(){
    try{
      const res = await api('/api/bookmarks','GET', null, token);
      setItems(res);
    }catch(e){ console.error(e); }
  }

  async function remove(id){
    try{
      await api('/api/bookmarks/'+id, 'DELETE', null, token);
      setItems(items.filter(i=>i.id!==id));
    }catch(e){ alert('Failed to delete'); }
  }

  if(!token) return <div>Please login to view bookmarks.</div>;

  return (
    <div>
      <h3>Bookmarks</h3>
      {items.length===0 && <div>No bookmarks yet.</div>}
      {items.map((b)=>(
        <div className='card' key={b.id}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <div style={{fontWeight:600}}>{b.article.title}</div>
            <div><button className='button' onClick={()=>remove(b.id)}>Remove</button></div>
          </div>
          <div style={{marginTop:8}}>{b.article.description}</div>
          <div style={{marginTop:8}}><a href={b.article.url} target='_blank' rel='noreferrer'>Read</a></div>
        </div>
      ))}
    </div>
  );
}
