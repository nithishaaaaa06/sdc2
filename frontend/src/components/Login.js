import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [err,setErr]=useState('');

  async function submit(e){
    e.preventDefault();
    setErr('');
    try{
      const res = await api('/api/auth/login','POST',{ email, password });
      onLogin(res.token);
    }catch(err){
      setErr(err.error || 'Login failed');
    }
  }

  return (
    <div>
      <h3>Login</h3>
      <form onSubmit={submit}>
        <div><input className='input' placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div style={{marginTop:8}}><input className='input' type='password' placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <div style={{marginTop:8}}><button className='button' type='submit'>Login</button></div>
        {err && <div style={{color:'red',marginTop:8}}>{err}</div>}
      </form>
    </div>
  );
}
