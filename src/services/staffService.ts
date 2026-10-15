import { StaffUser } from '../types';

const STORAGE_KEY = 'cc_authorized_staff';
const ACTIVE_STAFF_KEY = 'cc_active_staff_session';

const INITIAL_STAFF_LIST: StaffUser[] = [
  {
    id: 'staff-01',
    name: 'Manoj Kumar (Field Agent)',
    mobile: '9829011420',
    password: 'staff@123',
    role: 'Field Agent',
    addedAt: '2026-10-01T08:00:00.000Z',
    active: true,
  },
  {
    id: 'staff-02',
    name: 'Pooja Verma (Technician)',
    mobile: '9414155210',
    password: 'tech@123',
    role: 'Technician',
    addedAt: '2026-10-02T09:30:00.000Z',
    active: true,
  },
];

export const getStaffList = (): StaffUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_STAFF_LIST;
};

export const saveStaffList = (list: StaffUser[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
};

export const addStaffUser = (staff: {
  name: string;
  mobile: string;
  password: string;
  role: 'Field Agent' | 'Technician' | 'Supervisor';
}): StaffUser => {
  const current = getStaffList();
  const newUser: StaffUser = {
    id: `staff-${Date.now().toString().slice(-4)}`,
    name: staff.name.trim(),
    mobile: staff.mobile.trim(),
    password: staff.password.trim(),
    role: staff.role,
    addedAt: new Date().toISOString(),
    active: true,
  };
  const updated = [newUser, ...current];
  saveStaffList(updated);
  return newUser;
};

export const deleteStaffUser = (id: string): StaffUser[] => {
  const current = getStaffList();
  const updated = current.filter((u) => u.id !== id);
  saveStaffList(updated);

  // If deleted user was active, clear session
  const active = getActiveStaffSession();
  if (active && active.id === id) {
    clearActiveStaffSession();
  }
  return updated;
};

export const authenticateStaffUser = (mobile: string, password: string): StaffUser | null => {
  const cleanMobile = mobile.trim();
  const cleanPass = password.trim();
  const list = getStaffList();

  const found = list.find(
    (u) => u.mobile === cleanMobile && u.password === cleanPass && u.active
  );

  if (found) {
    try {
      localStorage.setItem(ACTIVE_STAFF_KEY, JSON.stringify(found));
    } catch {}
    return found;
  }
  return null;
};

export const getActiveStaffSession = (): StaffUser | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_STAFF_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const clearActiveStaffSession = () => {
  try {
    localStorage.removeItem(ACTIVE_STAFF_KEY);
  } catch {}
};
