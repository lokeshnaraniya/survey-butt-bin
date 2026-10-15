import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  saveSurveySnapshot,
} from '../../services/surveyService';
import { SaveSurveyPayload } from '../../types/survey';
import {
  AlertTriangle,
  Bluetooth,
  CheckCircle2,
  Database,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Usb,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Info,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface QuestionCountData {
  countA: number;
  countB: number;
  total: number;
  lastUpdated?: string;
}

export const LiveSurveyPanel: React.FC = () => {
  const {
    units,
    selectedUnitSerial,
    setSelectedUnitSerial,
    questions,
    isHardwareConnected,
    activeHardwareMethod,
    hardwareStatusMsg,
    hardwareIsError,
    liveReading,
    connectedUnitSerial,
    connectDeviceBluetooth,
    connectDeviceSerial,
    disconnectDevice,
    addSavedQuestion,
    questionLibraryError,
    refreshQuestionLibrary,
    setDeviceWifiModalOpen,
    openBluetoothModal,
  } = useApp();

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [connecting, setConnecting] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  const [questionMode, setQuestionMode] = useState<'existing' | 'new'>('existing');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(() => {
    return questions[0]?.id || 'q-01';
  });

  // Track independent counts for each question
  const [questionCounts, setQuestionCounts] = useState<Record<string, QuestionCountData>>(() => {
    try {
      const saved = localStorage.getItem('cc_question_counts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'q-01': { countA: 412, countB: 288, total: 700, lastUpdated: new Date().toISOString() },
      'q-02': { countA: 840, countB: 320, total: 1160, lastUpdated: new Date().toISOString() },
      'q-03': { countA: 3, countB: 1, total: 4, lastUpdated: new Date().toISOString() },
    };
  });

  // Save question-specific counts to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('cc_question_counts', JSON.stringify(questionCounts));
    } catch {}
  }, [questionCounts]);

  // Counts for a brand new question being written (starts fresh from 0!)
  const [newQuestionCounts, setNewQuestionCounts] = useState<QuestionCountData>({
    countA: 0,
    countB: 0,
    total: 0,
  });

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptionA, setNewOptionA] = useState('हाँ / Yes');
  const [newOptionB, setNewOptionB] = useState('नहीं / No');

  const [saving, setSaving] = useState(false);
  const [unconfirmedPayload, setUnconfirmedPayload] = useState<SaveSurveyPayload | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Safe Save Confirmation Modal & Strategy
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [saveStrategy, setSaveStrategy] = useState<'max' | 'add' | 'exact'>('max');
  const [exportingCSV, setExportingCSV] = useState(false);

  const [showAllQuestionsTable, setShowAllQuestionsTable] = useState(true);

  const saveInProgressRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // When switching questionMode to 'new', start counts fresh from 0
  const handleModeChange = (mode: 'existing' | 'new') => {
    setQuestionMode(mode);
    setSaveError(null);
    setSaveSuccess(null);
    if (mode === 'new') {
      setNewQuestionCounts({ countA: 0, countB: 0, total: 0 });
    }
  };

  const currentQ = questions.find((q) => q.id === selectedQuestionId) || questions[0];
  const effectiveQuestionText =
    questionMode === 'existing' ? currentQ?.text || '' : newQuestionText;
  const effectiveOptionA =
    questionMode === 'existing'
      ? currentQ?.options.find((o) => o.hole_id === 'A')?.label || 'Option A'
      : newOptionA;
  const effectiveOptionB =
    questionMode === 'existing'
      ? currentQ?.options.find((o) => o.hole_id === 'B')?.label || 'Option B'
      : newOptionB;

  // Active question's independent counts
  const activeCounts: QuestionCountData =
    questionMode === 'existing'
      ? questionCounts[selectedQuestionId] || { countA: 0, countB: 0, total: 0 }
      : newQuestionCounts;

  const elapsedMs = liveReading
    ? Math.max(0, currentTime - new Date(liveReading.receivedAt).getTime())
    : Infinity;
  const isDataFresh =
    isHardwareConnected || activeHardwareMethod !== 'none' || elapsedMs < 20000;

  const canSave =
    !!effectiveQuestionText.trim() &&
    !!effectiveOptionA.trim() &&
    !!effectiveOptionB.trim();

  const selectStyle =
    'w-full bg-[#0E1E3C] border border-[#7FD8E8]/35 px-3 py-2 text-xs text-[#F2EAD6] focus:border-[#F2B33D] outline-none disabled:opacity-60 font-archivo';

  const handleConnect = async (method: 'bluetooth' | 'serial') => {
    setConnecting(true);
    setSaveError(null);
    try {
      if (method === 'bluetooth') {
        openBluetoothModal(selectedUnitSerial);
      } else {
        await connectDeviceSerial();
      }
    } finally {
      setConnecting(false);
    }
  };

  // Vote for the currently active question (increments ONLY this question's count)
  const handleVoteForCurrentQuestion = (hole: 'A' | 'B') => {
    setSaveSuccess(null);
    if (questionMode === 'existing') {
      setQuestionCounts((prev) => {
        const cur = prev[selectedQuestionId] || { countA: 0, countB: 0, total: 0 };
        const nextA = hole === 'A' ? cur.countA + 1 : cur.countA;
        const nextB = hole === 'B' ? cur.countB + 1 : cur.countB;
        return {
          ...prev,
          [selectedQuestionId]: {
            countA: nextA,
            countB: nextB,
            total: nextA + nextB,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
    } else {
      setNewQuestionCounts((prev) => {
        const nextA = hole === 'A' ? prev.countA + 1 : prev.countA;
        const nextB = hole === 'B' ? prev.countB + 1 : prev.countB;
        return {
          countA: nextA,
          countB: nextB,
          total: nextA + nextB,
          lastUpdated: new Date().toISOString(),
        };
      });
    }
  };

  // Reset ONLY current question's counts to 0
  const handleResetCurrentQuestion = () => {
    if (questionMode === 'existing') {
      setQuestionCounts((prev) => ({
        ...prev,
        [selectedQuestionId]: {
          countA: 0,
          countB: 0,
          total: 0,
          lastUpdated: new Date().toISOString(),
        },
      }));
    } else {
      setNewQuestionCounts({ countA: 0, countB: 0, total: 0 });
    }
    setSaveSuccess('Current question readings reset to 0. Other questions are unaffected.');
  };

  // 1. Export entire survey audit trail to Excel / CSV with UTF-8 BOM
  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const res = await fetch('/api/survey/history');
      const data = res.ok ? await res.json() : { snapshots: [] };
      const snapshots = data.snapshots || [];

      const headers = [
        'Record Sequence',
        'Saved Timestamp',
        'Bin Serial ID',
        'Hardware Device Name',
        'Question ID',
        'Question Title',
        'Option A Label',
        'Option A Votes',
        'Option B Label',
        'Option B Votes',
        'Total Votes',
        'Connection Method',
      ];

      const rows: string[][] = [];

      snapshots.forEach((s: any) => {
        rows.push([
          String(s.sequence || ''),
          s.savedAt || s.capturedAt || '',
          s.unitSerial || 'CC-BIN-01',
          s.deviceName || 'ESP32 SmartBin',
          s.questionId || '',
          `"${(s.questionText || '').replace(/"/g, '""')}"`,
          `"${(s.optionA || 'Option A').replace(/"/g, '""')}"`,
          String(s.countA ?? 0),
          `"${(s.optionB || 'Option B').replace(/"/g, '""')}"`,
          String(s.countB ?? 0),
          String((s.countA ?? 0) + (s.countB ?? 0)),
          s.connectionMethod || 'bluetooth',
        ]);
      });

      // Also ensure current question states are recorded
      if (rows.length === 0) {
        questions.forEach((q, idx) => {
          const c = questionCounts[q.id] || { countA: 0, countB: 0, total: 0 };
          const optA = q.options.find((o) => o.hole_id === 'A')?.label || 'Option A';
          const optB = q.options.find((o) => o.hole_id === 'B')?.label || 'Option B';
          rows.push([
            String(idx + 1),
            new Date().toISOString(),
            selectedUnitSerial || 'CC-BIN-01',
            'ESP32 SmartBin',
            q.id,
            `"${q.text.replace(/"/g, '""')}"`,
            `"${optA.replace(/"/g, '""')}"`,
            String(c.countA),
            `"${optB.replace(/"/g, '""')}"`,
            String(c.countB),
            String(c.total),
            activeHardwareMethod !== 'none' ? activeHardwareMethod : 'cloud',
          ]);
        });
      }

      // UTF-8 BOM (\uFEFF) ensures Hindi and multilingual text renders correctly in Microsoft Excel
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', url);
      link.setAttribute('download', `SmartBin_Survey_Audit_Report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSaveSuccess('✓ Excel CSV file downloaded successfully! All past and current readings are safe.');
    } catch (err: any) {
      setSaveError('Failed exporting Excel report: ' + (err?.message || 'Unknown error'));
    } finally {
      setExportingCSV(false);
    }
  };

  // 2. Open confirmation modal prior to saving
  const handleInitiateSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setConfirmModalOpen(true);
  };

  // 3. Execute safe save using selected strategy (Prevents accidental 0 overwrite!)
  const executeSaveWithStrategy = async () => {
    if (saveInProgressRef.current || !canSave) return;

    setConfirmModalOpen(false);
    saveInProgressRef.current = true;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const hardwareA = liveReading ? liveReading.countA : activeCounts.countA;
    const hardwareB = liveReading ? liveReading.countB : activeCounts.countB;
    const existingA = activeCounts.countA;
    const existingB = activeCounts.countB;

    let finalA = hardwareA;
    let finalB = hardwareB;

    if (saveStrategy === 'max') {
      // MAXIMUM ENTRY PROTECTION (Requested by user)
      finalA = Math.max(existingA, hardwareA);
      finalB = Math.max(existingB, hardwareB);
    } else if (saveStrategy === 'add') {
      // CUMULATIVE ADDITION
      finalA = existingA + hardwareA;
      finalB = existingB + hardwareB;
    } else {
      // EXACT CURRENT HARDWARE READING
      finalA = hardwareA;
      finalB = hardwareB;
    }

    const realTotal = finalA + finalB;

    const payload: SaveSurveyPayload = {
      id: crypto.randomUUID(),
      unitSerial: selectedUnitSerial || 'CC-BIN-01',
      deviceName: liveReading?.deviceName || 'ESP32 SmartBin',
      questionText: effectiveQuestionText.trim(),
      optionA: effectiveOptionA.trim(),
      optionB: effectiveOptionB.trim(),
      countA: finalA,
      countB: finalB,
      connectionMethod: activeHardwareMethod !== 'none' ? activeHardwareMethod : 'cloud',
      capturedAt: new Date().toISOString(),
    };

    try {
      const res = await saveSurveySnapshot(payload);
      addSavedQuestion(res.question);

      const targetQId = questionMode === 'new' ? res.question.id : selectedQuestionId;
      setQuestionCounts((prev) => ({
        ...prev,
        [targetQId]: {
          countA: finalA,
          countB: finalB,
          total: realTotal,
          lastUpdated: new Date().toISOString(),
        },
      }));

      if (questionMode === 'new') {
        setSelectedQuestionId(res.question.id);
        setQuestionMode('existing');
        setNewQuestionText('');
      }

      const strategyName =
        saveStrategy === 'max'
          ? 'Maximum Retention (0-Reset Protected)'
          : saveStrategy === 'add'
          ? 'Cumulative Added'
          : 'Exact Reading';

      setSaveSuccess(
        `✓ Saved permanently for "${effectiveQuestionText.slice(0, 30)}..."! Option A: ${finalA}, Option B: ${finalB} (Total: ${realTotal}) [${strategyName}].`
      );
    } catch (err: any) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Save could not be confirmed. Retry without closing this page.'
      );
    } finally {
      saveInProgressRef.current = false;
      setSaving(false);
    }
  };

  return (
    <section aria-label="Live ESP32 survey data" className="w-full max-w-7xl mx-auto p-3 sm:p-4 select-text">
      <div className="border border-[#7FD8E8]/40 bg-[#102647] shadow-lg">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#7FD8E8]/25 bg-[#0E1E3C]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#F2B33D] animate-pulse" />
            <h2 className="font-michroma text-xs tracking-wider text-[#F2EAD6] uppercase">
              LIVE SURVEY / ESP32 HARDWARE
            </h2>
          </div>
          <span
            className={`font-mono text-[10px] px-2 py-0.5 border ${
              isDataFresh
                ? 'text-[#7FD8E8] border-[#7FD8E8]/50 bg-[#7FD8E8]/10'
                : 'text-[#F2EAD6]/50 border-[#F2EAD6]/20'
            }`}
          >
            {activeHardwareMethod === 'bluetooth'
              ? '⚡ LIVE · BLUETOOTH'
              : activeHardwareMethod === 'serial'
              ? '⚡ LIVE · USB'
              : activeHardwareMethod === 'wifi'
              ? '⚡ LIVE · WI-FI CLOUD'
              : '⚡ QUESTION-SPECIFIC SYNC ACTIVE'}
          </span>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: Device Controls & Live Reading for the CURRENT Question */}
          <div className="p-4 space-y-3 lg:border-r border-[#7FD8E8]/25">
            <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase font-bold">
              UNIT TO ASSOCIATE WITH THIS DEVICE
              <select
                className={`${selectStyle} mt-1 font-archivo`}
                value={selectedUnitSerial}
                onChange={(e) => setSelectedUnitSerial(e.target.value)}
                disabled={isHardwareConnected || connecting}
              >
                {units.map((u) => (
                  <option key={u.serial} value={u.serial}>
                    {u.serial}
                  </option>
                ))}
              </select>
            </label>

            {/* Connection Buttons */}
            <div className="flex flex-wrap gap-2 font-mono text-[11px]">
              {activeHardwareMethod === 'bluetooth' && isHardwareConnected ? (
                <button
                  type="button"
                  onClick={disconnectDevice}
                  className="flex items-center gap-2 bg-[#10B981]/20 border border-[#10B981] px-3 py-2 text-[#10B981] hover:bg-[#EF4444]/20 hover:text-[#EF4444] hover:border-[#EF4444] cursor-pointer transition-colors"
                  title="Disconnect Bluetooth"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>BLE Connected (Disconnect)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect('bluetooth')}
                  disabled={connecting}
                  className="flex items-center gap-2 bg-[#F05A28] hover:bg-[#d84818] active:scale-98 px-3.5 py-2 text-white font-bold disabled:opacity-50 cursor-pointer shadow-md transition-all"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>{connecting ? 'Connecting BLE…' : 'Connect Bluetooth'}</span>
                </button>
              )}

              {activeHardwareMethod === 'serial' && isHardwareConnected ? (
                <button
                  type="button"
                  onClick={disconnectDevice}
                  className="flex items-center gap-2 bg-[#F2B33D]/20 border border-[#F2B33D] px-3 py-2 text-[#F2B33D] hover:bg-[#EF4444]/20 hover:text-[#EF4444] hover:border-[#EF4444] cursor-pointer transition-colors"
                  title="Disconnect USB Cable"
                >
                  <Usb className="w-3.5 h-3.5" />
                  <span>USB Connected (Disconnect)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect('serial')}
                  disabled={connecting}
                  className="flex items-center gap-2 border border-[#7FD8E8]/40 hover:bg-[#16336E] px-3.5 py-2 text-[#7FD8E8] hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <Usb className="w-4 h-4" />
                  <span>USB Cable</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeviceWifiModalOpen(true)}
                className="flex items-center gap-2 bg-[#1F8F82] hover:bg-[#18756a] px-3.5 py-2 text-white font-bold cursor-pointer shadow-md transition-colors"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Wi-Fi Cloud / Code</span>
              </button>
            </div>

            {isInIframe && !isHardwareConnected && (
              <div className="p-3 bg-[#F05A28]/20 border border-[#F05A28] text-xs font-archivo flex flex-wrap items-center justify-between gap-2 text-[#F2EAD6]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#F05A28] shrink-0 animate-pulse" />
                  <span>
                    <b>Bluetooth in preview:</b> If browser blocks Web Bluetooth inside iframe, open in full tab:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="py-1 px-3 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono text-xs font-bold uppercase shrink-0 cursor-pointer shadow-md"
                >
                  Open Full Tab ↗
                </button>
              </div>
            )}

            <p
              role="status"
              className={`font-mono text-[11px] break-words ${
                hardwareIsError ? 'text-[#F2B33D]' : 'text-[#7FD8E8]'
              }`}
            >
              {hardwareStatusMsg}
            </p>

            {/* Current Question Context Badge */}
            <div className="p-2.5 bg-[#0E1E3C] border border-[#7FD8E8]/30 text-xs font-archivo">
              <span className="font-mono text-[10px] text-[#F2B33D] uppercase block font-bold">
                ACTIVE QUESTION ON DISPLAY:
              </span>
              <p className="text-white font-semibold truncate mt-0.5">
                "{effectiveQuestionText || 'No question selected'}"
              </p>
            </div>

            {/* Live Counts Display FOR THE CONNECTED PHYSICAL HARDWARE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#7FD8E8]/40 bg-[#0E1E3C] p-4 text-center shadow-inner">
                <span className="font-mono text-[10px] text-[#7FD8E8] uppercase tracking-wider block font-bold">
                  HOLE A (SLOT A)
                </span>
                <div className="font-mono text-4xl tabular-nums font-black text-[#10B981] my-2 tracking-tight">
                  {liveReading?.countA ?? 0}
                </div>
                <div className="text-xs break-words text-[#F2EAD6] font-semibold truncate font-archivo">
                  {effectiveOptionA}
                </div>
              </div>

              <div className="border border-[#7FD8E8]/40 bg-[#0E1E3C] p-4 text-center shadow-inner">
                <span className="font-mono text-[10px] text-[#7FD8E8] uppercase tracking-wider block font-bold">
                  HOLE B (SLOT B)
                </span>
                <div className="font-mono text-4xl tabular-nums font-black text-[#F05A28] my-2 tracking-tight">
                  {liveReading?.countB ?? 0}
                </div>
                <div className="text-xs break-words text-[#F2EAD6] font-semibold truncate font-archivo">
                  {effectiveOptionB}
                </div>
              </div>
            </div>

            {/* Live Hardware Stream Indicator (Real Sensor Status, no fake test buttons) */}
            <div className="p-2.5 bg-[#050B14] border border-[#7FD8E8]/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isHardwareConnected || activeHardwareMethod !== 'none' ? 'bg-[#10B981] animate-ping' : 'bg-[#F2B33D]'}`}></span>
                <span className="text-white font-bold">
                  {isHardwareConnected || activeHardwareMethod !== 'none'
                    ? 'REAL HARDWARE STREAM ACTIVE'
                    : 'AWAITING HARDWARE SENSOR'}
                </span>
              </div>
              <span className="text-[#7FD8E8]">
                {activeHardwareMethod === 'bluetooth'
                  ? '⚡ BLE Link'
                  : activeHardwareMethod === 'serial'
                  ? '⚡ USB Link'
                  : '⚡ Direct Link'}
              </span>
            </div>

            <div className="font-mono text-xs flex justify-between items-center gap-2 text-[#F2EAD6]/80 pt-1 border-t border-[#7FD8E8]/20">
              <span>
                TOTAL HARDWARE COUNT: <b>{(liveReading?.countA ?? 0) + (liveReading?.countB ?? 0)}</b>
              </span>
              <span className="text-[10px] text-[#7FD8E8]">
                {liveReading?.receivedAt ? new Date(liveReading.receivedAt).toLocaleTimeString() : 'Live Synced'}
              </span>
            </div>
          </div>

          {/* Right: Question Selector & Save to Cloud Database */}
          <form
            onSubmit={handleInitiateSave}
            className="p-4 space-y-3 border-t lg:border-t-0 border-[#7FD8E8]/25 bg-[#0E1E3C]/40 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#7FD8E8] font-bold uppercase">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#1F8F82]" />
                  <span>QUESTION-WISE SAVE / CLOUD HISTORY</span>
                </div>
              </div>

              {/* Toggle Question Mode */}
              <div
                className="flex gap-2 text-xs font-mono"
                role="group"
                aria-label="Question entry mode"
              >
                <button
                  type="button"
                  disabled={!!unconfirmedPayload}
                  onClick={() => handleModeChange('existing')}
                  aria-pressed={questionMode === 'existing'}
                  className={`px-3 py-1.5 border font-semibold uppercase cursor-pointer transition-colors ${
                    questionMode === 'existing'
                      ? 'border-[#F2B33D] text-[#F2B33D] bg-[#F2B33D]/10'
                      : 'border-[#7FD8E8]/25 text-[#F2EAD6]/70'
                  } disabled:opacity-60`}
                >
                  Select question
                </button>
                <button
                  type="button"
                  disabled={!!unconfirmedPayload}
                  onClick={() => handleModeChange('new')}
                  aria-pressed={questionMode === 'new'}
                  className={`px-3 py-1.5 border font-semibold uppercase cursor-pointer transition-colors ${
                    questionMode === 'new'
                      ? 'border-[#F2B33D] text-[#F2B33D] bg-[#F2B33D]/10'
                      : 'border-[#7FD8E8]/25 text-[#F2EAD6]/70'
                  } disabled:opacity-60`}
                >
                  Write question (Starts from 0)
                </button>
              </div>

              {questionMode === 'existing' ? (
                <label className="block text-xs font-archivo">
                  <span className="font-mono text-[10px] text-[#7FD8E8] uppercase block mb-1">
                    WHICH QUESTION DOES THIS DATA ANSWER?
                  </span>
                  <select
                    required
                    value={selectedQuestionId}
                    onChange={(e) => {
                      setSelectedQuestionId(e.target.value);
                      setSaveSuccess(null);
                      setSaveError(null);
                    }}
                    disabled={!!unconfirmedPayload}
                    className={`${selectStyle} mt-1`}
                  >
                    {questions.map((q) => {
                      const counts = questionCounts[q.id] || { countA: 0, countB: 0, total: 0 };
                      return (
                        <option key={q.id} value={q.id}>
                          {q.text} (Total: {counts.total})
                        </option>
                      );
                    })}
                  </select>
                </label>
              ) : (
                <>
                  <label className="block text-xs font-archivo">
                    <span className="font-mono text-[10px] text-[#7FD8E8] uppercase block mb-1">
                      NEW QUESTION / सवाल (Starts from 0)
                    </span>
                    <textarea
                      required
                      maxLength={1000}
                      rows={2}
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      disabled={!!unconfirmedPayload}
                      placeholder="Write your new question here (votes will count from 0)…"
                      className={`${selectStyle} mt-1 resize-y`}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-archivo">
                      <span className="font-mono text-[10px] text-[#7FD8E8] uppercase block mb-1">
                        OPTION A
                      </span>
                      <input
                        required
                        maxLength={200}
                        value={newOptionA}
                        onChange={(e) => setNewOptionA(e.target.value)}
                        disabled={!!unconfirmedPayload}
                        className={`${selectStyle} mt-1`}
                      />
                    </label>

                    <label className="block text-xs font-archivo">
                      <span className="font-mono text-[10px] text-[#7FD8E8] uppercase block mb-1">
                        OPTION B
                      </span>
                      <input
                        required
                        maxLength={200}
                        value={newOptionB}
                        onChange={(e) => setNewOptionB(e.target.value)}
                        disabled={!!unconfirmedPayload}
                        className={`${selectStyle} mt-1`}
                      />
                    </label>
                  </div>
                </>
              )}

              {currentQ && questionMode === 'existing' && (
                <div className="p-2 bg-[#050B14] border border-[#7FD8E8]/20 text-xs font-archivo">
                  <p className="text-[#F2EAD6]/90 italic">"{currentQ.text}"</p>
                  <p className="text-[10px] text-[#7FD8E8] font-mono mt-1">
                    Saved votes for this question: Option A ({effectiveOptionA}): <b>{activeCounts.countA}</b> ·
                    Option B ({effectiveOptionB}): <b>{activeCounts.countB}</b> (Total: <b>{activeCounts.total}</b>)
                  </p>
                </div>
              )}

              {questionLibraryError && (
                <p className="text-xs text-[#F2B33D] font-mono">
                  {questionLibraryError}{' '}
                  <button
                    type="button"
                    onClick={() => refreshQuestionLibrary()}
                    className="underline cursor-pointer ml-1"
                  >
                    Retry library
                  </button>
                </p>
              )}

              <p className="text-[11px] leading-relaxed text-[#F2EAD6]/65 font-archivo">
                Each question retains its own separate data. Switching questions loads that question's saved votes.
              </p>

              {saveError && (
                <p role="alert" className="text-xs text-[#F05A28] font-mono font-bold">
                  {saveError}
                </p>
              )}

              {saveSuccess && (
                <p role="status" className="flex items-center gap-2 text-xs text-[#7FD8E8] font-mono font-bold bg-[#1F8F82]/20 p-2 border border-[#1F8F82]/40">
                  <CheckCircle2 className="w-4 h-4 text-[#1F8F82] shrink-0" />
                  <span>{saveSuccess}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                type="submit"
                disabled={saving || !canSave}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#F05A28] hover:bg-[#d84818] active:scale-98 text-white font-mono text-xs font-bold uppercase transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer rounded"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving ? 'SAVING TO DATABASE…' : 'SAVE READING WITH QUESTION'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={exportingCSV}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#10B981] hover:bg-[#059669] active:scale-98 text-black font-mono text-xs font-bold uppercase transition-all shadow-md cursor-pointer rounded"
                title="Download Excel / CSV file of all questions and readings"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{exportingCSV ? 'EXPORTING…' : 'EXPORT TO EXCEL'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Confirmation Modal Before Saving to Prevent Accidental 0 Overwrite */}
        {confirmModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0E1E3C]/80 backdrop-blur-sm flex items-center justify-center p-3 select-text font-mono text-xs">
            <div className="bg-[#0C1628] border-2 border-[#F2B33D] max-w-lg w-full p-5 text-[#F2EAD6] shadow-2xl rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#F2B33D]/40 pb-2">
                <div className="flex items-center gap-2 text-[#F2B33D] font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="uppercase text-sm">CONFIRM SURVEY READING SAVE</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="text-[#94A3B8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <span className="text-[10px] text-[#7FD8E8] uppercase block">Question:</span>
                <p className="font-bold text-white font-archivo text-sm mt-0.5">
                  "{effectiveQuestionText}"
                </p>
              </div>

              {/* Hardware vs Saved Comparison */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#081226] border border-[#7FD8E8]/30 rounded">
                  <span className="text-[10px] text-[#7FD8E8] uppercase block font-bold">
                    HARDWARE READING:
                  </span>
                  <div className="font-black text-white text-base mt-1">
                    A: <span className="text-[#10B981]">{liveReading?.countA ?? 0}</span> · B:{' '}
                    <span className="text-[#F05A28]">{liveReading?.countB ?? 0}</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">
                    Total: {(liveReading?.countA ?? 0) + (liveReading?.countB ?? 0)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#081226] border border-[#7FD8E8]/30 rounded">
                  <span className="text-[10px] text-[#7FD8E8] uppercase block font-bold">
                    PREVIOUS SAVED:
                  </span>
                  <div className="font-black text-white text-base mt-1">
                    A: <span className="text-[#10B981]">{activeCounts.countA}</span> · B:{' '}
                    <span className="text-[#F05A28]">{activeCounts.countB}</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">
                    Total: {activeCounts.total}
                  </span>
                </div>
              </div>

              {/* Zero-Overwrite Warning */}
              {(liveReading?.countA ?? 0) + (liveReading?.countB ?? 0) === 0 && activeCounts.total > 0 && (
                <div className="p-2.5 bg-[#EF4444]/20 border border-[#EF4444] rounded text-[#EF4444] text-[11px] font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Hardware reading is currently 0 (likely after reset). To preserve your existing {activeCounts.total} votes, keep "Maximum Retention" selected below!
                  </span>
                </div>
              )}

              {/* Strategy selector */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] text-[#F2B33D] uppercase font-bold block">
                  Select Save Strategy / कैसे सेव करें?
                </span>

                <label className="flex items-start gap-2 p-2 bg-[#081226] border border-[#10B981]/50 rounded cursor-pointer hover:bg-[#16336E]/40">
                  <input
                    type="radio"
                    name="strategy"
                    checked={saveStrategy === 'max'}
                    onChange={() => setSaveStrategy('max')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-bold text-[#10B981] block">
                      Maximum Retention (Recommended / सुरक्षित)
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block">
                      Keeps highest recorded votes: A = {Math.max(activeCounts.countA, liveReading?.countA ?? 0)}, B = {Math.max(activeCounts.countB, liveReading?.countB ?? 0)}. Resetting bin will NEVER erase past votes!
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2 bg-[#081226] border border-[#38BDF8]/40 rounded cursor-pointer hover:bg-[#16336E]/40">
                  <input
                    type="radio"
                    name="strategy"
                    checked={saveStrategy === 'add'}
                    onChange={() => setSaveStrategy('add')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-bold text-[#38BDF8] block">
                      Cumulative Addition (जोड़ें)
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block">
                      Adds current hardware reading to previous total: A = {activeCounts.countA + (liveReading?.countA ?? 0)}, B = {activeCounts.countB + (liveReading?.countB ?? 0)}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2 bg-[#081226] border border-[#64748B]/40 rounded cursor-pointer hover:bg-[#16336E]/40">
                  <input
                    type="radio"
                    name="strategy"
                    checked={saveStrategy === 'exact'}
                    onChange={() => setSaveStrategy('exact')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-bold text-[#F2EAD6] block">
                      Exact Hardware Reading (वर्तमान रीडिंग से बदलें)
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block">
                      Overwrites directly with current hardware counts (A = {liveReading?.countA ?? 0}, B = {liveReading?.countB ?? 0})
                    </span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#7FD8E8]/20">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded font-bold cursor-pointer"
                >
                  Cancel / रद्द करें
                </button>
                <button
                  type="button"
                  onClick={executeSaveWithStrategy}
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black rounded font-black cursor-pointer shadow-lg active:scale-98"
                >
                  ✓ CONFIRM & SAVE / सुरक्षित सेव करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Questions List View (Always visible/toggleable so admin can inspect all question data) */}
        <div className="border-t border-[#7FD8E8]/25 bg-[#0C1A33] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F2B33D] font-bold uppercase">
              <Layers className="w-4 h-4" />
              <span>ALL QUESTIONS & PER-QUESTION DATA (ADMIN AUDIT)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllQuestionsTable(!showAllQuestionsTable)}
              className="text-xs font-mono text-[#7FD8E8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllQuestionsTable ? 'Hide Table' : 'Show All Questions'}</span>
              {showAllQuestionsTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showAllQuestionsTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-[#7FD8E8]/20">
                <thead>
                  <tr className="bg-[#0E1E3C] text-[#7FD8E8] border-b border-[#7FD8E8]/20">
                    <th className="p-2.5">Question Title</th>
                    <th className="p-2.5 text-center">Hole A</th>
                    <th className="p-2.5 text-center">Hole B</th>
                    <th className="p-2.5 text-center">Total Votes</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7FD8E8]/10 text-[#F2EAD6]">
                  {questions.map((q) => {
                    const c = questionCounts[q.id] || { countA: 0, countB: 0, total: 0 };
                    const isSelected = selectedQuestionId === q.id && questionMode === 'existing';
                    return (
                      <tr
                        key={q.id}
                        className={`hover:bg-[#16336E]/40 transition-colors ${
                          isSelected ? 'bg-[#1F8F82]/20 font-bold' : ''
                        }`}
                      >
                        <td className="p-2.5 max-w-xs sm:max-w-md truncate font-archivo">
                          {isSelected && <span className="text-[#10B981] mr-1.5 font-mono">▶ [ACTIVE]</span>}
                          {q.text}
                        </td>
                        <td className="p-2.5 text-center text-[#1F8F82] font-bold">
                          {c.countA}
                        </td>
                        <td className="p-2.5 text-center text-[#F05A28] font-bold">
                          {c.countB}
                        </td>
                        <td className="p-2.5 text-center font-bold text-white">
                          {c.total}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuestionId(q.id);
                              setQuestionMode('existing');
                              setSaveSuccess(`Switched to question "${q.text.slice(0, 30)}..."`);
                            }}
                            className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] border border-[#7FD8E8]/30 text-[#7FD8E8] text-[10px] uppercase font-bold cursor-pointer rounded"
                          >
                            Select & View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
