import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DimensionLine,
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
  } = useApp();

  const [activeTab, setActiveTab] = useState<'devices' | 'activity' | 'help'>('devices');
  const [problemModalOpen, setProblemModalOpen] = useState(false);
  const [ticketIssue, setTicketIssue] = useState<
    'bin_full' | 'bin_damaged' | 'counter_wrong' | 'card_torn' | 'bin_moved' | 'other'
  >('bin_full');
  const [ticketNotes, setTicketNotes] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);

  const isInRange = hardware.isInRange;

  const handleSyncClick = () => {
    startSync();
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitServiceTicket({
      unit_serial: selectedUnit.serial,
      location_name: 'Rangbari Main Gate Shop',
      merchant_name: 'Ramesh Tiwari',
      merchant_phone: '+91 98290 11420',
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
    <div className="flex flex-col h-full bg-blueprint-grid text-[#F2EAD6] overflow-y-auto">
      {/* Offline Quiet Mono Strip (Section 14 & 23) */}
      {!isOnline && (
        <div className="bg-[#0E1E3C] border-b border-[#F2B33D]/40 px-3 py-1.5 flex items-center justify-between font-mono text-[10px] text-[#F2B33D] select-none">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              OFFLINE · {outboxBatches.length > 0 ? `${outboxBatches.length} BATCHES WAITING` : 'LOCAL CACHE READY'}
            </span>
          </div>
          <span className="text-[#F2EAD6]/70">DATA BUFFERED IN PHONE</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 p-4 pb-20 max-w-lg mx-auto w-full flex flex-col">
        {/* Soft Reset Confirmation Prompt (Section 7 & 11) */}
        {resetPromptOpen && (
          <div className="mb-4 bg-[#0E1E3C] border-2 border-[#F2B33D] p-3.5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-[#F2B33D] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-michroma text-[11px] text-[#F2EAD6] uppercase">
                  QUESTION CHANGE DETECTED?
                </h4>
                <p className="font-archivo text-xs text-[#F2EAD6]/90 mt-1 leading-snug">
                  The bin was reset at{' '}
                  <span className="font-mono text-[#F2B33D]">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  . Did you swap the paper question card?
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => dismissResetPrompt('yes')}
                    className="py-1.5 bg-[#1F8F82] hover:bg-[#18756a] text-white font-mono text-[11px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    YES, SWAPPED
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissResetPrompt('no')}
                    className="py-1.5 bg-[#16336E] border border-[#7FD8E8]/40 hover:bg-[#1a3d82] text-[#F2EAD6] font-mono text-[11px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    NO, JUST EMPTIED
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissResetPrompt('not_sure')}
                    className="py-1.5 bg-[#0E1E3C] border border-[#F2EAD6]/30 hover:bg-[#16336E] text-[#F2EAD6]/80 font-mono text-[11px] uppercase transition-colors cursor-pointer"
                  >
                    NOT SURE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Devices (Single-card operational screen on Blueprint Blue) */}
        {activeTab === 'devices' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* The Merchant Card */}
            <div className="border-2 border-[#7FD8E8] bg-[#0E1E3C]/90 p-5 shadow-2xl relative">
              {/* Corner decorative bracket ticks */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#7FD8E8]" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#7FD8E8]" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#7FD8E8]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#7FD8E8]" />

              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-[#7FD8E8]/20 pb-3">
                <div>
                  <span className="font-mono text-[10px] text-[#7FD8E8] tracking-widest uppercase block">
                    SURVEY BIN PILOT · KOTA
                  </span>
                  <h2 className="font-michroma text-base text-[#F2EAD6] uppercase tracking-wide mt-0.5">
                    {selectedUnit.serial}
                  </h2>
                  <span className="font-archivo text-xs text-[#F2EAD6]/80">
                    Shree Balaji Paan · Rangbari Main Gate
                  </span>
                </div>

                <div className="text-right">
                  <RubberStamp status={isInRange ? 'SYNCED' : 'PENDING'} size="md" />
                  <span className="block font-mono text-[9px] text-[#7FD8E8]/80 mt-1 uppercase">
                    14 MINS AGO
                  </span>
                </div>
              </div>

              {/* Large Vote Counts in Mono */}
              <div className="my-5">
                <span className="font-mono text-[10px] text-[#7FD8E8] tracking-widest uppercase block mb-1">
                  TODAY'S COUNTS PER HOLE
                </span>
                <div className="grid grid-cols-2 gap-3 bg-[#16336E]/70 p-4 border border-[#7FD8E8]/30">
                  <div className="border-r border-[#7FD8E8]/20 pr-2">
                    <span className="font-mono text-xs text-[#7FD8E8] uppercase tracking-wider block">
                      HOLE A
                    </span>
                    <span className="font-mono text-3xl font-bold text-[#F2EAD6] tracking-tight">
                      {selectedUnit.counts.A}
                    </span>
                  </div>
                  <div className="pl-2">
                    <span className="font-mono text-xs text-[#7FD8E8] uppercase tracking-wider block">
                      HOLE B
                    </span>
                    <span className="font-mono text-3xl font-bold text-[#F2EAD6] tracking-tight">
                      {selectedUnit.counts.B}
                    </span>
                  </div>
                </div>
              </div>

              {/* In-Range vs Calm Out-of-Range State */}
              <div className="py-2 px-3 border border-[#7FD8E8]/30 bg-[#16336E]/40 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isInRange ? 'bg-[#1F8F82] animate-ping' : 'bg-[#F05A28]'
                    }`}
                  />
                  <span className={isInRange ? 'text-[#1F8F82] font-bold' : 'text-[#F05A28] font-bold'}>
                    {isInRange ? 'BIN IN BLE RANGE' : 'BIN NOT IN RANGE'}
                  </span>
                </div>
                <span className="text-[#7FD8E8]/80 text-[10px]">
                  {isInRange ? 'RSSI: -58 dBm' : 'LAST SEEN 3H AGO'}
                </span>
              </div>

              {!isInRange && (
                <div className="mt-2 text-center text-[#F2EAD6]/80 text-[11px] font-archivo">
                  Walk within about ten metres of the bin and keep the app open.
                </div>
              )}

              {/* Trace Path Animation on Active Sync */}
              <TracePathAnimation
                phase={syncState.phase}
                batchCount={syncState.lastBatchCount}
              />

              {/* Primary Retro Rocket Button: SYNC NOW */}
              <button
                type="button"
                disabled={syncState.active}
                onClick={handleSyncClick}
                className="w-full mt-2 py-4 bg-[#F05A28] hover:bg-[#d84818] active:scale-98 text-[#F2EAD6] font-archivo font-bold text-base uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${syncState.active ? 'animate-spin' : ''}`} />
                <span>{syncState.active ? 'DRAINING BIN...' : 'SYNC NOW'}</span>
              </button>

              {/* Direct Connection to Real ESP32 (Bluetooth / USB / Wi-Fi) */}
              <button
                type="button"
                onClick={() => setDeviceWifiModalOpen(true)}
                className="w-full mt-2 py-3 bg-[#0E1E3C] border-2 border-[#1F8F82] hover:bg-[#16336E] text-[#1F8F82] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-md"
              >
                <Bluetooth className="w-4 h-4 animate-pulse text-[#1F8F82]" />
                <span>CONNECT REAL ESP32 (BLUETOOTH / USB / WI-FI)</span>
              </button>

              <div className="mt-2 text-center">
                <span className="font-mono text-[9px] text-[#7FD8E8]/70 uppercase">
                  OPEN APP 3 TIMES A DAY TO AUTO-SYNC
                </span>
              </div>
            </div>

            {/* Quick Report a Problem Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setProblemModalOpen(true)}
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#F2EAD6]/70 hover:text-[#F2EAD6] underline underline-offset-4 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-[#F05A28]" />
                <span>REPORT A PROBLEM WITH BIN</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Activity (Read-only list of recent syncs & daily totals) */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="bg-[#0E1E3C] border border-[#7FD8E8]/40 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-[#7FD8E8]/20 pb-2">
                <div>
                  <h3 className="font-michroma text-xs text-[#F2EAD6] uppercase">
                    RECENT SYNCS & ACTIVITY
                  </h3>
                  <span className="font-mono text-[9px] text-[#7FD8E8]">
                    UNIT: {selectedUnit.serial} · READ-ONLY PROOF
                  </span>
                </div>
                <RubberStamp status="FIELD TESTED" size="sm" />
              </div>

              <div className="space-y-2">
                {syncBatches.slice(0, 5).map((batch) => (
                  <div
                    key={batch.id}
                    className="p-2.5 bg-[#16336E]/60 border border-[#7FD8E8]/20 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#F2EAD6]">
                          BATCH #{batch.id}
                        </span>
                        <span className="font-mono text-[10px] text-[#1F8F82] font-semibold">
                          +{batch.event_count} VOTES
                        </span>
                      </div>
                      <span className="font-archivo text-[11px] text-[#F2EAD6]/70 block mt-0.5">
                        Courier: {batch.courier_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] text-[#7FD8E8]">
                        {new Date(batch.end_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="block font-mono text-[9px] text-[#1F8F82] uppercase">
                        CARRIED HOME
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Totals */}
            <div className="bg-[#0E1E3C] border border-[#7FD8E8]/40 p-4">
              <h4 className="font-michroma text-[11px] text-[#F2EAD6] uppercase mb-2">
                DAILY ACCUMULATED TOTALS
              </h4>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-[#7FD8E8]/10">
                  <span className="text-[#F2EAD6]/80">TODAY (SESSION 04)</span>
                  <span className="font-bold text-[#F2EAD6]">700 VOTES</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#7FD8E8]/10">
                  <span className="text-[#F2EAD6]/80">YESTERDAY (SESSION 03)</span>
                  <span className="font-bold text-[#F2EAD6]">845 VOTES</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#F2EAD6]/80">PILOT ACCUMULATED</span>
                  <span className="font-bold text-[#F2B33D]">6,480 VOTES</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Help (3 visual cards with pictures & WhatsApp support) */}
        {activeTab === 'help' && (
          <div className="space-y-4">
            <h3 className="font-michroma text-xs text-[#F2EAD6] uppercase">
              MERCHANT PILOT GUIDE
            </h3>

            {/* Card 1: How to sync */}
            <div className="bg-[#0E1E3C] border border-[#7FD8E8]/40 p-3.5">
              <div className="flex items-center space-x-2.5 mb-1.5">
                <Smartphone className="w-4 h-4 text-[#F2B33D]" />
                <h4 className="font-michroma text-[11px] text-[#F2EAD6] uppercase">
                  1. HOW TO SYNC
                </h4>
              </div>
              <p className="font-archivo text-xs text-[#F2EAD6]/90 leading-relaxed">
                Open this app when walking past your shop bin 3 times a day. If you are within 10 meters, it automatically syncs in seconds!
              </p>
            </div>

            {/* Card 2: How to change question card */}
            <div className="bg-[#0E1E3C] border border-[#7FD8E8]/40 p-3.5">
              <div className="flex items-center space-x-2.5 mb-1.5">
                <RefreshCw className="w-4 h-4 text-[#7FD8E8]" />
                <h4 className="font-michroma text-[11px] text-[#F2EAD6] uppercase">
                  2. CHANGING THE QUESTION CARD
                </h4>
              </div>
              <p className="font-archivo text-xs text-[#F2EAD6]/90 leading-relaxed">
                Slide the paper card out from the top slot each morning. Slide in the new day's card, open the bin door, and tap the red internal reset switch once.
              </p>
            </div>

            {/* Card 3: How to empty bin */}
            <div className="bg-[#0E1E3C] border border-[#7FD8E8]/40 p-3.5">
              <div className="flex items-center space-x-2.5 mb-1.5">
                <Trash2 className="w-4 h-4 text-[#1F8F82]" />
                <h4 className="font-michroma text-[11px] text-[#F2EAD6] uppercase">
                  3. EMPTYING THE BIN
                </h4>
              </div>
              <p className="font-archivo text-xs text-[#F2EAD6]/90 leading-relaxed">
                Open the side latch with the key. Remove the inner liner bag, tie it securely, replace with fresh bag, and click the door shut.
              </p>
            </div>

            {/* WhatsApp Support Action */}
            <div className="pt-2">
              <a
                href="https://wa.me/919829011420?text=Code%20and%20Circuit%20Survey%20Bin%20Support"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-[#1F8F82] hover:bg-[#18756a] text-white font-archivo font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>CHAT WITH C&C PILOT SUPPORT (WHATSAPP)</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Merchant Bottom Navigation on Hangar Navy (Section 5 & 8) */}
      <div className="fixed bottom-0 inset-x-0 bg-[#0E1E3C] border-t border-[#7FD8E8]/30 max-w-lg mx-auto z-30">
        <div className="grid grid-cols-3 text-center py-2">
          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer transition-colors ${
              activeTab === 'devices' ? 'text-[#F05A28]' : 'text-[#F2EAD6]/60 hover:text-[#F2EAD6]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase mt-1 font-semibold">DEVICES</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer transition-colors ${
              activeTab === 'activity' ? 'text-[#F05A28]' : 'text-[#F2EAD6]/60 hover:text-[#F2EAD6]'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase mt-1 font-semibold">ACTIVITY</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer transition-colors ${
              activeTab === 'help' ? 'text-[#F05A28]' : 'text-[#F2EAD6]/60 hover:text-[#F2EAD6]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase mt-1 font-semibold">HELP</span>
          </button>
        </div>
      </div>

      {/* Report a Problem Modal (Section 7) */}
      {problemModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1E3C]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#16336E] border-2 border-[#F05A28] max-w-sm w-full p-5 text-[#F2EAD6]">
            <div className="flex items-center justify-between border-b border-[#7FD8E8]/20 pb-2 mb-3">
              <h3 className="font-michroma text-xs text-[#F2EAD6] uppercase">
                REPORT A BIN PROBLEM
              </h3>
              <button
                type="button"
                onClick={() => setProblemModalOpen(false)}
                className="text-[#7FD8E8] text-sm hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {ticketSubmitted ? (
              <div className="py-8 text-center text-[#1F8F82]">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                <h4 className="font-michroma text-sm uppercase">TICKET LOGGED</h4>
                <p className="font-archivo text-xs text-[#F2EAD6]/80 mt-1">
                  Field agent notified. We will visit your shop shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-3 font-archivo text-xs">
                <div>
                  <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                    WHAT IS HAPPENING?
                  </label>
                  <select
                    value={ticketIssue}
                    onChange={(e: any) => setTicketIssue(e.target.value)}
                    className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/40 p-2 text-xs text-[#F2EAD6]"
                  >
                    <option value="bin_full">Bin is full of waste</option>
                    <option value="counter_wrong">Counter looks wrong or stuck</option>
                    <option value="bin_damaged">Physical bin damaged</option>
                    <option value="card_torn">Question card missing or torn</option>
                    <option value="bin_moved">Bin was moved / repositioned</option>
                    <option value="other">Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                    NOTES (OPTIONAL)
                  </label>
                  <textarea
                    rows={2}
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                    placeholder="Describe what you see..."
                    className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/40 p-2 text-xs text-[#F2EAD6] resize-none"
                  />
                </div>

                {/* Photo & Voice note simulation */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => alert('Photo snapshot attached to ticket.')}
                    className="py-2 px-2 border border-[#7FD8E8]/40 bg-[#0E1E3C] hover:bg-[#16336E] text-[#7FD8E8] font-mono text-[10px] flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>PHOTO ATTACH</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleVoiceRecord}
                    className={`py-2 px-2 border font-mono text-[10px] flex items-center justify-center space-x-1 cursor-pointer ${
                      hasVoiceNote
                        ? 'border-[#1F8F82] text-[#1F8F82] bg-[#1F8F82]/20'
                        : recordingVoice
                        ? 'border-[#F05A28] text-[#F05A28] animate-pulse'
                        : 'border-[#7FD8E8]/40 bg-[#0E1E3C] text-[#7FD8E8]'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{hasVoiceNote ? 'VOICE RECORDED' : recordingVoice ? 'RECORDING...' : 'VOICE NOTE'}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-[#F05A28] hover:bg-[#d84818] text-[#F2EAD6] font-archivo font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  DISPATCH SERVICE TICKET
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Victory Starburst Dialog on Successful Sync */}
      {syncState.showVictory && (
        <Starburst
          message="BIN SYNCED"
          submessage={`${syncState.lastBatchCount || 412} votes carried home.`}
          onDismiss={dismissVictory}
        />
      )}
    </div>
  );
};
