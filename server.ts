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

interface StoredMerchant {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  password?: string;
  locality: string;
  assignedBinSerial: string;
  autoSyncEnabled?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StorageDb {
  questions: StoredQuestion[];
  snapshots: StoredSnapshot[];
  latestSequence: number;
  merchants?: StoredMerchant[];
  currentCounts?: {
    serial: string;
    countA: number;
    countB: number;
    total: number;
    updatedAt: string;
  };
  binCounts?: Record<string, {
    serial: string;
    locationName?: string;
    countA: number;
    countB: number;
    total: number;
    updatedAt: string;
  }>;
}

const DEFAULT_QUESTIONS: StoredQuestion[] = [
  {
    id: 'q-kota-airport',
    text: 'KOTA AIRPORT WILL BE COMPLETED ON TIME? / क्या कोटा एयरपोर्ट समय पर पूरा होगा?',
    optionA: 'YES / हाँ',
    optionB: 'NO / नहीं',
    language: 'Hindi',
    category: 'Civic',
    author: 'Code & Circuit SmartBin',
    activeStart: '2026-10-01',
    activeEnd: '2026-12-31',
    createdAt: '2026-10-01T00:00:00Z',
  },
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

const KOTA_BIN_LOCATIONS: Record<string, string> = {
  'CC-BIN-01': 'Gumanpura - Tea Corner',
  'CC-BIN-02': 'Talwandi Circle - Student Chai',
  'CC-BIN-03': 'Vigyan Nagar - Coaching Point',
  'CC-BIN-04': 'Indra Vihar - Hostel Gate',
  'CC-BIN-05': 'Nayapura - Bus Stand Tea',
};

// Ensure all 5 Kota bins exist in db.binCounts
if (!db.binCounts) {
  db.binCounts = {};
}
Object.entries(KOTA_BIN_LOCATIONS).forEach(([serial, loc]) => {
  if (!db.binCounts[serial]) {
    db.binCounts[serial] = {
      serial,
      locationName: loc,
      countA: 0,
      countB: 0,
      total: 0,
      updatedAt: new Date().toISOString(),
    };
  }
});

// Persistent latest bin telemetry store from DB or clean zero
let latestBinData = db.currentCounts || {
  serial: 'CC-BIN-01',
  countA: 0,
  countB: 0,
  total: 0,
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

  const targetSerial = String(req.query.serial || req.body?.serial || req.query.binId || req.body?.binId || 'CC-BIN-01').trim();
  if (!db.binCounts) db.binCounts = {};

  const currentForBin = db.binCounts[targetSerial] || {
    serial: targetSerial,
    locationName: KOTA_BIN_LOCATIONS[targetSerial] || targetSerial,
    countA: 0,
    countB: 0,
    total: 0,
    updatedAt: new Date().toISOString(),
  };

  if (a !== null || b !== null) {
    const nextA = a !== null && !isNaN(a) ? Math.max(0, a) : currentForBin.countA;
    const nextB = b !== null && !isNaN(b) ? Math.max(0, b) : currentForBin.countB;
    const updatedBin = {
      serial: targetSerial,
      locationName: KOTA_BIN_LOCATIONS[targetSerial] || targetSerial,
      countA: nextA,
      countB: nextB,
      total: nextA + nextB,
      updatedAt: new Date().toISOString(),
    };
    db.binCounts[targetSerial] = updatedBin;

    // Calculate network-wide cumulative totals across all bins
    const allBins = Object.values(db.binCounts);
    const networkA = allBins.reduce((sum, item: any) => sum + (item.countA || 0), 0);
    const networkB = allBins.reduce((sum, item: any) => sum + (item.countB || 0), 0);

    latestBinData = {
      serial: targetSerial,
      countA: networkA,
      countB: networkB,
      total: networkA + networkB,
      updatedAt: new Date().toISOString(),
    };
    db.currentCounts = latestBinData;
    saveDb();
  }

  res.json({
    success: true,
    data: db.binCounts[targetSerial] || latestBinData,
    networkTotals: latestBinData,
    message: `Telemetry saved for bin ${targetSerial} (${KOTA_BIN_LOCATIONS[targetSerial] || targetSerial})`,
  });
});

app.get('/api/bin/counts', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const targetSerial = typeof req.query.serial === 'string' ? req.query.serial.trim() : null;
  if (!db.binCounts) db.binCounts = {};

  if (targetSerial) {
    const binData = db.binCounts[targetSerial] || {
      serial: targetSerial,
      locationName: KOTA_BIN_LOCATIONS[targetSerial] || targetSerial,
      countA: 0,
      countB: 0,
      total: 0,
      updatedAt: new Date().toISOString(),
    };
    return res.json(binData);
  }

  const allBins = Object.values(db.binCounts);
  const networkA = allBins.reduce((sum, item: any) => sum + (item.countA || 0), 0);
  const networkB = allBins.reduce((sum, item: any) => sum + (item.countB || 0), 0);

  res.json({
    latest: latestBinData,
    bins: db.binCounts,
    countA: networkA,
    countB: networkB,
    total: networkA + networkB,
    serial: latestBinData.serial,
  });
});

