/**
 * Merchant Account & 3-Times-A-Day Auto Sync Engine
 * Code & Circuit Pilot Platform (Kota)
 */

export interface MerchantProfile {
  id: string;
  name: string;
  phone: string;
  password?: string;
  shopName: string;
  locality: string;
  assignedBinSerial: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number; // default 120 mins
}

export type SyncShift = 'morning' | 'afternoon' | 'evening' | 'manual';

export interface SyncLogRecord {
  id: string;
  merchantId: string;
  binSerial: string;
  shift: SyncShift;
  timestamp: string;
  countA: number;
  countB: number;
  total: number;
  status: 'success' | 'failed';
  message: string;
}

export interface ShiftSchedule {
  key: SyncShift;
  label: string;
  labelHindi: string;
  scheduledTime: string; // e.g. "10:00 AM"
  targetHour: number; // 24-hr format (e.g. 10 for 10 AM, 15 for 3 PM, 21 for 9 PM)
  windowStartHour: number;
  windowEndHour: number;
}

export const DAILY_SHIFTS: ShiftSchedule[] = [
  {
    key: 'morning',
    label: 'Morning Shift',
    labelHindi: 'सुबह का सिंक (Morning Rush)',
    scheduledTime: '10:00 AM',
    targetHour: 10,
    windowStartHour: 8,
    windowEndHour: 12,
  },
  {
    key: 'afternoon',
    label: 'Afternoon Shift',
    labelHindi: 'दोपहर का सिंक (Coaching Break)',
    scheduledTime: '03:00 PM',
    targetHour: 15,
    windowStartHour: 13,
    windowEndHour: 17,
  },
  {
    key: 'evening',
    label: 'Evening Shift',
    labelHindi: 'रात का सिंक (Shop Closing Rush)',
    scheduledTime: '09:00 PM',
    targetHour: 21,
    windowStartHour: 19,
    windowEndHour: 23,
  },
];

const DEFAULT_MERCHANTS: MerchantProfile[] = [
  {
    id: 'merch-01',
    name: 'Ramesh Tiwari',
    phone: '9829011420',
    password: '1234',
    shopName: 'Sharma Tea Point & Cafe',
    locality: 'Landmark City (Kunhari), Kota',
    assignedBinSerial: 'CC-BIN-01',
    autoSyncEnabled: true,
    syncIntervalMinutes: 120,
  },
  {
    id: 'merch-02',
    name: 'Gopal Soni',
    phone: '9414233100',
    password: '1234',
    shopName: 'Jai Hind Refreshment Stall',
    locality: 'Talwandi Circle, Kota',
    assignedBinSerial: 'CC-BIN-02',
    autoSyncEnabled: true,
    syncIntervalMinutes: 120,
  },
  {
    id: 'merch-03',
    name: 'Mohan Lal',
    phone: '9785123980',
    password: '1234',
    shopName: 'Kota Chai Point',
    locality: 'Vigyan Nagar, Kota',
    assignedBinSerial: 'CC-BIN-03',
    autoSyncEnabled: true,
    syncIntervalMinutes: 120,
  },
  {
    id: 'merch-04',
    name: 'Shankar Lal',
    phone: '9828456123',
    password: '1234',
    shopName: 'Royal Paan Palace',
    locality: 'Rangbari Main Gate, Kota',
    assignedBinSerial: 'CC-BIN-04',
    autoSyncEnabled: true,
    syncIntervalMinutes: 120,
  },
  {
    id: 'merch-05',
    name: 'Dinesh Rathore',
    phone: '9413789012',
    password: '1234',
    shopName: 'Central City Tobacco Kiosk',
    locality: 'Gumanpura Bazar, Kota',
    assignedBinSerial: 'CC-BIN-05',
    autoSyncEnabled: true,
    syncIntervalMinutes: 120,
  },
];

const ACTIVE_MERCHANT_KEY = 'cc_active_merchant_profile';
const ALL_MERCHANTS_KEY = 'cc_all_merchants_list';
const SYNC_LOGS_KEY = 'cc_merchant_sync_logs';

export const getAllMerchants = (): MerchantProfile[] => {
  try {
    const raw = localStorage.getItem(ALL_MERCHANTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_MERCHANTS;
};

export const saveAllMerchants = (list: MerchantProfile[]) => {
  try {
    localStorage.setItem(ALL_MERCHANTS_KEY, JSON.stringify(list));
  } catch {}
};

export const fetchMerchantsFromServer = async (): Promise<MerchantProfile[]> => {
  try {
    const res = await fetch('/api/merchants');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.merchants)) {
        saveAllMerchants(data.merchants);
        return data.merchants;
      }
    }
  } catch {}
  return getAllMerchants();
};

export const addMerchant = async (
  merchantData: Omit<MerchantProfile, 'id'>
): Promise<MerchantProfile> => {
  const newMerch: MerchantProfile = {
    ...merchantData,
    password: merchantData.password?.trim() || '1234',
    id: `merch-${Date.now().toString().slice(-5)}`,
  };

  const list = getAllMerchants();
  const updated = [...list, newMerch];
  saveAllMerchants(updated);

  // Sync with server endpoint
  try {
    const res = await fetch('/api/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMerch),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.merchant) {
        return data.merchant;
      }
    }
  } catch {}

  return newMerch;
};

