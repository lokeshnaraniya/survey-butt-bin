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
  Save,
  Usb,
  X,
} from 'lucide-react';

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
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptionA, setNewOptionA] = useState('हाँ / Yes');
  const [newOptionB, setNewOptionB] = useState('नहीं / No');

  const [saving, setSaving] = useState(false);
  const [unconfirmedPayload, setUnconfirmedPayload] = useState<SaveSurveyPayload | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const saveInProgressRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMs = liveReading
    ? Math.max(0, currentTime - new Date(liveReading.receivedAt).getTime())
    : Infinity;
  const isDataFresh = !!liveReading && (isHardwareConnected || activeHardwareMethod !== 'none' || elapsedMs < 20000);

  const currentQ = questions.find((q) => q.id === selectedQuestionId);
  const effectiveQuestionText =
    questionMode === 'existing' ? currentQ?.text || '' : newQuestionText;
  const effectiveOptionA =
    questionMode === 'existing'
      ? currentQ?.options.find((o) => o.hole_id === 'A')?.label || ''
      : newOptionA;
  const effectiveOptionB =
    questionMode === 'existing'
      ? currentQ?.options.find((o) => o.hole_id === 'B')?.label || ''
      : newOptionB;

  const canSave =
    isDataFresh &&
    !!effectiveQuestionText.trim() &&
    !!effectiveOptionA.trim() &&
    !!effectiveOptionB.trim() &&
    ['bluetooth', 'serial', 'wifi'].includes(activeHardwareMethod);

  const selectStyle =
    'w-full bg-[#0E1E3C] border border-[#7FD8E8]/35 px-3 py-2 text-xs text-[#F2EAD6] focus:border-[#F2B33D] outline-none disabled:opacity-60 font-archivo';

  const handleConnect = async (method: 'bluetooth' | 'serial') => {
    setConnecting(true);
    setSaveError(null);
    try {
      if (method === 'bluetooth') {
        await connectDeviceBluetooth();
      } else {
        await connectDeviceSerial();
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveInProgressRef.current || (!unconfirmedPayload && (!canSave || !liveReading))) {
      return;
    }

    const payload: SaveSurveyPayload =
      unconfirmedPayload || {
        id: crypto.randomUUID(),
        unitSerial: liveReading!.unitSerial,
        deviceName: liveReading!.deviceName,
        questionText: effectiveQuestionText.trim(),
        optionA: effectiveOptionA.trim(),
        optionB: effectiveOptionB.trim(),
        countA: liveReading!.countA,
        countB: liveReading!.countB,
        connectionMethod: activeHardwareMethod,
        capturedAt: liveReading!.receivedAt,
      };

    saveInProgressRef.current = true;
    setUnconfirmedPayload(payload);
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await saveSurveySnapshot(payload);
      addSavedQuestion(res.question);
      if (questionMode === 'existing') {
        setSelectedQuestionId(res.question.id);
      }
      setSaveSuccess(
        `Saved record #${res.record.sequence} · A: ${res.record.countA}, B: ${res.record.countB}. All previous saves are retained.`
      );
      setUnconfirmedPayload(null);
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
                : isHardwareConnected
                ? liveReading
                  ? 'text-[#F2B33D] border-[#F2B33D]/40 bg-[#F2B33D]/10'
                  : 'text-[#F2B33D] border-[#F2B33D]/40'
                : 'text-[#F2EAD6]/50 border-[#F2EAD6]/20'
            }`}
          >
            {isDataFresh
              ? activeHardwareMethod === 'bluetooth'
                ? '⚡ LIVE · BLUETOOTH'
                : activeHardwareMethod === 'serial'
                ? '⚡ LIVE · USB'
                : activeHardwareMethod === 'wifi'
                ? '⚡ LIVE · WI-FI CLOUD'
                : '⚡ LIVE DEVICE DATA'
              : isHardwareConnected
              ? 'CONNECTED · WAITING FOR READING'
              : 'OFFLINE / NOT CONNECTED'}
          </span>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: Device Controls & Live Reading */}
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
              {isHardwareConnected ? (
                <button
                  type="button"
                  onClick={disconnectDevice}
                  className="flex items-center gap-2 border border-[#7FD8E8]/40 px-3 py-2 hover:bg-[#16336E] text-white cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleConnect('bluetooth')}
                    disabled={connecting}
                    className="flex items-center gap-2 bg-[#F05A28] hover:bg-[#d84818] active:scale-98 px-3.5 py-2 text-white font-bold disabled:opacity-50 cursor-pointer shadow-md transition-all"
                  >
                    <Bluetooth className="w-4 h-4" />
                    <span>{connecting ? 'Connecting…' : 'Connect Bluetooth'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConnect('serial')}
                    disabled={connecting}
                    className="flex items-center gap-2 border border-[#7FD8E8]/40 hover:bg-[#16336E] px-3.5 py-2 text-[#7FD8E8] hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    <Usb className="w-4 h-4" />
                    <span>USB Cable</span>
                  </button>
                </>
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
                    <b>Bluetooth connect nahi ho raha?</b> AI Studio preview iframe me browser Bluetooth ko block karta hai. Naye Chrome tab me direct chalane ke liye:
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

            {/* Live Counts Big Display */}
            <div className={`grid grid-cols-2 gap-3 ${isDataFresh ? '' : 'opacity-60'}`}>
              <div className="border border-[#7FD8E8]/25 bg-[#0E1E3C] p-3 text-center">
                <span className="font-mono text-[10px] text-[#7FD8E8] uppercase tracking-wider block font-bold">
                  HOLE A
                </span>
                <div className="font-mono text-3xl tabular-nums font-bold text-[#1F8F82] my-1">
                  {liveReading?.countA ?? '—'}
                </div>
                <div className="text-xs break-words text-[#F2EAD6]/70 truncate font-archivo">
                  {effectiveOptionA || 'Select question'}
                </div>
              </div>

              <div className="border border-[#7FD8E8]/25 bg-[#0E1E3C] p-3 text-center">
                <span className="font-mono text-[10px] text-[#7FD8E8] uppercase tracking-wider block font-bold">
                  HOLE B
                </span>
                <div className="font-mono text-3xl tabular-nums font-bold text-[#F05A28] my-1">
                  {liveReading?.countB ?? '—'}
                </div>
                <div className="text-xs break-words text-[#F2EAD6]/70 truncate font-archivo">
                  {effectiveOptionB || 'Select question'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 my-1 font-mono text-[10px]">
              <button
                type="button"
                onClick={async () => {
                  const nextA = (liveReading?.countA ?? 0) + 1;
                  const b = liveReading?.countB ?? 0;
                  await fetch(`/api/bin/sync?a=${nextA}&b=${b}`);
                }}
                className="py-1 px-2 bg-[#1F8F82]/20 hover:bg-[#1F8F82] text-[#1F8F82] hover:text-white border border-[#1F8F82]/50 uppercase cursor-pointer font-bold transition-all text-center"
              >
                +1 Test Vote A
              </button>
              <button
                type="button"
                onClick={async () => {
                  const a = liveReading?.countA ?? 0;
                  const nextB = (liveReading?.countB ?? 0) + 1;
                  await fetch(`/api/bin/sync?a=${a}&b=${nextB}`);
                }}
                className="py-1 px-2 bg-[#F05A28]/20 hover:bg-[#F05A28] text-[#F05A28] hover:text-white border border-[#F05A28]/50 uppercase cursor-pointer font-bold transition-all text-center"
              >
                +1 Test Vote B
              </button>
            </div>

            <div className="font-mono text-xs flex justify-between gap-2 text-[#F2EAD6]/80 pt-1">
              <span>TOTAL: <b>{liveReading?.total ?? '—'}</b></span>
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/bin/reset');
                }}
                className="text-[10px] text-[#F05A28] hover:underline cursor-pointer"
                title="Reset Cloud Counts to 0"
              >
                Reset to 0
              </button>
              <span className="text-[#7FD8E8]">
                {liveReading
                  ? `${Math.floor(elapsedMs / 1000)}s since reading`
                  : 'Awaiting sensor beam'}
              </span>
            </div>

            {liveReading && (
              <p className="font-mono text-[10px] text-[#F2EAD6]/60">
                {liveReading.deviceName} → {connectedUnitSerial || liveReading.unitSerial} ·{' '}
                {new Date(liveReading.receivedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Right: Question Binding & Save to Database Form */}
          <form
            onSubmit={handleSave}
            className="p-4 space-y-3 border-t lg:border-t-0 border-[#7FD8E8]/25 bg-[#0E1E3C]/40"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-[#7FD8E8] font-bold uppercase">
              <Database className="w-4 h-4 text-[#1F8F82]" />
              <span>QUESTION-WISE SAVE / CLOUD HISTORY</span>
            </div>

            <div
              className="flex gap-2 text-xs font-mono"
              role="group"
              aria-label="Question entry mode"
            >
              <button
                type="button"
                disabled={!!unconfirmedPayload}
                onClick={() => setQuestionMode('existing')}
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
                onClick={() => setQuestionMode('new')}
                aria-pressed={questionMode === 'new'}
                className={`px-3 py-1.5 border font-semibold uppercase cursor-pointer transition-colors ${
                  questionMode === 'new'
                    ? 'border-[#F2B33D] text-[#F2B33D] bg-[#F2B33D]/10'
                    : 'border-[#7FD8E8]/25 text-[#F2EAD6]/70'
                } disabled:opacity-60`}
              >
                Write question
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
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  disabled={!!unconfirmedPayload}
                  className={`${selectStyle} mt-1`}
                >
                  <option value="">Choose the question on your bin…</option>
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.text}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="block text-xs font-archivo">
                  <span className="font-mono text-[10px] text-[#7FD8E8] uppercase block mb-1">
                    QUESTION / सवाल
                  </span>
                  <textarea
                    required
                    maxLength={1000}
                    rows={2}
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    disabled={!!unconfirmedPayload}
                    placeholder="इस bin पर कौन सा सवाल पूछा गया है?"
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
              <p className="text-xs text-[#F2EAD6]/80 break-words italic">
                "{currentQ.text}"
              </p>
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
              Each save stores a separate immutable snapshot with its question, option labels, counts, and timestamp. Saving does not reset the ESP32 or delete previous history.
            </p>

            {unconfirmedPayload && !saving && (
              <div className="border border-[#F2B33D]/40 p-2 text-xs text-[#F2B33D] font-mono">
                Unconfirmed save: A {unconfirmedPayload.countA}, B {unconfirmedPayload.countB}. Retry sends this exact reading without duplicating it.
              </div>
            )}

            {saveError && (
              <p role="alert" className="text-xs text-[#F05A28] font-mono font-bold">
                {saveError}
              </p>
            )}

            {saveSuccess && (
              <p role="status" className="flex items-center gap-2 text-xs text-[#7FD8E8] font-mono font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#1F8F82] shrink-0" />
                <span>{saveSuccess}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={saving || (!unconfirmedPayload && !canSave)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#F05A28] hover:bg-[#d84818] active:scale-98 text-white font-mono text-xs font-bold uppercase transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? 'SAVING TO DATABASE…'
                  : unconfirmedPayload
                  ? 'RETRY SAME SAVE'
                  : 'SAVE READING WITH QUESTION'}
              </span>
            </button>

            {!canSave && !unconfirmedPayload && (
              <p className="text-[11px] text-[#F2B33D] font-mono">
                {isDataFresh
                  ? 'Select or write a question and both option labels to enable save.'
                  : 'Connect your ESP32 and wait for a live reading.'}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
