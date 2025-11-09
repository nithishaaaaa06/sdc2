require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const webpush = require('web-push');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || '';

// Optional MongoDB connection
let UserModel = null;
let BookmarkModel = null;
let ReadingHistoryModel = null;
let UserPreferencesModel = null;
let useMongo = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(()=>{
      console.log('Connected to MongoDB');
    }).catch(err=>{
      console.error('MongoDB connection error:', err.message);
    });
  const userSchema = new mongoose.Schema({ name:String, email:String, password:String });
  const bookmarkSchema = new mongoose.Schema({ userId:String, article:Object });
  const readingHistorySchema = new mongoose.Schema({ userId:String, article:Object, viewedAt:Date });
  const userPreferencesSchema = new mongoose.Schema({ 
    userId:String, 
    favoriteCategories:[String], 
    favoriteSources:[String],
    readingStreak:Number,
    lastReadDate:Date
  });
  UserModel = mongoose.model('User', userSchema);
  BookmarkModel = mongoose.model('Bookmark', bookmarkSchema);
  ReadingHistoryModel = mongoose.model('ReadingHistory', readingHistorySchema);
  UserPreferencesModel = mongoose.model('UserPreferences', userPreferencesSchema);
  useMongo = true;
}

// In-memory fallback (for quick demo without DB)
const users = []; // { id, name, email, passwordHash }
const bookmarks = []; // { id, userId, article }
const readingHistory = []; // { id, userId, article, viewedAt }
const userPreferences = []; // { userId, favoriteCategories, favoriteSources, readingStreak, lastReadDate }
const pushSubscriptions = []; // { endpoint, keys }

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:example@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error:'Missing authorization header' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error:'Invalid token' });
  }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error:'email and password required' });
  if (useMongo) {
    const exists = await UserModel.findOne({ email }).exec();
    if (exists) return res.status(400).json({ error:'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    const u = new UserModel({ name, email, password:hash });
    await u.save();
    return res.json({ message:'Registered' });
  } else {
    if (users.find(u=>u.email===email)) return res.status(400).json({ error:'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const id = 'u'+Date.now();
    users.push({ id, name, email, passwordHash: hash });
    return res.json({ message:'Registered' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error:'email and password required' });
  if (useMongo) {
    const u = await UserModel.findOne({ email }).exec();
    if (!u) return res.status(400).json({ error:'Invalid credentials' });
    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ error:'Invalid credentials' });
    const token = jwt.sign({ id: u._id, email: u.email }, JWT_SECRET, { expiresIn:'7d' });
    return res.json({ token });
  } else {
    const u = users.find(x=>x.email===email);
    if (!u) return res.status(400).json({ error:'Invalid credentials' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(400).json({ error:'Invalid credentials' });
    const token = jwt.sign({ id: u.id, email: u.email }, JWT_SECRET, { expiresIn:'7d' });
    return res.json({ token });
  }
});

// News proxy
app.get('/api/news', async (req, res) => {
  const category = req.query.category || 'general';
  const q = req.query.q || '';
  if (!NEWSAPI_KEY) {
    return res.status(500).json({ error:'NEWSAPI_KEY not set in server. See .env.example' });
  }
  try {
    const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=20&category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}`;
    const response = await axios.get(url, { headers: { 'X-Api-Key': NEWSAPI_KEY } });
    return res.json(response.data);
  } catch (err) {
    console.error('NewsAPI error:', err.message);
    return res.status(500).json({ error:'Failed to fetch news' });
  }
});

// Trending headlines
app.get('/api/trending', async (req, res) => {
  const country = req.query.country || 'us';
  const category = req.query.category || '';
  if (!NEWSAPI_KEY) {
    return res.status(500).json({ error:'NEWSAPI_KEY not set in server. See .env.example' });
  }
  try {
    const base = 'https://newsapi.org/v2/top-headlines';
    const url = `${base}?pageSize=20&country=${encodeURIComponent(country)}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
    console.log('[trending]', { country, category, url });
    const response = await axios.get(url, { headers: { 'X-Api-Key': NEWSAPI_KEY } });
    if (response.data && Array.isArray(response.data.articles) && response.data.articles.length > 0) {
      return res.json(response.data);
    }

    // Fallback: if top-headlines returns 0, query popular domains per country via `everything`
    const countryDomains = {
      us: ['nytimes.com','cnn.com','foxnews.com','washingtonpost.com','theverge.com','wsj.com'],
      gb: ['bbc.co.uk','theguardian.com','telegraph.co.uk','independent.co.uk','metro.co.uk'],
      in: ['hindustantimes.com','ndtv.com','indiatoday.in','timesofindia.indiatimes.com','thehindu.com','livemint.com'],
      au: ['abc.net.au','news.com.au','theage.com.au','smh.com.au','theaustralian.com.au'],
      ca: ['cbc.ca','ctvnews.ca','globalnews.ca','theglobeandmail.com','nationalpost.com']
    };
    const domains = countryDomains[country];
    if (!domains) {
      return res.json(response.data); // no mapping; return original (empty) response
    }
    const fallbackUrl = `https://newsapi.org/v2/everything?sortBy=publishedAt&pageSize=20&domains=${encodeURIComponent(domains.join(','))}`;
    console.log('[trending:fallback]', { country, fallbackUrl });
    const fb = await axios.get(fallbackUrl, { headers: { 'X-Api-Key': NEWSAPI_KEY } });
    if (fb.data && Array.isArray(fb.data.articles) && fb.data.articles.length > 0) {
      return res.json(fb.data);
    }

    // Final fallback: global top-headlines without country (optionally category)
    const globalUrl = `${base}?pageSize=20${category ? `&category=${encodeURIComponent(category)}` : ''}`;
    console.log('[trending:global-fallback]', { globalUrl });
    const gb = await axios.get(globalUrl, { headers: { 'X-Api-Key': NEWSAPI_KEY } });
    return res.json(gb.data);
  } catch (err) {
    console.error('Trending error:', err.message);
    return res.status(500).json({ error:'Failed to fetch trending' });
  }
});

// Bookmarks (requires auth)
app.get('/api/bookmarks', authMiddleware, async (req, res) => {
  if (useMongo) {
    const docs = await BookmarkModel.find({ userId: req.user.id }).exec();
    return res.json(docs.map(d=>({ id:d._id, article:d.article })));
  } else {
    const userBookmarks = bookmarks.filter(b=>b.userId===req.user.id);
    return res.json(userBookmarks);
  }
});

app.post('/api/bookmarks', authMiddleware, async (req, res) => {
  const { article } = req.body;
  if (!article) return res.status(400).json({ error:'article required' });
  if (useMongo) {
    const b = new BookmarkModel({ userId: req.user.id, article });
    await b.save();
    return res.json({ id: b._id, article: b.article });
  } else {
    const id = 'b'+Date.now();
    const entry = { id, userId: req.user.id, article };
    bookmarks.push(entry);
    return res.json(entry);
  }
});

app.delete('/api/bookmarks/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (useMongo) {
    await BookmarkModel.deleteOne({ _id: id, userId: req.user.id }).exec();
    return res.json({ message:'deleted' });
  } else {
    const idx = bookmarks.findIndex(b=>b.id===id && b.userId===req.user.id);
    if (idx===-1) return res.status(404).json({ error:'not found' });
    bookmarks.splice(idx,1);
    return res.json({ message:'deleted' });
  }
});

