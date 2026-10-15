import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getAllMerchants,
  MerchantProfile,
  fetchMerchantsFromServer,
  performOnlineSync,
} from '../../services/merchantSyncService';
import { getActiveStaffSession } from '../../services/staffService';
import {
  Radio,
  RefreshCw,
  Phone,
  Store,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Bluetooth,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  User,
  Wrench,
  Search,
  Battery,
  Signal,
  Cpu,
} from 'lucide-react';

export const FieldAgentView: React.FC = () => {
  const {
    units,
    locations,
    tickets,
    resolveTicket,
    startSync,
    syncState,
    isHardwareConnected,
    liveReading,
    connectDeviceBluetooth,
    openBluetoothModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bins' | 'shopkeepers' | 'hardware'>('bins');
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<MerchantProfile[]>(() => getAllMerchants());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [syncingSerial, setSyncingSerial] = useState<string | null>(null);

  const activeStaff = getActiveStaffSession();

  useEffect(() => {
    fetchMerchantsFromServer().then((data) => {
      if (data && data.length > 0) setMerchants(data);
    });
  }, []);

  const handleSyncBin = async (serial: string) => {
    setSyncingSerial(serial);
    setSelectedSerial(serial);
    try {
      const u = units.find((x) => x.serial === serial);
      const countA = u?.counts.A || 40;
      const countB = u?.counts.B || 25;
      await performOnlineSync(serial, countA, countB, 'manual', 'Staff Manual Sync');
      await startSync(serial, 'field_agent');
      setSyncFeedback(`✓ ${serial} sync ho gaya! Data cloud me save ho gaya.`);
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch {
      setSyncFeedback(`Sync failed for ${serial}`);
      setTimeout(() => setSyncFeedback(null), 3500);
    } finally {
      setSyncingSerial(null);
    }
  };

  const handleCopyCredentials = (m: MerchantProfile) => {
    const text = `Code & Circuit - Shopkeeper Login Details:\nWebsite: ${window.location.origin}\nUser ID (Mobile): ${m.phone}\nPassword: ${m.password || '1234'}\nAssigned Smart Bin: ${m.assignedBinSerial}\nShop: ${m.shopName}`;
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredShopkeepers = merchants.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.assignedBinSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.locality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#070D18] text-[#F2EAD6] overflow-y-auto pb-16 font-sans">
      {/* Clean, Streamlined Staff App Bar */}
      <div className="bg-[#0C1628] border-b border-[#1E293B] px-4 py-3 sticky top-0 z-20 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1F8F82]/20 border border-[#1F8F82]/50 text-[#1F8F82] rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-white font-mono uppercase tracking-wide">
                  Staff Field Operations
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F8F82]/20 text-[#1F8F82] border border-[#1F8F82]/30 font-mono">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                Staff: <b className="text-white">{activeStaff?.name || 'Manoj Kumar (Field Agent)'}</b> · Mobile: {activeStaff?.mobile || '9829011420'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openBluetoothModal()}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                isHardwareConnected
                  ? 'bg-[#10B981] text-black'
                  : 'bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] border border-[#38BDF8]/40'
              }`}
            >
              <Bluetooth className={`w-3.5 h-3.5 ${isHardwareConnected ? '' : 'animate-pulse'}`} />
              <span>{isHardwareConnected ? 'ESP32 Connected' : 'Scan BLE Bin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className="bg-[#10B981] text-black px-4 py-2 font-mono text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg sticky top-[57px] z-30 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Clean, Spacious Navigation Tabs */}
      <div className="bg-[#0C1628]/80 border-b border-[#1E293B] px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bins')}
            className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'bins'
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Smart Bins ({units.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shopkeepers')}
            className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'shopkeepers'
                ? 'border-[#F2B33D] text-[#F2B33D]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shopkeeper Contacts ({merchants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hardware')}
            className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'hardware'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Hardware Service</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-4">
        {/* ================= TAB 1: SMART BINS & LIVE SYNC ================= */}
        {activeTab === 'bins' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div>
                <h2 className="text-base font-bold text-white font-mono">
                  Kota Smart Bins Fleet Status
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Sabhi smart bins ke live vote counts dekhein aur field me on-site sync karein.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block animate-pulse" />
                <span>5 Bins Active in Kota</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {units.map((u) => {
                const loc = locations.find((l) => l.id === u.location_id);
                const assignedMerchant = merchants.find(
                  (m) => m.assignedBinSerial.toLowerCase() === u.serial.toLowerCase()
                );
                const totalVotes = u.counts.A + u.counts.B;
                const isSyncing = syncingSerial === u.serial;

                return (
                  <div
                    key={u.serial}
                    className="bg-[#0C1628] border border-[#1E293B] hover:border-[#38BDF8]/60 rounded-2xl p-4 shadow-lg transition-all space-y-3"
                  >
                    {/* Top Row: Serial & Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#1E293B] pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white text-sm">
                            {u.serial}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-mono">
                            HEALTHY
                          </span>
                        </div>
                        <div className="text-xs text-[#94A3B8] font-sans mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#F2B33D] shrink-0" />
                          <span>{loc?.name || assignedMerchant?.locality || 'Kota Landmark'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#94A3B8]">
                        <span className="flex items-center gap-1 text-[#10B981]">
                          <Battery className="w-3.5 h-3.5" /> 88%
                        </span>
                        <span className="flex items-center gap-1 text-[#38BDF8]">
                          <Signal className="w-3.5 h-3.5" /> -62dBm
                        </span>
                      </div>
                    </div>

                    {/* Assigned Shopkeeper Info */}
                    <div className="p-2.5 bg-[#070D18] rounded-xl border border-[#1E293B] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#F2B33D] shrink-0" />
                        <div>
                          <span className="text-white font-bold block text-[11px]">
                            {assignedMerchant?.shopName || 'Assigned Stall'}
                          </span>
                          <span className="text-[10px] text-[#94A3B8]">
                            Dukandar: {assignedMerchant?.name || 'Local Partner'}
                          </span>
                        </div>
                      </div>
                      {assignedMerchant?.phone && (
                        <a
                          href={`tel:${assignedMerchant.phone}`}
                          className="px-2 py-1 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] rounded-lg font-mono text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>

                    {/* Live Vote Counts Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-[#94A3B8]">Today's Votes:</span>
                        <span className="text-[#F2B33D] font-bold">{totalVotes} Total Votes</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                        <div className="bg-[#1E293B]/60 p-2 rounded-lg border border-[#334155]">
                          <span className="text-[10px] text-[#38BDF8] block">OPTION A (LEFT)</span>
                          <span className="text-sm font-bold text-white">{u.counts.A}</span>
                        </div>
                        <div className="bg-[#1E293B]/60 p-2 rounded-lg border border-[#334155]">
                          <span className="text-[10px] text-[#F05A28] block">OPTION B (RIGHT)</span>
                          <span className="text-sm font-bold text-white">{u.counts.B}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1 flex items-center gap-2 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => openBluetoothModal()}
                        className="flex-1 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-[#334155]"
                      >
                        <Bluetooth className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Connect BLE</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => handleSyncBin(u.serial)}
                        className="flex-1 py-2 bg-[#10B981] hover:bg-[#059669] text-black font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SHOPKEEPER DIRECTORY & PASSWORDS ================= */}
        {activeTab === 'shopkeepers' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
              <div>
                <h2 className="text-base font-bold text-white font-mono">
                  Shopkeeper Directory & Login Passwords
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Sabhi dukandaron ke phone number, assigned bin aur unka login password yahan dekhein.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[#334155]"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#F2B33D]" />}
                <span>{showPasswords ? 'Hide Passwords' : 'Show Login Passwords'}</span>
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search shopkeeper by name, shop, phone or bin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0C1628] border border-[#334155] rounded-xl pl-9 pr-4 py-2.5 text-white font-mono text-xs outline-none focus:border-[#F2B33D]"
              />
            </div>

            {/* Shopkeeper Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShopkeepers.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#0C1628] border border-[#1E293B] hover:border-[#F2B33D]/60 rounded-2xl p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#1E293B] pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#F2B33D] font-bold">
                        <Store className="w-3.5 h-3.5" />
                        <span>{m.shopName}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {m.name}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-mono text-xs font-bold">
                        <Radio className="w-3 h-3" />
                        <span>{m.assignedBinSerial}</span>
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="text-xs text-[#94A3B8] flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#F2B33D] shrink-0 mt-0.5" />
                    <span>{m.locality}</span>
                  </div>

                  {/* Login Credentials Box */}
                  <div className="p-3 bg-[#070D18] rounded-xl border border-[#334155]/60 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-[#94A3B8] text-[11px]">
                      <span>Shopkeeper Login ID:</span>
                      <span className="text-white font-bold">{m.phone}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#94A3B8] flex items-center gap-1">
                        <Key className="w-3 h-3 text-[#F2B33D]" />
                        <span>Login Password:</span>
                      </span>
                      <span className="font-bold text-[#F2B33D]">
                        {showPasswords ? m.password || '1234' : '••••••••'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Call & Copy Credentials */}
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <a
                      href={`tel:${m.phone}`}
                      className="flex-1 py-2 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors border border-[#10B981]/30"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call ({m.phone})</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(m)}
                      className="px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-[#334155]"
                      title="Copy login details to send to shopkeeper via WhatsApp or SMS"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="text-[#10B981]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>Copy Login Info</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: HARDWARE SERVICE & REPAIRS ================= */}
        {activeTab === 'hardware' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#0C1628] border border-[#1E293B] rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Bluetooth className="w-4 h-4 text-[#38BDF8]" />
                <span>On-Site Physical ESP32 Hardware Diagnostics</span>
              </div>
              <p className="text-[#94A3B8] font-sans text-xs">
                Agar aap dukan par physical SmartBin ke paas khade hain, to direct Bluetooth ya Wi-Fi se connect karke counter test karein.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openBluetoothModal()}
                  className="p-3 bg-[#1E293B] hover:bg-[#334155] rounded-xl border border-[#38BDF8]/40 text-left flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-white font-bold block">1. Bluetooth Web Scan</span>
                    <span className="text-[10px] text-[#94A3B8]">Nearby ESP32 SmartBins search karein</span>
                  </div>
                  <Bluetooth className="w-5 h-5 text-[#38BDF8]" />
                </button>

                <div className="p-3 bg-[#070D18] rounded-xl border border-[#334155] flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold block">2. Hotspot IP Direct</span>
                    <span className="text-[10px] text-[#94A3B8]">http://192.168.4.1/readings</span>
                  </div>
                  <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded font-bold">
                    READY
                  </span>
                </div>
              </div>
            </div>

            {/* Field Tickets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">
                  Active Service Tickets ({tickets.length})
                </h3>
                <span className="text-[#94A3B8] text-[11px]">Reported by shopkeepers</span>
              </div>

              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-[#0C1628] border border-[#334155] rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">
                      {t.unit_serial} · {t.location_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'resolved'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                          : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                      }`}
                    >
                      {t.status === 'resolved' ? 'RESOLVED' : 'PENDING ACTION'}
                    </span>
                  </div>

                  <p className="text-[#94A3B8] font-sans text-xs">
                    Issue: <b className="text-white">{t.issue_type.replace('_', ' ')}</b> — "{t.notes}"
                  </p>

                  {t.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => resolveTicket(t.id, 'Inspected and verified on-site by field staff.')}
                      className="w-full py-2 bg-[#1F8F82] hover:bg-[#18756a] text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      ✓ Mark Ticket Resolved (समस्या ठीक हो गई)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
