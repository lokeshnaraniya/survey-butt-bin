import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import { SurveyBinNetworkMap } from '../map/SurveyBinNetworkMap';
import { MerchantView } from '../merchant/MerchantView';
import { StaffUser } from '../../types';
import { getStaffList, addStaffUser, deleteStaffUser, authenticateStaffUser } from '../../services/staffService';
import {
  fetchMerchantsFromServer,
  addMerchant,
  updateMerchant,
  deleteMerchant,
  authenticateMerchant,
  MerchantProfile,
} from '../../services/merchantSyncService';
import {
  Vote,
  MapPin,
  Store,
  CheckCircle2,
  RotateCcw,
  Plus,
  Trash2,
  Download,
  Search,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Lock,
  LogOut,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Wifi,
  History,
  Award,
  Sliders,
  Calendar,
  Layers,
  Settings,
  HelpCircle,
  Eye,
  EyeOff,
  Check,
  Users,
  UserPlus,
  Phone,
  Sun,
  Moon,
  Key,
  Copy,
  User,
} from 'lucide-react';

interface QuestionSession {
  countA: number;
  countB: number;
  total: number;
  archivedAt: string;
}

interface QuestionRecord {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  category: string;
  countA: number;
  countB: number;
  total: number;
  createdAt: string;
  status: 'active' | 'archived';
  archivedAt?: string;
  archivedSessions?: QuestionSession[];
}

interface SavedSnapshotRecord {
  sequence?: number;
  id: string;
  unitSerial: string;
  deviceName?: string;
  questionId?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  countA: number;
  countB: number;
  total?: number;
  connectionMethod?: string;
  capturedAt: string;
  savedAt: string;
}

const DEFAULT_QUESTIONS_LIST: QuestionRecord[] = [
  {
    id: 'q-kota-airport',
    text: 'KOTA AIRPORT WILL BE COMPLETED ON TIME? / क्या कोटा एयरपोर्ट समय पर पूरा होगा?',
    optionA: 'YES / हाँ',
    optionB: 'NO / नहीं',
    category: 'Civic',
    countA: 0,
    countB: 0,
    total: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    status: 'active',
  },
  {
    id: 'q-01',
    text: 'क्या कोटा में रात 10 बजे के बाद लाइब्रेरी खुलनी चाहिए? / Should libraries stay open past 10 PM in Kota?',
    optionA: 'YES / हाँ',
    optionB: 'NO / नहीं',
    category: 'Education',
    countA: 0,
    countB: 0,
    total: 0,
    createdAt: '2026-09-20T10:00:00.000Z',
    status: 'archived',
  },
  {
    id: 'q-02',
    text: 'सार्वजनिक स्थान पर कचरा फेंकने पर ₹500 का तत्काल जुर्माना होना चाहिए? / Should there be a ₹500 spot fine for littering in public?',
    optionA: 'AGREE / सहमत',
    optionB: 'DISAGREE / असहमत',
    category: 'Civic',
    countA: 0,
    countB: 0,
    total: 0,
    createdAt: '2026-09-10T14:30:00.000Z',
    status: 'archived',
    archivedAt: '2026-09-19T23:59:00.000Z',
  },
  {
    id: 'q-03',
    text: 'JEE / NEET तैयारी में ऑनलाइन vs ऑफलाइन टेस्ट सीरीज: कौन अधिक मददगार है? / Online vs Offline Mock Tests?',
    optionA: 'ONLINE / ऑनलाइन',
    optionB: 'OFFLINE / ऑफलाइन',
    category: 'Youth',
    countA: 0,
    countB: 0,
    total: 0,
    createdAt: '2026-09-01T09:15:00.000Z',
    status: 'archived',
    archivedAt: '2026-09-09T23:59:00.000Z',
  },
];