// Reading History endpoints
app.post('/api/history', authMiddleware, async (req, res) => {
  const { article } = req.body;
  if (!article) return res.status(400).json({ error:'article required' });
  const viewedAt = new Date();
  
  if (useMongo) {
    // Check if already exists to avoid duplicates
    const existing = await ReadingHistoryModel.findOne({ 
      userId: req.user.id, 
      'article.url': article.url 
    }).exec();
    if (!existing) {
      const h = new ReadingHistoryModel({ userId: req.user.id, article, viewedAt });
      await h.save();
    }
    // Update reading streak
    await updateReadingStreak(req.user.id, useMongo);
    return res.json({ message:'tracked' });
  } else {
    const existing = readingHistory.find(h => h.userId === req.user.id && h.article.url === article.url);
    if (!existing) {
      const id = 'h'+Date.now();
      readingHistory.push({ id, userId: req.user.id, article, viewedAt });
    }
    updateReadingStreak(req.user.id, false);
    return res.json({ message:'tracked' });
  }
});

app.get('/api/history', authMiddleware, async (req, res) => {
  if (useMongo) {
    const docs = await ReadingHistoryModel.find({ userId: req.user.id })
      .sort({ viewedAt: -1 })
      .limit(100)
      .exec();
    return res.json(docs.map(d=>({ id:d._id, article:d.article, viewedAt:d.viewedAt })));
  } else {
    const userHistory = readingHistory
      .filter(h => h.userId === req.user.id)
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 100);
    return res.json(userHistory);
  }
});

