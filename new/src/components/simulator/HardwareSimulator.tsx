import React from 'react';
import { useApp } from '../../context/AppContext';
import { DimensionLine, RubberStamp } from '../common/CosmicWorkshopComponents';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import {
  Activity,
  AlertTriangle,
  Battery,
  Clock,
  Cpu,
  Layers,
  Power,
  Radio,
  RefreshCw,
  Sliders,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

export const HardwareSimulator: React.FC = () => {
  const {
    hardware,
    triggerHardwareVote,
    triggerHardwareReset,
    toggleHardwarePower,
    toggleSensorStuck,
    toggleInRange,
    isOnline,
    setIsOnline,
    simulatorOpen,
    setSimulatorOpen,
    setDeviceWifiModalOpen,
  } = useApp();

  if (!simulatorOpen) {
    return (
      <button
        type="button"
        onClick={() => setSimulatorOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center space-x-2.5 bg-[#0E1E3C] border-2 border-[#7FD8E8] text-[#7FD8E8] px-3.5 py-2 hover:bg-[#16336E] transition-all cursor-pointer shadow-2xl"
      >
        <Cpu className="w-4 h-4 text-[#F2B33D] animate-pulse" />
        <span className="font-mono text-xs font-bold tracking-wider uppercase">
          HARDWARE ESP32 LAB
        </span>
        {hardware.unacknowledgedEvents.length > 0 && (
          <span className="font-mono text-[10px] bg-[#F05A28] text-white px-1.5 py-0.2 font-bold rounded-xs">
            {hardware.unacknowledgedEvents.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#0E1E3C] border-l-2 border-[#7FD8E8] shadow-2xl flex flex-col text-[#F2EAD6] overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Simulator Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#16336E] border-b border-[#7FD8E8]/40">
        <div className="flex items-center space-x-2.5">
          <CodeCircuitLogo size={24} strokeColor="#7FD8E8" sparkColor="#F2B33D" />
          <div>
            <h3 className="font-michroma text-xs tracking-wider text-[#F2EAD6] uppercase">
              ESP32 BIN TESTBED
            </h3>
            <span className="font-mono text-[9px] text-[#7FD8E8]">
              CW-01 HARDWARE EMULATOR · {hardware.serial}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSimulatorOpen(false)}
          className="text-[#7FD8E8] hover:text-white p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Simulator Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-archivo text-xs">
        {/* Hardware Status Strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#16336E]/60 border border-[#7FD8E8]/30 p-2">
            <span className="block font-mono text-[9px] text-[#7FD8E8] uppercase">POWER</span>
            <span
              className={`font-mono text-xs font-bold ${
                hardware.isPowerOn ? 'text-[#1F8F82]' : 'text-[#F05A28]'
              }`}
            >
              {hardware.isPowerOn ? 'MAINS ACTIVE' : 'POWER DOWN'}
            </span>
          </div>
          <div className="bg-[#16336E]/60 border border-[#7FD8E8]/30 p-2">
            <span className="block font-mono text-[9px] text-[#7FD8E8] uppercase">BLE RANGE</span>
            <span
              className={`font-mono text-xs font-bold ${
                hardware.isInRange ? 'text-[#1F8F82]' : 'text-[#F05A28]'
              }`}
            >
              {hardware.isInRange ? 'IN RANGE (2M)' : 'OUT OF RANGE'}
            </span>
          </div>
          <div className="bg-[#16336E]/60 border border-[#7FD8E8]/30 p-2">
            <span className="block font-mono text-[9px] text-[#7FD8E8] uppercase">INTERNET</span>
            <span
              className={`font-mono text-xs font-bold ${
                isOnline ? 'text-[#1F8F82]' : 'text-[#F2B33D]'
              }`}
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Physical 16x2 Green Character LCD */}
        <div className="p-3 bg-[#081226] border-2 border-[#1F8F82] rounded-xs shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[9px] text-[#1F8F82] uppercase tracking-widest flex items-center gap-1">
              <Cpu className="w-3 h-3" /> 16×2 RETRO LCD (CURRENT SESSION)
            </span>
            <span className="font-mono text-[9px] text-[#F2B33D]">
              BOOT #{hardware.bootId}
            </span>
          </div>
          {/* LCD Matrix Glass */}
          <div className="bg-[#1a3826] p-2.5 font-mono text-[#43ff64] tracking-widest text-xs border border-[#43ff64]/40 leading-relaxed shadow-inner">
            <div className="flex justify-between">
              <span>HOLE A: {String(hardware.lcdCounts.A).padStart(4, '0')}</span>
              <span>SES: {String(hardware.currentSessionId).padStart(2, '0')}</span>
            </div>
            <div className="flex justify-between border-t border-[#43ff64]/20 pt-0.5 mt-0.5">
              <span>HOLE B: {String(hardware.lcdCounts.B).padStart(4, '0')}</span>
              <span>
                {hardware.isSensorStuck
                  ? '!JAMMED!'
                  : hardware.isPowerOn
                  ? 'STANDBY'
                  : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Link to Real Physical ESP32 Hardware */}
        <button
          type="button"
          onClick={() => setDeviceWifiModalOpen(true)}
          className="w-full py-2.5 px-3 bg-[#081226] border-2 border-[#F2B33D] hover:bg-[#16336E] text-[#F2B33D] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-md"
        >
          <Wifi className="w-4 h-4 animate-pulse" />
          <span>SYNC REAL ESP32 (192.168.4.1)</span>
        </button>

        {/* Physical IR Sensor Trigger Buttons */}
        <div>
          <span className="font-mono text-[10px] text-[#7FD8E8] uppercase tracking-wider block mb-2 font-semibold">
            ► TRIGGER IR SENSOR BEAM BREAK (VOTE SIMULATION)
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!hardware.isPowerOn || hardware.isSensorStuck}
              onClick={() => triggerHardwareVote('A')}
              className="py-3 px-3 bg-[#16336E] border-2 border-[#7FD8E8] hover:bg-[#1f408a] text-[#F2EAD6] font-mono font-bold text-center cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              <div className="text-sm text-[#7FD8E8]">BREAK BEAM [A]</div>
              <div className="text-[10px] text-[#F2EAD6]/70 mt-0.5 font-archivo">
                Deposit cigarette into Hole A
              </div>
            </button>
            <button
              type="button"
              disabled={!hardware.isPowerOn || hardware.isSensorStuck}
              onClick={() => triggerHardwareVote('B')}
              className="py-3 px-3 bg-[#16336E] border-2 border-[#7FD8E8] hover:bg-[#1f408a] text-[#F2EAD6] font-mono font-bold text-center cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              <div className="text-sm text-[#7FD8E8]">BREAK BEAM [B]</div>
              <div className="text-[10px] text-[#F2EAD6]/70 mt-0.5 font-archivo">
                Deposit cigarette into Hole B
              </div>
            </button>
          </div>
        </div>

        <DimensionLine label="INTERNAL ENCLOSURE CONTROLS" theme="navy" />

        {/* Internal Reset Switch (Reachable only when bin opened) */}
        <div className="p-3 bg-[#16336E]/40 border border-[#F05A28]/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono text-xs font-bold text-[#F05A28] uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> INTERNAL RESET SWITCH
              </span>
              <p className="font-archivo text-[11px] text-[#F2EAD6]/80 mt-0.5">
                Closes session, zeroes LCD, writes reset event, flags unbound session.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={!hardware.isPowerOn}
            onClick={triggerHardwareReset}
            className="w-full py-2 bg-[#F05A28] hover:bg-[#d84818] text-[#F2EAD6] font-mono font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-98 transition-colors disabled:opacity-40"
          >
            PRESS PHYSICAL RESET SWITCH
          </button>
        </div>

        {/* Environmental & Fault Injection */}
        <div>
          <span className="font-mono text-[10px] text-[#7FD8E8] uppercase tracking-wider block mb-2 font-semibold">
            ► FIELD FAULT & NETWORK INJECTION
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleHardwarePower}
              className={`py-2 px-2.5 border text-left flex items-center justify-between cursor-pointer ${
                hardware.isPowerOn
                  ? 'border-[#1F8F82] text-[#1F8F82] bg-[#1F8F82]/10'
                  : 'border-[#F05A28] text-[#F05A28] bg-[#F05A28]/10'
              }`}
            >
              <span className="font-mono text-[10px] font-bold">POWER STATE</span>
              <Power className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleSensorStuck}
              className={`py-2 px-2.5 border text-left flex items-center justify-between cursor-pointer ${
                hardware.isSensorStuck
                  ? 'border-[#F05A28] text-[#F05A28] bg-[#F05A28]/20'
                  : 'border-[#7FD8E8]/40 text-[#7FD8E8]'
              }`}
            >
              <span className="font-mono text-[10px] font-bold">
                {hardware.isSensorStuck ? 'SENSOR JAMMED' : 'SENSOR CLEAR'}
              </span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleInRange}
              className={`py-2 px-2.5 border text-left flex items-center justify-between cursor-pointer ${
                hardware.isInRange
                  ? 'border-[#1F8F82] text-[#1F8F82] bg-[#1F8F82]/10'
                  : 'border-[#F05A28] text-[#F05A28] bg-[#F05A28]/10'
              }`}
            >
              <span className="font-mono text-[10px] font-bold">
                {hardware.isInRange ? 'BLE IN RANGE' : 'BLE OUT OF RANGE'}
              </span>
              <Radio className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`py-2 px-2.5 border text-left flex items-center justify-between cursor-pointer ${
                isOnline
                  ? 'border-[#1F8F82] text-[#1F8F82] bg-[#1F8F82]/10'
                  : 'border-[#F2B33D] text-[#F2B33D] bg-[#F2B33D]/20'
              }`}
            >
              <span className="font-mono text-[10px] font-bold">
                {isOnline ? 'PHONE ONLINE' : 'PHONE OFFLINE'}
              </span>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Ring Buffer Telemetry Inspect */}
        <div className="bg-[#081226] border border-[#7FD8E8]/30 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[9px] text-[#7FD8E8] uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" /> HARDWARE FLASH RING BUFFER
            </span>
            <span className="font-mono text-[9px] text-[#F2B33D]">
              {hardware.unacknowledgedEvents.length} UNSYNCED EVENTS
            </span>
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[9px] text-[#F2EAD6]/80">
            {hardware.unacknowledgedEvents.length === 0 ? (
              <span className="text-[#7FD8E8]/60 italic block py-1">
                Ring buffer empty or all events server-acknowledged.
              </span>
            ) : (
              hardware.unacknowledgedEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-0.5 border-b border-[#7FD8E8]/10"
                >
                  <span className="text-[#F2B33D]">SEQ:{evt.sequence_number.toString().slice(-4)}</span>
                  <span className="uppercase text-[#1F8F82]">{evt.event_type}</span>
                  <span>{JSON.stringify(evt.payload)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
