import React, { useState } from 'react';
import { api } from '../api';

export default function Signup({ onSigned }){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');

  async function submit(e){
    e.preventDefault();
    setMsg('');
    try{
      await api('/api/auth/register','POST',{ name, email, password });
      setMsg('Registered. Please login.');
      onSigned && onSigned();
    }catch(err){
      setMsg(err.error || 'Registration failed');
    }
  }

  return (
    <div>
      <h3>Signup</h3>
      <form onSubmit={submit}>
        <div><input className='input' placeholder='Name' value={name} onChange={e=>setName(e.target.value)} /></div>
        <div style={{marginTop:8}}><input className='input' placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div style={{marginTop:8}}><input className='input' type='password' placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <div style={{marginTop:8}}><button className='button' type='submit'>Register</button></div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </form>
    </div>
  );
}
