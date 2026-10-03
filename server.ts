import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage file for persistent survey snapshots & questions
const DATA_FILE = path.resolve(__dirname, 'survey-data.json');

interface StoredQuestion {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  language: string;
  category: string;
  author: string;
  activeStart: string;
  activeEnd: string;
  createdAt: string;
}

interface StoredSnapshot {
  sequence: number;
  id: string;
  unitSerial: string;
  deviceName: string;
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  countA: number;
  countB: number;
  connectionMethod: string;
  capturedAt: string;
  savedAt: string;
}

interface StorageDb {
  questions: StoredQuestion[];
  snapshots: StoredSnapshot[];
  latestSequence: number;
}

const DEFAULT_QUESTIONS: StoredQuestion[] = [
  {
    id: 'q-01',
    text: 'क्या कोटा में रात 10 बजे के बाद लाइब्रेरी खुलनी चाहिए? / Should student libraries stay open past 10 PM in Kota?',
    optionA: 'हाँ / YES',
    optionB: 'नहीं / NO',
    language: 'Hindi',
    category: 'Education',
    author: 'Admin Team (Mukesh)',
    activeStart: '2026-09-20',
    activeEnd: '2026-10-10',
    createdAt: '2026-09-19T10:00:00Z',
  },
  {
    id: 'q-02',
    text: 'सार्वजनिक स्थान पर कचरा फेंकने पर ₹500 का तत्काल जुर्माना होना चाहिए? / Should there be a ₹500 spot fine for littering in public?',
    optionA: 'सहमत / AGREE',
    optionB: 'असहमत / DISAGREE',
    language: 'Hindi',
    category: 'Civic',
    author: 'Admin Team (Mukesh)',
    activeStart: '2026-09-21',
    activeEnd: '2026-10-15',
    createdAt: '2026-09-20T14:30:00Z',
  },
  {
    id: 'q-03',
    text: 'JEE / NEET तैयारी में ऑनलाइन vs ऑफलाइन टेस्ट सीरीज: कौन अधिक मददगार है? / JEE prep: Online or Offline Mock Tests?',
    optionA: 'ऑनलाइन / ONLINE',
    optionB: 'ऑफलाइन / OFFLINE',
    language: 'Hindi',
    category: 'Youth',
    author: 'Research Team',
    activeStart: '2026-09-25',
    activeEnd: '2026-10-25',
    createdAt: '2026-09-24T09:15:00Z',
  },
];

function loadDb(): StorageDb {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed reading survey-data.json, starting fresh:', err);
  }
  return {
    questions: DEFAULT_QUESTIONS,
    snapshots: [],
    latestSequence: 0,
  };
}

let db = loadDb();

function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed saving survey-data.json:', err);
  }
}

// In-memory latest bin telemetry store
let latestBinData = {
  serial: 'CC-BIN-01',
  countA: 412,
  countB: 288,
  total: 700,
  updatedAt: new Date().toISOString(),
};

// IoT Telemetry API endpoint for ESP32 Wi-Fi Sync
app.all('/api/bin/sync', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const queryA = req.query.a || req.query.countA;
  const queryB = req.query.b || req.query.countB;
  const bodyA = req.body?.countA ?? req.body?.a;
  const bodyB = req.body?.countB ?? req.body?.b;

  const a =
    queryA !== undefined
      ? parseInt(String(queryA), 10)
      : bodyA !== undefined
      ? parseInt(String(bodyA), 10)
      : null;
  const b =
    queryB !== undefined
      ? parseInt(String(queryB), 10)
      : bodyB !== undefined
      ? parseInt(String(bodyB), 10)
      : null;

  if (a !== null || b !== null) {
    latestBinData = {
      serial: String(req.query.serial || req.body?.serial || 'CC-BIN-01'),
      countA: a !== null && !isNaN(a) ? a : latestBinData.countA,
      countB: b !== null && !isNaN(b) ? b : latestBinData.countB,
      total:
        (a !== null && !isNaN(a) ? a : latestBinData.countA) +
        (b !== null && !isNaN(b) ? b : latestBinData.countB),
      updatedAt: new Date().toISOString(),
    };
  }

  res.json({
    success: true,
    data: latestBinData,
    message: 'Telemetry synchronized successfully',
  });
});

app.get('/api/bin/counts', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(latestBinData);
});

// Admin Authentication Endpoint
app.post('/api/admin/login', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { email, password, userId } = req.body || {};
  const cleanedEmail = String(email || userId || '').trim().toLowerCase();
  const inputPassword = String(password || '');

  if (
    (cleanedEmail === 'lokeshnaraniya@gmail.com' || cleanedEmail === '7976718683') &&
    inputPassword === 'lokeshadmin'
  ) {
    const adminToken = 'admin-token-lokesh-' + Buffer.from(cleanedEmail).toString('base64');
    return res.json({
      success: true,
      token: adminToken,
      user: {
        email: 'lokeshnaraniya@gmail.com',
        name: 'Lokesh Naraniya',
        role: 'SUPER_ADMIN',
      },
    });
  }
  return res.status(401).json({ success: false, error: 'Invalid admin email or password.' });
});

