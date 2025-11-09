import React from 'react';

export default function Navbar({ user, onLogout, dark, setDark }){
  return (
    <div className='header'>
      <div style={{fontWeight:600}}>News Reader</div>
      <div className='nav'>
        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input type='checkbox' checked={dark} onChange={e=>setDark(e.target.checked)} /> Dark
        </label>
        {user ? <>
          <div>Hi, {user.email}</div>
          <button className='button' onClick={onLogout}>Logout</button>
        </> : null}
      </div>
    </div>
  );
}