export const updateMerchant = async (
  id: string,
  updatedData: Partial<MerchantProfile>
): Promise<MerchantProfile> => {
  const list = getAllMerchants();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) {
    throw new Error('Shopkeeper not found');
  }

  const updated: MerchantProfile = {
    ...list[idx],
    ...updatedData,
  };
  list[idx] = updated;
  saveAllMerchants(list);

  // Update active merchant if currently active
  const active = getActiveMerchant();
  if (active.id === id) {
    saveActiveMerchant(updated);
  }

  // Sync with server endpoint
  try {
    await fetch(`/api/merchants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
  } catch {}

  return updated;
};

export const deleteMerchant = async (id: string): Promise<void> => {
  const list = getAllMerchants().filter((m) => m.id !== id);
  saveAllMerchants(list);

  try {
    await fetch(`/api/merchants/${id}`, { method: 'DELETE' });
  } catch {}
};

export const getMerchantByPhone = (phone: string): MerchantProfile | undefined => {
  const cleaned = phone.replace(/\D/g, '').slice(-10);
  return getAllMerchants().find((m) => m.phone.replace(/\D/g, '').slice(-10) === cleaned);
};

export const authenticateMerchant = (
  phoneOrId: string,
  enteredPass: string
): { success: boolean; merchant?: MerchantProfile; error?: string } => {
  const cleanInput = phoneOrId.trim();
  const cleanPhone = cleanInput.replace(/\D/g, '').slice(-10);
  const cleanPass = enteredPass.trim();

  const list = getAllMerchants();
  const matched = list.find((m) => {
    const mPhone = m.phone.replace(/\D/g, '').slice(-10);
    return (cleanPhone && mPhone === cleanPhone) || m.id === cleanInput;
  });

  if (!matched) {
    return {
      success: false,
      error: 'यह मोबाइल नंबर रजिस्टर्ड नहीं है। कृपया पहले एडमिन से दुकानदार रजिस्टर करवाएं।',
    };
  }

  const expectedPass = (matched.password || '1234').trim();
  if (cleanPass !== expectedPass) {
    return {
      success: false,
      error: `गलत पासवर्ड! दुकानदार "${matched.name}" के लिए सही पासवर्ड दर्ज करें। (एडमिन द्वारा दिया गया पासवर्ड)`,
    };
  }

  saveActiveMerchant(matched);
  return { success: true, merchant: matched };
};

export const getMerchantByBinSerial = (binSerial: string): MerchantProfile | undefined => {
  return getAllMerchants().find(
    (m) => m.assignedBinSerial.toLowerCase() === binSerial.toLowerCase()
  );
};

export const getActiveMerchant = (): MerchantProfile => {
  try {
    const raw = localStorage.getItem(ACTIVE_MERCHANT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getAllMerchants()[0] || DEFAULT_MERCHANTS[0];
};

export const saveActiveMerchant = (m: MerchantProfile) => {
  try {
    localStorage.setItem(ACTIVE_MERCHANT_KEY, JSON.stringify(m));
  } catch {}
};

export const getMerchantSyncLogs = (): SyncLogRecord[] => {
  try {
    const raw = localStorage.getItem(SYNC_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const saveMerchantSyncLog = (record: Omit<SyncLogRecord, 'id'>): SyncLogRecord => {
  const fullRecord: SyncLogRecord = {
    ...record,
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const list = getMerchantSyncLogs();
  const updated = [fullRecord, ...list].slice(0, 100);
  try {
    localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(updated));
  } catch {}
  return fullRecord;
};

/**
 * Check which of the 3 daily shifts have been completed today for a specific bin
 */
export const getTodayShiftStatuses = (binSerial: string) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const logs = getMerchantSyncLogs().filter(
    (l) => l.binSerial === binSerial && l.timestamp.startsWith(todayStr) && l.status === 'success'
  );

  const statuses: Record<SyncShift, { completed: boolean; lastTime?: string; votes?: number }> = {
    morning: { completed: false },
    afternoon: { completed: false },
    evening: { completed: false },
    manual: { completed: false },
  };

  logs.forEach((log) => {
    statuses[log.shift] = {
      completed: true,
      lastTime: log.timestamp,
      votes: log.total,
    };
  });

  return statuses;
};

/**
 * Perform online sync to server API
 */
export const performOnlineSync = async (
  binSerial: string,
  countA: number,
  countB: number,
  shift: SyncShift = 'manual',
  merchantName?: string
): Promise<{ success: boolean; message: string; record?: SyncLogRecord }> => {
  try {
    const total = countA + countB;
    // Send telemetry to server endpoint
    const url = `/api/bin/sync?serial=${encodeURIComponent(binSerial)}&a=${countA}&b=${countB}&merchant=${encodeURIComponent(merchantName || '')}&shift=${shift}`;
    const res = await fetch(url);
    const data = res.ok ? await res.json() : null;

    const log = saveMerchantSyncLog({
      merchantId: getActiveMerchant().id,
      binSerial,
      shift,
      timestamp: new Date().toISOString(),
      countA,
      countB,
      total,
      status: res.ok ? 'success' : 'failed',
      message: res.ok
        ? `Successfully uploaded ${total} votes (A: ${countA}, B: ${countB}) for ${binSerial}`
        : 'Server rejected sync packet',
    });

    return {
      success: res.ok,
      message: res.ok
        ? `✓ डेटा सफलतापूर्वक ऑनलाइन अपलोड हो गया! (${shift.toUpperCase()})`
        : 'सर्वर पर अपलोड विफल रहा। इंटरनेट जांचें।',
      record: log,
    };
  } catch (err: any) {
    const log = saveMerchantSyncLog({
      merchantId: getActiveMerchant().id,
      binSerial,
      shift,
      timestamp: new Date().toISOString(),
      countA,
      countB,
      total: countA + countB,
      status: 'failed',
      message: err?.message || 'Network sync error',
    });

    return {
      success: false,
      message: 'ऑनलाइन सिंक त्रुटि: ' + (err?.message || 'Network error'),
      record: log,
    };
  }
};