// Reset Bin Counts - Strictly Restricted to Admin
app.all('/api/bin/reset', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.body?.token;
  const adminSecret = req.query.password || req.body?.password;
  const adminKey = req.headers['x-admin-key'];

  const isAuthorized =
    token?.includes('admin-token-lokesh') ||
    adminSecret === 'lokeshadmin' ||
    adminKey === 'lokeshadmin';

  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'Access Denied: Admin login required to reset counts. Please log in with lokeshnaraniya@gmail.com',
    });
  }

  // Auto-archive previous survey counts into db.snapshots before zeroing so old data is permanently preserved
  if (latestBinData.total > 0) {
    const activeQ = db.questions[0] || DEFAULT_QUESTIONS[0];
    db.latestSequence += 1;
    const archivedSnapshot: StoredSnapshot = {
      sequence: db.latestSequence,
      id: `archive-${Date.now()}`,
      unitSerial: latestBinData.serial,
      deviceName: 'SmartBin CC-BIN-01 (Archived on Reset)',
      questionId: activeQ.id,
      questionText: activeQ.text,
      optionA: activeQ.optionA,
      optionB: activeQ.optionB,
      countA: latestBinData.countA,
      countB: latestBinData.countB,
      connectionMethod: 'Admin Reset Auto-Archive',
      capturedAt: latestBinData.updatedAt,
      savedAt: new Date().toISOString(),
    };
    db.snapshots.unshift(archivedSnapshot);
    saveDb();
  }

  latestBinData = {
    serial: 'CC-BIN-01',
    countA: 0,
    countB: 0,
    total: 0,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    message: 'Bin counts reset to 0 by Admin. Historical data archived successfully.',
    data: latestBinData,
  });
});

// ==========================================
// QUESTION & SNAPSHOT DATABASE API ROUTES
// ==========================================

// GET /api/survey/questions
app.get('/api/survey/questions', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ questions: db.questions });
});

// POST /api/survey/questions
app.post('/api/survey/questions', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { text, optionA, optionB, language, category, author, activeStart, activeEnd } = req.body;

  if (!text || !optionA || !optionB) {
    return res.status(400).json({ error: 'Question text and both options are required.' });
  }

  const newQuestion: StoredQuestion = {
    id: `q-${Date.now().toString().slice(-4)}`,
    text: text.trim(),
    optionA: optionA.trim(),
    optionB: optionB.trim(),
    language: language || 'Hindi',
    category: category || 'Civic',
    author: author || 'Saved survey',
    activeStart: activeStart || new Date().toISOString().slice(0, 10),
    activeEnd: activeEnd || '',
    createdAt: new Date().toISOString(),
  };

  db.questions.unshift(newQuestion);
  saveDb();

  res.json({ success: true, question: newQuestion });
});

// POST /api/survey/save
app.post('/api/survey/save', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {
    id,
    unitSerial,
    deviceName,
    questionText,
    optionA,
    optionB,
    countA,
    countB,
    connectionMethod,
    capturedAt,
  } = req.body;

  if (!unitSerial || questionText === undefined || optionA === undefined || optionB === undefined) {
    return res.status(400).json({ error: 'Missing required survey snapshot fields.' });
  }

  // Find or create associated question
  let matchingQ = db.questions.find(
    (q) => q.text === questionText && q.optionA === optionA && q.optionB === optionB
  );

  if (!matchingQ) {
    matchingQ = {
      id: `q-${Date.now().toString().slice(-4)}`,
      text: questionText.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      language: /[\u0900-\u097F]/.test(questionText) ? 'Hindi' : 'English',
      category: 'Civic',
      author: 'Live survey reading',
      activeStart: new Date().toISOString().slice(0, 10),
      activeEnd: '',
      createdAt: new Date().toISOString(),
    };
    db.questions.unshift(matchingQ);
  }

  db.latestSequence += 1;
  const newSnapshot: StoredSnapshot = {
    sequence: db.latestSequence,
    id: id || `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    unitSerial: unitSerial.trim(),
    deviceName: deviceName || 'ESP32 SmartBin',
    questionId: matchingQ.id,
    questionText: matchingQ.text,
    optionA: matchingQ.optionA,
    optionB: matchingQ.optionB,
    countA: Number(countA) || 0,
    countB: Number(countB) || 0,
    connectionMethod: connectionMethod || 'bluetooth',
    capturedAt: capturedAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
  };

  db.snapshots.unshift(newSnapshot);
  saveDb();

  res.json({
    success: true,
    record: newSnapshot,
    question: matchingQ,
  });
});

// GET /api/survey/history
app.get('/api/survey/history', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const unit = typeof req.query.unit === 'string' ? req.query.unit.trim().toLowerCase() : '';
  const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
  const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
  const cursor = req.query.cursor !== undefined ? parseInt(String(req.query.cursor), 10) : undefined;
  const upperSequence =
    req.query.upperSequence !== undefined
      ? parseInt(String(req.query.upperSequence), 10)
      : undefined;

  let filtered = db.snapshots;

  if (unit) {
    filtered = filtered.filter((s) => s.unitSerial.toLowerCase().includes(unit));
  }

  if (from) {
    const fromTime = new Date(from).getTime();
    if (!isNaN(fromTime)) {
      filtered = filtered.filter((s) => new Date(s.savedAt).getTime() >= fromTime);
    }
  }

  if (to) {
    const toTime = new Date(to).getTime() + 86400000;
    if (!isNaN(toTime)) {
      filtered = filtered.filter((s) => new Date(s.savedAt).getTime() <= toTime);
    }
  }

  if (upperSequence !== undefined) {
    filtered = filtered.filter((s) => s.sequence <= upperSequence);
  }

  // Sort descending by sequence
  filtered.sort((a, b) => b.sequence - a.sequence);

  const startIndex = cursor !== undefined ? cursor : 0;
  const limit = 50;
  const pageRecords = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? startIndex + limit : null;

  res.json({
    records: pageRecords,
    nextCursor,
  });
});

// Vite Middleware mounting
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Code & Circuit Survey Bin Server active on port ${port}`);
});
