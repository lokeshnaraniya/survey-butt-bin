import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getActiveMerchant,
  saveActiveMerchant,
  MerchantProfile,
  DAILY_SHIFTS,
  getTodayShiftStatuses,
  performOnlineSync,
  getMerchantSyncLogs,
  SyncLogRecord,
  SyncShift,
} from '../../services/merchantSyncService';
import {
  RubberStamp,
  Starburst,
  TracePathAnimation,
} from '../common/CosmicWorkshopComponents';
import {
  AlertCircle,
  Bluetooth,
  Camera,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  History,
  Info,
  Mic,
  PhoneCall,
  Radio,
  RefreshCw,
  Send,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
  Clock,
  Calendar,
  Check,
  Store,
  MapPin,
  Cpu,
  Power,
} from 'lucide-react';

export const MerchantView: React.FC = () => {
  const {
    selectedUnit,
    hardware,
    syncState,
    startSync,
    dismissVictory,
    isOnline,
    outboxBatches,
    syncBatches,
    resetPromptOpen,
    dismissResetPrompt,
    submitServiceTicket,
    adminConfig,
    setDeviceWifiModalOpen,
    isHardwareConnected,
    connectDeviceBluetooth,
    disconnectDevice,
    liveReading,
    connectedUnitSerial,
    setSelectedUnitSerial,
    selectedUnitSerial,
    openBluetoothModal,
    units,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'devices' | 'activity' | 'schedule' | 'help'>('devices');
  const [merchant, setMerchant] = useState<MerchantProfile>(() => getActiveMerchant());
  const [shiftStatuses, setShiftStatuses] = useState(() => getTodayShiftStatuses(merchant.assignedBinSerial));
  const [syncLogs, setSyncLogs] = useState<SyncLogRecord[]>(() => getMerchantSyncLogs());
  const [syncingNow, setSyncingNow] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Problem Modal state
  const [problemModalOpen, setProblemModalOpen] = useState(false);
  const [ticketIssue, setTicketIssue] = useState<
    'bin_full' | 'bin_damaged' | 'counter_wrong' | 'card_torn' | 'bin_moved' | 'other'
  >('bin_full');
  const [ticketNotes, setTicketNotes] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Keep merchant serial in sync with global selected unit
  useEffect(() => {
    if (merchant.assignedBinSerial !== selectedUnitSerial) {
      setSelectedUnitSerial(merchant.assignedBinSerial);
    }
  }, [merchant.assignedBinSerial]);

  // Update shift statuses whenever logs change
  const refreshShiftData = () => {
    setShiftStatuses(getTodayShiftStatuses(merchant.assignedBinSerial));
    setSyncLogs(getMerchantSyncLogs());
  };

  // Determine current active counts
  const currentCountA = liveReading && isHardwareConnected ? liveReading.countA : selectedUnit.counts.A || 45;
  const currentCountB = liveReading && isHardwareConnected ? liveReading.countB : selectedUnit.counts.B || 28;
  const totalVotes = currentCountA + currentCountB;

  // Manual or Scheduled Trigger to Upload Online
  const handlePerformSync = async (shift: SyncShift = 'manual') => {
    setSyncingNow(true);
    try {
      const result = await performOnlineSync(
        merchant.assignedBinSerial,
        currentCountA,
        currentCountB,
        shift,
        merchant.shopName
      );
      showToast(result.message);
      refreshShiftData();
    } catch (err: any) {
      showToast('Sync error: ' + (err?.message || 'Failed'));
    } finally {
      setSyncingNow(false);
    }
  };

  // 3-TIMES-A-DAY AUTO-SYNC ENGINE
  // Regularly evaluates local time (10 AM, 3 PM, 9 PM) and auto-syncs if shift is due!
  useEffect(() => {
    const checkSchedule = async () => {
      if (!merchant.autoSyncEnabled) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentStatuses = getTodayShiftStatuses(merchant.assignedBinSerial);

      // Check Morning window: 8 AM to 12 PM (target 10 AM)
      if (currentHour >= 8 && currentHour < 12 && !currentStatuses.morning.completed) {
        if (isHardwareConnected || isOnline) {
          await handlePerformSync('morning');
        }
      }
      // Check Afternoon window: 1 PM to 5 PM (target 3 PM)
      else if (currentHour >= 13 && currentHour < 17 && !currentStatuses.afternoon.completed) {
        if (isHardwareConnected || isOnline) {
          await handlePerformSync('afternoon');
        }
      }
      // Check Evening window: 7 PM to 11 PM (target 9 PM)
      else if (currentHour >= 19 && currentHour < 23 && !currentStatuses.evening.completed) {
        if (isHardwareConnected || isOnline) {
          await handlePerformSync('evening');
        }
      }
    };

    // Run check immediately, then every 30 seconds
    checkSchedule();
    const timer = setInterval(checkSchedule, 30000);
    return () => clearInterval(timer);
  }, [merchant, isHardwareConnected, isOnline, currentCountA, currentCountB]);

  // Calculate Next Shift
  const getNextShiftInfo = () => {
    const hour = new Date().getHours();
    if (hour < 10) return { label: 'Morning Shift', time: '10:00 AM' };
    if (hour < 15) return { label: 'Afternoon Shift', time: '03:00 PM' };
    if (hour < 21) return { label: 'Evening Shift', time: '09:00 PM' };
    return { label: 'Tomorrow Morning', time: '10:00 AM' };
  };

  const nextShift = getNextShiftInfo();

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitServiceTicket({
      unit_serial: merchant.assignedBinSerial,
      location_name: merchant.locality,
      merchant_name: merchant.name,
      merchant_phone: merchant.phone,
      issue_type: ticketIssue,
      notes: ticketNotes || 'Reported via Merchant Quick Help Form',
      voice_note_present: hasVoiceNote,
    });
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setProblemModalOpen(false);
      setTicketNotes('');
      setHasVoiceNote(false);
    }, 1500);
  };

  const handleVoiceRecord = () => {
    setRecordingVoice(true);
    setTimeout(() => {
      setRecordingVoice(false);
      setHasVoiceNote(true);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#070D18] text-[#F2EAD6] overflow-y-auto font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-[#10B981] text-black px-4 py-2.5 font-mono text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xl sticky top-0 z-50 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Offline Mono Strip */}
      {!isOnline && (
        <div className="bg-[#0E1E3C] border-b border-[#F2B33D]/40 px-3 py-1.5 flex items-center justify-between font-mono text-[10px] text-[#F2B33D] select-none">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>OFFLINE · LOCAL BLUETOOTH CACHE ACTIVE</span>
          </div>
          <span className="text-[#F2EAD6]/70">DATA BUFFERED IN PHONE</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 p-4 pb-20 max-w-xl mx-auto w-full flex flex-col space-y-4">
        {/* Merchant Shop Header Card */}
        <div className="bg-gradient-to-r from-[#0E1E3C] via-[#0A1424] to-[#0E1E3C] border-2 border-[#10B981]/50 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#334155] pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#10B981]/20 border border-[#10B981]/50 rounded-xl text-[#10B981]">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-white font-mono">
                    {merchant.shopName}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-mono">
                    Shopkeeper
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#F2B33D]" />
                  <span>{merchant.locality} · {merchant.name} ({merchant.phone})</span>
                </p>
              </div>
            </div>

            {/* Bin Assignment Switcher */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-[#94A3B8] text-[11px]">Assigned Bin:</span>
              <select
                value={merchant.assignedBinSerial}
                onChange={(e) => {
                  const updated = { ...merchant, assignedBinSerial: e.target.value };
                  setMerchant(updated);
                  saveActiveMerchant(updated);
                  setSelectedUnitSerial(e.target.value);
                  showToast(`Assigned bin switched to ${e.target.value}`);
                }}
                className="bg-[#070D18] border border-[#334155] rounded px-2.5 py-1 text-white font-bold outline-none cursor-pointer"
              >
                <option value="CC-BIN-01">CC-BIN-01 (Landmark City, Kunhari)</option>
                <option value="CC-BIN-02">CC-BIN-02 (Talwandi Circle)</option>
                <option value="CC-BIN-03">CC-BIN-03 (Vigyan Nagar)</option>
                <option value="CC-BIN-04">CC-BIN-04 (Rangbari Gate)</option>
                <option value="CC-BIN-05">CC-BIN-05 (Gumanpura Bazar)</option>
              </select>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('devices')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'devices'
                  ? 'bg-[#10B981] text-black shadow-md'
                  : 'bg-[#070D18] text-[#94A3B8] hover:text-white'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Live Votes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-[#3B82F6] text-white shadow-md'
                  : 'bg-[#070D18] text-[#94A3B8] hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily Sync (3x)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-[#F2B33D] text-black shadow-md'
                  : 'bg-[#070D18] text-[#94A3B8] hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Sync Logs</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BLUETOOTH CONNECTIVITY & LIVE VOTE DISPLAY */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            {/* Bluetooth Live Link Status Card */}
            <div className="bg-[#0C1628] border-2 border-[#1E293B] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#10B981]" />
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono uppercase">
                      ESP-32 Status ({merchant.assignedBinSerial})
                    </h2>
                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      Counter range: 5-10 meters
                    </span>
                  </div>
                </div>

                {isHardwareConnected ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 rounded-full font-mono text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                    <span>Connected (Live)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 rounded-full font-mono text-xs font-bold">
                    Disconnected
                  </span>
                )}
              </div>

              {/* Live Counts per Hole */}
              <div>
                <div className="flex items-center justify-between mb-2 font-mono text-xs">
                  <span className="text-[#94A3B8] uppercase font-bold">
                    Today's Live Votes:
                  </span>
                  <span className="text-white font-black text-sm">
                    Total: {totalVotes} votes
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#070D18] border-2 border-[#10B981]/40 rounded-xl p-4 text-center">
                    <span className="text-xs font-mono font-bold text-[#10B981] block">
                      HOLE A (Option A)
                    </span>
                    <span className="text-4xl font-black text-white font-mono tracking-tight my-1 block">
                      {currentCountA}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      {totalVotes > 0 ? Math.round((currentCountA / totalVotes) * 100) : 50}%
                    </span>
                  </div>

                  <div className="bg-[#070D18] border-2 border-[#3B82F6]/40 rounded-xl p-4 text-center">
                    <span className="text-xs font-mono font-bold text-[#38BDF8] block">
                      HOLE B (Option B)
                    </span>
                    <span className="text-4xl font-black text-white font-mono tracking-tight my-1 block">
                      {currentCountB}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      {totalVotes > 0 ? Math.round((currentCountB / totalVotes) * 100) : 50}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bluetooth Connection Controls */}
              <div className="space-y-2 pt-2">
                {isHardwareConnected ? (
                  <button
                    type="button"
                    onClick={disconnectDevice}
                    className="w-full py-2.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Power className="w-4 h-4" />
                    <span>Disconnect Bluetooth</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      openBluetoothModal(merchant.assignedBinSerial);
                    }}
                    className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] text-black rounded-xl font-mono text-sm font-black flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
                  >
                    <Bluetooth className="w-5 h-5 animate-pulse" />
                    <span>Connect ESP32 (Bluetooth)</span>
                  </button>
                )}

                {/* Primary Action Button: SYNC NOW */}
                <button
                  type="button"
                  disabled={syncingNow}
                  onClick={() => handlePerformSync('manual')}
                  className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl font-mono text-xs font-black flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingNow ? 'animate-spin' : ''}`} />
                  <span>{syncingNow ? 'Uploading to Server...' : '⚡ Sync Online Now'}</span>
                </button>
              </div>

              {/* Explanatory Info Card */}
              <div className="p-3 bg-[#070D18] rounded-xl border border-[#334155] font-mono text-xs text-[#94A3B8] space-y-1">
                <div className="flex items-center gap-1.5 text-[#10B981] font-bold">
                  <Check className="w-4 h-4" />
                  <span>Auto-Sync Guide</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Shopkeeper ka phone Bluetooth se bin se connected rehta hai. Din me 3 bar (10 AM, 3 PM, 9 PM) data automatic website par sync ho jata hai.
                </p>
              </div>
            </div>

            {/* Quick Report a Problem Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setProblemModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#94A3B8] hover:text-white underline cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-[#F05A28]" />
                <span>Report an Issue</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULED 3-TIMES-A-DAY AUTO SYNC */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="bg-[#0C1628] border-2 border-[#3B82F6]/50 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#38BDF8]" />
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono uppercase">
                      दिन में 3 बार ऑटो ऑनलाइन सिंक (3-Times Daily Sync)
                    </h2>
                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      बिन: {merchant.assignedBinSerial} · कोटा पायलट शेड्यूल
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-[#94A3B8] block text-[10px]">अगला निर्धारित समय:</span>
                  <span className="text-[#F2B33D] font-bold">{nextShift.label} ({nextShift.time})</span>
                </div>
              </div>

              {/* 3 Daily Shifts Cards */}
              <div className="space-y-3">
                {DAILY_SHIFTS.map((shift) => {
                  const stat = shiftStatuses[shift.key];
                  return (
                    <div
                      key={shift.key}
                      className={`p-3.5 rounded-xl border-2 transition-all flex flex-wrap items-center justify-between gap-3 ${
                        stat?.completed
                          ? 'bg-[#10B981]/10 border-[#10B981]'
                          : 'bg-[#070D18] border-[#334155]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                            stat?.completed
                              ? 'bg-[#10B981] text-black'
                              : 'bg-[#1E293B] text-[#94A3B8]'
                          }`}
                        >
                          {stat?.completed ? <Check className="w-5 h-5 stroke-[3]" /> : <Clock className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">
                              {shift.scheduledTime}
                            </span>
                            <span className="text-xs text-[#94A3B8] font-mono">
                              · {shift.labelHindi}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono mt-0.5">
                            {stat?.completed ? (
                              <span className="text-[#10B981] font-bold">
                                ✓ आज सिंक हो चुका ({stat.votes} वोट्स ऑनलाइन भेजे गए)
                              </span>
                            ) : (
                              <span className="text-[#F2B33D]">
                                ⏳ शेड्यूल एक्टिव — समय होने पर अपने आप ऑनलाइन होगा
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePerformSync(shift.key)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all active:scale-95 ${
                          stat?.completed
                            ? 'bg-[#1E293B] text-[#7FD8E8] hover:bg-[#334155]'
                            : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white'
                        }`}
                      >
                        {stat?.completed ? 'पुनः सिंक करें' : 'अभी सिंक करें'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-3 bg-[#070D18] rounded-xl border border-[#334155] flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-white font-bold block">बैकग्राउंड ऑटो-सिंक इनेबल्ड:</span>
                  <span className="text-[#94A3B8] text-[11px]">
                    दुकानदार का ऐप खुला रहने पर ऑटो-अपलोड हमेशा चालू रहेगा
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 rounded font-bold">
                  सक्रिय (ACTIVE)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYNC ACTIVITY AUDIT LOG */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="bg-[#0C1628] border-2 border-[#F2B33D]/50 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#F2B33D]" />
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono uppercase">
                      सिंक ऑडिट लॉग (ऑनलाइन डेटा इतिहास)
                    </h2>
                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      बिन {merchant.assignedBinSerial} द्वारा भेजे गए डेटा का रिकॉर्ड
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={refreshShiftData}
                  className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#334155] text-white font-mono text-xs rounded flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>रिफ्रेश</span>
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {syncLogs.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8] font-mono text-xs">
                    अभी तक कोई ऑनलाइन सिंक रिकॉर्ड नहीं है। 'अभी सिंक करें' दबाकर पहला सिंक करें!
                  </div>
                ) : (
                  syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-[#070D18] border border-[#1E293B] rounded-xl font-mono text-xs flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'success' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                          }`}>
                            {log.shift.toUpperCase()}
                          </span>
                          <span className="text-white font-bold">{log.total} कुल वोट्स</span>
                          <span className="text-[#94A3B8] text-[11px]">(A: {log.countA}, B: {log.countB})</span>
                        </div>
                        <span className="text-[10px] text-[#64748B] block mt-0.5">
                          {new Date(log.timestamp).toLocaleString()} · {log.binSerial}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#10B981] font-bold">
                        ✓ सर्वर पुष्टिकृत
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Soft Reset Confirmation Prompt */}
        {resetPromptOpen && (
          <div className="bg-[#0E1E3C] border-2 border-[#F2B33D] rounded-xl p-4 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#F2B33D] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-mono text-xs font-bold text-white uppercase">
                  QUESTION CARD SWAPPED / प्रश्न बदला गया?
                </h4>
                <p className="font-archivo text-xs text-[#94A3B8] mt-1">
                  हार्डवेयर काउंटर रीसेट हुआ है। क्या आपने बिन पर लगा पोस्टर या प्रश्न बदला है?
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => dismissResetPrompt('yes')}
                    className="py-1.5 bg-[#10B981] text-black font-bold rounded cursor-pointer"
                  >
                    हाँ, बदला
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissResetPrompt('no')}
                    className="py-1.5 bg-[#1E293B] text-white border border-[#334155] rounded cursor-pointer"
                  >
                    नहीं, केवल खाली किया
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissResetPrompt('not_sure')}
                    className="py-1.5 bg-[#070D18] text-[#94A3B8] rounded cursor-pointer"
                  >
                    पता नहीं
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report a Problem Modal */}
        {problemModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0E1E3C]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0C1628] border-2 border-[#F05A28] max-w-sm w-full p-5 text-[#F2EAD6] rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#334155] pb-2 mb-3">
                <h3 className="font-mono text-xs font-bold text-white uppercase">
                  REPORT A BIN PROBLEM (समस्या बताएं)
                </h3>
                <button
                  type="button"
                  onClick={() => setProblemModalOpen(false)}
                  className="text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {ticketSubmitted ? (
                <div className="py-8 text-center text-[#10B981]">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                  <h4 className="font-mono text-sm font-bold uppercase">TICKET LOGGED</h4>
                  <p className="font-sans text-xs text-[#94A3B8] mt-1">
                    फील्ड एजेंट को सूचना भेज दी गई है। वे जल्द दुकान पर आएंगे।
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                      समस्या का प्रकार चुनें:
                    </label>
                    <select
                      value={ticketIssue}
                      onChange={(e: any) => setTicketIssue(e.target.value)}
                      className="w-full bg-[#070D18] border border-[#334155] p-2 text-xs text-white rounded outline-none"
                    >
                      <option value="bin_full">बिन सिगरेट बट्स से भर गया है (Bin Full)</option>
                      <option value="counter_wrong">काउंटर रीडिंग गलत दिख रही है (Wrong Counter)</option>
                      <option value="bin_damaged">बिन में कोई टूट-फूट हुई है (Damaged)</option>
                      <option value="card_torn">प्रश्न पोस्टर फट गया है या गायब है (Card Torn)</option>
                      <option value="bin_moved">बिन को किसी ने हटा दिया है (Bin Moved)</option>
                      <option value="other">अन्य समस्या (Other)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                      विवरण (नोट्स):
                    </label>
                    <textarea
                      rows={2}
                      value={ticketNotes}
                      onChange={(e) => setTicketNotes(e.target.value)}
                      placeholder="समस्या का थोड़ा विवरण लिखें..."
                      className="w-full bg-[#070D18] border border-[#334155] p-2 text-xs text-white rounded resize-none outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 mt-2 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono font-bold text-xs uppercase tracking-wider rounded cursor-pointer"
                  >
                    शिकायत दर्ज करें (SUBMIT TICKET)
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