// User Preferences endpoints
app.get('/api/preferences', authMiddleware, async (req, res) => {
  if (useMongo) {
    let prefs = await UserPreferencesModel.findOne({ userId: req.user.id }).exec();
    if (!prefs) {
      prefs = new UserPreferencesModel({ 
        userId: req.user.id, 
        favoriteCategories: [], 
        favoriteSources: [],
        readingStreak: 0,
        lastReadDate: null
      });
      await prefs.save();
    }
    return res.json({
      favoriteCategories: prefs.favoriteCategories || [],
      favoriteSources: prefs.favoriteSources || [],
      readingStreak: prefs.readingStreak || 0,
      lastReadDate: prefs.lastReadDate
    });
  } else {
    let prefs = userPreferences.find(p => p.userId === req.user.id);
    if (!prefs) {
      prefs = { userId: req.user.id, favoriteCategories: [], favoriteSources: [], readingStreak: 0, lastReadDate: null };
      userPreferences.push(prefs);
    }
    return res.json({
      favoriteCategories: prefs.favoriteCategories || [],
      favoriteSources: prefs.favoriteSources || [],
      readingStreak: prefs.readingStreak || 0,
      lastReadDate: prefs.lastReadDate
    });
  }
});

app.put('/api/preferences', authMiddleware, async (req, res) => {
  const { favoriteCategories, favoriteSources } = req.body;
  if (useMongo) {
    let prefs = await UserPreferencesModel.findOne({ userId: req.user.id }).exec();
    if (!prefs) {
      prefs = new UserPreferencesModel({ userId: req.user.id });
    }
    if (favoriteCategories !== undefined) prefs.favoriteCategories = favoriteCategories;
    if (favoriteSources !== undefined) prefs.favoriteSources = favoriteSources;
    await prefs.save();
    return res.json({ message:'updated' });
  } else {
    let prefs = userPreferences.find(p => p.userId === req.user.id);
    if (!prefs) {
      prefs = { userId: req.user.id, favoriteCategories: [], favoriteSources: [], readingStreak: 0, lastReadDate: null };
      userPreferences.push(prefs);
    }
    if (favoriteCategories !== undefined) prefs.favoriteCategories = favoriteCategories;
    if (favoriteSources !== undefined) prefs.favoriteSources = favoriteSources;
    return res.json({ message:'updated' });
  }
});

