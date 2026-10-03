import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import {
  fetchSurveyHistory,
  generateSurveyHistoryCsv,
  createSurveyQuestion,
} from '../../services/surveyService';
import { SurveySnapshotRecord } from '../../types/survey';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Download,
  Flame,
  Globe,
  HelpCircle,
  History,
  Layers,
  Lock,
  LogOut,
  PlusCircle,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Vote,
  Wifi,
  X,
} from 'lucide-react';

export const PublicWebsite: React.FC = () => {
  const {
    questions,
    units,
    selectedUnitSerial,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    setRole,
  } = useApp();

  // Active Live Question on the Smart Bin
  const activeQuestion = questions[0] || {
    id: 'q-01',
    text: 'क्या कोटा में रात 10 बजे के बाद लाइब्रेरी खुलनी चाहिए? / Should student libraries stay open past 10 PM in Kota?',
    options: [
      { hole_id: 'A', label: 'हाँ / YES' },
      { hole_id: 'B', label: 'नहीं / NO' },
    ],
    category: 'Education',
  };

  // Live Telemetry from Cloud Poller (/api/bin/counts)
  const [liveCounts, setLiveCounts] = useState<{ countA: number; countB: number; total: number }>({
    countA: 412,
    countB: 288,
    total: 700,
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isDataFresh, setIsDataFresh] = useState(true);

  // Historical Surveys (Old Data)
  const [historyRecords, setHistoryRecords] = useState<SurveySnapshotRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterCategory, setHistoryFilterCategory] = useState('All');

  // Admin Modal & State
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Reset Confirmation Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // New Question Creation Modal (Admin only)
  const [newQuestionModalOpen, setNewQuestionModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newCategory, setNewCategory] = useState<'Civic' | 'Education' | 'Youth' | 'Environment'>('Civic');
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  // Vote Animation Trigger
  const [animatedHole, setAnimatedHole] = useState<'A' | 'B' | null>(null);

  // 1. Poll live counts every 1 second from /api/bin/counts
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/bin/counts');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.countA === 'number' && typeof data.countB === 'number') {
            setLiveCounts({
              countA: data.countA,
              countB: data.countB,
              total: data.countA + data.countB,
            });
            setLastSyncTime(new Date());
            setIsDataFresh(true);
          }
        }
      } catch {
        setIsDataFresh(false);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, []);

  // 2. Load Historical Surveys (Old Data) from /api/survey/history
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetchSurveyHistory({});
      if (res && res.records) {
        setHistoryRecords(res.records);
      }
    } catch (err) {
      console.error('Failed loading survey history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Test Vote Demonstration
  const handleTestVote = async (hole: 'A' | 'B') => {
    setAnimatedHole(hole);
    setTimeout(() => setAnimatedHole(null), 1000);

    const nextA = hole === 'A' ? liveCounts.countA + 1 : liveCounts.countA;
    const nextB = hole === 'B' ? liveCounts.countB + 1 : liveCounts.countB;

    setLiveCounts({
      countA: nextA,
      countB: nextB,
      total: nextA + nextB,
    });

    try {
      await fetch(`/api/bin/sync?serial=CC-BIN-01&a=${nextA}&b=${nextB}`);
    } catch (err) {
      console.error('Test vote error:', err);
    }
  };

  // Admin Login Handler
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    try {
      // 1. Local context login
      const localSuccess = adminLogin(adminUserId, adminPassword);

      // 2. Server verification
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminUserId, password: adminPassword }),
      });

      const serverData = await res.json();

      if (localSuccess || serverData.success) {
        if (serverData.token) {
          sessionStorage.setItem('cc_admin_token', serverData.token);
        }
        setAdminModalOpen(false);
        setAdminUserId('');
        setAdminPassword('');
      } else {
        setAdminError(serverData.error || 'Access Denied: Invalid User ID or Password.');
      }
    } catch {
      setAdminError('Login failed. Please check network and retry.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Secure Admin Reset Handler
  const handleAdminReset = async () => {
    if (!isAdminAuthenticated) {
      setResetModalOpen(false);
      setAdminModalOpen(true);
      return;
    }

    setResetting(true);
    try {
      const token = sessionStorage.getItem('cc_admin_token') || 'admin-token-lokesh';
      const res = await fetch('/api/bin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': 'lokeshadmin',
        },
        body: JSON.stringify({ token, password: 'lokeshadmin' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLiveCounts({ countA: 0, countB: 0, total: 0 });
        setResetSuccessMsg('✅ Bin counts successfully reset to 0! Old survey data has been permanently archived.');
        loadHistory(); // Reload history so the newly archived data shows immediately!
        setTimeout(() => {
          setResetSuccessMsg(null);
          setResetModalOpen(false);
        }, 2500);
      } else {
        alert(data.error || 'Failed to reset. Admin authorization required.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while resetting counts.');
    } finally {
      setResetting(false);
    }
  };

  // Create New Survey Question (Admin)
  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newOptionA.trim() || !newOptionB.trim()) return;

    setCreatingQuestion(true);
    try {
      await createSurveyQuestion({
        text: newQuestionText.trim(),
        optionA: newOptionA.trim(),
        optionB: newOptionB.trim(),
        category: newCategory,
        language: /[\u0900-\u097F]/.test(newQuestionText) ? 'Hindi' : 'English',
        author: 'Admin (Lokesh Naraniya)',
        activeStart: new Date().toISOString().slice(0, 10),
        activeEnd: '',
      });

      // Also auto-archive previous counts if needed, and reset live
      setNewQuestionModalOpen(false);
      setNewQuestionText('');
      setNewOptionA('');
      setNewOptionB('');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to create question.');
    } finally {
      setCreatingQuestion(false);
    }
  };

  // CSV Export for Historical Data
  const handleExportCsv = () => {
    if (historyRecords.length === 0) return;
    const csv = generateSurveyHistoryCsv(historyRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartbin-survey-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculated Percentages
  const totalVotes = liveCounts.total;
  const pctA = totalVotes > 0 ? ((liveCounts.countA / totalVotes) * 100).toFixed(1) : '50.0';
  const pctB = totalVotes > 0 ? ((liveCounts.countB / totalVotes) * 100).toFixed(1) : '50.0';
  const leadingOption =
    liveCounts.countA > liveCounts.countB
      ? activeQuestion.options[0]?.label || 'Option A'
      : liveCounts.countB > liveCounts.countA
      ? activeQuestion.options[1]?.label || 'Option B'
      : 'Tied';

  // Filtered Historical Records
  const filteredHistory = historyRecords.filter((rec) => {
    const matchesSearch =
      !historySearch ||
      rec.questionText.toLowerCase().includes(historySearch.toLowerCase()) ||
      rec.optionA.toLowerCase().includes(historySearch.toLowerCase()) ||
      rec.optionB.toLowerCase().includes(historySearch.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#081226] text-[#F2EAD6] font-archivo flex flex-col selection:bg-[#F05A28] selection:text-white">
      {/* 1. Top Notice Announcement Bar */}
      <div className="bg-[#0E1E3C] border-b border-[#7FD8E8]/20 px-4 py-2 text-xs font-mono text-[#F2EAD6]/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1F8F82] animate-ping" />
          <span className="font-bold text-[#7FD8E8]">KOTA SMART CITIZEN INITIATIVE:</span>
          <span>Cigarette Butt Litter Reduction Meets Real-Time Public Polling</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-[#1F8F82]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>SmartBin CC-BIN-01 Active</span>
          </span>
          <span className="text-[#F2EAD6]/50">|</span>
          <span className="text-[#F2EAD6]/70">Kota, Rajasthan</span>
        </div>
      </div>

      {/* 2. Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#081226]/95 backdrop-blur-md border-b border-[#7FD8E8]/30 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <a href="#live-poll" className="flex items-center gap-3 group">
            <CodeCircuitLogo size={36} strokeColor="#F2EAD6" sparkColor="#7FD8E8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-michroma text-sm lg:text-base tracking-wider text-white group-hover:text-[#7FD8E8] transition-colors">
                  CODE & CIRCUIT
                </span>
                <span className="font-mono text-[10px] bg-[#16336E] text-[#7FD8E8] px-1.5 py-0.5 border border-[#7FD8E8]/40">
                  SMART BIN
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#7FD8E8]/70 tracking-wide">
                IOT SURVEY PORTAL · SWIFT TELEMETRY
              </p>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-mono text-xs">
            <a href="#live-poll" className="text-[#F2EAD6] hover:text-[#7FD8E8] font-bold flex items-center gap-1.5 transition-colors">
              <Vote className="w-3.5 h-3.5 text-[#1F8F82]" />
              <span>LIVE POLL</span>
            </a>
            <a href="#survey-history" className="text-[#F2EAD6]/80 hover:text-[#7FD8E8] flex items-center gap-1.5 transition-colors">
              <History className="w-3.5 h-3.5 text-[#F2B33D]" />
              <span>SURVEY ARCHIVE (OLD DATA)</span>
            </a>
            <a href="#how-it-works" className="text-[#F2EAD6]/80 hover:text-[#7FD8E8] flex items-center gap-1.5 transition-colors">
              <Cpu className="w-3.5 h-3.5 text-[#7FD8E8]" />
              <span>HARDWARE TECH</span>
            </a>
            <a href="#impact" className="text-[#F2EAD6]/80 hover:text-[#7FD8E8] flex items-center gap-1.5 transition-colors">
              <TrendingUp className="w-3.5 h-3.5 text-[#F05A28]" />
              <span>CIVIC IMPACT</span>
            </a>
          </nav>

          {/* Right Header Action: Admin Controls */}
          <div className="flex items-center gap-2.5">
            {isAdminAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1F8F82]/20 border border-[#1F8F82] font-mono text-[11px] text-[#1F8F82]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin: Lokesh Naraniya</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className="px-3 py-1.5 bg-[#16336E] hover:bg-[#1a3d85] border border-[#7FD8E8] text-[#7FD8E8] hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
                  title="Open Staff Operations Dashboard"
                >
                  Admin Panel
                </button>
                <button
                  type="button"
                  onClick={adminLogout}
                  className="p-1.5 text-[#F2EAD6]/60 hover:text-[#F05A28] border border-transparent hover:border-[#F05A28]/40 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdminModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono text-xs font-bold uppercase transition-all shadow-md cursor-pointer active:scale-98"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section: Live Real-Time Survey Station */}
      <section id="live-poll" className="py-8 lg:py-14 px-4 lg:px-8 relative overflow-hidden bg-gradient-to-b from-[#081226] via-[#0E1E3C] to-[#081226]">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1F8F82]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#F05A28]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Subheading */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1F8F82]/20 border border-[#1F8F82] font-mono text-xs text-[#1F8F82] uppercase tracking-widest font-bold mb-3">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>REAL-TIME CITIZEN POLL · KOTA PILOT</span>
            </div>
            <h1 className="font-michroma text-xl lg:text-3xl text-white tracking-wide leading-snug">
              Vote with your butt. Clean your city.
            </h1>
            <p className="mt-2 text-sm text-[#F2EAD6]/70 font-archivo">
              Drop your extinguished cigarette into slot A or B to cast your vote. Powered by dual infrared sensors and ESP32 telemetry.
            </p>
          </div>

          {/* Active Poll Card */}
          <div className="bg-[#0E1E3C] border-2 border-[#7FD8E8] shadow-2xl p-6 lg:p-8 relative">
            {/* Header of Active Question */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#7FD8E8]/20 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 bg-[#F2B33D] text-[#081226] font-bold uppercase">
                  {activeQuestion.category || 'Civic'}
                </span>
                <span className="font-mono text-xs text-[#7FD8E8]">
                  UNIT: CC-BIN-01 (KOTA AERODROME)
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#F2EAD6]/70">
                <span>Updated:</span>
                <span className="text-[#1F8F82] font-bold">
                  {lastSyncTime.toLocaleTimeString()}
                </span>
                <button
                  type="button"
                  onClick={() => setLiveCounts((p) => ({ ...p }))}
                  className="p-1 hover:text-[#7FD8E8] cursor-pointer"
                  title="Auto-refreshing every 1s"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </button>
              </div>
            </div>

            {/* Giant Question Display */}
            <div className="text-center my-4">
              <h2 className="text-lg lg:text-2xl font-bold text-white leading-relaxed">
                {activeQuestion.text}
              </h2>
            </div>

            {/* Voting Arena: Dual Chambers Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              {/* Option A Chamber */}
              <div
                className={`p-6 border-2 transition-all duration-300 relative ${
                  animatedHole === 'A'
                    ? 'border-[#1F8F82] bg-[#1F8F82]/20 scale-102 shadow-lg shadow-[#1F8F82]/30'
                    : 'border-[#1F8F82]/50 bg-[#16336E]/40 hover:border-[#1F8F82]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs mb-2">
                  <span className="px-2 py-0.5 bg-[#1F8F82] text-white font-bold tracking-wider">
                    SLOT A
                  </span>
                  <span className="text-2xl font-bold text-[#1F8F82] font-mono">
                    {pctA}%
                  </span>
                </div>

                <div className="my-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {activeQuestion.options[0]?.label || 'हाँ / YES'}
                  </h3>
                  <div className="font-mono text-4xl lg:text-5xl font-black text-[#1F8F82] tracking-tight">
                    {liveCounts.countA}
                    <span className="text-xs text-[#F2EAD6]/50 font-normal ml-2">votes</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#081226] h-3 rounded-full overflow-hidden border border-[#1F8F82]/40 mb-4">
                  <div
                    className="bg-[#1F8F82] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${pctA}%` }}
                  />
                </div>

                {/* Demonstration Button */}
                <button
                  type="button"
                  onClick={() => handleTestVote('A')}
                  className="w-full py-2 bg-[#1F8F82] hover:bg-[#18756a] active:scale-98 text-white font-mono text-xs font-bold uppercase transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Vote className="w-4 h-4" />
                  <span>Test Vote Slot A (+1)</span>
                </button>
              </div>

              {/* Option B Chamber */}
              <div
                className={`p-6 border-2 transition-all duration-300 relative ${
                  animatedHole === 'B'
                    ? 'border-[#F05A28] bg-[#F05A28]/20 scale-102 shadow-lg shadow-[#F05A28]/30'
                    : 'border-[#F05A28]/50 bg-[#16336E]/40 hover:border-[#F05A28]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs mb-2">
                  <span className="px-2 py-0.5 bg-[#F05A28] text-white font-bold tracking-wider">
                    SLOT B
                  </span>
                  <span className="text-2xl font-bold text-[#F05A28] font-mono">
                    {pctB}%
                  </span>
                </div>

                <div className="my-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {activeQuestion.options[1]?.label || 'नहीं / NO'}
                  </h3>
                  <div className="font-mono text-4xl lg:text-5xl font-black text-[#F05A28] tracking-tight">
                    {liveCounts.countB}
                    <span className="text-xs text-[#F2EAD6]/50 font-normal ml-2">votes</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#081226] h-3 rounded-full overflow-hidden border border-[#F05A28]/40 mb-4">
                  <div
                    className="bg-[#F05A28] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${pctB}%` }}
                  />
                </div>

                {/* Demonstration Button */}
                <button
                  type="button"
                  onClick={() => handleTestVote('B')}
                  className="w-full py-2 bg-[#F05A28] hover:bg-[#d84818] active:scale-98 text-white font-mono text-xs font-bold uppercase transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Vote className="w-4 h-4" />
                  <span>Test Vote Slot B (+1)</span>
                </button>
              </div>
            </div>

            {/* Total Votes and Leader Summary */}
            <div className="p-4 bg-[#081226] border border-[#7FD8E8]/30 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[#F2EAD6]/60">TOTAL BUTTS COLLECTED:</span>
                <span className="text-lg font-bold text-white">{totalVotes}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#F2EAD6]/60">CURRENT LEADER:</span>
                <span className="text-[#F2B33D] font-bold uppercase flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {leadingOption}
                </span>
              </div>

              {/* Reset Count Button: Strictly requires Admin Login! */}
              <div className="flex items-center gap-2">
                {isAdminAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500 font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Counts to 0</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminModalOpen(true);
                      setAdminError('Resetting counts requires Administrator Login.');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 text-[#F2EAD6]/50 hover:text-[#F2B33D] border border-dashed border-[#7FD8E8]/30 hover:border-[#F2B33D] transition-colors cursor-pointer"
                    title="Protected: Admin login required"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#F2B33D]" />
                    <span>Reset (Admin Login Required)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Physical Bin LCD Simulator Panel */}
            <div className="mt-6 pt-4 border-t border-[#7FD8E8]/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#7FD8E8]">
                <Cpu className="w-4 h-4 text-[#1F8F82]" />
                <span>Physical 16x2 I2C LCD Output on SmartBin:</span>
              </div>
              <div className="bg-[#050B14] border border-[#1F8F82] p-2 text-[#1F8F82] font-mono text-sm tracking-widest shadow-inner">
                A:{liveCounts.countA} &nbsp; B:{liveCounts.countB} &nbsp; Total:{liveCounts.total}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Admin Control Center (Only visible when Admin is Logged In) */}
      {isAdminAuthenticated && (
        <section className="py-6 px-4 lg:px-8 bg-[#16336E]/60 border-y-2 border-[#F2B33D]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 text-[#F2B33D]">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <h3 className="font-michroma text-sm uppercase tracking-wider font-bold">
                  ADMIN CONTROL CENTER — LOGGED IN AS lokeshnaraniya@gmail.com
                </h3>
              </div>
              <span className="font-mono text-xs bg-[#F2B33D] text-[#081226] font-bold px-2 py-0.5">
                SUPER ADMIN LEVEL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {/* Action 1: Reset Counts */}
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="p-4 bg-red-900/30 hover:bg-red-800/40 border border-red-500 text-red-200 text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase">Zero / Reset Counts</span>
                    <RotateCcw className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-[11px] text-red-300/70 font-archivo">
                    Safely archives current poll to history and zeroes live hardware counters.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-red-400 underline font-bold">
                  Initiate Reset →
                </span>
              </button>

              {/* Action 2: Create New Survey */}
              <button
                type="button"
                onClick={() => setNewQuestionModalOpen(true)}
                className="p-4 bg-[#1F8F82]/20 hover:bg-[#1F8F82]/30 border border-[#1F8F82] text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase text-[#1F8F82]">New Question</span>
                    <PlusCircle className="w-4 h-4 text-[#1F8F82]" />
                  </div>
                  <p className="text-[11px] text-[#F2EAD6]/70 font-archivo">
                    Publish a new civic survey question to the smart bin.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-[#1F8F82] underline font-bold">
                  Launch Question →
                </span>
              </button>

              {/* Action 3: Export CSV */}
              <button
                type="button"
                onClick={handleExportCsv}
                className="p-4 bg-[#0E1E3C] hover:bg-[#16336E] border border-[#7FD8E8]/40 text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase text-[#7FD8E8]">Download Data</span>
                    <Download className="w-4 h-4 text-[#7FD8E8]" />
                  </div>
                  <p className="text-[11px] text-[#F2EAD6]/70 font-archivo">
                    Export entire historical polling log to CSV spreadsheet.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-[#7FD8E8] underline font-bold">
                  Export CSV ({historyRecords.length} records) →
                </span>
              </button>

              {/* Action 4: Hardware Tools */}
              <button
                type="button"
                onClick={() => setRole('admin')}
                className="p-4 bg-[#0E1E3C] hover:bg-[#16336E] border border-[#F2B33D]/40 text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase text-[#F2B33D]">Staff Operations</span>
                    <Layers className="w-4 h-4 text-[#F2B33D]" />
                  </div>
                  <p className="text-[11px] text-[#F2EAD6]/70 font-archivo">
                    Open advanced merchant view, field agent courier, or simulator.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-[#F2B33D] underline font-bold">
                  Open Staff View →
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. Historical Surveys & Old Data Archive ("पुराने सर्वे व पुराना डेटा") */}
      <section id="survey-history" className="py-12 lg:py-16 px-4 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#7FD8E8]/30 pb-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#F2B33D] uppercase tracking-wider mb-1 font-bold">
              <History className="w-4 h-4" />
              <span>CITIZEN DATA VAULT</span>
            </div>
            <h2 className="font-michroma text-xl lg:text-2xl text-white">
              Historical Surveys & Old Data Archive (पुराने सर्वे परिणाम)
            </h2>
            <p className="text-xs text-[#F2EAD6]/70 font-archivo mt-1">
              Every past citizen voting session recorded by Code & Circuit smart bins is permanently saved and publicly open for transparency.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={historyRecords.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#16336E] hover:bg-[#1a3d85] border border-[#7FD8E8] text-[#7FD8E8] hover:text-white font-mono text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7FD8E8]/50" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search previous questions, options, or dates..."
              className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/30 pl-9 pr-4 py-2 font-mono text-xs text-[#F2EAD6] placeholder-[#F2EAD6]/40 focus:border-[#7FD8E8] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {['All', 'Civic', 'Education', 'Youth'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setHistoryFilterCategory(cat)}
                className={`px-3 py-1.5 transition-colors cursor-pointer ${
                  historyFilterCategory === cat
                    ? 'bg-[#F05A28] text-white font-bold'
                    : 'bg-[#0E1E3C] text-[#F2EAD6]/70 hover:text-white border border-[#7FD8E8]/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* History Records List */}
        {historyLoading ? (
          <div className="py-12 text-center text-xs font-mono text-[#7FD8E8] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading historical survey records...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 text-center bg-[#0E1E3C] border border-[#7FD8E8]/20 font-mono text-xs text-[#F2EAD6]/60">
            No historical survey records found matching your search.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((rec) => {
              const recTotal = rec.countA + rec.countB;
              const rPctA = recTotal > 0 ? ((rec.countA / recTotal) * 100).toFixed(1) : '50.0';
              const rPctB = recTotal > 0 ? ((rec.countB / recTotal) * 100).toFixed(1) : '50.0';
              const winnerLabel =
                rec.countA > rec.countB
                  ? rec.optionA
                  : rec.countB > rec.countA
                  ? rec.optionB
                  : 'Tied';

              return (
                <div
                  key={rec.id}
                  className="bg-[#0E1E3C] border border-[#7FD8E8]/30 p-5 hover:border-[#7FD8E8] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs font-mono text-[#7FD8E8]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#16336E] text-white font-bold">
                        {rec.unitSerial}
                      </span>
                      <span>{new Date(rec.savedAt).toLocaleDateString()} at {new Date(rec.savedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#F2B33D] font-bold">
                      <Award className="w-4 h-4" />
                      <span>Winner: {winnerLabel}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-3">
                    {rec.questionText}
                  </h3>

                  {/* Dual Breakdown Progress Bar */}
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#1F8F82] font-bold">
                        {rec.optionA}: {rec.countA} votes ({rPctA}%)
                      </span>
                      <span className="text-[#F05A28] font-bold">
                        {rec.optionB}: {rec.countB} votes ({rPctB}%)
                      </span>
                    </div>

                    <div className="w-full bg-[#081226] h-2.5 flex rounded-full overflow-hidden border border-[#7FD8E8]/20">
                      <div className="bg-[#1F8F82] h-full" style={{ width: `${rPctA}%` }} />
                      <div className="bg-[#F05A28] h-full" style={{ width: `${rPctB}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#F2EAD6]/50 pt-1">
                      <span>Total Butts: {recTotal}</span>
                      <span>Verified: Dual IR Beam Telemetry</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. How the Hardware & Smart Bin Works */}
      <section id="how-it-works" className="py-12 lg:py-16 px-4 lg:px-8 bg-[#0E1E3C] border-y border-[#7FD8E8]/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs text-[#7FD8E8] uppercase tracking-widest block mb-2 font-bold">
              PHYSICAL EMBEDDED ARCHITECTURE
            </span>
            <h2 className="font-michroma text-xl lg:text-2xl text-white">
              How the Smart Survey Bin Works
            </h2>
            <p className="mt-2 text-xs text-[#F2EAD6]/70 font-archivo">
              Combining industrial optical sensing, edge microcontrollers, and cloud telemetry to eliminate cigarette waste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-archivo">
            <div className="bg-[#081226] border border-[#7FD8E8]/30 p-5">
              <div className="w-10 h-10 bg-[#1F8F82]/20 border border-[#1F8F82] flex items-center justify-center text-[#1F8F82] font-mono font-bold mb-3">
                01
              </div>
              <h3 className="font-bold text-white text-sm mb-1">Citizen Casts Vote</h3>
              <p className="text-xs text-[#F2EAD6]/70 leading-relaxed">
                The smoker selects Option A or Option B aperture on the physical stainless steel bin to express their opinion.
              </p>
            </div>

            <div className="bg-[#081226] border border-[#7FD8E8]/30 p-5">
              <div className="w-10 h-10 bg-[#7FD8E8]/20 border border-[#7FD8E8] flex items-center justify-center text-[#7FD8E8] font-mono font-bold mb-3">
                02
              </div>
              <h3 className="font-bold text-white text-sm mb-1">Optical IR Beam Break</h3>
              <p className="text-xs text-[#F2EAD6]/70 leading-relaxed">
                Dual infrared sensors (Pins 26 & 27) detect falling cigarette butts without physical contact and debounce false triggers.
              </p>
            </div>

            <div className="bg-[#081226] border border-[#F2B33D]/20 border border-[#F2B33D] flex items-center justify-center text-[#F2B33D] font-mono font-bold mb-3">
              03
            </div>
            <div className="bg-[#081226] border border-[#7FD8E8]/30 p-5">
              <div className="w-10 h-10 bg-[#F05A28]/20 border border-[#F05A28] flex items-center justify-center text-[#F05A28] font-mono font-bold mb-3">
                04
              </div>
              <h3 className="font-bold text-white text-sm mb-1">Instant Cloud Telemetry</h3>
              <p className="text-xs text-[#F2EAD6]/70 leading-relaxed">
                ESP32 synchronizes via Mobile Hotspot / Wi-Fi directly to this cloud web portal within 1 second.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Civic & Environmental Impact */}
      <section id="impact" className="py-12 lg:py-16 px-4 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="font-mono text-xs text-[#1F8F82] uppercase tracking-widest block mb-2 font-bold">
            MEASURABLE SWACHH BHARAT OUTCOMES
          </span>
          <h2 className="font-michroma text-xl lg:text-2xl text-white">
            Civic & Environmental Impact in Kota
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center">
          <div className="bg-[#0E1E3C] border border-[#7FD8E8]/30 p-6">
            <div className="text-3xl lg:text-4xl font-bold text-[#1F8F82] mb-1">2,840+</div>
            <div className="text-xs text-[#F2EAD6]/70 uppercase">Butts Diverted</div>
          </div>
          <div className="bg-[#0E1E3C] border border-[#7FD8E8]/30 p-6">
            <div className="text-3xl lg:text-4xl font-bold text-[#F2B33D] mb-1">100%</div>
            <div className="text-xs text-[#F2EAD6]/70 uppercase">Cloud Audited</div>
          </div>
          <div className="bg-[#0E1E3C] border border-[#7FD8E8]/30 p-6">
            <div className="text-3xl lg:text-4xl font-bold text-[#7FD8E8] mb-1">1.4 kg</div>
            <div className="text-xs text-[#F2EAD6]/70 uppercase">Cellulose Acetate Kept Out</div>
          </div>
          <div className="bg-[#0E1E3C] border border-[#7FD8E8]/30 p-6">
            <div className="text-3xl lg:text-4xl font-bold text-[#F05A28] mb-1">94.8%</div>
            <div className="text-xs text-[#F2EAD6]/70 uppercase">Public Engagement</div>
          </div>
        </div>
      </section>

      {/* 8. Global Website Footer */}
      <footer className="mt-auto bg-[#050B14] border-t border-[#7FD8E8]/20 py-8 px-4 lg:px-8 font-mono text-xs text-[#F2EAD6]/60">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CodeCircuitLogo size={24} strokeColor="#F2EAD6" sparkColor="#7FD8E8" />
            <span>Code & Circuit · Smart Survey Bin Initiative (Kota, Rajasthan)</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#live-poll" className="hover:text-white">Live Poll</a>
            <a href="#survey-history" className="hover:text-white">Old Data Archive</a>
            {!isAdminAuthenticated ? (
              <button
                type="button"
                onClick={() => setAdminModalOpen(true)}
                className="text-[#F2B33D] hover:underline cursor-pointer"
              >
                Admin Login
              </button>
            ) : (
              <button
                type="button"
                onClick={adminLogout}
                className="text-red-400 hover:underline cursor-pointer"
              >
                Admin Logout ({adminUserId || 'Lokesh'})
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* MODAL 1: Admin Login Modal (lokeshnaraniya@gmail.com / lokeshadmin) */}
      {/* ============================================================== */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#081226]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E1E3C] border-2 border-[#7FD8E8] max-w-sm w-full p-6 text-[#F2EAD6] shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setAdminModalOpen(false);
                setAdminError(null);
              }}
              className="absolute top-4 right-4 text-[#7FD8E8] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-2 border-2 border-[#7FD8E8] bg-[#16336E] flex items-center justify-center text-[#F2B33D]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-michroma text-sm uppercase tracking-wider text-white">
                ADMIN SECURE LOGIN
              </h3>
              <p className="font-mono text-[10px] text-[#7FD8E8] mt-1">
                Authorized Personnel Only (Survey & Reset Control)
              </p>
            </div>

            {adminError && (
              <div className="mb-4 p-2.5 bg-red-900/30 border border-red-500 text-red-200 font-mono text-xs text-center font-bold">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-[#7FD8E8] uppercase mb-1">
                  ADMIN USER ID / EMAIL
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={adminUserId}
                  onChange={(e) => setAdminUserId(e.target.value)}
                  placeholder="lokeshnaraniya@gmail.com"
                  className="w-full bg-[#081226] border border-[#7FD8E8]/40 p-2.5 text-[#F2EAD6] focus:border-[#F2B33D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#7FD8E8] uppercase mb-1">
                  ADMIN PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#081226] border border-[#7FD8E8]/40 p-2.5 text-[#F2EAD6] focus:border-[#F2B33D] outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-2.5 bg-[#F05A28] hover:bg-[#d84818] active:scale-98 text-white font-bold uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {adminLoading ? 'Verifying...' : 'Login as Admin'}
                </button>
              </div>

              <div className="text-[10px] text-center text-[#F2EAD6]/50">
                Authorized user: lokeshnaraniya@gmail.com
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Secure Reset Confirmation Modal (Strictly Admin Only) */}
      {/* ============================================================== */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#081226]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E1E3C] border-2 border-red-500 max-w-md w-full p-6 text-[#F2EAD6] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="absolute top-4 right-4 text-[#F2EAD6]/60 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-400 mb-4">
              <ShieldAlert className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="font-michroma text-base text-white">
                  RESET BIN COUNTS TO ZERO
                </h3>
                <span className="font-mono text-[10px] text-red-300">
                  ADMIN OPERATION · LOKESH NARANIYA
                </span>
              </div>
            </div>

            {resetSuccessMsg ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500 text-emerald-200 font-mono text-xs text-center font-bold">
                {resetSuccessMsg}
              </div>
            ) : (
              <>
                <p className="font-archivo text-xs text-[#F2EAD6]/80 leading-relaxed mb-4">
                  Are you sure you want to reset the SmartBin counters to zero? Current counts (<b>A: {liveCounts.countA}</b>, <b>B: {liveCounts.countB}</b>) will be <b>automatically archived into the historical database</b> so no data will ever be lost!
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 bg-[#16336E] text-[#F2EAD6] font-mono text-xs cursor-pointer hover:bg-[#1f4287]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminReset}
                    disabled={resetting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-mono text-xs font-bold uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {resetting ? 'Archiving & Resetting...' : 'Confirm Reset (0)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: Create New Survey Question (Admin Only) */}
      {/* ============================================================== */}
      {newQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#081226]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E1E3C] border-2 border-[#1F8F82] max-w-lg w-full p-6 text-[#F2EAD6] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setNewQuestionModalOpen(false)}
              className="absolute top-4 right-4 text-[#7FD8E8] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-[#1F8F82] mb-4">
              <PlusCircle className="w-6 h-6" />
              <h3 className="font-michroma text-base text-white">
                LAUNCH NEW CITIZEN SURVEY
              </h3>
            </div>

            <form onSubmit={handleCreateQuestionSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-[#7FD8E8] uppercase mb-1">
                  QUESTION TEXT (HINDI OR ENGLISH)
                </label>
                <textarea
                  required
                  rows={3}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="e.g. क्या कोचिंग छात्रों के लिए रविवार को पूर्ण अवकाश होना चाहिए?"
                  className="w-full bg-[#081226] border border-[#7FD8E8]/40 p-2.5 text-[#F2EAD6] focus:border-[#1F8F82] outline-none font-archivo text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#1F8F82] uppercase mb-1">
                    OPTION A (HOLE A)
                  </label>
                  <input
                    type="text"
                    required
                    value={newOptionA}
                    onChange={(e) => setNewOptionA(e.target.value)}
                    placeholder="e.g. हाँ / YES"
                    className="w-full bg-[#081226] border border-[#1F8F82]/50 p-2 text-[#F2EAD6] focus:border-[#1F8F82] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#F05A28] uppercase mb-1">
                    OPTION B (HOLE B)
                  </label>
                  <input
                    type="text"
                    required
                    value={newOptionB}
                    onChange={(e) => setNewOptionB(e.target.value)}
                    placeholder="e.g. नहीं / NO"
                    className="w-full bg-[#081226] border border-[#F05A28]/50 p-2 text-[#F2EAD6] focus:border-[#F05A28] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#7FD8E8] uppercase mb-1">
                  SURVEY CATEGORY
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#081226] border border-[#7FD8E8]/40 p-2 text-[#F2EAD6] focus:border-[#1F8F82] outline-none"
                >
                  <option value="Civic">Civic / स्वच्छता व नगर निकाय</option>
                  <option value="Education">Education / शिक्षा व कोचिंग</option>
                  <option value="Youth">Youth / युवा व करियर</option>
                  <option value="Environment">Environment / पर्यावरण</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setNewQuestionModalOpen(false)}
                  className="px-4 py-2 bg-[#16336E] text-[#F2EAD6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingQuestion}
                  className="px-5 py-2 bg-[#1F8F82] hover:bg-[#18756a] active:scale-98 text-white font-bold uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {creatingQuestion ? 'Launching...' : 'Publish to Smart Bin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
