/**
 * Code & Circuit App — Functional Specification v1
 * Survey Bin Pilot Platform
 * Cosmic Workshop Standard CW-01
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicWebsite } from './components/website/PublicWebsite';
import { MobileShell } from './components/layout/MobileShell';
import { StaffLoginView } from './components/auth/StaffLoginView';
import { StaffManagementModal } from './components/admin/StaffManagementModal';
import { ShopkeeperManagementModal } from './components/admin/ShopkeeperManagementModal';
import { BluetoothConnectModal } from './components/device/BluetoothConnectModal';
import { getActiveStaffSession, clearActiveStaffSession } from './services/staffService';
import { StaffUser } from './types';
import {
  ArrowLeft,
  Smartphone,
  LogOut,
  ShieldCheck,
  Users,
  Store,
  Sun,
  Moon,
} from 'lucide-react';

function MainRouter() {
  const {
    isAdminAuthenticated,
    theme,
    toggleTheme,
    isBluetoothModalOpen,
    setIsBluetoothModalOpen,
    bluetoothTargetSerial,
  } = useApp();
  const [viewMode, setViewMode] = useState<'website' | 'app'>('website');
  const [activeStaff, setActiveStaff] = useState<StaffUser | null>(() => getActiveStaffSession());
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [shopkeeperModalOpen, setShopkeeperModalOpen] = useState(false);

  const handleStaffLogout = () => {
    clearActiveStaffSession();
    setActiveStaff(null);
    setViewMode('website');
  };

  if (viewMode === 'app') {
    // If not authenticated as staff (and not logged in as admin), require Staff Login
    if (!activeStaff && !isAdminAuthenticated) {
      return (
        <StaffLoginView
          onSuccess={(staff) => setActiveStaff(staff)}
          onBackToWebsite={() => setViewMode('website')}
        />
      );
    }

    return (
      <div className="relative">
        <MobileShell
          onBackToWebsite={() => setViewMode('website')}
          onStaffLogout={handleStaffLogout}
          activeStaff={activeStaff}
        />

        {/* Shopkeeper & Bin Allocation Modal Accessible in Staff & Admin View */}
        <ShopkeeperManagementModal
          isOpen={shopkeeperModalOpen}
          onClose={() => setShopkeeperModalOpen(false)}
          currentRole={activeStaff ? 'staff' : 'admin'}
        />

        {/* Staff Management Modal Accessible Anywhere */}
        <StaffManagementModal
          isOpen={staffModalOpen}
          onClose={() => setStaffModalOpen(false)}
        />

        {/* Global Bluetooth Connection & Troubleshooting Hub */}
        <BluetoothConnectModal
          isOpen={isBluetoothModalOpen}
          onClose={() => setIsBluetoothModalOpen(false)}
          targetSerial={bluetoothTargetSerial}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <PublicWebsite
        onOpenStaffApp={() => setViewMode('app')}
        onOpenShopkeepers={() => setShopkeeperModalOpen(true)}
      />

      {/* Shopkeeper & Bin Allocation Modal Accessible in Website View */}
      <ShopkeeperManagementModal
        isOpen={shopkeeperModalOpen}
        onClose={() => setShopkeeperModalOpen(false)}
        currentRole={isAdminAuthenticated ? 'admin' : 'staff'}
      />

      {/* Staff Management Modal Accessible Anywhere */}
      <StaffManagementModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
      />

      {/* Global Bluetooth Connection & Troubleshooting Hub */}
      <BluetoothConnectModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        targetSerial={bluetoothTargetSerial}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