// Recommendations endpoint
app.get('/api/recommendations', authMiddleware, async (req, res) => {
  try {
    // Get user preferences and reading history
    let prefs, history;
    if (useMongo) {
      prefs = await UserPreferencesModel.findOne({ userId: req.user.id }).exec();
      history = await ReadingHistoryModel.find({ userId: req.user.id }).exec();
    } else {
      prefs = userPreferences.find(p => p.userId === req.user.id);
      history = readingHistory.filter(h => h.userId === req.user.id);
    }
    
    const favoriteCategories = (prefs && prefs.favoriteCategories) || [];
    const favoriteSources = (prefs && prefs.favoriteSources) || [];
    
    // Analyze reading history to infer preferences
    const categoryCounts = {};
    const sourceCounts = {};
    history.forEach(h => {
      const cat = h.article.category || 'general';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (h.article.source && h.article.source.name) {
        const source = h.article.source.name.toLowerCase();
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      }
    });
    
    // Get top categories and sources from history
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
    
    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([src]) => src);
    
    // Combine user preferences with inferred preferences
    const categoriesToFetch = [...new Set([...favoriteCategories, ...topCategories])];
    const primaryCategory = categoriesToFetch[0] || 'general';
    
    // Fetch news from primary category
    if (!NEWSAPI_KEY) {
      return res.status(500).json({ error:'NEWSAPI_KEY not set' });
    }
    
    const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=30&category=${encodeURIComponent(primaryCategory)}`;
    const response = await axios.get(url, { headers: { 'X-Api-Key': NEWSAPI_KEY } });
    
    let articles = response.data.articles || [];
    
    // Filter out articles user has already read
    const readUrls = new Set(history.map(h => h.article.url));
    articles = articles.filter(a => a.url && !readUrls.has(a.url));
    
    // Score articles based on preferences
    articles = articles.map(article => {
      let score = 0;
      const articleSource = (article.source && article.source.name) ? article.source.name.toLowerCase() : '';
      
      // Boost score for favorite categories
      if (favoriteCategories.includes(primaryCategory)) score += 10;
      
      // Boost score for favorite sources
      if (favoriteSources.some(fs => articleSource.includes(fs.toLowerCase()))) {
        score += 15;
      }
      
      // Boost score for top sources from history
      if (topSources.some(ts => articleSource.includes(ts))) {
        score += 5;
      }
      
      return { ...article, recommendationScore: score };
    });
    
    // Sort by recommendation score
    articles.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
    
    // Return top 20 recommendations
    return res.json({ articles: articles.slice(0, 20), preferences: { categories: categoriesToFetch, sources: topSources } });
  } catch (err) {
    console.error('Recommendations error:', err.message);
    return res.status(500).json({ error:'Failed to fetch recommendations' });
  }
});

// Helper function to update reading streak
async function updateReadingStreak(userId, useMongo) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (useMongo) {
    let prefs = await UserPreferencesModel.findOne({ userId }).exec();
    if (!prefs) {
      prefs = new UserPreferencesModel({ userId, favoriteCategories: [], favoriteSources: [], readingStreak: 0, lastReadDate: null });
    }
    
    const lastRead = prefs.lastReadDate ? new Date(prefs.lastReadDate) : null;
    if (lastRead) {
      lastRead.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, no change
      } else if (daysDiff === 1) {
        // Consecutive day
        prefs.readingStreak = (prefs.readingStreak || 0) + 1;
        prefs.lastReadDate = today;
      } else {
        // Streak broken
        prefs.readingStreak = 1;
        prefs.lastReadDate = today;
      }
    } else {
      // First time reading
      prefs.readingStreak = 1;
      prefs.lastReadDate = today;
    }
    await prefs.save();
  } else {
    let prefs = userPreferences.find(p => p.userId === userId);
    if (!prefs) {
      prefs = { userId, favoriteCategories: [], favoriteSources: [], readingStreak: 0, lastReadDate: null };
      userPreferences.push(prefs);
    }
    
    const lastRead = prefs.lastReadDate ? new Date(prefs.lastReadDate) : null;
    if (lastRead) {
      lastRead.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, no change
      } else if (daysDiff === 1) {
        // Consecutive day
        prefs.readingStreak = (prefs.readingStreak || 0) + 1;
        prefs.lastReadDate = today;
      } else {
        // Streak broken
        prefs.readingStreak = 1;
        prefs.lastReadDate = today;
      }
    } else {
      // First time reading
      prefs.readingStreak = 1;
      prefs.lastReadDate = today;
    }
  }
}

// Web Push endpoints
app.get('/api/push/public-key', (req, res) => {
  if (!VAPID_PUBLIC) return res.status(500).json({ error:'Push not configured' });
  return res.json({ publicKey: VAPID_PUBLIC });
});

app.post('/api/push/subscribe', async (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error:'Invalid subscription' });
  if (!pushSubscriptions.find(s=>s.endpoint===sub.endpoint)) pushSubscriptions.push(sub);
  return res.json({ ok:true });
});

app.post('/api/push/unsubscribe', async (req, res) => {
  const { endpoint } = req.body || {};
  const idx = pushSubscriptions.findIndex(s=>s.endpoint===endpoint);
  if (idx !== -1) pushSubscriptions.splice(idx,1);
  return res.json({ ok:true });
});

// Example endpoint to broadcast a breaking news notification
app.post('/api/push/broadcast', async (req, res) => {
  const { title, body, url } = req.body || {};
  if (!VAPID_PRIVATE || !VAPID_PUBLIC) return res.status(500).json({ error:'Push not configured' });
  const payload = JSON.stringify({ title: title || 'Breaking News', body: body || 'Tap to read', url: url || '/' });
  const results = await Promise.allSettled(pushSubscriptions.map(s=>webpush.sendNotification(s, payload)));
  // Cleanup gone subscriptions
  results.forEach((r,i)=>{ if (r.status==='rejected' && r.reason && r.reason.statusCode===410) pushSubscriptions.splice(i,1); });
  return res.json({ sent: results.filter(r=>r.status==='fulfilled').length });
});

app.get('/', (req,res)=>res.send('News Reader Backend Running'));

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});
