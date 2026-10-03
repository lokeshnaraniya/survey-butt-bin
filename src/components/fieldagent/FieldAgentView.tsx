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
  CheckCircle2,
  Cpu,
  MapPin,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Wrench,
} from 'lucide-react';

export const FieldAgentView: React.FC = () => {
  const {
    units,
    locations,
    tickets,
    resolveTicket,
    startSync,
    syncState,
    dismissVictory,
    hardware,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'nearby' | 'queue' | 'install'>('nearby');
  const [selectedDrainSerial, setSelectedDrainSerial] = useState<string | null>(null);
  const [installSerial, setInstallSerial] = useState('CC-BIN-06');
  const [installLocality, setInstallLocality] = useState('Talwandi Circle');
  const [installNotes, setInstallNotes] = useState('Mounted with steel bracket at 1.1m height.');
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleDrainBin = async (serial: string) => {
    setSelectedDrainSerial(serial);
    await startSync(serial, 'field_agent');
  };

  const handleInstallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstallSuccess(true);
    setTimeout(() => {
      setInstallSuccess(false);
      setActiveTab('nearby');
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full bg-blueprint-grid text-[#F2EAD6] overflow-y-auto pb-20">
      {/* Field Agent App Bar */}
      <div className="bg-[#0E1E3C] border-b border-[#7FD8E8]/40 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h2 className="font-michroma text-xs text-[#F2EAD6] uppercase tracking-wide">
              FIELD AGENT COURIER & SERVICE
            </h2>
            <span className="font-mono text-[9px] text-[#7FD8E8]">
              COURIER ID: FA-MANOJ-01 · RESCUE MODE ARMED
            </span>
          </div>
          <RubberStamp status="FIELD TESTED" size="sm" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0E1E3C]/80 border-b border-[#7FD8E8]/20 px-4">
        <div className="max-w-md mx-auto grid grid-cols-3 text-center font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('nearby')}
            className={`py-2 border-b-2 font-bold uppercase transition-colors cursor-pointer ${
              activeTab === 'nearby'
                ? 'border-[#F05A28] text-[#F05A28]'
                : 'border-transparent text-[#F2EAD6]/60 hover:text-[#F2EAD6]'
            }`}
          >
            NEARBY BLE ({units.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`py-2 border-b-2 font-bold uppercase transition-colors cursor-pointer ${
              activeTab === 'queue'
                ? 'border-[#F05A28] text-[#F05A28]'
                : 'border-transparent text-[#F2EAD6]/60 hover:text-[#F2EAD6]'
            }`}
          >
            SERVICE QUEUE ({tickets.filter((t) => t.status !== 'resolved').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`py-2 border-b-2 font-bold uppercase transition-colors cursor-pointer ${
              activeTab === 'install'
                ? 'border-[#F05A28] text-[#F05A28]'
                : 'border-transparent text-[#F2EAD6]/60 hover:text-[#F2EAD6]'
            }`}
          >
            INSTALL BIN
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full p-4 space-y-4">
        {/* ================= TAB 1: NEARBY UNITS (RESCUE DRAIN) ================= */}
        {activeTab === 'nearby' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#0E1E3C] border border-[#7FD8E8]/30 text-xs">
              <span className="font-mono text-[10px] text-[#7FD8E8] uppercase block font-semibold mb-1">
                UNIVERSAL COURIER PRINCIPLE (SECTION 9):
              </span>
              <p className="font-archivo text-[#F2EAD6]/80 text-[11px] leading-snug">
                "Any authorised phone can drain any bin. A field agent walking past another merchant's bin can sync it. The sync batch records who carried it — insurance against a merchant's phone dying."
              </p>
            </div>

            {/* In-flight Trace Path Animation */}
            {syncState.active && (
              <TracePathAnimation
                phase={syncState.phase}
                batchCount={syncState.lastBatchCount}
              />
            )}

            {/* List of nearby bins */}
            <div className="space-y-2.5">
              {units.map((u) => {
                const loc = locations.find((l) => l.id === u.location_id);
                const isSelected = selectedDrainSerial === u.serial;

                return (
                  <div
                    key={u.serial}
                    className="p-3.5 bg-[#0E1E3C]/90 border border-[#7FD8E8]/40 hover:border-[#7FD8E8] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-michroma text-xs text-[#F2EAD6]">
                            {u.serial}
                          </span>
                          <span className="font-mono text-[10px] text-[#7FD8E8]">
                            RSSI -62 dBm
                          </span>
                        </div>
                        <span className="font-archivo text-xs text-[#F2EAD6]/80 block mt-0.5">
                          {loc?.name || 'Unassigned / Warehouse'}
                        </span>
                        <span className="font-mono text-[10px] text-[#F2B33D] block mt-0.5">
                          TODAY: {u.counts.A + u.counts.B} votes · SES #{u.current_session_id}
                        </span>
                      </div>

                      <RubberStamp
                        status={u.current_status === 'Healthy' ? 'HEALTHY' : 'PENDING'}
                        size="sm"
                      />
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#7FD8E8]/20 flex items-center justify-between">
                      <span className="font-mono text-[9px] text-[#7FD8E8]/70">
                        LAST SYNC: {new Date(u.last_sync_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <button
                        type="button"
                        disabled={syncState.active}
                        onClick={() => handleDrainBin(u.serial)}
                        className="py-1.5 px-3 bg-[#F05A28] hover:bg-[#d84818] text-[#F2EAD6] font-mono text-xs font-bold uppercase transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncState.active && isSelected ? 'animate-spin' : ''}`} />
                        <span>RESCUE DRAIN</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: FIELD SERVICE QUEUE ================= */}
        {activeTab === 'queue' && (
          <div className="space-y-3">
            <h3 className="font-michroma text-xs text-[#F2EAD6] uppercase">
              ASSIGNED FIELD REPAIRS & INSPECTIONS
            </h3>

            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-3.5 bg-[#0E1E3C] border border-[#F05A28]/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#F2EAD6]">
                    TICKET #{t.id} · {t.unit_serial}
                  </span>
                  <RubberStamp status={t.status === 'resolved' ? 'FIELD TESTED' : 'PENDING'} size="sm" />
                </div>

                <div className="font-archivo text-xs text-[#F2EAD6]/90">
                  <b>Location:</b> {t.location_name}
                </div>
                <div className="font-archivo text-xs text-[#F05A28] font-bold uppercase">
                  Issue: {t.issue_type.replace('_', ' ')}
                </div>
                <p className="font-archivo text-[11px] text-[#F2EAD6]/80 italic">
                  "{t.notes}"
                </p>

                {t.status !== 'resolved' ? (
                  <button
                    type="button"
                    onClick={() => resolveTicket(t.id, 'Inspected and cleared on-site by Manoj.')}
                    className="w-full py-2 mt-1 bg-[#1F8F82] hover:bg-[#18756a] text-white font-mono text-xs font-bold uppercase cursor-pointer"
                  >
                    MARK REPAIR COMPLETE
                  </button>
                ) : (
                  <div className="p-1.5 bg-[#1F8F82]/20 text-[#1F8F82] text-center font-mono text-[10px] font-bold">
                    RESOLVED & VERIFIED ON-SITE
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 3: INSTALL & DEPLOYMENT WIZARD ================= */}
        {activeTab === 'install' && (
          <div className="bg-[#0E1E3C] border-2 border-[#7FD8E8] p-4 text-xs font-archivo space-y-3">
            <h3 className="font-michroma text-xs text-[#F2EAD6] uppercase">
              NEW UNIT DEPLOYMENT WIZARD
            </h3>
            <p className="text-[11px] text-[#F2EAD6]/80">
              Mount physical unit at merchant site, log GPS lock, and release per-device encryption secret to merchant phone.
            </p>

            {installSuccess ? (
              <div className="py-8 text-center text-[#1F8F82]">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                <h4 className="font-michroma text-sm uppercase">DEPLOYMENT REGISTERED</h4>
                <p className="font-mono text-xs text-[#7FD8E8] mt-1">
                  Unit {installSerial} bound to {installLocality}
                </p>
              </div>
            ) : (
              <form onSubmit={handleInstallSubmit} className="space-y-3">
                <div>
                  <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                    UNIT SERIAL NUMBER
                  </label>
                  <input
                    type="text"
                    value={installSerial}
                    onChange={(e) => setInstallSerial(e.target.value)}
                    className="w-full bg-[#16336E] border border-[#7FD8E8]/40 p-2 font-mono text-xs text-[#F2EAD6]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                    SHOP OUTLET / LOCALITY
                  </label>
                  <input
                    type="text"
                    value={installLocality}
                    onChange={(e) => setInstallLocality(e.target.value)}
                    className="w-full bg-[#16336E] border border-[#7FD8E8]/40 p-2 font-archivo text-xs text-[#F2EAD6]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                    INSTALLATION NOTES & BRACKET FIXING
                  </label>
                  <textarea
                    rows={2}
                    value={installNotes}
                    onChange={(e) => setInstallNotes(e.target.value)}
                    className="w-full bg-[#16336E] border border-[#7FD8E8]/40 p-2 font-archivo text-xs text-[#F2EAD6] resize-none"
                  />
                </div>

                <div className="p-2 border border-[#7FD8E8]/20 bg-[#16336E]/40 font-mono text-[10px] text-[#7FD8E8]">
                  GPS LOCK: 25.1528° N, 75.8427° E (ACCURACY: ±3M)
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#F05A28] hover:bg-[#d84818] text-[#F2EAD6] font-archivo font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  CONFIRM & ACTIVATE DEPLOYMENT
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {syncState.showVictory && (
        <Starburst
          message="BIN DRAINED BY COURIER"
          submessage={`${syncState.lastBatchCount} votes transferred into cloud.`}
          onDismiss={dismissVictory}
        />
      )}
    </div>
  );
};