// Reject arbitrary manual count overrides - Only real ESP32 / sensor / ballot inputs allowed
app.all('/api/bin/set-counts', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);

  res.status(403).json({
    success: false,
    error: 'Manual count setting is disabled. All vote counts must come directly from real ESP32 sensors or authentic ballots.',
  });
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

// Reset Bin Counts - Strictly Restricted to Admin - Auto-Archives All Bin Data with Question Info
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

  const targetSerial = req.query.serial || req.body?.serial;
  const activeQ = db.questions[0] || DEFAULT_QUESTIONS[0];
  const questionId = req.body?.questionId || req.query.questionId || activeQ.id;
  const questionText = req.body?.questionText || req.query.questionText || activeQ.text;
  const optionA = req.body?.optionA || req.query.optionA || activeQ.optionA;
  const optionB = req.body?.optionB || req.query.optionB || activeQ.optionB;

  const archivedSnapshots: StoredSnapshot[] = [];

  // Archive data for bins that had votes recorded
  if (db.binCounts && Object.keys(db.binCounts).length > 0) {
    for (const [serial, bin] of Object.entries(db.binCounts)) {
      if (targetSerial && targetSerial !== 'ALL' && serial !== targetSerial) {
        continue;
      }
      const b = bin as any;
      if ((b.countA || 0) + (b.countB || 0) > 0) {
        db.latestSequence += 1;
        const snapshot: StoredSnapshot = {
          sequence: db.latestSequence,
          id: `archive-${serial}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          unitSerial: serial,
          deviceName: `SmartBin ${serial} (${KOTA_BIN_LOCATIONS[serial] || b.locationName || 'Kota Location'})`,
          questionId,
          questionText,
          optionA,
          optionB,
          countA: b.countA || 0,
          countB: b.countB || 0,
          connectionMethod: 'Admin Reset Auto-Archive (Pre-Reset)',
          capturedAt: b.updatedAt || new Date().toISOString(),
          savedAt: new Date().toISOString(),
        };
        db.snapshots.unshift(snapshot);
        archivedSnapshots.push(snapshot);
      }
      // Zero out the bin count after saving
      b.countA = 0;
      b.countB = 0;
      b.total = 0;
      b.updatedAt = new Date().toISOString();
    }
  }

  // Also if latestBinData had votes that were not captured above
  if (latestBinData.total > 0 && !archivedSnapshots.some((s) => s.unitSerial === latestBinData.serial)) {
    db.latestSequence += 1;
    const snapshot: StoredSnapshot = {
      sequence: db.latestSequence,
      id: `archive-${latestBinData.serial}-${Date.now()}`,
      unitSerial: latestBinData.serial,
      deviceName: `SmartBin ${latestBinData.serial} (${KOTA_BIN_LOCATIONS[latestBinData.serial] || 'Kota Network'})`,
      questionId,
      questionText,
      optionA,
      optionB,
      countA: latestBinData.countA,
      countB: latestBinData.countB,
      connectionMethod: 'Admin Reset Auto-Archive (Network)',
      capturedAt: latestBinData.updatedAt || new Date().toISOString(),
      savedAt: new Date().toISOString(),
    };
    db.snapshots.unshift(snapshot);
    archivedSnapshots.push(snapshot);
  }

  latestBinData = {
    serial: 'CC-BIN-01',
    countA: 0,
    countB: 0,
    total: 0,
    updatedAt: new Date().toISOString(),
  };
  db.currentCounts = latestBinData;
  saveDb();

  res.json({
    success: true,
    message: 'Bin counts reset to 0. Historical data and question safely preserved in database.',
    archivedCount: archivedSnapshots.length,
    archivedSnapshots,
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

// Activate existing question
app.post('/api/survey/questions/activate/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.params;
  const idx = db.questions.findIndex((q) => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }
  const [selected] = db.questions.splice(idx, 1);
  db.questions.unshift(selected);
  saveDb();
  res.json({ success: true, activeQuestion: selected });
});

// Delete question
app.delete('/api/survey/questions/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.params;
  db.questions = db.questions.filter((q) => q.id !== id);
  saveDb();
  res.json({ success: true, message: 'Question deleted' });
});

// Delete snapshot / history record
app.delete('/api/survey/history/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.params;
  db.snapshots = db.snapshots.filter((s) => s.id !== id);
  saveDb();
  res.json({ success: true, message: 'History record deleted' });
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

// ==========================================
// SHOPKEEPER & BIN ASSIGNMENT API ROUTES
// ==========================================

const DEFAULT_STORED_MERCHANTS: StoredMerchant[] = [
  {
    id: 'merch-01',
    name: 'Ramesh Tiwari',
    phone: '9829011420',
    password: '1234',
    shopName: 'Sharma Tea Point & Cafe',
    locality: 'Gumanpura / Kunhari, Kota',
    assignedBinSerial: 'CC-BIN-01',
    autoSyncEnabled: true,
  },
  {
    id: 'merch-02',
    name: 'Gopal Soni',
    phone: '9414233100',
    password: '1234',
    shopName: 'Jai Hind Refreshment Stall',
    locality: 'Talwandi Commerce Circle, Kota',
    assignedBinSerial: 'CC-BIN-02',
    autoSyncEnabled: true,
  },
  {
    id: 'merch-03',
    name: 'Mohan Lal',
    phone: '9785123980',
    password: '1234',
    shopName: 'Kota Chai Point',
    locality: 'Vigyan Nagar Coaching Strip, Kota',
    assignedBinSerial: 'CC-BIN-03',
    autoSyncEnabled: true,
  },
  {
    id: 'merch-04',
    name: 'Shankar Lal',
    phone: '9828456123',
    password: '1234',
    shopName: 'Royal Paan Palace',
    locality: 'Rangbari / Indra Vihar, Kota',
    assignedBinSerial: 'CC-BIN-04',
    autoSyncEnabled: true,
  },
  {
    id: 'merch-05',
    name: 'Dinesh Rathore',
    phone: '9413789012',
    password: '1234',
    shopName: 'Central City Tobacco Kiosk',
    locality: 'Nayapura Bus Stand, Kota',
    assignedBinSerial: 'CC-BIN-05',
    autoSyncEnabled: true,
  },
];

// GET /api/merchants - List all registered shopkeepers & assigned bins
app.get('/api/merchants', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!db.merchants || db.merchants.length === 0) {
    db.merchants = [...DEFAULT_STORED_MERCHANTS];
    saveDb();
  }
  res.json({ merchants: db.merchants });
});

// POST /api/merchants - Add new shopkeeper with assigned bin & password
app.post('/api/merchants', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { name, shopName, phone, password, locality, assignedBinSerial, notes } = req.body || {};
  if (!name || !shopName || !phone) {
    return res.status(400).json({ error: 'Shopkeeper Name, Shop Name, and Mobile Number are required.' });
  }

  if (!db.merchants) db.merchants = [...DEFAULT_STORED_MERCHANTS];

  const newMerch: StoredMerchant = {
    id: `merch-${Date.now().toString().slice(-5)}`,
    name: String(name).trim(),
    shopName: String(shopName).trim(),
    phone: String(phone).replace(/\D/g, '').slice(-10),
    password: password ? String(password).trim() : '1234',
    locality: locality ? String(locality).trim() : 'Kota, Rajasthan',
    assignedBinSerial: assignedBinSerial ? String(assignedBinSerial).trim() : 'CC-BIN-01',
    autoSyncEnabled: true,
    notes: notes ? String(notes).trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.merchants.push(newMerch);
  saveDb();
  res.json({ success: true, merchant: newMerch });
});

// PUT /api/merchants/:id - Update shopkeeper details, password, or reassign bin
app.put('/api/merchants/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.params;
  if (!db.merchants) db.merchants = [...DEFAULT_STORED_MERCHANTS];

  const idx = db.merchants.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Shopkeeper not found' });
  }

  const existing = db.merchants[idx];
  const updated: StoredMerchant = {
    ...existing,
    name: req.body?.name !== undefined ? String(req.body.name).trim() : existing.name,
    shopName: req.body?.shopName !== undefined ? String(req.body.shopName).trim() : existing.shopName,
    phone: req.body?.phone !== undefined ? String(req.body.phone).replace(/\D/g, '').slice(-10) : existing.phone,
    password: req.body?.password !== undefined ? String(req.body.password).trim() : (existing.password || '1234'),
    locality: req.body?.locality !== undefined ? String(req.body.locality).trim() : existing.locality,
    assignedBinSerial: req.body?.assignedBinSerial !== undefined ? String(req.body.assignedBinSerial).trim() : existing.assignedBinSerial,
    notes: req.body?.notes !== undefined ? String(req.body.notes).trim() : existing.notes,
    updatedAt: new Date().toISOString(),
  };

  db.merchants[idx] = updated;
  saveDb();
  res.json({ success: true, merchant: updated });
});

// DELETE /api/merchants/:id - Remove shopkeeper
app.delete('/api/merchants/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.params;
  if (!db.merchants) db.merchants = [...DEFAULT_STORED_MERCHANTS];

  db.merchants = db.merchants.filter((m) => m.id !== id);
  saveDb();
  res.json({ success: true, message: 'Shopkeeper removed successfully' });
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
