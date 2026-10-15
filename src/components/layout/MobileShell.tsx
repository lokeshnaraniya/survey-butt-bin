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
import { StaffManagementModal } from '../admin/StaffManagementModal';
import { ShopkeeperManagementModal } from '../admin/ShopkeeperManagementModal';
import {
  ArrowLeft,
  Bluetooth,
  BookOpen,
  Cpu,
  LogOut,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Store,
  Terminal,
  Wifi,
  WifiOff,
  Wrench,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MobileShellProps {
  onBackToWebsite?: () => void;
  onStaffLogout?: () => void;
  activeStaff?: any;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  onBackToWebsite,
  onStaffLogout,
  activeStaff,
}) => {
  const {
    role,
    setRole,
    isOnline,
    setIsOnline,
    isAdminAuthenticated,
    adminLogout,
    setAdminAuthModalOpen,
    deviceWifiModalOpen,
    setDeviceWifiModalOpen,
    setSimulatorOpen,
  } = useApp();

  const [firstLaunchOpen, setFirstLaunchOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [shopkeeperModalOpen, setShopkeeperModalOpen] = useState(false);
  const [showLiveSurveyPanel, setShowLiveSurveyPanel] = useState(false);

  return (
    <div className="min-h-screen bg-[#070D18] flex flex-col font-sans text-[#F2EAD6]">
      {/* Clean, Non-Congested Operational Bar */}
      <header className="bg-[#0C1628] border-b border-[#1E293B] px-3 sm:px-4 py-2.5 shrink-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Mark & Back Button */}
          <div className="flex items-center space-x-2.5">
            {onBackToWebsite && (
              <button
                type="button"
                onClick={onBackToWebsite}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F8F82] hover:bg-[#18756a] text-white font-bold cursor-pointer rounded-xl font-mono text-xs transition-colors shadow"
                title="Return to Public Website"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">← Public Website</span>
                <span className="sm:hidden">← Site</span>
              </button>
            )}

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
              <CodeCircuitLogo size={26} strokeColor="#F2EAD6" sparkColor="#7FD8E8" />
              <div className="text-left font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs tracking-wider text-white group-hover:text-[#7FD8E8] transition-colors">
                    CODE & CIRCUIT
                  </span>
                  <span className="text-[10px] bg-[#16336E] text-[#7FD8E8] px-1.5 py-0.2 rounded border border-[#7FD8E8]/30 font-bold">
                    STAFF PORTAL
                  </span>
                </div>
                <span className="text-[10px] text-[#94A3B8] block">
                  Kota Smart Bins Management
                </span>
              </div>
            </button>
          </div>

          {/* Clean Role Switcher */}
          <div className="flex items-center bg-[#070D18] border border-[#334155] rounded-xl p-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setRole('field_agent')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                role === 'field_agent'
                  ? 'bg-[#1F8F82] text-white shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Staff Field View</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('merchant')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                role === 'merchant'
                  ? 'bg-[#F2B33D] text-black shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shopkeeper View</span>
            </button>

            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                  role === 'admin' || role === 'super_admin'
                    ? 'bg-[#3B82F6] text-white shadow'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            )}
          </div>

          {/* Quick Actions: Shopkeeper modal + Staff modal + Hardware connect + Logout */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {/* Manage Shopkeepers Button */}
            <button
              type="button"
              onClick={() => setShopkeeperModalOpen(true)}
              className="px-2.5 py-1.5 bg-[#F2B33D]/15 hover:bg-[#F2B33D]/25 border border-[#F2B33D]/40 text-[#F2B33D] rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Add, view & manage shopkeepers"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">🏪 Shopkeepers</span>
            </button>

            {/* Manage Staff Button */}
            <button
              type="button"
              onClick={() => setStaffModalOpen(true)}
              className="px-2.5 py-1.5 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/40 text-[#C4B5FD] rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Add or remove authorized staff members"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">👥 Staff</span>
            </button>

            {/* Hardware Live Survey toggle */}
            <button
              type="button"
              onClick={() => setShowLiveSurveyPanel(!showLiveSurveyPanel)}
              className="px-2.5 py-1.5 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#38BDF8] rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title={showLiveSurveyPanel ? 'Hide Hardware Panel' : 'Show Live Hardware Panel'}
            >
              <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden md:inline">ESP32 Monitor</span>
              {showLiveSurveyPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {activeStaff && (
              <span className="hidden xl:inline text-[#7FD8E8] font-mono text-[11px] px-2 py-1 bg-[#16336E] rounded-lg border border-[#7FD8E8]/30">
                Staff: <b>{activeStaff.name}</b>
              </span>
            )}

            {onStaffLogout && (
              <button
                type="button"
                onClick={onStaffLogout}
                className="px-2.5 py-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 rounded-xl font-bold font-mono text-xs cursor-pointer flex items-center gap-1 transition-colors"
                title="Logout from Staff Terminal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col items-center justify-start overflow-y-auto relative w-full">
        {/* Collapsible Live ESP32 Hardware Survey Panel */}
        {showLiveSurveyPanel && (
          <div className="w-full bg-[#081226] border-b border-[#1E293B] p-3 shadow-inner">
            <div className="max-w-5xl mx-auto space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#38BDF8] font-bold flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>Real-Time ESP32 Hardware Diagnostics & Sensor Reading</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowLiveSurveyPanel(false)}
                  className="text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Close ✕
                </button>
              </div>
              <LiveSurveyPanel />
            </div>
          </div>
        )}

        {/* Clean, Full-Width Responsive Screen Rendering */}
        <div className="w-full flex-1 overflow-y-auto">
          {role === 'field_agent' && <FieldAgentView />}
          {role === 'merchant' && <MerchantView />}
          {(role === 'admin' || role === 'super_admin') &&
            (isAdminAuthenticated ? (
              <AdminDashboard />
            ) : (
              <div className="p-12 text-center text-[#F2EAD6] max-w-md mx-auto my-12 bg-[#0C1628] rounded-2xl border border-[#1E293B] shadow-2xl">
                <ShieldAlert className="w-12 h-12 text-[#F2B33D] mx-auto mb-3" />
                <h3 className="font-mono text-base font-bold uppercase text-white">ADMIN ACCESS REQUIRED</h3>
                <p className="font-sans text-xs text-[#94A3B8] mt-1 mb-4 leading-relaxed">
                  Administrator password is required to access Fleet & Question configuration.
                </p>
                <button
                  type="button"
                  onClick={() => setAdminAuthModalOpen(true)}
                  className="py-2.5 px-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-mono text-xs font-bold rounded-xl cursor-pointer uppercase transition-all shadow-md active:scale-95"
                >
                  Enter Admin Password
                </button>
              </div>
            ))}
          {role === 'student' && <EducationView />}
        </div>
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

      {/* Shopkeeper & Bin Allocation Modal Accessible in Operational Terminal */}
      <ShopkeeperManagementModal
        isOpen={shopkeeperModalOpen}
        onClose={() => setShopkeeperModalOpen(false)}
        currentRole={role === 'admin' || isAdminAuthenticated ? 'admin' : 'staff'}
      />

      {/* Staff Management Modal Accessible in Operational Terminal */}
      <StaffManagementModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
      />
    </div>
  );
};
