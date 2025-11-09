import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import NewsList from './components/NewsList';
import Trending from './components/Trending';
import Bookmarks from './components/Bookmarks';
import PersonalizedFeed from './components/PersonalizedFeed';
import Preferences from './components/Preferences';
import ReadingHistory from './components/ReadingHistory';
import { enableNotifications, disableNotifications, isSubscribedToPush } from './push';
import Footer from './components/Footer';

function App(){
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState(token ? 'personalized' : 'news');
  const [dark, setDark] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(()=>{
    if(token) {
      // naive decode to show email if present in token payload (not secure)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email:payload.email });
      }catch(e){ setUser(null); }
    } else setUser(null);
  }, [token]);

  useEffect(()=>{
    (async ()=>{
      const s = await isSubscribedToPush();
      setPushEnabled(s);
    })();
  },[]);

  // Sync dark mode class onto <body> so global styles respond correctly
  useEffect(()=>{
    const cls = document.body.classList;
    if (dark) cls.add('dark'); else cls.remove('dark');
  }, [dark]);

  function handleLogin(t){
    localStorage.setItem('token', t);
    setToken(t);
    setView('personalized');
  }
  function handleLogout(){
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  // Unauthenticated page: show only Login/Signup
  if (!token) {
    return (
      <div>
        <div className='app'>
          <Navbar user={null} onLogout={()=>{}} dark={dark} setDark={setDark} />
          <div className='auth-grid' style={{margin:'30px 0 10px'}}>
            <div className='card'>
              <Login onLogin={handleLogin} />
            </div>
            <div className='card'>
              <Signup onSigned={()=>{}} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='app'>
        <Navbar user={user} onLogout={handleLogout} dark={dark} setDark={setDark} />
        <div className='layout'>
          <div className='sidebar side-actions'>
            <div className='stack'>
              <h4>Actions</h4>
              <button className='button' onClick={()=>setView('personalized')} style={{backgroundColor: view==='personalized' ? 'var(--primary, #007bff)' : '', color: view==='personalized' ? 'white' : ''}}>
                ⭐ Personalized
              </button>
              <button className='button' onClick={()=>setView('news')} style={{backgroundColor: view==='news' ? 'var(--primary, #007bff)' : '', color: view==='news' ? 'white' : ''}}>
                News
              </button>
              <button className='button' onClick={()=>setView('trending')} style={{backgroundColor: view==='trending' ? 'var(--primary, #007bff)' : '', color: view==='trending' ? 'white' : ''}}>
                Trending
              </button>
              <button className='button' onClick={()=>setView('bookmarks')} style={{backgroundColor: view==='bookmarks' ? 'var(--primary, #007bff)' : '', color: view==='bookmarks' ? 'white' : ''}}>
                Bookmarks
              </button>
              <button className='button' onClick={()=>setView('history')} style={{backgroundColor: view==='history' ? 'var(--primary, #007bff)' : '', color: view==='history' ? 'white' : ''}}>
                History
              </button>
              <button className='button' onClick={()=>setView('preferences')} style={{backgroundColor: view==='preferences' ? 'var(--primary, #007bff)' : '', color: view==='preferences' ? 'white' : ''}}>
                Preferences
              </button>
            </div>
          </div>
          <div className='main'>
            {view==='personalized' && <PersonalizedFeed token={token} />}
            {view==='news' && <NewsList token={token} />}
            {view==='trending' && <Trending token={token} />}
            {view==='bookmarks' && <Bookmarks token={token} />}
            {view==='history' && <ReadingHistory token={token} />}
            {view==='preferences' && <Preferences token={token} />}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
