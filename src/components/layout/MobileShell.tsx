import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import { MerchantView } from '../merchant/MerchantView';
import { AdminDashboard } from '../admin/AdminDashboard';
import { FieldAgentView } from '../fieldagent/FieldAgentView';
import { EducationView } from '../education/EducationView';
import { HardwareSimulator } from '../simulator/HardwareSimulator';
import { FirstLaunchModal } from '../auth/FirstLaunchModal';
import { AdminLoginModal } from '../auth/AdminLoginModal';
import { DeviceWifiSyncModal } from '../device/DeviceWifiSyncModal';
import { LiveSurveyPanel } from '../device/LiveSurveyPanel';
import {
  Bluetooth,
  BookOpen,
  Cpu,
  Layers,
  LogOut,
  Monitor,
  Phone,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Store,
  Terminal,
  Wifi,
  WifiOff,
  Wrench,
} from 'lucide-react';
import { Role } from '../../types';

export const MobileShell: React.FC = () => {
  const {
    role,
    setRole,
    isMobileFrame,
    setIsMobileFrame,
    isOnline,
    setIsOnline,
    hardware,
    setSimulatorOpen,
    isAdminAuthenticated,
    adminLogout,
    setAdminAuthModalOpen,
    deviceWifiModalOpen,
    setDeviceWifiModalOpen,
  } = useApp();

  const [firstLaunchOpen, setFirstLaunchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0E1E3C] flex flex-col font-archivo text-[#F2EAD6] select-none">
      {/* Global Mission Control Header */}
      <header className="bg-[#081226] border-b border-[#7FD8E8]/30 px-3 py-2 shrink-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Brand Mark & Title (Clicking logo 3 times or prompt allows discreet staff entry) */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => {
                if (!isAdminAuthenticated) {
                  setAdminAuthModalOpen(true);
                } else {
                  setRole('admin');
                }
              }}
              className="flex items-center space-x-2 cursor-pointer group"
              title="Staff Terminal: Click for Admin Authentication"
            >
              <CodeCircuitLogo size={28} strokeColor="#F2EAD6" sparkColor="#7FD8E8" />
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="font-michroma text-xs tracking-wider text-[#F2EAD6] group-hover:text-[#7FD8E8] transition-colors">
                    CODE & CIRCUIT
                  </span>
                  <span className="font-mono text-[9px] bg-[#16336E] text-[#7FD8E8] px-1 py-0.2 border border-[#7FD8E8]/30">
                    CW-01
                  </span>
                </div>
                <span className="font-mono text-[9px] text-[#7FD8E8]/70 block">
                  SURVEY BIN TELEMETRY
                </span>
              </div>
            </button>
          </div>

          {/* Role Switcher (Admin button is HIDDEN when not authenticated) */}
          <div className="flex items-center bg-[#0E1E3C] border border-[#7FD8E8]/40 p-0.5 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setRole('merchant')}
              className={`px-2.5 py-1 flex items-center space-x-1 transition-all cursor-pointer ${
                role === 'merchant'
                  ? 'bg-[#F05A28] text-white font-bold'
                  : 'text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>MERCHANT</span>
            </button>

            {/* Admin button ONLY shown when authenticated */}
            {isAdminAuthenticated && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`px-2.5 py-1 flex items-center space-x-1 transition-all cursor-pointer ${
                    role === 'admin' || role === 'super_admin'
                      ? 'bg-[#16336E] text-[#7FD8E8] border border-[#7FD8E8]/50 font-bold'
                      : 'text-[#7FD8E8] hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-[#1F8F82]" />
                  <span>ADMIN ACTIVE</span>
                </button>
                <button
                  type="button"
                  onClick={adminLogout}
                  title="Log out of Admin"
                  className="px-1.5 py-1 text-[#F05A28] hover:bg-[#F05A28]/20 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setRole('field_agent')}
              className={`px-2.5 py-1 flex items-center space-x-1 transition-all cursor-pointer ${
                role === 'field_agent'
                  ? 'bg-[#1F8F82] text-white font-bold'
                  : 'text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>FIELD AGENT</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('student')}
              className={`px-2.5 py-1 flex items-center space-x-1 transition-all cursor-pointer ${
                role === 'student'
                  ? 'bg-[#F2B33D] text-[#0E1E3C] font-bold'
                  : 'text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>ROBOTICS</span>
            </button>
          </div>

          {/* Quick Diagnostics, Wi-Fi Hardware Sync & Viewport Controls */}
          <div className="flex items-center space-x-2">
            {/* Real ESP32 Direct Hardware Connect Button */}
            <button
              type="button"
              onClick={() => setDeviceWifiModalOpen(true)}
              className="px-2.5 py-1 bg-[#0E1E3C] border-2 border-[#1F8F82] hover:bg-[#16336E] text-[#1F8F82] text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer shadow-md"
              title="Connect directly to physical ESP32 SmartBin (Bluetooth / USB / Wi-Fi)"
            >
              <Bluetooth className="w-3.5 h-3.5 animate-pulse text-[#1F8F82]" />
              <span>CONNECT ESP32</span>
            </button>

            {/* Online / Offline switch */}
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              title={isOnline ? 'Online (Click to toggle offline mode)' : 'Offline (Click to restore online)'}
              className={`px-2 py-1 border text-[10px] font-mono flex items-center space-x-1 cursor-pointer ${
                isOnline
                  ? 'border-[#1F8F82]/50 text-[#1F8F82] bg-[#1F8F82]/10'
                  : 'border-[#F2B33D]/60 text-[#F2B33D] bg-[#F2B33D]/10'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            {/* Mobile Frame vs Desktop Toggle */}
            <div className="hidden sm:flex items-center bg-[#0E1E3C] border border-[#7FD8E8]/30 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setIsMobileFrame(true)}
                className={`p-1.5 cursor-pointer ${
                  isMobileFrame ? 'bg-[#16336E] text-[#7FD8E8]' : 'text-[#F2EAD6]/60'
                }`}
                title="Mobile Viewport (390px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFrame(false)}
                className={`p-1.5 cursor-pointer ${
                  !isMobileFrame ? 'bg-[#16336E] text-[#7FD8E8]' : 'text-[#F2EAD6]/60'
                }`}
                title="Desktop Responsive Viewport"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hardware Lab Trigger */}
            <button
              type="button"
              onClick={() => setSimulatorOpen(true)}
              className="px-2.5 py-1 bg-[#16336E] border border-[#7FD8E8] hover:bg-[#1f408a] text-[#7FD8E8] text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-[#F2B33D]" />
              <span className="hidden md:inline">ESP32 LAB</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col items-center justify-start overflow-y-auto relative w-full">
        {/* Live ESP32 Hardware Survey Panel */}
        <LiveSurveyPanel />

        <p className="w-full max-w-7xl px-4 pb-2 text-[10px] font-mono text-[#7FD8E8]/65">
          Live ESP32 readings and saves are above. Pilot fleet / footfall screens below can contain demo data; demo figures are not added to saved history.
        </p>

        {/* If Mobile Frame mode is enabled AND on a desktop screen, wrap in realistic Android phone bezel */}
        {isMobileFrame ? (
          <div className="w-full flex-1 flex items-center justify-center p-0 sm:py-6 overflow-hidden">
            <div className="w-full sm:max-w-[400px] h-full sm:h-[840px] sm:max-h-[90vh] bg-[#0E1E3C] sm:border-4 sm:border-[#7FD8E8]/60 sm:rounded-[36px] flex flex-col shadow-2xl overflow-hidden relative">
              {/* Simulated Mobile Status Bar on Hangar Navy */}
              <div className="bg-[#0E1E3C] px-5 pt-2 pb-1 flex items-center justify-between text-[11px] font-mono text-[#F2EAD6]/80 shrink-0 z-20">
                <span>09:41</span>
                {/* Speaker pill notch */}
                <div className="w-16 h-3 bg-black/40 rounded-full mx-auto" />
                <div className="flex items-center space-x-1.5">
                  <Radio className="w-3 h-3 text-[#7FD8E8]" />
                  <span>5G</span>
                  <span>94%</span>
                </div>
              </div>

              {/* Sub-Screen Rendering */}
              <div className="flex-1 overflow-y-auto flex flex-col relative">
                {role === 'merchant' && <MerchantView />}
                {(role === 'admin' || role === 'super_admin') &&
                  (isAdminAuthenticated ? (
                    <AdminDashboard />
                  ) : (
                    <div className="p-8 text-center text-[#F2EAD6]">
                      <ShieldAlert className="w-12 h-12 text-[#F05A28] mx-auto mb-3" />
                      <h3 className="font-michroma text-sm uppercase">AUTHENTICATION REQUIRED</h3>
                      <p className="font-archivo text-xs text-[#F2EAD6]/70 mt-1 mb-4">
                        Please provide your staff credentials to access Mission Control.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAdminAuthModalOpen(true)}
                        className="py-2.5 px-5 bg-[#F05A28] text-white font-mono text-xs font-bold uppercase cursor-pointer"
                      >
                        LOG IN AS STAFF
                      </button>
                    </div>
                  ))}
                {role === 'field_agent' && <FieldAgentView />}
                {role === 'student' && <EducationView />}
              </div>

              {/* Mobile Bottom Home Indicator with Discreet Staff Trigger */}
              <div className="h-6 bg-[#0E1E3C] flex items-center justify-between px-4 shrink-0">
                <div className="w-10" />
                <div className="w-24 h-1 bg-[#F2EAD6]/30 rounded-full" />
                <button
                  type="button"
                  onClick={() => setAdminAuthModalOpen(true)}
                  title="Staff Portal (Hidden)"
                  className="text-[#F2EAD6]/20 hover:text-[#7FD8E8] text-[9px] font-mono cursor-pointer"
                >
                  <Terminal className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Full Desktop Width Mode */
          <div className="w-full flex-1 overflow-y-auto">
            {role === 'merchant' && <MerchantView />}
            {(role === 'admin' || role === 'super_admin') &&
              (isAdminAuthenticated ? (
                <AdminDashboard />
              ) : (
                <div className="p-12 text-center text-[#F2EAD6]">
                  <ShieldAlert className="w-12 h-12 text-[#F05A28] mx-auto mb-3" />
                  <h3 className="font-michroma text-base uppercase">STAFF ACCESS RESTRICTED</h3>
                  <p className="font-archivo text-xs text-[#F2EAD6]/70 mt-1 mb-4 max-w-sm mx-auto">
                    Authorized staff credentials required to access Fleet & Unbound Session telemetry.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAdminAuthModalOpen(true)}
                    className="py-2.5 px-6 bg-[#F05A28] text-white font-mono text-xs font-bold uppercase cursor-pointer"
                  >
                    ENTER STAFF CREDENTIALS
                  </button>
                </div>
              ))}
            {role === 'field_agent' && <FieldAgentView />}
            {role === 'student' && <EducationView />}
          </div>
        )}
      </main>

      {/* Floating Hardware ESP32 Testbed Simulator */}
      <HardwareSimulator />

      {/* Real ESP32 Wi-Fi Live Sync Modal (192.168.4.1) */}
      <DeviceWifiSyncModal
        isOpen={deviceWifiModalOpen}
        onClose={() => setDeviceWifiModalOpen(false)}
      />

      {/* Secure Admin Credentials Login Modal */}
      <AdminLoginModal />

      {/* First Launch Multi-Role Picker Modal */}
      <FirstLaunchModal isOpen={firstLaunchOpen} onClose={() => setFirstLaunchOpen(false)} />
    </div>
  );
};