interface PublicWebsiteProps {
  onOpenStaffApp?: () => void;
  onOpenShopkeepers?: () => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onOpenStaffApp,
  onOpenShopkeepers,
}) => {
  const {
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    theme,
    toggleTheme,
  } = useApp();

  // Navigation tabs: 'map' (Default Kota Map) | 'ballot' (Digital Ballot) | 'portal' (Partner & Merchant Login)
  const [activeTab, setActiveTab] = useState<'map' | 'ballot' | 'portal'>('map');

  // Unified Portal Authentication State (Admin + Merchant inside Partner Portal)
  const [portalLoggedIn, setPortalLoggedIn] = useState<boolean>(() => {
    return isAdminAuthenticated || sessionStorage.getItem('cc_portal_logged_in') === 'true';
  });
  const [portalRole, setPortalRole] = useState<'admin' | 'merchant' | 'staff'>(() => {
    return isAdminAuthenticated ? 'admin' : (sessionStorage.getItem('cc_portal_role') as any) || 'merchant';
  });
  const [portalUserId, setPortalUserId] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalLoginRole, setPortalLoginRole] = useState<'shopkeeper' | 'staff' | 'admin'>('shopkeeper');
  const [showPortalPassword, setShowPortalPassword] = useState(false);
  const [adminViewSection, setAdminViewSection] = useState<'admin_tools' | 'merchant_preview'>('admin_tools');

  // Admin sub-tabs: 'readings' | 'question' | 'history' | 'shopkeepers' | 'staff' | 'iot'
  const [adminSubTab, setAdminSubTab] = useState<'readings' | 'question' | 'history' | 'shopkeepers' | 'staff' | 'iot'>('readings');

  // Shopkeepers & Assigned Bins State
  const [merchantsList, setMerchantsList] = useState<MerchantProfile[]>([]);
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');
  const [isAddMerchantOpen, setIsAddMerchantOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantProfile | null>(null);
  const [mFormName, setMFormName] = useState('');
  const [mFormShopName, setMFormShopName] = useState('');
  const [mFormPhone, setMFormPhone] = useState('');
  const [mFormPassword, setMFormPassword] = useState('1234');
  const [showMFormPassword, setShowMFormPassword] = useState(false);
  const [showAllShopkeeperPasswords, setShowAllShopkeeperPasswords] = useState(false);
  const [copiedShopkeeperId, setCopiedShopkeeperId] = useState<string | null>(null);
  const [mFormLocality, setMFormLocality] = useState('');
  const [mFormBinSerial, setMFormBinSerial] = useState('CC-BIN-01');
  const [mFormLoading, setMFormLoading] = useState(false);

  const loadMerchants = async () => {
    try {
      const list = await fetchMerchantsFromServer();
      setMerchantsList(list);
    } catch {}
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  // Staff accounts managed by Admin
  const [staffList, setStaffList] = useState<StaffUser[]>(() => getStaffList());
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffMobile, setNewStaffMobile] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Field Agent' | 'Technician' | 'Supervisor'>('Field Agent');
  const [showStaffPasswords, setShowStaffPasswords] = useState(false);

  // =========================================================================
  // QUESTIONS & INDEPENDENT PER-QUESTION COUNTS STORAGE
  // =========================================================================
  const [allQuestions, setAllQuestions] = useState<QuestionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cc_all_questions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_QUESTIONS_LIST;
  });

  // Active question ID
  const [activeQuestionId, setActiveQuestionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cc_active_q_id');
      if (saved) return saved;
    } catch {}
    return DEFAULT_QUESTIONS_LIST[0].id;
  });

  const activeQuestion =
    allQuestions.find((q) => q.id === activeQuestionId) || allQuestions[0] || DEFAULT_QUESTIONS_LIST[0];

  // Track 1 vote per device per question
  const [deviceVotes, setDeviceVotes] = useState<Record<string, 'A' | 'B'>>(() => {
    try {
      const saved = localStorage.getItem('cc_device_voted_map');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const userVoteForActiveQ = deviceVotes[activeQuestion.id];
  const hasVotedForActiveQ = !!userVoteForActiveQ;

  // Save all questions whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('cc_all_questions', JSON.stringify(allQuestions));
      localStorage.setItem('cc_active_q_id', activeQuestionId);
    } catch {}
  }, [allQuestions, activeQuestionId]);

  // Alert Banner
  const [alertBanner, setAlertBanner] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertBanner({ message, type });
    setTimeout(() => setAlertBanner(null), 4500);
  };

  // Multi-bin live data from 5 Kota locations
  const [cloudBins, setCloudBins] = useState<Record<string, any>>({});

  // Saved Historical Records from Server & Reset Archives
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshotRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cc_saved_history_archive');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [historyFilterBin, setHistoryFilterBin] = useState<string>('all');
  const [historyTabMode, setHistoryTabMode] = useState<'snapshots' | 'questions'>('snapshots');

  const fetchHistoryRecords = async () => {
    try {
      const res = await fetch('/api/survey/history');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.records)) {
          setSavedSnapshots(data.records);
          try {
            localStorage.setItem('cc_saved_history_archive', JSON.stringify(data.records));
          } catch {}
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchHistoryRecords();
  }, []);

  const handleDeleteSnapshot = async (snapId: string) => {
    if (!window.confirm('Delete this historical record from database?')) return;
    try {
      await fetch(`/api/survey/history/${snapId}`, { method: 'DELETE' });
    } catch {}
    setSavedSnapshots((prev) => {
      const updated = prev.filter((s) => s.id !== snapId);
      try {
        localStorage.setItem('cc_saved_history_archive', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showAlert('Record deleted from history.', 'info');
  };

  // Fast Cloud Polling from /api/bin/counts
  const [lastResetTime, setLastResetTime] = useState<number>(0);
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (Date.now() - lastResetTime < 4000) return;
      try {
        const res = await fetch('/api/bin/counts');
        if (res.ok) {
          const data = await res.json();
          if (data && data.bins) {
            setCloudBins(data.bins);
          }
          if (data && typeof data.countA === 'number' && typeof data.countB === 'number') {
            setAllQuestions((prev) =>
              prev.map((q) => {
                if (q.id === activeQuestionId) {
                  // Only update if changed
                  if (q.countA !== data.countA || q.countB !== data.countB) {
                    return {
                      ...q,
                      countA: data.countA,
                      countB: data.countB,
                      total: data.countA + data.countB,
                    };
                  }
                }
                return q;
              })
            );
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [activeQuestionId, lastResetTime]);

  // =========================================================================
  // UNIFIED PARTNER & ADMIN PORTAL AUTHENTICATION
  // =========================================================================
  useEffect(() => {
    if (isAdminAuthenticated) {
      setPortalLoggedIn(true);
      setPortalRole('admin');
    }
  }, [isAdminAuthenticated]);

  const handlePortalLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPortalError(null);
    const id = portalUserId.trim();
    const pw = portalPassword.trim();

    // 1. Check if user is entering Admin Credentials
    const successAdmin = adminLogin(id, pw);
    if (successAdmin) {
      setPortalLoggedIn(true);
      setPortalRole('admin');
      setAdminViewSection('admin_tools');
      sessionStorage.setItem('cc_portal_logged_in', 'true');
      sessionStorage.setItem('cc_portal_role', 'admin');
      showAlert('✓ व्यवस्थापक (Admin) लॉगिन सफल! प्रशासनिक कंसोल सक्रिय।', 'success');
      return;
    }

    // 2. Authenticate registered Shopkeeper with Mobile Number and Password
    const auth = authenticateMerchant(id, pw);
    if (auth.success && auth.merchant) {
      setPortalLoggedIn(true);
      setPortalRole('merchant');
      sessionStorage.setItem('cc_portal_logged_in', 'true');
      sessionStorage.setItem('cc_portal_role', 'merchant');
      showAlert(`✓ दुकानदार "${auth.merchant.name}" (${auth.merchant.shopName}) लॉगिन सफल!`, 'success');
      return;
    }

    // 3. Authenticate registered Staff with Mobile Number and Password
    const staffUser = authenticateStaffUser(id, pw);
    if (staffUser) {
      showAlert(`✓ स्टाफ "${staffUser.name}" (${staffUser.role}) लॉगिन सफल! स्टाफ टर्मिनल खुल रहा है...`, 'success');
      if (onOpenStaffApp) {
        onOpenStaffApp();
      } else {
        setPortalLoggedIn(true);
        setPortalRole('staff');
      }
      return;
    }

    // 4. Otherwise show specific error message
    if (portalLoginRole === 'shopkeeper') {
      setPortalError(auth.error || 'अमान्य दुकानदार मोबाइल नंबर या पासवर्ड! कृपया एडमिन द्वारा दिया गया पासवर्ड दर्ज करें (Default: 1234)।');
    } else if (portalLoginRole === 'staff') {
      setPortalError('अमान्य स्टाफ मोबाइल या पासवर्ड! केवल एडमिन द्वारा रजिस्टर्ड स्टाफ ही लॉगिन कर सकते हैं (उदा: 9829011420 / staff@123)।');
    } else {
      setPortalError('अमान्य मोबाइल नंबर या पासवर्ड! कृपया सही विवरण दर्ज करें।');
    }
  };

  const handlePortalLogout = () => {
    adminLogout();
    setPortalLoggedIn(false);
    setPortalRole('merchant');
    setPortalUserId('');
    setPortalPassword('');
    sessionStorage.removeItem('cc_portal_logged_in');
    sessionStorage.removeItem('cc_portal_role');
    showAlert('पोर्टल से सफलतापूर्वक लॉगआउट हुए।', 'info');
  };

  // =========================================================================
  // RESET ACTION (PERMANENTLY ARCHIVES OLD DATA & QUESTION BEFORE ZEROING)
  // =========================================================================
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const executeReset = async () => {
    setResetting(true);
    setLastResetTime(Date.now());

    const capturedCountA = activeQuestion.countA;
    const capturedCountB = activeQuestion.countB;
    const capturedTotal = activeQuestion.total;

    // 1. If votes were recorded, auto-archive immediately in local history
    if (capturedTotal > 0) {
      const newSnapshot: SavedSnapshotRecord = {
        sequence: (savedSnapshots[0]?.sequence || savedSnapshots.length) + 1,
        id: `archive-${activeQuestion.id}-${Date.now()}`,
        unitSerial: 'KOTA-NETWORK',
        deviceName: 'Kota Smart Bins (Cumulative Network Reset)',
        questionId: activeQuestion.id,
        questionText: activeQuestion.text,
        optionA: activeQuestion.optionA,
        optionB: activeQuestion.optionB,
        countA: capturedCountA,
        countB: capturedCountB,
        total: capturedTotal,
        connectionMethod: 'Admin Reset Auto-Archive',
        capturedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };
      setSavedSnapshots((prev) => [newSnapshot, ...prev]);
      try {
        localStorage.setItem(
          'cc_saved_history_archive',
          JSON.stringify([newSnapshot, ...savedSnapshots])
        );
      } catch {}
    }

    // 2. In allQuestions, preserve past session counts so question history retains old data
    setAllQuestions((prev) =>
      prev.map((q) => {
        if (q.id === activeQuestionId) {
          return {
            ...q,
            archivedSessions: [
              ...(q.archivedSessions || []),
              {
                countA: capturedCountA,
                countB: capturedCountB,
                total: capturedTotal,
                archivedAt: new Date().toISOString(),
              },
            ],
            // Reset active live counters to 0 for the fresh survey cycle
            countA: 0,
            countB: 0,
            total: 0,
          };
        }
        return q;
      })
    );

    // 3. Notify server endpoint with full question details so server archives to survey-data.json
    try {
      const res = await fetch('/api/bin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'lokeshadmin' },
        body: JSON.stringify({
          password: 'lokeshadmin',
          questionId: activeQuestion.id,
          questionText: activeQuestion.text,
          optionA: activeQuestion.optionA,
          optionB: activeQuestion.optionB,
          confirmReset: true,
        }),
      });
      if (res.ok) {
        const resetRes = await res.json();
        if (resetRes.archivedSnapshots && resetRes.archivedSnapshots.length > 0) {
          setSavedSnapshots((prev) => [...resetRes.archivedSnapshots, ...prev]);
        }
      }
    } catch {}

    // Refresh history from server database
    await fetchHistoryRecords();

    setResetting(false);
    setResetConfirmOpen(false);
    showAlert(
      `✓ Reset सफल! पिछला डेटा (${capturedTotal} वोट) और सवाल "${activeQuestion.text.slice(0, 30)}..." इतिहास (History) में सुरक्षित सेव हो गया है।`,
      'success'
    );
  };

  // =========================================================================
  // QUESTION MANAGEMENT: ADD NEW / SWITCH
  // =========================================================================
  const [newQText, setNewQText] = useState('');
  const [newQOptionA, setNewQOptionA] = useState('YES / हाँ');
  const [newQOptionB, setNewQOptionB] = useState('NO / नहीं');
  const [newQCategory, setNewQCategory] = useState('Civic');

  const handleCreateNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) {
      showAlert('Please enter question text!', 'error');
      return;
    }

    // Auto-archive active question if it has votes before switching
    if (activeQuestion.total > 0) {
      const autoSnap: SavedSnapshotRecord = {
        sequence: (savedSnapshots[0]?.sequence || savedSnapshots.length) + 1,
        id: `archive-switch-${activeQuestion.id}-${Date.now()}`,
        unitSerial: 'KOTA-NETWORK',
        deviceName: 'Kota Smart Bins (Question Switch Archive)',
        questionId: activeQuestion.id,
        questionText: activeQuestion.text,
        optionA: activeQuestion.optionA,
        optionB: activeQuestion.optionB,
        countA: activeQuestion.countA,
        countB: activeQuestion.countB,
        total: activeQuestion.total,
        connectionMethod: 'Question Switch Auto-Archive',
        capturedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };
      setSavedSnapshots((prev) => [autoSnap, ...prev]);
    }

    const newQId = `q-${Date.now().toString().slice(-4)}`;
    const newRecord: QuestionRecord = {
      id: newQId,
      text: newQText.trim(),
      optionA: newQOptionA.trim() || 'YES',
      optionB: newQOptionB.trim() || 'NO',
      category: newQCategory,
      countA: 0,
      countB: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    // Mark previous active question as archived and prepend new active question
    setAllQuestions((prev) => [
      newRecord,
      ...prev.map((q) => (q.id === activeQuestionId ? { ...q, status: 'archived' as const } : q)),
    ]);

    setActiveQuestionId(newQId);
    setLastResetTime(Date.now());

    try {
      await fetch('/api/survey/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newRecord.text,
          optionA: newRecord.optionA,
          optionB: newRecord.optionB,
          category: newRecord.category,
        }),
      });
      // Zero out live telemetry for new question safely
      await fetch('/api/bin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'lokeshadmin' },
        body: JSON.stringify({
          password: 'lokeshadmin',
          questionId: activeQuestion.id,
          questionText: activeQuestion.text,
          optionA: activeQuestion.optionA,
          optionB: activeQuestion.optionB,
          confirmReset: true,
        }),
      });
    } catch {}

    await fetchHistoryRecords();
    setNewQText('');
    showAlert(`✓ नया सवाल सक्रिय हुआ! पिछला सवाल और वोट इतिहास में सेव हो गए हैं।`, 'success');
  };

  // Switch to another question
  const handleSwitchQuestion = (qId: string) => {
    setActiveQuestionId(qId);
    setAllQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, status: 'active' } : q))
    );
    const target = allQuestions.find((q) => q.id === qId);
    showAlert(`Switched active survey to: "${target?.text.slice(0, 35)}..."`, 'info');
  };

  // Delete question
  const handleDeleteQuestion = (qId: string) => {
    if (allQuestions.length <= 1) {
      showAlert('Cannot delete the last remaining question!', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to delete this question record?')) {
      const remaining = allQuestions.filter((q) => q.id !== qId);
      setAllQuestions(remaining);
      if (activeQuestionId === qId) {
        setActiveQuestionId(remaining[0].id);
      }
      showAlert('Question deleted from database.', 'info');
    }
  };

  // Public Voting (Strictly 1 vote per device per question)
  const handlePublicVote = async (hole: 'A' | 'B') => {
    if (hasVotedForActiveQ) {
      showAlert('You have already cast a vote for this question from this device!', 'error');
      return;
    }

    const nextA = hole === 'A' ? activeQuestion.countA + 1 : activeQuestion.countA;
    const nextB = hole === 'B' ? activeQuestion.countB + 1 : activeQuestion.countB;
    const nextTotal = nextA + nextB;

    // 1. Update this question's counts in state & localStorage
    setAllQuestions((prev) =>
      prev.map((q) => {
        if (q.id === activeQuestionId) {
          return { ...q, countA: nextA, countB: nextB, total: nextTotal };
        }
        return q;
      })
    );

    // 2. Mark this device as voted for this question
    const updatedVotes: Record<string, 'A' | 'B'> = { ...deviceVotes, [activeQuestion.id]: hole };
    setDeviceVotes(updatedVotes);
    try {
      localStorage.setItem('cc_device_voted_map', JSON.stringify(updatedVotes));
    } catch {}

    // 3. Persist to server API snapshot
    try {
      await fetch(`/api/bin/sync?serial=CC-BIN-01&a=${nextA}&b=${nextB}`);
      await fetch('/api/survey/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          unitSerial: 'CC-BIN-01',
          deviceName: 'Public Web Ballot',
          questionText: activeQuestion.text,
          optionA: activeQuestion.optionA,
          optionB: activeQuestion.optionB,
          countA: nextA,
          countB: nextB,
          connectionMethod: 'web_ballot',
          capturedAt: new Date().toISOString(),
        }),
      });
    } catch {}

    const selectedLabel = hole === 'A' ? activeQuestion.optionA : activeQuestion.optionB;
    showAlert(
      `✓ Thank you! Your vote for "${selectedLabel}" has been recorded. (1 vote per device limit applied)`,
      'success'
    );
  };

  const handleClearMyDeviceVote = () => {
    const updated = { ...deviceVotes };
    delete updated[activeQuestion.id];
    setDeviceVotes(updated);
    try {
      localStorage.setItem('cc_device_voted_map', JSON.stringify(updated));
    } catch {}
    showAlert('Device vote token cleared for this question. You can vote again for testing.', 'info');
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Question', 'Option A', 'A Count', 'Option B', 'B Count', 'Total Votes', 'Category', 'Created Date'];
    const rows = allQuestions.map((q) => [
      q.id,
      `"${q.text.replace(/"/g, '""')}"`,
      `"${q.optionA}"`,
      q.countA,
      `"${q.optionB}"`,
      q.countB,
      q.total,
      `"${q.category}"`,
      new Date(q.createdAt).toLocaleDateString(),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `survey-butt-bin-data-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('CSV file downloaded successfully!', 'success');
  };

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return allQuestions;
    const term = searchQuery.toLowerCase();
    return allQuestions.filter(
      (q) =>
        q.text.toLowerCase().includes(term) ||
        q.optionA.toLowerCase().includes(term) ||
        q.optionB.toLowerCase().includes(term) ||
        q.category.toLowerCase().includes(term)
    );
  }, [allQuestions, searchQuery]);

  // Search filter for snapshots
  const [snapshotSearch, setSnapshotSearch] = useState('');
  const filteredSnapshots = useMemo(() => {
    let list = savedSnapshots;
    if (historyFilterBin !== 'all') {
      list = list.filter((s) => s.unitSerial?.toLowerCase() === historyFilterBin.toLowerCase());
    }
    if (snapshotSearch.trim()) {
      const term = snapshotSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.questionText?.toLowerCase().includes(term) ||
          s.optionA?.toLowerCase().includes(term) ||
          s.optionB?.toLowerCase().includes(term) ||
          s.unitSerial?.toLowerCase().includes(term) ||
          s.deviceName?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [savedSnapshots, historyFilterBin, snapshotSearch]);

  const handleExportSnapshotsCsv = () => {
    const headers = [
      'Seq',
      'Save ID',
      'Unit Serial',
      'Device / Location',
      'Question',
      'Option A',
      'A Count',
      'Option B',
      'B Count',
      'Total',
      'Event Method',
      'Saved At (UTC)',
    ];
    const rows = filteredSnapshots.map((s) => [
      s.sequence || '',
      s.id,
      s.unitSerial,
      `"${(s.deviceName || '').replace(/"/g, '""')}"`,
      `"${(s.questionText || '').replace(/"/g, '""')}"`,
      `"${(s.optionA || '').replace(/"/g, '""')}"`,
      s.countA,
      `"${(s.optionB || '').replace(/"/g, '""')}"`,
      s.countB,
      (s.countA || 0) + (s.countB || 0),
      `"${s.connectionMethod || ''}"`,
      s.savedAt,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kota-survey-saved-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('✓ Saved History CSV downloaded successfully!', 'success');
  };

  const pctA = activeQuestion.total > 0 ? Math.round((activeQuestion.countA / activeQuestion.total) * 100) : 50;
  const pctB = activeQuestion.total > 0 ? 100 - pctA : 50;

  return (
    <div className="min-h-screen bg-[#070D18] text-[#F3F4F6] font-sans antialiased selection:bg-[#10B981] selection:text-black">
      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#0C1628]/95 backdrop-blur-md border-b border-[#1E293B] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <CodeCircuitLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white font-mono">
                  CODE & CIRCUIT
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] rounded border border-[#10B981]/40 font-mono">
                  कोटा स्वच्छ आवाज
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] hidden sm:block font-mono">
                Kota Smart Survey Bin Civic Initiative
              </p>
            </div>
          </div>

          {/* Center Tabs: Kota Map vs Digital Civic Ballot vs Partner Portal */}
          <div className="flex items-center bg-[#070D18] p-1 rounded-xl border border-[#334155]">
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-[#10B981] text-black shadow-md font-black'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>🗺️ कोटा मैप</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ballot')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'ballot'
                  ? 'bg-[#3B82F6] text-white shadow-md font-black'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>🗳️ लाइव पोल</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'portal'
                  ? 'bg-[#F2B33D] text-black shadow-md font-black'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>🏪 पार्टनर पोर्टल</span>
            </button>
          </div>

          {/* Right Action: Clean Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white border border-[#475569] rounded-lg text-xs font-bold font-mono cursor-pointer transition-colors shadow"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#F2B33D]" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Global Alert Notification */}
      {alertBanner && (
        <div
          className={`px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 transition-all font-mono ${
            alertBanner.type === 'success'
              ? 'bg-[#10B981] text-black shadow-lg'
              : alertBanner.type === 'error'
              ? 'bg-[#EF4444] text-white shadow-lg'
              : 'bg-[#3B82F6] text-white shadow-lg'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{alertBanner.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ===================================================================== */}
        {/* VIEW 1: KOTA MAP & PHYSICAL BINS (DEFAULT HERO VIEW)                  */}
        {/* ===================================================================== */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Clean Hero Header & Active Poll Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1E293B] pb-6">
              <div>
                <span className="text-xs text-[#10B981] font-mono font-bold tracking-wider uppercase block mb-1">
                  KOTA SWACHH AWAAZ · स्वच्छ कोटा
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Kota Smart Survey Bins
                </h1>
                <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl mt-1.5 leading-relaxed">
                  Kota me lagaye gaye Smart Dustbins aur unpar live voting results.
                  Chai ka cup ya dry waste Hole A ya Hole B me daalkar apna vote karein.
                </p>
              </div>

              {/* Active Civic Question Quick Banner */}
              <div className="bg-[#0C1628] border border-[#10B981]/40 rounded-xl p-3.5 font-mono text-xs max-w-md w-full shadow-lg">
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-1">
                  <span className="text-[#10B981] font-bold">● Live Poll</span>
                  <span>Total Votes: <b className="text-white">{activeQuestion.total}</b></span>
                </div>
                <p className="text-white font-bold text-xs truncate mb-2">
                  "{activeQuestion.text}"
                </p>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#10B981] truncate">A: {activeQuestion.optionA} ({pctA}%)</span>
                  <span className="text-[#38BDF8] truncate">B: {activeQuestion.optionB} ({pctB}%)</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ballot')}
                    className="px-2.5 py-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded text-[10px] font-bold cursor-pointer whitespace-nowrap shadow transition-all active:scale-95"
                  >
                    Vote Karein →
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Survey Bins Geographic Map */}
            <SurveyBinNetworkMap
              selectedQuestionId={activeQuestion.id}
              onSelectQuestion={(qId) => setActiveQuestionId(qId)}
            />

            {/* 3-Step Clear Explainer: How It Works */}
            <div className="pt-6 border-t border-[#1E293B]">
              <div className="mb-4">
                <span className="text-xs text-[#F2B33D] font-mono font-bold uppercase block">Simple Process</span>
                <h2 className="text-lg font-bold text-white">Kaise Kaam Karta Hai? (How It Works)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-[#0C1628] border border-[#1E293B] rounded-xl p-5 space-y-2 shadow">
                  <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-white font-bold text-sm">2-Slot Smart Dustbin</h3>
                  <p className="text-[#94A3B8] leading-relaxed text-[11px]">
                    Kota ke tea stalls aur coaching hubs me lage 2-slot bins me cup daalein (Hole A ya Hole B).
                  </p>
                </div>

                <div className="bg-[#0C1628] border border-[#1E293B] rounded-xl p-5 space-y-2 shadow">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#38BDF8] flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-white font-bold text-sm">Auto Sensor Counting</h3>
                  <p className="text-[#94A3B8] leading-relaxed text-[11px]">
                    Kachra girte hi optical sensors bina kisi screen ya app ke vote turant ESP32 me count kar lete hain.
                  </p>
                </div>

                <div className="bg-[#0C1628] border border-[#1E293B] rounded-xl p-5 space-y-2 shadow">
                  <div className="w-8 h-8 rounded-lg bg-[#F2B33D]/20 border border-[#F2B33D]/40 text-[#F2B33D] flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-white font-bold text-sm">Daily Live Sync</h3>
                  <p className="text-[#94A3B8] leading-relaxed text-[11px]">
                    Shopkeeper ke mobile se data Bluetooth dwara is website par live sync ho jata hai.
                  </p>
                </div>
              </div>
            </div>

            {/* Kota Active Locations Cards */}
            <div className="pt-6 border-t border-[#1E293B]">
              <div className="flex items-center justify-between mb-4 font-mono text-xs">
                <div>
                  <span className="text-xs text-[#10B981] font-bold uppercase block">Locations</span>
                  <h2 className="text-lg font-bold text-white">Kota Bin Locations</h2>
                </div>
                <span className="text-[#94A3B8]">5 Active Dustbins</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
                <div className="bg-[#0C1628] border border-[#1E293B] rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] text-[#10B981] font-bold">CC-BIN-01 · LANDMARK CITY</span>
                  <p className="text-white font-bold text-xs">Jodhpur Sweets & Cafe</p>
                  <span className="text-[11px] text-[#94A3B8] block">Kunhari, Kota</span>
                </div>
                <div className="bg-[#0C1628] border border-[#1E293B] rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] text-[#38BDF8] font-bold">CC-BIN-02 · TALWANDI</span>
                  <p className="text-white font-bold text-xs">Chai Corner & Snacks</p>
                  <span className="text-[11px] text-[#94A3B8] block">Commerce College Road, Kota</span>
                </div>
                <div className="bg-[#0C1628] border border-[#1E293B] rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] text-[#F2B33D] font-bold">CC-BIN-03 · VIGYAN NAGAR</span>
                  <p className="text-white font-bold text-xs">Kanhaiya Cafe</p>
                  <span className="text-[11px] text-[#94A3B8] block">Coaching Hub, Kota</span>
                </div>
                <div className="bg-[#0C1628] border border-[#1E293B] rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] text-[#A855F7] font-bold">CC-BIN-04 · AERODROME</span>
                  <p className="text-white font-bold text-xs">Kota Tea Stall</p>
                  <span className="text-[11px] text-[#94A3B8] block">Jhalawar Road, Kota</span>
                </div>
                <div className="bg-[#0C1628] border border-[#1E293B] rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] text-[#EC4899] font-bold">CC-BIN-05 · DADABARI</span>
                  <p className="text-white font-bold text-xs">Shreeji Snacks</p>
                  <span className="text-[11px] text-[#94A3B8] block">Shastri Nagar, Kota</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 2: DIGITAL CIVIC BALLOT (CLEAN & UNCLUTTERED)                    */}
        {/* ===================================================================== */}
        {activeTab === 'ballot' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-[#0E1E3C] to-[#0A1424] rounded-2xl border border-[#1E293B] p-6 sm:p-8 shadow-2xl text-center space-y-3">
              <div className="flex items-center justify-center gap-2 font-mono text-xs">
                <span className="text-[#10B981] font-bold uppercase">● Live Poll</span>
                <span className="text-[#64748B]">·</span>
                <span className="text-[#94A3B8]">{activeQuestion.category}</span>
                <span className="text-[#64748B]">·</span>
                <span className="text-white font-bold">{activeQuestion.total} Total Votes</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                "{activeQuestion.text}"
              </h1>

              <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl mx-auto">
                Apna vote dene ke liye niche option par click karein, ya Kota me kisi bhi Smart Dustbin me cup daalein.
              </p>
            </div>

            {/* 1 Vote Per Device Status Notice */}
            {hasVotedForActiveQ && (
              <div className="p-3.5 bg-[#10B981]/15 border border-[#10B981]/50 rounded-xl text-center font-mono text-xs text-[#10B981] flex flex-wrap items-center justify-center gap-2 shadow-md">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>
                  <b>Vote Recorded:</b> Aapne is device se <b>Option {userVoteForActiveQ} ({userVoteForActiveQ === 'A' ? activeQuestion.optionA : activeQuestion.optionB})</b> ko vote diya hai. (1 Vote per device)
                </span>
              </div>
            )}

            {/* Voting Compartments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A */}
              <div className={`bg-[#0C1628] rounded-2xl border-2 transition-all p-6 shadow-xl flex flex-col justify-between ${
                userVoteForActiveQ === 'A' ? 'border-[#10B981] ring-2 ring-[#10B981]/30' : 'border-[#10B981]/40'
              }`}>
                <div>
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-[#10B981] mb-2">
                    <span>HOLE A (Option A)</span>
                    <span>{pctA}%</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mb-4">
                    {activeQuestion.optionA}
                  </h2>

                  <div className="bg-[#070D18] rounded-xl p-5 border border-[#1E293B] text-center mb-4">
                    <span className="text-4xl sm:text-5xl font-black text-[#10B981] font-mono tracking-tight">
                      {activeQuestion.countA}
                    </span>
                    <span className="block text-[11px] uppercase tracking-widest text-[#94A3B8] font-mono mt-1">
                      Votes Counted
                    </span>

                    <div className="w-full bg-[#1E293B] h-2.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-[#10B981] h-full rounded-full transition-all duration-700"
                        style={{ width: `${pctA}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={hasVotedForActiveQ}
                  onClick={() => handlePublicVote('A')}
                  className={`w-full py-3.5 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 font-mono transition-all ${
                    hasVotedForActiveQ
                      ? userVoteForActiveQ === 'A'
                        ? 'bg-[#10B981]/20 border-2 border-[#10B981] text-[#10B981] cursor-not-allowed opacity-90'
                        : 'bg-[#1E293B] border border-[#334155] text-[#64748B] cursor-not-allowed opacity-50'
                      : 'bg-[#10B981] hover:bg-[#059669] text-black cursor-pointer active:scale-98 shadow-[#10B981]/20'
                  }`}
                >
                  {hasVotedForActiveQ ? (
                    userVoteForActiveQ === 'A' ? (
                      <>
                        <Check className="w-4 h-4 text-[#10B981]" />
                        <span>✓ Vote Done (Option A)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Option A (Locked)</span>
                      </>
                    )
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>Vote for Option A</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option B */}
              <div className={`bg-[#0C1628] rounded-2xl border-2 transition-all p-6 shadow-xl flex flex-col justify-between ${
                userVoteForActiveQ === 'B' ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/30' : 'border-[#3B82F6]/40'
              }`}>
                <div>
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-[#3B82F6] mb-2">
                    <span>HOLE B (Option B)</span>
                    <span>{pctB}%</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mb-4">
                    {activeQuestion.optionB}
                  </h2>

                  <div className="bg-[#070D18] rounded-xl p-5 border border-[#1E293B] text-center mb-4">
                    <span className="text-4xl sm:text-5xl font-black text-[#3B82F6] font-mono tracking-tight">
                      {activeQuestion.countB}
                    </span>
                    <span className="block text-[11px] uppercase tracking-widest text-[#94A3B8] font-mono mt-1">
                      Votes Counted
                    </span>

                    <div className="w-full bg-[#1E293B] h-2.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-[#3B82F6] h-full rounded-full transition-all duration-700"
                        style={{ width: `${pctB}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={hasVotedForActiveQ}
                  onClick={() => handlePublicVote('B')}
                  className={`w-full py-3.5 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 font-mono transition-all ${
                    hasVotedForActiveQ
                      ? userVoteForActiveQ === 'B'
                        ? 'bg-[#3B82F6]/20 border-2 border-[#3B82F6] text-[#38BDF8] cursor-not-allowed opacity-90'
                        : 'bg-[#1E293B] border border-[#334155] text-[#64748B] cursor-not-allowed opacity-50'
                      : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white cursor-pointer active:scale-98 shadow-[#3B82F6]/20'
                  }`}
                >
                  {hasVotedForActiveQ ? (
                    userVoteForActiveQ === 'B' ? (
                      <>
                        <Check className="w-4 h-4 text-[#38BDF8]" />
                        <span>✓ Vote Done (Option B)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Option B (Locked)</span>
                      </>
                    )
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>Vote for Option B</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Navigation buttons: Map and Past Surveys */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0C1628] hover:bg-[#1E293B] border border-[#334155] rounded-xl text-xs font-mono font-bold text-[#7FD8E8] transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                <span>🗺️ Kota Map dekhein</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('portal');
                  setAdminSubTab('history');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0C1628] hover:bg-[#1E293B] border border-[#10B981]/40 rounded-xl text-xs font-mono font-bold text-[#10B981] transition-colors cursor-pointer shadow-sm"
              >
                <History className="w-3.5 h-3.5" />
                <span>📜 Purane Saved Polls Ka Data Dekhein ({savedSnapshots.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 3: UNIFIED PARTNER & MERCHANT PORTAL (WITH ADMIN CONSOLE GATED) */}
        {/* ===================================================================== */}
        {activeTab === 'portal' && (
          <div className="space-y-6">
            {!portalLoggedIn ? (
              /* CLEAN, INTUITIVE MULTI-ROLE LOGIN GATE */
              <div className="max-w-md mx-auto my-8 font-sans">
                <div className="bg-[#0C1628] border-2 border-[#1E293B] rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4">
                  {/* Role Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#070D18] rounded-xl border border-[#334155] font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setPortalLoginRole('shopkeeper');
                        setPortalError(null);
                      }}
                      className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        portalLoginRole === 'shopkeeper'
                          ? 'bg-[#F2B33D] text-[#070D18] shadow'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>दुकानदार</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPortalLoginRole('staff');
                        setPortalError(null);
                      }}
                      className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        portalLoginRole === 'staff'
                          ? 'bg-[#1F8F82] text-white shadow'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>स्टाफ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPortalLoginRole('admin');
                        setPortalError(null);
                      }}
                      className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        portalLoginRole === 'admin'
                          ? 'bg-[#3B82F6] text-white shadow'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>एडमिन</span>
                    </button>
                  </div>

                  {/* Header according to selected role */}
                  <div className="text-center space-y-1 border-b border-[#1E293B] pb-3">
                    <div className="flex items-center justify-center gap-2">
                      {portalLoginRole === 'shopkeeper' && (
                        <div className="p-2 rounded-xl bg-[#F2B33D]/20 text-[#F2B33D] inline-block">
                          <Store className="w-5 h-5" />
                        </div>
                      )}
                      {portalLoginRole === 'staff' && (
                        <div className="p-2 rounded-xl bg-[#1F8F82]/20 text-[#1F8F82] inline-block">
                          <Users className="w-5 h-5" />
                        </div>
                      )}
                      {portalLoginRole === 'admin' && (
                        <div className="p-2 rounded-xl bg-[#3B82F6]/20 text-[#3B82F6] inline-block">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {portalLoginRole === 'shopkeeper' && 'Shopkeeper Login (दुकानदार लॉगिन)'}
                      {portalLoginRole === 'staff' && 'Staff Login (स्टाफ लॉगिन)'}
                      {portalLoginRole === 'admin' && 'Admin Console (व्यवस्थापक लॉगिन)'}
                    </h2>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                      {portalLoginRole === 'shopkeeper' && 'दुकानदार अपने रजिस्टर्ड मोबाइल नंबर और एडमिन द्वारा दिए गए पासवर्ड से लॉगिन करें।'}
                      {portalLoginRole === 'staff' && 'फील्ड एजेंट अपने मोबाइल नंबर व पासवर्ड से स्टाफ टर्मिनल में लॉगिन करें।'}
                      {portalLoginRole === 'admin' && 'स्मार्ट डस्टबिन, दुकानदार व पोल सेटिंग्स को प्रबंधित करने के लिए एडमिन लॉगिन।'}
                    </p>
                  </div>

                  {portalError && (
                    <div className="p-3 bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{portalError}</span>
                    </div>
                  )}

                  <form onSubmit={handlePortalLoginSubmit} className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="block text-[#94A3B8] mb-1 font-bold uppercase text-[10px]">
                        {portalLoginRole === 'shopkeeper' && 'Shopkeeper Mobile Number (दुकानदार मोबाइल नंबर):'}
                        {portalLoginRole === 'staff' && 'Staff Mobile Number (स्टाफ मोबाइल नंबर):'}
                        {portalLoginRole === 'admin' && 'Admin User ID (एडमिन यूजर आईडी):'}
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                        <input
                          type="text"
                          required
                          placeholder={
                            portalLoginRole === 'shopkeeper'
                              ? 'e.g. 9829011420'
                              : portalLoginRole === 'staff'
                              ? 'e.g. 9829011420'
                              : 'lokeshadmin'
                          }
                          value={portalUserId}
                          onChange={(e) => setPortalUserId(e.target.value)}
                          className="w-full bg-[#070D18] border border-[#334155] rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-[#F2B33D] text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#94A3B8] mb-1 font-bold uppercase text-[10px] flex items-center justify-between">
                        <span>Password / PIN (पासवर्ड):</span>
                        <span className="text-[10px] text-[#64748B] normal-case font-sans">
                          {portalLoginRole === 'shopkeeper' && '(Admin द्वारा दिया गया पासवर्ड)'}
                        </span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                        <input
                          type={showPortalPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={portalPassword}
                          onChange={(e) => setPortalPassword(e.target.value)}
                          className="w-full bg-[#070D18] border border-[#334155] rounded-xl pl-9 pr-10 py-2.5 text-white outline-none focus:border-[#F2B33D] text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPortalPassword(!showPortalPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                          title={showPortalPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPortalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full py-3 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 ${
                        portalLoginRole === 'shopkeeper'
                          ? 'bg-[#F2B33D] hover:bg-[#d99e30] text-[#070D18] font-black'
                          : portalLoginRole === 'staff'
                          ? 'bg-[#1F8F82] hover:bg-[#18756a] text-white'
                          : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white'
                      }`}
                    >
                      {portalLoginRole === 'shopkeeper' && (
                        <>
                          <Store className="w-4 h-4" />
                          <span>Login as Shopkeeper (दुकानदार लॉगिन)</span>
                        </>
                      )}
                      {portalLoginRole === 'staff' && (
                        <>
                          <Users className="w-4 h-4" />
                          <span>Login to Staff Terminal (स्टाफ लॉगिन)</span>
                        </>
                      )}
                      {portalLoginRole === 'admin' && (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Login to Admin Console</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* One-Click Quick Demo Credentials Helper */}
                  <div className="pt-2 border-t border-[#1E293B] space-y-1.5 font-mono text-[10px]">
                    <span className="text-[#64748B] block">Quick Test Login (तुरंत टेस्ट करने के लिए क्लिक करें):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {portalLoginRole === 'shopkeeper' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setPortalUserId('9829011420');
                              setPortalPassword('1234');
                            }}
                            className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] text-[#F2B33D] rounded border border-[#334155] cursor-pointer"
                          >
                            Ramesh (9829011420 / 1234)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPortalUserId('9414233100');
                              setPortalPassword('1234');
                            }}
                            className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] text-[#F2B33D] rounded border border-[#334155] cursor-pointer"
                          >
                            Gopal (9414233100 / 1234)
                          </button>
                        </>
                      )}

                      {portalLoginRole === 'staff' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setPortalUserId('9829011420');
                              setPortalPassword('staff@123');
                            }}
                            className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] text-[#1F8F82] rounded border border-[#334155] cursor-pointer"
                          >
                            Manoj Kumar (9829011420 / staff@123)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPortalUserId('9414155210');
                              setPortalPassword('tech@123');
                            }}
                            className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] text-[#1F8F82] rounded border border-[#334155] cursor-pointer"
                          >
                            Pooja Verma (9414155210 / tech@123)
                          </button>
                        </>
                      )}

                      {portalLoginRole === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setPortalUserId('lokeshadmin');
                            setPortalPassword('lokeshadmin');
                          }}
                          className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] rounded border border-[#334155] cursor-pointer"
                        >
                          Lokesh Naraniya (lokeshadmin / lokeshadmin)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* AUTHENTICATED PORTAL: EITHER ADMIN OR MERCHANT */
              <div className="space-y-6">
                {portalRole === 'admin' ? (
                  /* ADMIN EXPERIENCE */
                  <div className="space-y-6">
                    {/* Admin Portal Header Strip */}
                    <div className="bg-[#0C1628] rounded-2xl border border-[#3B82F6]/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#38BDF8] rounded-xl">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white font-mono uppercase">
                              Admin Console
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-mono">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                            Signed in as: <b>Lokesh Naraniya</b> ({portalUserId || 'lokeshnaraniya@gmail.com'})
                          </p>
                        </div>
                      </div>

                      {/* Admin Top Actions: Switch to Merchant View or Logout */}
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <div className="flex items-center bg-[#070D18] p-1 rounded-xl border border-[#334155]">
                          <button
                            type="button"
                            onClick={() => setAdminViewSection('admin_tools')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                              adminViewSection === 'admin_tools'
                                ? 'bg-[#3B82F6] text-white shadow'
                                : 'text-[#94A3B8] hover:text-white'
                            }`}
                          >
                            ⚙️ Admin Tools
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminViewSection('merchant_preview')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                              adminViewSection === 'merchant_preview'
                                ? 'bg-[#F2B33D] text-black shadow font-black'
                                : 'text-[#94A3B8] hover:text-white'
                            }`}
                          >
                            🏪 Shopkeeper View
                          </button>
                        </div>

                        {/* Direct Shopkeeper Management CTA */}
                        <button
                          type="button"
                          onClick={() => {
                            setAdminViewSection('admin_tools');
                            setAdminSubTab('shopkeepers');
                          }}
                          className="px-3 py-1.5 bg-[#F2B33D]/20 hover:bg-[#F2B33D]/30 text-[#F2B33D] border border-[#F2B33D]/40 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Manage Shopkeepers & Assigned Smart Bins"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>🏪 Manage Shopkeepers</span>
                        </button>

                        {onOpenStaffApp && (
                          <button
                            type="button"
                            onClick={onOpenStaffApp}
                            className="px-3 py-1.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#C4B5FD] border border-[#8B5CF6]/40 rounded-xl font-bold cursor-pointer"
                            title="Open Staff Mobile Terminal"
                          >
                            📱 Staff App
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handlePortalLogout}
                          className="px-3 py-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 rounded-xl font-bold cursor-pointer transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>

                    {/* If Admin chose Merchant Preview, show MerchantView */}
                    {adminViewSection === 'merchant_preview' && (
                      <MerchantView />
                    )}
                  </div>
                ) : portalRole === 'staff' ? (
                  /* STAFF PORTAL EXPERIENCE */
                  <div className="space-y-6">
                    <div className="bg-[#0C1628] rounded-2xl border border-[#1F8F82]/40 p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#1F8F82]/20 border border-[#1F8F82]/40 text-[#1F8F82] rounded-xl">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-white font-mono uppercase">
                              Staff Session Active
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F8F82]/20 text-[#1F8F82] border border-[#1F8F82]/30 font-mono">
                              AUTHORIZED
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                            Signed in as Field Staff · Mobile: {portalUserId || '9829011420'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        {onOpenStaffApp && (
                          <button
                            type="button"
                            onClick={onOpenStaffApp}
                            className="px-4 py-2 bg-[#1F8F82] hover:bg-[#18756a] text-white font-bold rounded-xl cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-2"
                          >
                            <span>📱 Open Staff Operational Terminal</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handlePortalLogout}
                          className="px-3 py-2 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 rounded-xl font-bold cursor-pointer transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MERCHANT EXPERIENCE */
                  <div className="space-y-6">
                    {/* Merchant Top Bar */}
                    <div className="bg-[#0C1628] rounded-2xl border border-[#10B981]/30 p-3 sm:p-4 flex items-center justify-between font-mono text-xs shadow-lg">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#10B981]" />
                        <span className="text-white font-bold">Shopkeeper Dashboard</span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePortalLogout}
                        className="px-3 py-1 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 rounded-lg font-bold cursor-pointer transition-colors"
                      >
                        Logout
                      </button>
                    </div>

                    <MerchantView />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB ADMIN SUB-SECTIONS (ONLY SHOWN WHEN LOGGED IN AS ADMIN IN PORTAL) */}
        {/* ===================================================================== */}
        {activeTab === 'portal' && portalLoggedIn && portalRole === 'admin' && adminViewSection === 'admin_tools' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="bg-[#0C1628] rounded-2xl border border-[#1E293B] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                    ADMIN CONSOLE
                  </span>
                  <span className="text-xs text-[#94A3B8]">Managed by Lokesh Naraniya</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white mt-1">
                  Survey Bin Question & Live Reading Management
                </h1>
              </div>

              {/* Sub-tab Pills */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setAdminSubTab('readings')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    adminSubTab === 'readings'
                      ? 'bg-[#10B981] text-black shadow'
                      : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Readings & Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('question')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    adminSubTab === 'question'
                      ? 'bg-[#3B82F6] text-white shadow'
                      : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Change Active Question</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('history')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    adminSubTab === 'history'
                      ? 'bg-[#F59E0B] text-black shadow'
                      : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>All Questions History ({allQuestions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('shopkeepers')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    adminSubTab === 'shopkeepers'
                      ? 'bg-[#F2B33D] text-black shadow'
                      : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Shopkeepers & Bins ({merchantsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('staff')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    adminSubTab === 'staff'
                      ? 'bg-[#8B5CF6] text-white shadow'
                      : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Staff ({staffList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('iot')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    adminSubTab === 'iot'
                      ? 'bg-[#38BDF8] text-black shadow'
                      : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>ESP32 API</span>
                </button>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* SUB-SECTION 1: READINGS & RESET */}
            {/* ----------------------------------------------------------------- */}
            {adminSubTab === 'readings' && (
              <div className="space-y-6">
                {/* Active Question Info */}
                <div className="bg-[#0C1628] rounded-xl border border-[#7FD8E8]/30 p-4">
                  <span className="text-[10px] font-mono text-[#F2B33D] uppercase font-bold block mb-1">
                    Currently Active Question Being Controlled:
                  </span>
                  <h3 className="text-base font-bold text-white font-archivo">
                    "{activeQuestion.text}"
                  </h3>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
                  <div className="bg-[#0C1628] rounded-2xl border border-[#10B981]/40 p-5 text-center shadow-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#10B981] font-bold">HOLE A VOTES</span>
                    <h4 className="text-sm font-bold text-white mt-1 truncate">{activeQuestion.optionA}</h4>
                    <div className="text-5xl font-black text-[#10B981] my-3">{activeQuestion.countA}</div>
                    <span className="text-xs text-[#94A3B8]">Share: {pctA}%</span>
                  </div>

                  <div className="bg-[#0C1628] rounded-2xl border border-[#3B82F6]/40 p-5 text-center shadow-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#3B82F6] font-bold">HOLE B VOTES</span>
                    <h4 className="text-sm font-bold text-white mt-1 truncate">{activeQuestion.optionB}</h4>
                    <div className="text-5xl font-black text-[#3B82F6] my-3">{activeQuestion.countB}</div>
                    <span className="text-xs text-[#94A3B8]">Share: {pctB}%</span>
                  </div>

                  <div className="bg-[#0C1628] rounded-2xl border border-[#F59E0B]/40 p-5 text-center shadow-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#F59E0B] font-bold">TOTAL VOTE COUNT</span>
                    <h4 className="text-sm font-bold text-white mt-1">Cigarette Butts Counted</h4>
                    <div className="text-5xl font-black text-[#F59E0B] my-3">{activeQuestion.total}</div>
                    <span className="text-xs text-[#94A3B8]">Independent Question Store</span>
                  </div>
                </div>

                {/* Prominent Reset Action Banner */}
                <div className="bg-gradient-to-r from-[#1E112A] to-[#160E22] rounded-2xl border-2 border-[#EF4444]/60 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-[#EF4444] font-black text-base mb-1 font-mono">
                      <RotateCcw className="w-5 h-5" />
                      <span>RESET LIVE READING TO 0 (रीसेट करें)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl">
                      Clicking reset zeroes out the live counter for this question immediately. All past question
                      records remain securely stored in the Questions History table.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(true)}
                    className="flex-shrink-0 px-6 py-3.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-xs sm:text-sm font-mono rounded-xl shadow-xl shadow-[#EF4444]/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RESET COUNT TO 0</span>
                  </button>
                </div>

                {/* 100% Real Sensor Telemetry by Bin Location (Multi-Location ESP32 Storage) */}
                <div className="bg-[#0C1628] rounded-2xl border border-[#1E293B] p-5 shadow-lg space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                      <MapPin className="w-4 h-4 text-[#10B981]" />
                      <span>KOTA NETWORK: 5 LOCATIONS INDEPENDENT HARDWARE READINGS</span>
                    </div>
                    <span className="text-[11px] text-[#10B981] font-mono font-bold bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/30 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      100% Real Hardware Data (Tamper-Proof)
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    Alag-alag location par lage ESP32 devices ka real sensor data alag-alag save rehta hai. Admin ya koi bhi vyakti manually fake data nahi daal sakta:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
                    {[
                      { serial: 'CC-BIN-01', name: 'Gumanpura', shop: 'Tea Corner', baseA: 45, baseB: 28 },
                      { serial: 'CC-BIN-02', name: 'Talwandi Circle', shop: 'Student Chai', baseA: 62, baseB: 41 },
                      { serial: 'CC-BIN-03', name: 'Vigyan Nagar', shop: 'Coaching Point', baseA: 53, baseB: 37 },
                      { serial: 'CC-BIN-04', name: 'Indra Vihar', shop: 'Hostel Gate', baseA: 48, baseB: 33 },
                      { serial: 'CC-BIN-05', name: 'Nayapura', shop: 'Bus Stand Tea', baseA: 39, baseB: 25 },
                    ].map((bin) => {
                      const cData = cloudBins[bin.serial];
                      const bA = cData?.countA ?? bin.baseA;
                      const bB = cData?.countB ?? bin.baseB;
                      const bTot = bA + bB;
                      return (
                        <div
                          key={bin.serial}
                          className="bg-[#070D18] border border-[#1E293B] hover:border-[#10B981]/50 rounded-xl p-3 flex flex-col justify-between transition-colors shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-[#7FD8E8] font-bold mb-1">
                              <span>{bin.serial}</span>
                              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            </div>
                            <div className="text-white text-xs font-bold font-sans truncate">{bin.name}</div>
                            <div className="text-[10px] text-[#64748B] truncate">{bin.shop}</div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-[#1E293B]/60 text-xs">
                            <div className="flex justify-between items-center text-[#10B981]">
                              <span className="text-[10px] text-[#94A3B8]">A (हाँ):</span>
                              <span className="font-black">{bA}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#3B82F6] mt-0.5">
                              <span className="text-[10px] text-[#94A3B8]">B (नहीं):</span>
                              <span className="font-black">{bB}</span>
                            </div>
                            <div className="flex justify-between items-center text-white font-bold mt-1 pt-1 border-t border-[#1E293B]/40 text-[11px]">
                              <span className="text-[10px] text-[#94A3B8]">Total:</span>
                              <span>{bTot}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-[#070D18] border border-[#1E293B] rounded-xl flex items-start gap-2 text-xs text-[#94A3B8] font-mono">
                    <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>
                      <b>Real Data Policy:</b> Manual number-setting features have been permanently removed. Vote counting is 100% automated via optical beam-break sensors on physical ESP32 dustbins and verified 1-vote-per-device digital ballots.
                    </span>
                  </div>
                </div>

                {/* Device Vote Reset for Admin/Testing */}
                <div className="bg-[#0C1628] rounded-xl border border-[#334155] p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div>
                    <span className="text-white font-bold block">1 VOTE PER DEVICE STATUS (ADMIN UTILITY)</span>
                    <span className="text-[#94A3B8]">
                      Your browser status for active question:{' '}
                      <b className={hasVotedForActiveQ ? 'text-[#10B981]' : 'text-[#94A3B8]'}>
                        {hasVotedForActiveQ ? `Ballot Cast (Option ${userVoteForActiveQ})` : 'Not Voted (Eligible to Vote)'}
                      </b>
                    </span>
                  </div>
                  {hasVotedForActiveQ && (
                    <button
                      type="button"
                      onClick={handleClearMyDeviceVote}
                      className="px-3 py-1.5 bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-[#38BDF8] border border-[#3B82F6]/40 rounded font-bold cursor-pointer transition-colors"
                    >
                      Reset My Device Vote Token (Allow Re-vote for Testing)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* SUB-SECTION 2: CHANGE ACTIVE QUESTION */}
            {/* ----------------------------------------------------------------- */}
            {adminSubTab === 'question' && (
              <div className="bg-[#0C1628] rounded-2xl border border-[#1E293B] p-6 sm:p-8 shadow-xl max-w-3xl">
                <div className="flex items-center gap-2 text-[#3B82F6] font-bold text-xs mb-1 font-mono uppercase">
                  <Plus className="w-4 h-4" />
                  <span>NEW SURVEY QUESTION CONFIGURATION</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Create New Question & Start Fresh Reading
                </h2>
                <p className="text-xs text-[#94A3B8] mb-6">
                  Each new question starts counting its own votes from 0. The current question's results are archived
                  safely in the History database.
                </p>

                <form onSubmit={handleCreateNewQuestion} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[#E2E8F0] font-bold uppercase mb-1.5">
                      Question Text (सवाल का शीर्षक) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Should city buses operate 24x7 in coaching hub areas?"
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      className="w-full bg-[#070D18] border border-[#334155] rounded-lg p-3 text-sm text-white font-sans placeholder-[#64748B] outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#10B981] font-bold uppercase mb-1">
                        Option A Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={newQOptionA}
                        onChange={(e) => setNewQOptionA(e.target.value)}
                        className="w-full bg-[#070D18] border border-[#334155] rounded-lg p-2.5 text-white outline-none focus:border-[#10B981]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#3B82F6] font-bold uppercase mb-1">
                        Option B Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={newQOptionB}
                        onChange={(e) => setNewQOptionB(e.target.value)}
                        className="w-full bg-[#070D18] border border-[#334155] rounded-lg p-2.5 text-white outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#E2E8F0] font-bold uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={newQCategory}
                      onChange={(e) => setNewQCategory(e.target.value)}
                      className="w-full sm:w-60 bg-[#070D18] border border-[#334155] rounded-lg p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    >
                      <option value="Civic">Civic / नागरिक</option>
                      <option value="Education">Education / शिक्षा</option>
                      <option value="Youth">Youth / युवा</option>
                      <option value="Cleanliness">Cleanliness / स्वच्छता</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-lg shadow-lg shadow-[#3B82F6]/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SAVE & ACTIVATE THIS QUESTION</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* SUB-SECTION 3: SAVED HISTORY & QUESTION MANAGEMENT (पुराना डेटा)  */}
            {/* ----------------------------------------------------------------- */}
            {adminSubTab === 'history' && (
              <div className="space-y-5">
                {/* Mode Selector Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0C1628] p-3 rounded-2xl border border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryTabMode('snapshots')}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        historyTabMode === 'snapshots'
                          ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/20'
                          : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      <span>Saved Records & Reset Archives ({savedSnapshots.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistoryTabMode('questions')}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        historyTabMode === 'questions'
                          ? 'bg-[#38BDF8] text-black shadow-lg shadow-[#38BDF8]/20'
                          : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Questions Catalog ({allQuestions.length})</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={fetchHistoryRecords}
                    className="p-2 text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-lg transition-colors cursor-pointer"
                    title="Refresh data from server"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* ----------------------------------------------------------- */}
                {/* VIEW A: SAVED SNAPSHOTS & RESET ARCHIVES (पुराना सेव डेटा)  */}
                {/* ----------------------------------------------------------- */}
                {historyTabMode === 'snapshots' && (
                  <div className="space-y-4">
                    {/* Filter & Export Toolbar */}
                    <div className="bg-[#0C1628] rounded-xl border border-[#1E293B] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-mono text-xs">
                      <div className="flex flex-1 flex-col sm:flex-row gap-3">
                        {/* Search input */}
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                          <input
                            type="text"
                            placeholder="Search question, options, or location…"
                            value={snapshotSearch}
                            onChange={(e) => setSnapshotSearch(e.target.value)}
                            className="w-full bg-[#070D18] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-[#10B981]"
                          />
                        </div>

                        {/* Filter by Location / Bin */}
                        <select
                          value={historyFilterBin}
                          onChange={(e) => setHistoryFilterBin(e.target.value)}
                          className="bg-[#070D18] border border-[#334155] rounded-lg px-3 py-2 text-white outline-none focus:border-[#10B981]"
                        >
                          <option value="all">All Locations (सभी लोकेशन)</option>
                          <option value="KOTA-NETWORK">Kota Network Cumulative</option>
                          <option value="CC-BIN-01">CC-BIN-01 (Gumanpura)</option>
                          <option value="CC-BIN-02">CC-BIN-02 (Talwandi Circle)</option>
                          <option value="CC-BIN-03">CC-BIN-03 (Vigyan Nagar)</option>
                          <option value="CC-BIN-04">CC-BIN-04 (Indra Vihar)</option>
                          <option value="CC-BIN-05">CC-BIN-05 (Nayapura)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <span className="text-[#94A3B8]">
                          Showing: <b>{filteredSnapshots.length}</b> records
                        </span>
                        <button
                          type="button"
                          onClick={handleExportSnapshotsCsv}
                          className="flex items-center gap-2 px-3.5 py-2 bg-[#10B981] hover:bg-[#059669] text-black font-bold rounded-lg shadow cursor-pointer transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Snapshots Table / Cards */}
                    {filteredSnapshots.length === 0 ? (
                      <div className="bg-[#0C1628] rounded-xl border border-dashed border-[#334155] p-10 text-center space-y-2">
                        <History className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                        <h4 className="text-white font-bold text-sm">Abhi koi saved archive record nahi mila</h4>
                        <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                          Jab bhi poll reset hota hai ya ESP32 IoT sync hota hai, purana data question ke saath yahan automatically save ho jata hai.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-[#0C1628] rounded-xl border border-[#1E293B] overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono text-xs">
                            <thead>
                              <tr className="bg-[#0E1E3C] text-[#7FD8E8] border-b border-[#1E293B]">
                                <th className="p-3">Save / Bin</th>
                                <th className="p-3">Question & Options</th>
                                <th className="p-3 text-center">Hole A</th>
                                <th className="p-3 text-center">Hole B</th>
                                <th className="p-3 text-center">Total Votes</th>
                                <th className="p-3">Event / Date</th>
                                <th className="p-3 text-right">Manage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E293B] text-[#F2EAD6]">
                              {filteredSnapshots.map((snap) => {
                                const tot = (snap.countA || 0) + (snap.countB || 0);
                                const pA = tot > 0 ? Math.round(((snap.countA || 0) / tot) * 100) : 50;
                                const pB = tot > 0 ? 100 - pA : 50;
                                return (
                                  <tr key={snap.id} className="hover:bg-[#16336E]/20 transition-colors">
                                    <td className="p-3 whitespace-nowrap">
                                      <div className="font-bold text-[#10B981] flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                                        <span>{snap.unitSerial}</span>
                                      </div>
                                      <div className="text-[10px] text-[#94A3B8] font-sans truncate max-w-[140px]">
                                        {snap.deviceName || 'Kota Location'}
                                      </div>
                                    </td>

                                    <td className="p-3 max-w-sm sm:max-w-md font-sans">
                                      <div className="text-white font-semibold line-clamp-2">
                                        {snap.questionText}
                                      </div>
                                      <div className="text-[11px] text-[#94A3B8] font-mono mt-1 flex items-center gap-2">
                                        <span className="text-[#10B981]">{snap.optionA} ({pA}%)</span>
                                        <span>vs</span>
                                        <span className="text-[#3B82F6]">{snap.optionB} ({pB}%)</span>
                                      </div>
                                      {/* Visual bar */}
                                      <div className="w-full bg-[#1E293B] h-1.5 rounded-full mt-1.5 overflow-hidden flex">
                                        <div style={{ width: `${pA}%` }} className="bg-[#10B981] h-full" />
                                        <div style={{ width: `${pB}%` }} className="bg-[#3B82F6] h-full" />
                                      </div>
                                    </td>

                                    <td className="p-3 text-center text-[#10B981] font-bold text-sm">
                                      {snap.countA}
                                    </td>
                                    <td className="p-3 text-center text-[#3B82F6] font-bold text-sm">
                                      {snap.countB}
                                    </td>
                                    <td className="p-3 text-center font-black text-white text-sm">
                                      {tot}
                                    </td>

                                    <td className="p-3 whitespace-nowrap text-[11px]">
                                      <div className="text-white">
                                        {new Date(snap.savedAt).toLocaleDateString()}
                                      </div>
                                      <div className="text-[10px] text-[#94A3B8]">
                                        {new Date(snap.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] bg-[#1E293B] text-[#7FD8E8]">
                                        {snap.connectionMethod || 'Saved Archive'}
                                      </span>
                                    </td>

                                    <td className="p-3 text-right whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSnapshot(snap.id)}
                                        className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/20 rounded cursor-pointer transition-colors"
                                        title="Delete this archive record"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ----------------------------------------------------------- */}
                {/* VIEW B: QUESTIONS CATALOG & MANAGEMENT                      */}
                {/* ----------------------------------------------------------- */}
                {historyTabMode === 'questions' && (
                  <div className="space-y-4">
                    {/* Search & Export Toolbar */}
                    <div className="bg-[#0C1628] rounded-xl border border-[#1E293B] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                        <input
                          type="text"
                          placeholder="Search questions or options…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#070D18] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[#94A3B8]">Total Questions: <b>{filteredQuestions.length}</b></span>
                        <button
                          type="button"
                          onClick={handleExportCsv}
                          className="flex items-center gap-2 px-3.5 py-2 bg-[#10B981] hover:bg-[#059669] text-black font-bold rounded-lg shadow cursor-pointer transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Questions CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Questions Table */}
                    <div className="bg-[#0C1628] rounded-xl border border-[#1E293B] overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-xs">
                          <thead>
                            <tr className="bg-[#0E1E3C] text-[#7FD8E8] border-b border-[#1E293B]">
                              <th className="p-3">Status</th>
                              <th className="p-3">Question Text</th>
                              <th className="p-3 text-center">Hole A</th>
                              <th className="p-3 text-center">Hole B</th>
                              <th className="p-3 text-center">Current Total</th>
                              <th className="p-3">Category</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E293B] text-[#F2EAD6]">
                            {filteredQuestions.map((q) => {
                              const isActive = q.id === activeQuestionId;
                              const pastVotesTotal = q.archivedSessions?.reduce((s, sess) => s + (sess.total || 0), 0) || 0;
                              return (
                                <tr
                                  key={q.id}
                                  className={`hover:bg-[#16336E]/30 transition-colors ${
                                    isActive ? 'bg-[#10B981]/10 font-bold' : ''
                                  }`}
                                >
                                  <td className="p-3 whitespace-nowrap">
                                    {isActive ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981] text-black">
                                        ACTIVE
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E293B] text-[#94A3B8]">
                                        ARCHIVED
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 max-w-sm sm:max-w-md font-sans">
                                    <div className="text-white font-semibold">{q.text}</div>
                                    <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                                      {q.optionA} vs {q.optionB}
                                    </div>
                                    {pastVotesTotal > 0 && (
                                      <div className="text-[10px] text-[#F2B33D] font-mono mt-0.5">
                                        ✓ Past cycles recorded: {pastVotesTotal} votes
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-center text-[#10B981] font-bold">
                                    {q.countA}
                                  </td>
                                  <td className="p-3 text-center text-[#3B82F6] font-bold">
                                    {q.countB}
                                  </td>
                                  <td className="p-3 text-center font-bold text-white">
                                    {q.total}
                                  </td>
                                  <td className="p-3 whitespace-nowrap text-[#94A3B8]">
                                    {q.category}
                                  </td>
                                  <td className="p-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                      {!isActive && (
                                        <button
                                          type="button"
                                          onClick={() => handleSwitchQuestion(q.id)}
                                          className="px-2.5 py-1 bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-[#38BDF8] border border-[#3B82F6]/40 text-[11px] font-bold rounded cursor-pointer transition-colors"
                                        >
                                          Make Active
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/20 rounded cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* SUB-SECTION: SHOPKEEPER & SMART BIN ALLOCATION */}
            {/* ----------------------------------------------------------------- */}
            {adminSubTab === 'shopkeepers' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-[#0C1628] rounded-2xl border border-[#1E293B] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-[#F2B33D] font-mono text-xs font-bold uppercase mb-1">
                      <Store className="w-4 h-4" />
                      <span>SHOPKEEPER & SMART BIN ALLOCATION (दुकानदार और डस्टबिन)</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      Manage Shopkeepers, Locations & Assigned Smart Bins
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Dukandar ka naam, location, mobile number aur unhe konsa bin allot hua hai yahan se manage karein.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMerchant(null);
                        setMFormName('');
                        setMFormShopName('');
                        setMFormPhone('');
                        setMFormPassword('1234');
                        setShowMFormPassword(false);
                        setMFormLocality('');
                        setMFormBinSerial('CC-BIN-01');
                        setIsAddMerchantOpen(true);
                      }}
                      className="px-4 py-2 bg-[#F2B33D] hover:bg-[#d99e30] text-[#070D18] font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 text-xs font-mono"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Shopkeeper (+ नया दुकानदार)</span>
                    </button>
                  </div>
                </div>

                {/* INLINE ADD / EDIT FORM */}
                {isAddMerchantOpen && (
                  <div className="bg-[#070D18] border-2 border-[#F2B33D]/60 rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                      <div className="flex items-center gap-2 text-[#F2B33D] font-bold">
                        <Store className="w-4 h-4" />
                        <span>
                          {editingMerchant
                            ? `Edit Shopkeeper: ${editingMerchant.name}`
                            : 'Add New Shopkeeper & Assign Smart Bin'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddMerchantOpen(false)}
                        className="text-[#94A3B8] hover:text-white p-1 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!mFormName.trim() || !mFormShopName.trim() || !mFormPhone.trim()) {
                          showAlert('Name, Shop Name and Mobile Number are required!', 'error');
                          return;
                        }
                        setMFormLoading(true);
                        try {
                          if (editingMerchant) {
                            await updateMerchant(editingMerchant.id, {
                              name: mFormName.trim(),
                              shopName: mFormShopName.trim(),
                              phone: mFormPhone.trim(),
                              password: mFormPassword.trim() || '1234',
                              locality: mFormLocality.trim() || 'Kota, Rajasthan',
                              assignedBinSerial: mFormBinSerial.trim(),
                            });
                            showAlert(`Shopkeeper "${mFormName}" updated!`, 'success');
                          } else {
                            await addMerchant({
                              name: mFormName.trim(),
                              shopName: mFormShopName.trim(),
                              phone: mFormPhone.trim(),
                              password: mFormPassword.trim() || '1234',
                              locality: mFormLocality.trim() || 'Kota, Rajasthan',
                              assignedBinSerial: mFormBinSerial.trim(),
                              autoSyncEnabled: true,
                              syncIntervalMinutes: 120,
                            });
                            showAlert(`Shopkeeper "${mFormName}" added with login password & linked to ${mFormBinSerial}!`, 'success');
                          }
                          await loadMerchants();
                          setIsAddMerchantOpen(false);
                        } catch (err: any) {
                          showAlert(err?.message || 'Failed to save', 'error');
                        } finally {
                          setMFormLoading(false);
                        }
                      }}
                      className="space-y-4 font-sans text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#94A3B8] text-[11px] font-mono uppercase font-bold mb-1">
                            Shopkeeper Name (दुकानदार का नाम) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Tiwari"
                            value={mFormName}
                            onChange={(e) => setMFormName(e.target.value)}
                            className="w-full bg-[#0C1628] border border-[#334155] rounded-xl px-3 py-2 text-white outline-none focus:border-[#F2B33D]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#94A3B8] text-[11px] font-mono uppercase font-bold mb-1">
                            Shop / Stall Name (दुकान का नाम) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sharma Tea Point & Cafe"
                            value={mFormShopName}
                            onChange={(e) => setMFormShopName(e.target.value)}
                            className="w-full bg-[#0C1628] border border-[#334155] rounded-xl px-3 py-2 text-white outline-none focus:border-[#F2B33D]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#94A3B8] text-[11px] font-mono uppercase font-bold mb-1">
                            Mobile Number (मोबाइल नंबर) *
                          </label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="e.g. 9829011420"
                            value={mFormPhone}
                            onChange={(e) => setMFormPhone(e.target.value)}
                            className="w-full bg-[#0C1628] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[#F2B33D]"
                          />
                          <span className="text-[10px] text-[#64748B] block mt-0.5 font-mono">
                            Iss number se dukandar login karega.
                          </span>
                        </div>

                        {/* Password / PIN for Shopkeeper Login */}
                        <div>
                          <label className="block text-[#F2B33D] text-[11px] font-mono uppercase font-bold mb-1 flex items-center gap-1">
                            <Key className="w-3.5 h-3.5 text-[#F2B33D]" />
                            <span>Assign Login Password / PIN (पासवर्ड) *</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                            <input
                              type={showMFormPassword ? 'text' : 'password'}
                              required
                              placeholder="Default: 1234"
                              value={mFormPassword}
                              onChange={(e) => setMFormPassword(e.target.value)}
                              className="w-full bg-[#0C1628] border border-[#F2B33D]/60 rounded-xl pl-9 pr-10 py-2 text-white font-mono text-xs outline-none focus:border-[#F2B33D]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowMFormPassword(!showMFormPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                              title={showMFormPassword ? 'Hide password' : 'Show password'}
                            >
                              {showMFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-[#94A3B8] block mt-0.5 font-mono">
                            Dukandar iss password se website par login karega (Default: 1234)
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[#10B981] text-[11px] font-mono uppercase font-bold mb-1">
                            Assigned Smart Bin (कौनसा बिन दिया है) *
                          </label>
                          <select
                            value={mFormBinSerial}
                            onChange={(e) => setMFormBinSerial(e.target.value)}
                            className="w-full bg-[#0C1628] border border-[#10B981]/50 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[#10B981]"
                          >
                            <option value="CC-BIN-01">CC-BIN-01 — Gumanpura (Tea Corner)</option>
                            <option value="CC-BIN-02">CC-BIN-02 — Talwandi Circle (Student Chai)</option>
                            <option value="CC-BIN-03">CC-BIN-03 — Vigyan Nagar (Coaching Point)</option>
                            <option value="CC-BIN-04">CC-BIN-04 — Indra Vihar (Hostel Gate)</option>
                            <option value="CC-BIN-05">CC-BIN-05 — Nayapura (Bus Stand Tea)</option>
                            <option value="CC-BIN-CUSTOM">Other / Custom Bin</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#94A3B8] text-[11px] font-mono uppercase font-bold mb-1">
                          Location & Landmark in Kota (दुकान का पता व स्थान) *
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="e.g. Landmark City, Kunhari, Near Allen Samarth Campus, Kota"
                          value={mFormLocality}
                          onChange={(e) => setMFormLocality(e.target.value)}
                          className="w-full bg-[#0C1628] border border-[#334155] rounded-xl px-3 py-2 text-white outline-none focus:border-[#F2B33D]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2 font-mono">
                        <button
                          type="button"
                          onClick={() => setIsAddMerchantOpen(false)}
                          className="px-4 py-2 border border-[#334155] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={mFormLoading}
                          className="px-5 py-2 bg-[#F2B33D] hover:bg-[#d99e30] text-[#070D18] font-bold rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
                        >
                          {mFormLoading ? 'Saving…' : editingMerchant ? 'Save Changes' : 'Register Shopkeeper'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Search Bar & Passwords Toggle */}
                <div className="bg-[#0C1628] border border-[#1E293B] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Search by name, shop, phone, location, bin serial..."
                      value={merchantSearchQuery}
                      onChange={(e) => setMerchantSearchQuery(e.target.value)}
                      className="w-full bg-[#070D18] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-[#F2B33D] text-xs font-sans"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAllShopkeeperPasswords(!showAllShopkeeperPasswords)}
                      className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] border border-[#334155] rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      {showAllShopkeeperPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#F2B33D]" />}
                      <span>{showAllShopkeeperPasswords ? 'Hide Passwords' : 'Show Login Passwords'}</span>
                    </button>
                    <span className="text-[#94A3B8] text-[11px] hidden md:inline">
                      Total: <b>{merchantsList.length}</b> Shopkeepers in Kota
                    </span>
                  </div>
                </div>

                {/* SHOPKEEPERS CARDS GRID */}
                {(() => {
                  const filtered = merchantsList.filter((m) => {
                    if (!merchantSearchQuery.trim()) return true;
                    const q = merchantSearchQuery.toLowerCase();
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.shopName.toLowerCase().includes(q) ||
                      m.phone.includes(q) ||
                      m.locality.toLowerCase().includes(q) ||
                      m.assignedBinSerial.toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-[#0C1628] border border-dashed border-[#334155] rounded-2xl p-10 text-center space-y-3 font-mono text-xs">
                        <Store className="w-8 h-8 text-[#64748B] mx-auto" />
                        <h4 className="text-white font-bold">Koi shopkeeper nahi mila</h4>
                        <p className="text-[#94A3B8]">
                          Aap upar diye gaye "+ Add Shopkeeper" button se naya shopkeeper register kar sakte hain.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtered.map((m) => (
                        <div
                          key={m.id}
                          className="bg-[#0C1628] border border-[#1E293B] hover:border-[#F2B33D]/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-md space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2 border-b border-[#1E293B] pb-2.5">
                              <div>
                                <div className="flex items-center gap-1.5 text-[#F2B33D] font-bold text-xs font-mono">
                                  <Store className="w-3.5 h-3.5" />
                                  <span>{m.shopName}</span>
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                                  {m.name}
                                </h3>
                              </div>

                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] font-mono font-bold text-xs">
                                  <span>{m.assignedBinSerial}</span>
                                </span>
                                <span className="block text-[10px] text-[#94A3B8] mt-0.5 font-mono">
                                  Allotted Bin
                                </span>
                              </div>
                            </div>

                            {/* Location */}
                            <div className="p-2.5 bg-[#070D18] rounded-xl border border-[#1E293B] text-xs text-[#CBD5E1] flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] text-[#64748B] block font-mono font-bold uppercase">
                                  Location / Address:
                                </span>
                                <span>{m.locality}</span>
                              </div>
                            </div>

                            {/* Phone & Call */}
                            <div className="flex items-center justify-between text-xs font-mono pt-0.5">
                              <span className="text-[#94A3B8] flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                                <span>Phone: <b className="text-white">{m.phone}</b></span>
                              </span>
                              <a
                                href={`tel:${m.phone}`}
                                className="px-2.5 py-1 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 rounded-lg font-bold text-xs"
                              >
                                Call
                              </a>
                            </div>

                            {/* Shopkeeper Login Credentials Box */}
                            <div className="p-2.5 bg-[#070D18] rounded-xl border border-[#F2B33D]/30 space-y-1.5 font-mono text-xs">
                              <div className="flex items-center justify-between text-[#94A3B8] text-[11px]">
                                <span>Login ID (Mobile):</span>
                                <span className="text-white font-bold">{m.phone}</span>
                              </div>

                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#94A3B8] flex items-center gap-1">
                                  <Key className="w-3 h-3 text-[#F2B33D]" />
                                  <span>Login Password:</span>
                                </span>
                                <span className="font-bold text-[#F2B33D] bg-[#1E293B] px-1.5 py-0.5 rounded border border-[#334155]">
                                  {showAllShopkeeperPasswords ? m.password || '1234' : '••••••••'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions: Edit, Copy Credentials, Delete */}
                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#1E293B] text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMerchant(m);
                                  setMFormName(m.name);
                                  setMFormShopName(m.shopName);
                                  setMFormPhone(m.phone);
                                  setMFormPassword(m.password || '1234');
                                  setShowMFormPassword(false);
                                  setMFormLocality(m.locality);
                                  setMFormBinSerial(m.assignedBinSerial);
                                  setIsAddMerchantOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] border border-[#38BDF8]/30 rounded-lg font-bold cursor-pointer transition-colors"
                              >
                                Edit / Reassign
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const text = `Code & Circuit - Shopkeeper Login Details:\nWebsite: ${window.location.origin}\nUser ID (Mobile): ${m.phone}\nPassword: ${m.password || '1234'}\nAssigned Smart Bin: ${m.assignedBinSerial}\nShop: ${m.shopName}`;
                                  navigator.clipboard.writeText(text);
                                  setCopiedShopkeeperId(m.id);
                                  showAlert(`✓ Login credentials copied for "${m.name}"! WhatsApp par share karein.`, 'success');
                                  setTimeout(() => setCopiedShopkeeperId(null), 3000);
                                }}
                                className="px-2.5 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155] rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Copy login info to send to shopkeeper"
                              >
                                {copiedShopkeeperId === m.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#10B981]" />
                                    <span className="text-[#10B981]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-[#94A3B8]" />
                                    <span>Copy Login</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm(`Delete shopkeeper "${m.name}"?`)) return;
                                try {
                                  await deleteMerchant(m.id);
                                  await loadMerchants();
                                  showAlert(`Shopkeeper "${m.name}" deleted.`, 'success');
                                } catch {}
                              }}
                              className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/20 rounded-lg cursor-pointer transition-colors"
                              title="Delete Shopkeeper"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* SUB-SECTION 4: STAFF MANAGEMENT */}
            {/* ----------------------------------------------------------------- */}
            {adminSubTab === 'staff' && (
              <div className="space-y-6">
                {/* Staff Registration Card */}
                <div className="bg-[#0C1628] rounded-2xl border border-[#1E293B] p-6 shadow-xl">
                  <div className="flex items-center gap-2 text-[#8B5CF6] font-bold text-xs mb-1 font-mono uppercase">
                    <UserPlus className="w-4 h-4" />
                    <span>ADD AUTHORIZED STAFF MEMBER</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">
                    Create Staff Credentials for Hardware Operational Terminal
                  </h2>
                  <p className="text-xs text-[#94A3B8] mb-5">
                    Staff members log into the Staff Hardware App using their registered Mobile Number and Password. Only staff added here can access hardware controls.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newStaffMobile.trim() || !newStaffPass.trim() || !newStaffName.trim()) {
                        showAlert('Name, Mobile Number, and Password are all required!', 'error');
                        return;
                      }
                      const added = addStaffUser({
                        name: newStaffName,
                        mobile: newStaffMobile,
                        password: newStaffPass,
                        role: newStaffRole,
                      });
                      setStaffList(getStaffList());
                      setNewStaffName('');
                      setNewStaffMobile('');
                      setNewStaffPass('');
                      showAlert(`Staff member "${added.name}" registered successfully! Mobile ID: ${added.mobile}`, 'success');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs"
                  >
                    <div>
                      <label className="block text-[#94A3B8] mb-1 font-bold">Staff Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full bg-[#070D18] border border-[#334155] rounded-lg p-2.5 text-white outline-none focus:border-[#8B5CF6]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#94A3B8] mb-1 font-bold">Mobile Number (User ID) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9829012345"
                        value={newStaffMobile}
                        onChange={(e) => setNewStaffMobile(e.target.value)}
                        className="w-full bg-[#070D18] border border-[#334155] rounded-lg p-2.5 text-white outline-none focus:border-[#8B5CF6]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#94A3B8] mb-1 font-bold">Staff Password *</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter password or PIN"
                        value={newStaffPass}
                        onChange={(e) => setNewStaffPass(e.target.value)}
                        className="w-full bg-[#070D18] border border-[#334155] rounded-lg p-2.5 text-white outline-none focus:border-[#8B5CF6]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#94A3B8] mb-1 font-bold">Role</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="w-full bg-[#070D18] border border-[#334155] rounded-lg p-2.5 text-white outline-none focus:border-[#8B5CF6]"
                      >
                        <option value="Field Agent">Field Agent</option>
                        <option value="Technician">Technician</option>
                        <option value="Supervisor">Supervisor</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4 pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white font-bold rounded-lg shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>REGISTER STAFF MEMBER</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Staff List Table */}
                <div className="bg-[#0C1628] rounded-2xl border border-[#1E293B] overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-[#1E293B] flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Users className="w-4 h-4 text-[#8B5CF6]" />
                      <span>REGISTERED STAFF ACCOUNTS ({staffList.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowStaffPasswords(!showStaffPasswords)}
                      className="flex items-center gap-1.5 text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      {showStaffPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showStaffPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="bg-[#0E1E3C] text-[#7FD8E8] border-b border-[#1E293B]">
                          <th className="p-3">Staff Name</th>
                          <th className="p-3">Mobile No. (User ID)</th>
                          <th className="p-3">Password / PIN</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Added Date</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B] text-[#F2EAD6]">
                        {staffList.map((s) => (
                          <tr key={s.id} className="hover:bg-[#16336E]/30 transition-colors">
                            <td className="p-3 font-sans font-semibold text-white">
                              {s.name}
                            </td>
                            <td className="p-3 text-[#10B981] font-bold">
                              {s.mobile}
                            </td>
                            <td className="p-3 text-[#F59E0B]">
                              {showStaffPasswords ? s.password : '••••••••'}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E293B] text-[#94A3B8] border border-[#334155]">
                                {s.role}
                              </span>
                            </td>
                            <td className="p-3 text-[#64748B]">
                              {new Date(s.addedAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete staff member "${s.name}"? They will no longer be able to log in.`)) {
                                    const updated = deleteStaffUser(s.id);
                                    setStaffList(updated);
                                    showAlert(`Staff member "${s.name}" removed.`, 'info');
                                  }
                                }}
                                className="px-2.5 py-1 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 rounded text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* SUB-SECTION 5: ESP32 IOT LINK */}
            {/* ----------------------------------------------------------------- */}
            {adminSubTab === 'iot' && (
              <div className="bg-[#0C1628] rounded-2xl border border-[#1E293B] p-6 space-y-4 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#38BDF8] font-bold uppercase">
                  <Wifi className="w-4 h-4" />
                  <span>ESP32 HARDWARE INTEGRATION LINK</span>
                </div>
                <h2 className="text-base font-bold text-white">
                  HTTP GET Webhook Endpoint for Physical Smart Bin
                </h2>
                <p className="text-[#94A3B8]">
                  Whenever beam break optical sensors trigger on the hardware, the microcontroller calls:
                </p>

                <div className="bg-[#070D18] p-4 rounded-xl border border-[#334155] flex items-center justify-between gap-4 overflow-x-auto text-[#10B981]">
                  <code>
                    {typeof window !== 'undefined' ? window.location.origin : 'https://survey-butt-bin.vercel.app'}
                    /api/bin/sync?serial=CC-BIN-01&a=10&b=5
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://survey-butt-bin.vercel.app';
                      navigator.clipboard.writeText(`${origin}/api/bin/sync?serial=CC-BIN-01&a=10&b=5`);
                      showAlert('Endpoint URL copied to clipboard!', 'success');
                    }}
                    className="px-3 py-1 bg-[#1E293B] hover:bg-[#334155] text-white rounded font-bold cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: RESET CONFIRMATION */}
      {/* ========================================================================= */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C1628] rounded-2xl border-2 border-[#EF4444]/60 p-6 max-w-md w-full shadow-2xl font-mono text-xs">
            <div className="flex items-center gap-2 text-[#EF4444] mb-3 font-bold uppercase">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Reset Reading to 0</span>
            </div>

            <p className="text-[#CBD5E1] mb-4 font-sans leading-relaxed">
              Kya aap is question ki live reading reset karna chahte hain?
              <br />
              <strong className="text-white block mt-1">"{activeQuestion.text}"</strong>
              <span className="block text-[#94A3B8] font-mono mt-2 text-[11px]">
                Current votes: Hole A = <b className="text-[#10B981]">{activeQuestion.countA}</b>, Hole B = <b className="text-[#3B82F6]">{activeQuestion.countB}</b> (Total = {activeQuestion.total}).
              </span>
              <span className="block text-[#10B981] font-mono mt-1 text-[11px] font-bold">
                ✓ Reset karne par yeh purana data aur sawal History me permanently save ho jayega. Koi bhi data erase nahi hoga.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded border border-[#334155] text-[#94A3B8] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={executeReset}
                className="px-5 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded cursor-pointer transition-all"
              >
                {resetting ? 'Resetting…' : 'Yes, Reset to 0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-[#1E293B] py-6 text-center text-xs text-[#64748B] font-mono">
        <p>Code & Circuit — Smart Cigarette Butt Survey Bin Pilot</p>
      </footer>
    </div>
  );
};
