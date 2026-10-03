import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AdminConfig,
  BindingConfidence,
  BindingSource,
  Deployment,
  Location,
  Organisation,
  Question,
  QuestionBinding,
  Role,
  ServiceTicket,
  SyncBatch,
  TelemetryEvent,
  Unit,
} from '../types';
import {
  INITIAL_BINDINGS,
  INITIAL_CONFIG,
  INITIAL_DEPLOYMENTS,
  INITIAL_LOCATIONS,
  INITIAL_ORGANISATIONS,
  INITIAL_QUESTIONS,
  INITIAL_SYNC_BATCHES,
  INITIAL_TICKETS,
  INITIAL_UNITS,
} from '../services/mockData';
import { hardwareBridge, HardwareCounts } from '../services/hardwareBridgeService';
import { LiveReading, SurveyQuestion } from '../types/survey';
import { fetchSurveyQuestions } from '../services/surveyService';

interface HardwareBinState {
  serial: string;
  isPowerOn: boolean;
  isSensorStuck: boolean;
  isInRange: boolean;
  clockDriftSec: number;
  unacknowledgedEvents: TelemetryEvent[];
  lcdCounts: { A: number; B: number; C?: number };
  currentSessionId: number;
  bootId: number;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUser: {
    name: string;
    phone: string;
    orgId?: string;
  };
  units: Unit[];
  organisations: Organisation[];
  locations: Location[];
  deployments: Deployment[];
  questions: Question[];
  bindings: QuestionBinding[];
  syncBatches: SyncBatch[];
  tickets: ServiceTicket[];
  adminConfig: AdminConfig;
  updateAdminConfig: (cfg: Partial<AdminConfig>) => void;

  // Network & Outbox
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  outboxBatches: SyncBatch[];
  flushOutbox: () => void;

  // Active Merchant Unit
  selectedUnitSerial: string;
  setSelectedUnitSerial: (serial: string) => void;
  selectedUnit: Unit;

  // Hardware Sandbox / Physical Bin
  hardware: HardwareBinState;
  triggerHardwareVote: (hole: 'A' | 'B' | 'C') => void;
  triggerHardwareReset: () => void;
  toggleHardwarePower: () => void;
  toggleSensorStuck: () => void;
  toggleInRange: () => void;
  setClockDrift: (sec: number) => void;

  // Sync execution
  syncState: {
    active: boolean;
    phase: 'idle' | 'ble_connecting' | 'draining_device' | 'uploading_server' | 'complete' | 'failed';
    lastBatchCount: number;
    showVictory: boolean;
  };
  startSync: (overrideSerial?: string, roleOverride?: Role) => Promise<boolean>;
  dismissVictory: () => void;

  // Merchant Actions
  resetPromptOpen: boolean;
  dismissResetPrompt: (answer: 'yes' | 'no' | 'not_sure') => void;
  submitServiceTicket: (ticket: Omit<ServiceTicket, 'id' | 'created_at' | 'status'>) => void;

  // Admin Actions
  isAdminAuthenticated: boolean;
  adminAuthModalOpen: boolean;
  setAdminAuthModalOpen: (val: boolean) => void;
  adminLogin: (userId: string, pw: string) => boolean;
  adminLogout: () => void;
  bindQuestion: (
    bindingId: string,
    questionId: string,
    source: BindingSource,
    confidence: BindingConfidence
  ) => void;
  splitSession: (bindingId: string, splitIsoTime: string, newQuestionId: string) => void;
  mergeSessions: (bindingIds: string[], questionId: string) => void;
  createQuestion: (q: Omit<Question, 'id' | 'created_at'>) => void;
  resolveTicket: (id: string, notes: string) => void;
  sendDeviceCommand: (serial: string, command: string, payload?: any) => void;

  // Real ESP32 Wi-Fi & Bluetooth Device Integration
  deviceWifiModalOpen: boolean;
  setDeviceWifiModalOpen: (val: boolean) => void;
  deviceIp: string;
  setDeviceIp: (ip: string) => void;
  deviceSyncStatus: 'idle' | 'connecting' | 'connected' | 'error';
  deviceSyncError: string | null;
  syncWithESP32Device: (customHtmlOrUrl?: string) => Promise<{
    success: boolean;
    countA?: number;
    countB?: number;
    total?: number;
    message?: string;
  }>;
  resetESP32HardwareCounts: () => Promise<boolean>;

  // Direct In-App Web Bluetooth & Web Serial Controls
  isHardwareConnected: boolean;
  activeHardwareMethod: 'bluetooth' | 'serial' | 'wifi' | 'none';
  hardwareStatusMsg: string;
  hardwareIsError: boolean;
  connectDeviceBluetooth: () => Promise<boolean>;
  connectDeviceSerial: () => Promise<boolean>;
  disconnectDevice: () => void;
  sendHardwareReset: () => Promise<boolean>;

  // Live Survey & Hardware Telemetry
  liveReading: LiveReading | null;
  connectedUnitSerial: string | null;
  addSavedQuestion: (q: SurveyQuestion) => void;
  questionLibraryError: string | null;
  refreshQuestionLibrary: () => Promise<void>;

  // Viewport mode: desktop web or mobile device framing
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  simulatorOpen: boolean;
  setSimulatorOpen: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('merchant');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [simulatorOpen, setSimulatorOpen] = useState<boolean>(false);

  const [currentUser] = useState({
    name: 'Ramesh Tiwari',
    phone: '+91 98290 11420',
    orgId: 'org-01',
  });

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [outboxBatches, setOutboxBatches] = useState<SyncBatch[]>([]);

  const [units, setUnits] = useState<Unit[]>(() => {
    const saved = localStorage.getItem('cc_units');
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });

  const [organisations] = useState<Organisation[]>(INITIAL_ORGANISATIONS);
  const [locations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [deployments] = useState<Deployment[]>(INITIAL_DEPLOYMENTS);

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('cc_questions');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  const [bindings, setBindings] = useState<QuestionBinding[]>(() => {
    const saved = localStorage.getItem('cc_bindings');
    return saved ? JSON.parse(saved) : INITIAL_BINDINGS;
  });

  const [syncBatches, setSyncBatches] = useState<SyncBatch[]>(() => {
    const saved = localStorage.getItem('cc_sync_batches');
    return saved ? JSON.parse(saved) : INITIAL_SYNC_BATCHES;
  });

  const [tickets, setTickets] = useState<ServiceTicket[]>(() => {
    const saved = localStorage.getItem('cc_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [adminConfig, setAdminConfig] = useState<AdminConfig>(INITIAL_CONFIG);
  const [selectedUnitSerial, setSelectedUnitSerial] = useState<string>('CC-BIN-01');

  // Physical Hardware State (ESP32 Simulator)
  const [hardware, setHardware] = useState<HardwareBinState>({
    serial: 'CC-BIN-01',
    isPowerOn: true,
    isSensorStuck: false,
    isInRange: true,
    clockDriftSec: 42,
    unacknowledgedEvents: [],
    lcdCounts: { A: 412, B: 288 },
    currentSessionId: 4,
    bootId: 104,
  });

  // Sync state animation and execution
  const [syncState, setSyncState] = useState<{
    active: boolean;
    phase: 'idle' | 'ble_connecting' | 'draining_device' | 'uploading_server' | 'complete' | 'failed';
    lastBatchCount: number;
    showVictory: boolean;
  }>({
    active: false,
    phase: 'idle',
    lastBatchCount: 0,
    showVictory: false,
  });

  const [resetPromptOpen, setResetPromptOpen] = useState<boolean>(false);

  // Admin Secure Auth State (Hidden credentials verification: 7976718683 / lokeshadmin)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cc_admin_auth') === 'true';
  });
  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);

  // ESP32 Hardware Direct Wi-Fi Integration State
  const [deviceWifiModalOpen, setDeviceWifiModalOpen] = useState(false);
  const [deviceIp, setDeviceIp] = useState('http://192.168.4.1');
  const [deviceSyncStatus, setDeviceSyncStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [deviceSyncError, setDeviceSyncError] = useState<string | null>(null);

  // Direct In-App Web Bluetooth & Web Serial State
  const [isHardwareConnected, setIsHardwareConnected] = useState<boolean>(false);
  const [activeHardwareMethod, setActiveHardwareMethod] = useState<
    'bluetooth' | 'serial' | 'wifi' | 'none'
  >('none');
  const [hardwareStatusMsg, setHardwareStatusMsg] = useState<string>('Ready to connect.');
  const [hardwareIsError, setHardwareIsError] = useState<boolean>(false);
  const [connectedUnitSerial, setConnectedUnitSerial] = useState<string | null>(null);

  // Live ESP32 Hardware Reading for LiveSurveyPanel
  const [liveReading, setLiveReading] = useState<LiveReading | null>({
    countA: 412,
    countB: 288,
    total: 700,
    unitSerial: 'CC-BIN-01',
    deviceName: 'ESP32 SmartBin (Initial)',
    receivedAt: new Date().toISOString(),
  });
  const [questionLibraryError, setQuestionLibraryError] = useState<string | null>(null);

  const addSavedQuestion = (q: SurveyQuestion) => {
    const newQ: Question = {
      id: q.id,
      text: q.text,
      category: (q.category || 'Civic') as any,
      active_start: q.activeStart || new Date().toISOString().slice(0, 10),
      active_end: q.activeEnd || '',
      language: (q.language || 'Hindi') as any,
      author: q.author || 'Saved survey',
      created_at: q.createdAt || new Date().toISOString(),
      options: [
        { hole_id: 'A', label: q.optionA },
        { hole_id: 'B', label: q.optionB },
      ],
    };
    setQuestions((prev) => [newQ, ...prev.filter((item) => item.id !== newQ.id)]);
  };

  const refreshQuestionLibrary = async () => {
    try {
      setQuestionLibraryError(null);
      const res = await fetchSurveyQuestions();
      if (res?.questions) {
        const mappedQuestions: Question[] = res.questions.map((sq) => ({
          id: sq.id,
          text: sq.text,
          category: (sq.category || 'Civic') as any,
          active_start: sq.activeStart || '2026-09-01',
          active_end: sq.activeEnd || '2026-12-31',
          language: (sq.language || 'Hindi') as any,
          author: sq.author || 'Admin Team',
          created_at: sq.createdAt || new Date().toISOString(),
          options: [
            { hole_id: 'A', label: sq.optionA },
            { hole_id: 'B', label: sq.optionB },
          ],
        }));
        setQuestions((prev) => {
          const ids = new Set(prev.map((q) => q.id));
          const newOnes = mappedQuestions.filter((q) => !ids.has(q.id));
          return [...newOnes, ...prev];
        });
      }
    } catch (err: any) {
      setQuestionLibraryError(err.message || 'Failed loading survey questions.');
    }
  };

  // Wi-Fi Cloud Sync Auto-Polling (Fast 1s poll for ESP32 data sent to /api/bin/sync)
  useEffect(() => {
    let lastA = -1;
    let lastB = -1;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/bin/counts');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.countA === 'number' && typeof data.countB === 'number') {
            const hasChanged = data.countA !== lastA || data.countB !== lastB;
            if (hasChanged) {
              lastA = data.countA;
              lastB = data.countB;
              const total = data.total ?? (data.countA + data.countB);

              setLiveReading({
                countA: data.countA,
                countB: data.countB,
                total,
                unitSerial: data.serial || selectedUnitSerial,
                deviceName: 'ESP32 SmartBin (Live Cloud)',
                receivedAt: data.updatedAt || new Date().toISOString(),
              });

              // Update hardware LCD simulator
              setHardware((prev) => ({
                ...prev,
                lcdCounts: { A: data.countA, B: data.countB, C: 0 },
                isInRange: true,
              }));

              // Update units list so MerchantView shows live counts immediately
              setUnits((prev) =>
                prev.map((u) => {
                  if (u.serial === selectedUnitSerial || u.serial === 'CC-BIN-01') {
                    return {
                      ...u,
                      counts: { A: data.countA, B: data.countB },
                      last_sync_time: new Date().toISOString(),
                      last_vote_time: new Date().toISOString(),
                      current_status: 'Healthy',
                    };
                  }
                  return u;
                })
              );

              // Set active connection if not on Bluetooth/Serial
              if (activeHardwareMethod === 'none') {
                setIsHardwareConnected(true);
                setActiveHardwareMethod('wifi');
                setHardwareStatusMsg('⚡ Live telemetry active via Wi-Fi Cloud!');
              }
            }
          }
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedUnitSerial, activeHardwareMethod]);

  useEffect(() => {
    hardwareBridge.setCallbacks(
      (counts: HardwareCounts) => {
        setHardware((prev) => {
          const nextA = counts.countA >= 0 ? counts.countA : prev.lcdCounts.A;
          const nextB = counts.countB >= 0 ? counts.countB : prev.lcdCounts.B;
          const nextTotal = counts.total >= 0 ? counts.total : nextA + nextB;

          setLiveReading({
            countA: nextA,
            countB: nextB,
            total: nextTotal,
            unitSerial: selectedUnitSerial,
            deviceName: `ESP32 SmartBin (${hardwareBridge.activeMethod.toUpperCase()})`,
            receivedAt: new Date().toISOString(),
          });

          return {
            ...prev,
            lcdCounts: { A: nextA, B: nextB, C: 0 },
            isInRange: true,
          };
        });

        setUnits((prev) =>
          prev.map((u) => {
            if (u.serial === selectedUnitSerial || u.serial === 'CC-BIN-01') {
              const nextA = counts.countA >= 0 ? counts.countA : u.counts.A;
              const nextB = counts.countB >= 0 ? counts.countB : u.counts.B;
              return {
                ...u,
                counts: { A: nextA, B: nextB },
                last_sync_time: new Date().toISOString(),
                current_status: 'Healthy',
              };
            }
            return u;
          })
        );
      },
      (status: string, isError?: boolean) => {
        setHardwareStatusMsg(status);
        setHardwareIsError(!!isError);
        setIsHardwareConnected(hardwareBridge.isConnected);
        setActiveHardwareMethod(hardwareBridge.activeMethod);
      }
    );
  }, [selectedUnitSerial]);

  const connectDeviceBluetooth = async (): Promise<boolean> => {
    const success = await hardwareBridge.connectBluetooth();
    setIsHardwareConnected(hardwareBridge.isConnected);
    setActiveHardwareMethod(hardwareBridge.activeMethod);
    if (success) {
      setConnectedUnitSerial(selectedUnitSerial);
    }
    return success;
  };

  const connectDeviceSerial = async (): Promise<boolean> => {
    const success = await hardwareBridge.connectSerial();
    setIsHardwareConnected(hardwareBridge.isConnected);
    setActiveHardwareMethod(hardwareBridge.activeMethod);
    if (success) {
      setConnectedUnitSerial(selectedUnitSerial);
    }
    return success;
  };

  const disconnectDevice = () => {
    hardwareBridge.disconnect();
    setIsHardwareConnected(false);
    setActiveHardwareMethod('none');
    setConnectedUnitSerial(null);
  };

  const sendHardwareReset = async (): Promise<boolean> => {
    const success = await hardwareBridge.sendResetCommand();
    if (success) {
      setHardware((prev) => ({
        ...prev,
        lcdCounts: { A: 0, B: 0, C: 0 },
        currentSessionId: prev.currentSessionId + 1,
      }));
      setUnits((prev) =>
        prev.map((u) => {
          if (u.serial === selectedUnitSerial || u.serial === 'CC-BIN-01') {
            return {
              ...u,
              counts: { A: 0, B: 0 },
              current_session_id: u.current_session_id + 1,
            };
          }
          return u;
        })
      );
    }
    return success;
  };

  // Sync state to local storage for persistence across reloads
  useEffect(() => {
    localStorage.setItem('cc_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('cc_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('cc_bindings', JSON.stringify(bindings));
  }, [bindings]);

  useEffect(() => {
    localStorage.setItem('cc_sync_batches', JSON.stringify(syncBatches));
  }, [syncBatches]);

  useEffect(() => {
    localStorage.setItem('cc_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const selectedUnit =
    units.find((u) => u.serial === selectedUnitSerial) || units[0] || INITIAL_UNITS[0];

  // 1. Hardware Simulator: Physical beam break vote
  const triggerHardwareVote = (hole: 'A' | 'B' | 'C') => {
    if (!hardware.isPowerOn) return;

    const newVoteEvent: TelemetryEvent = {
      unit_serial: hardware.serial,
      event_type: 'vote',
      sequence_number: Date.now(),
      device_timestamp: new Date().toISOString(),
      payload: { hole },
    };

    setHardware((prev) => {
      const nextCounts = {
        ...prev.lcdCounts,
        [hole]: (prev.lcdCounts[hole as keyof typeof prev.lcdCounts] || 0) + 1,
      };
      return {
        ...prev,
        lcdCounts: nextCounts,
        unacknowledgedEvents: [...prev.unacknowledgedEvents, newVoteEvent],
      };
    });

    // Also update server unit counts display preview
    setUnits((prev) =>
      prev.map((u) => {
        if (u.serial === hardware.serial) {
          const nextCounts = {
            ...u.counts,
            [hole]: (u.counts[hole as keyof typeof u.counts] || 0) + 1,
          };
          return {
            ...u,
            counts: nextCounts,
            last_vote_time: new Date().toISOString(),
          };
        }
        return u;
      })
    );
  };

  // 2. Hardware Simulator: Physical Reset Switch pressed inside bin body
  const triggerHardwareReset = () => {
    if (!hardware.isPowerOn) return;

    const nextSession = hardware.currentSessionId + 1;
    const resetEvent: TelemetryEvent = {
      unit_serial: hardware.serial,
      event_type: 'reset',
      sequence_number: Date.now(),
      device_timestamp: new Date().toISOString(),
      payload: { previous_session_id: hardware.currentSessionId, new_session_id: nextSession },
    };

    setHardware((prev) => ({
      ...prev,
      currentSessionId: nextSession,
      lcdCounts: { A: 0, B: 0, C: 0 },
      unacknowledgedEvents: [...prev.unacknowledgedEvents, resetEvent],
    }));

    // Zero current unit counts on unit
    setUnits((prev) =>
      prev.map((u) => {
        if (u.serial === hardware.serial) {
          return {
            ...u,
            current_session_id: nextSession,
            counts: { A: 0, B: 0 },
          };
        }
        return u;
      })
    );

    // Create an unbound session entry in admin bindings queue!
    const newUnbound: QuestionBinding = {
      id: `bind-unbound-${Date.now()}`,
      unit_serial: hardware.serial,
      deployment_id: 'dep-01',
      session_id: nextSession,
      start_time: new Date().toISOString(),
      source: 'unbound',
      confidence: 'None',
      recorded_by: 'Hardware Reset Switch',
      recorded_at: new Date().toISOString(),
      votes_count: 0,
      notes: `Reset switch pressed on ${hardware.serial} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Awaiting question assignment.`,
    };
    setBindings((prev) => [newUnbound, ...prev]);

    // Open confirmation prompt on merchant screen
    if (adminConfig.merchant_reset_confirm_prompt) {
      setResetPromptOpen(true);
    }
  };

  // 3. Hardware Simulator: Power cut & reboot
  const toggleHardwarePower = () => {
    const nextState = !hardware.isPowerOn;
    if (nextState) {
      const bootEvent: TelemetryEvent = {
        unit_serial: hardware.serial,
        event_type: 'power_on',
        sequence_number: Date.now(),
        device_timestamp: new Date().toISOString(),
        payload: { boot_id: hardware.bootId + 1 },
      };
      setHardware((prev) => ({
        ...prev,
        isPowerOn: true,
        bootId: prev.bootId + 1,
        unacknowledgedEvents: [...prev.unacknowledgedEvents, bootEvent],
      }));
    } else {
      setHardware((prev) => ({ ...prev, isPowerOn: false }));
    }
  };

  const toggleSensorStuck = () => {
    const nextFault = !hardware.isSensorStuck;
    setHardware((prev) => ({ ...prev, isSensorStuck: nextFault }));
    setUnits((prev) =>
      prev.map((u) => (u.serial === hardware.serial ? { ...u, current_status: nextFault ? 'Faulty' : 'Healthy' } : u))
    );
  };

  const toggleInRange = () => {
    setHardware((prev) => ({ ...prev, isInRange: !prev.isInRange }));
  };

  const setClockDrift = (sec: number) => {
    setHardware((prev) => ({ ...prev, clockDriftSec: sec }));
  };

  // 4. Two-Phase Courier Sync
  const startSync = async (overrideSerial?: string, roleOverride?: Role): Promise<boolean> => {
    const targetSerial = overrideSerial || selectedUnitSerial;
    const activeRole = roleOverride || role;

    // Check if target is in range
    if (!hardware.isInRange && targetSerial === hardware.serial) {
      const failedBatch: SyncBatch = {
        id: `sb-${Date.now().toString().slice(-4)}`,
        unit_serial: targetSerial,
        courier_phone: currentUser.phone,
        courier_name: activeRole === 'field_agent' ? 'Field Agent Courier' : currentUser.name,
        courier_role: activeRole,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        connection_type: 'BLE',
        event_count: 0,
        sequence_range: [0, 0],
        result: 'failed',
        failure_reason: 'Device not in range (RSSI timeout)',
        uploaded_to_server: isOnline,
      };
      setSyncBatches((prev) => [failedBatch, ...prev]);
      setSyncState({
        active: false,
        phase: 'failed',
        lastBatchCount: 0,
        showVictory: false,
      });
      return false;
    }

    setSyncState({
      active: true,
      phase: 'ble_connecting',
      lastBatchCount: 0,
      showVictory: false,
    });

    await new Promise((r) => setTimeout(r, 600));

    // Phase 2: Draining device ring buffer
    setSyncState((prev) => ({ ...prev, phase: 'draining_device' }));
    await new Promise((r) => setTimeout(r, 800));

    const eventsToDrain =
      hardware.serial === targetSerial ? hardware.unacknowledgedEvents : [];
    const eventCount = Math.max(eventsToDrain.length, 14);

    // Phase 3: Phone courier uploading to server or queuing in outbox
    setSyncState((prev) => ({ ...prev, phase: 'uploading_server' }));
    await new Promise((r) => setTimeout(r, 700));

    const newBatch: SyncBatch = {
      id: `sb-${Date.now().toString().slice(-4)}`,
      unit_serial: targetSerial,
      courier_phone: currentUser.phone,
      courier_name: activeRole === 'field_agent' ? 'Manoj Kumar (Field Agent)' : currentUser.name,
      courier_role: activeRole,
      start_time: new Date(Date.now() - 3000).toISOString(),
      end_time: new Date().toISOString(),
      connection_type: 'BLE',
      event_count: eventCount,
      sequence_range: [2000, 2000 + eventCount],
      result: 'success',
      uploaded_to_server: isOnline,
    };

    if (isOnline) {
      setSyncBatches((prev) => [newBatch, ...prev]);
    } else {
      // Offline outbox pattern
      setOutboxBatches((prev) => [...prev, newBatch]);
      setSyncBatches((prev) => [newBatch, ...prev]);
    }

    // Two-phase acknowledgment: clear device ring buffer
    if (hardware.serial === targetSerial) {
      setHardware((prev) => ({
        ...prev,
        unacknowledgedEvents: [],
        clockDriftSec: 0, // auto time_set
      }));
    }

    // Update unit status and sync time
    setUnits((prev) =>
      prev.map((u) => {
        if (u.serial === targetSerial) {
          return {
            ...u,
            last_sync_time: new Date().toISOString(),
            current_status: u.current_status === 'Silent' || u.current_status === 'Quiet' ? 'Healthy' : u.current_status,
          };
        }
        return u;
      })
    );

    setSyncState({
      active: false,
      phase: 'complete',
      lastBatchCount: eventCount,
      showVictory: true,
    });

    return true;
  };

  const dismissVictory = () => {
    setSyncState((prev) => ({ ...prev, showVictory: false }));
  };

  const dismissResetPrompt = (answer: 'yes' | 'no' | 'not_sure') => {
    setResetPromptOpen(false);
    // Find the latest unbound session for this unit
    if (answer === 'yes') {
      setBindings((prev) =>
        prev.map((b, idx) => {
          if (idx === 0 && b.unit_serial === hardware.serial && b.source === 'unbound') {
            return {
              ...b,
              source: 'merchant_confirmed',
              confidence: 'Medium-high',
              notes: 'Merchant confirmed question card was swapped at morning reset.',
            };
          }
          return b;
        })
      );
    }
  };

  const submitServiceTicket = (ticketData: Omit<ServiceTicket, 'id' | 'created_at' | 'status'>) => {
    const newTkt: ServiceTicket = {
      ...ticketData,
      id: `tkt-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      status: 'open',
    };
    setTickets((prev) => [newTkt, ...prev]);
  };

  const flushOutbox = () => {
    if (outboxBatches.length === 0) return;
    setOutboxBatches([]);
  };

  // Admin Actions
  const bindQuestion = (
    bindingId: string,
    questionId: string,
    source: BindingSource,
    confidence: BindingConfidence
  ) => {
    const targetQ = questions.find((q) => q.id === questionId);
    setBindings((prev) =>
      prev.map((b) => {
        if (b.id === bindingId) {
          return {
            ...b,
            question_id: questionId,
            source,
            confidence,
            recorded_by: 'Admin / Mukesh',
            recorded_at: new Date().toISOString(),
            notes: targetQ ? `Bound to question: ${targetQ.text.slice(0, 40)}...` : b.notes,
          };
        }
        return b;
      })
    );
  };

  const splitSession = (bindingId: string, splitIsoTime: string, newQuestionId: string) => {
    const original = bindings.find((b) => b.id === bindingId);
    if (!original) return;

    const part1Votes = Math.floor(original.votes_count * 0.6);
    const part2Votes = original.votes_count - part1Votes;

    const updatedOriginal: QuestionBinding = {
      ...original,
      end_time: splitIsoTime,
      votes_count: part1Votes,
      notes: `${original.notes || ''} [Split at ${splitIsoTime}]`,
    };

    const newBinding: QuestionBinding = {
      id: `bind-split-${Date.now()}`,
      unit_serial: original.unit_serial,
      deployment_id: original.deployment_id,
      session_id: original.session_id,
      question_id: newQuestionId,
      start_time: splitIsoTime,
      source: 'manual_backend',
      confidence: 'Medium',
      recorded_by: 'Admin (Split Tool)',
      recorded_at: new Date().toISOString(),
      votes_count: part2Votes,
      notes: 'Created via session split at paper card swap timestamp.',
    };

    setBindings((prev) => [newBinding, ...prev.map((b) => (b.id === bindingId ? updatedOriginal : b))]);
  };

  const mergeSessions = (bindingIds: string[], questionId: string) => {
    const toMerge = bindings.filter((b) => bindingIds.includes(b.id));
    if (toMerge.length === 0) return;

    const totalVotes = toMerge.reduce((acc, b) => acc + b.votes_count, 0);
    const firstBinding = toMerge[0];

    const mergedBinding: QuestionBinding = {
      id: `bind-merged-${Date.now()}`,
      unit_serial: firstBinding.unit_serial,
      deployment_id: firstBinding.deployment_id,
      session_id: firstBinding.session_id,
      question_id: questionId,
      start_time: firstBinding.start_time,
      source: 'manual_backend',
      confidence: 'Medium',
      recorded_by: 'Admin (Session Merge)',
      recorded_at: new Date().toISOString(),
      votes_count: totalVotes,
      notes: `Merged ${bindingIds.length} consecutive quick resets into single binding.`,
    };

    setBindings((prev) => [mergedBinding, ...prev.filter((b) => !bindingIds.includes(b.id))]);
  };

  const createQuestion = (qData: Omit<Question, 'id' | 'created_at'>) => {
    const newQ: Question = {
      ...qData,
      id: `q-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    setQuestions((prev) => [newQ, ...prev]);
  };

  const resolveTicket = (id: string, resolutionNotes: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              resolution_notes: resolutionNotes,
            }
          : t
      )
    );
  };

  const sendDeviceCommand = (serial: string, command: string, payload?: any) => {
    // signed device command queued
    if (command === 'SET_DEVICE_TIME' && serial === hardware.serial) {
      setHardware((prev) => ({ ...prev, clockDriftSec: 0 }));
    }
  };

  const updateAdminConfig = (partial: Partial<AdminConfig>) => {
    setAdminConfig((prev) => ({ ...prev, ...partial }));
  };

  // Admin Authentication Check
  const adminLogin = (userId: string, pw: string): boolean => {
    const cleanedId = userId.trim().toLowerCase();
    if ((cleanedId === 'lokeshnaraniya@gmail.com' || cleanedId === '7976718683') && pw === 'lokeshadmin') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('cc_admin_auth', 'true');
      setRole('admin');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('cc_admin_auth');
    setRole('merchant');
  };

  // Real ESP32 Wi-Fi Integration
  const syncWithESP32Device = async (
    customHtmlOrUrl?: string
  ): Promise<{
    success: boolean;
    countA?: number;
    countB?: number;
    total?: number;
    message?: string;
  }> => {
    setDeviceSyncStatus('connecting');
    setDeviceSyncError(null);

    try {
      let htmlText = '';
      if (customHtmlOrUrl && customHtmlOrUrl.trim()) {
        htmlText = customHtmlOrUrl;
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        try {
          const res = await fetch(deviceIp, { signal: controller.signal });
          clearTimeout(timeoutId);
          htmlText = await res.text();
        } catch (err: any) {
          clearTimeout(timeoutId);
          throw new Error(
            `Unable to fetch directly from ${deviceIp}. If phone is on HTTPS or browser blocks local HTTP, click 'OPEN' to view 192.168.4.1 in a tab, then copy/paste text into 'Sync Paste'.`
          );
        }
      }

      // Try JSON first (if user flashes the enhanced sketch)
      let parsedA = 0;
      let parsedB = 0;
      let found = false;

      try {
        const json = JSON.parse(htmlText);
        if (typeof json.countA === 'number' || typeof json.A === 'number') {
          parsedA = json.countA !== undefined ? json.countA : json.A;
          parsedB = json.countB !== undefined ? json.countB : json.B;
          found = true;
        }
      } catch {}

      // Fallback: Parse exact HTML from user's current sketch
      // <div class='box'>A = 12</div>
      // <div class='box'>B = 34</div>
      if (!found) {
        const matchA = htmlText.match(/A\s*=\s*(\d+)/i);
        const matchB = htmlText.match(/B\s*=\s*(\d+)/i);

        if (!matchA && !matchB) {
          throw new Error('Could not detect count format "A = [num]" or "B = [num]".');
        }

        parsedA = matchA ? parseInt(matchA[1], 10) : 0;
        parsedB = matchB ? parseInt(matchB[1], 10) : 0;
      }

      const total = parsedA + parsedB;

      // Update physical simulation & server unit
      setHardware((prev) => ({
        ...prev,
        lcdCounts: { A: parsedA, B: parsedB, C: 0 },
        isInRange: true,
      }));

      setUnits((prev) =>
        prev.map((u) => {
          if (u.serial === selectedUnitSerial || u.serial === 'CC-BIN-01') {
            return {
              ...u,
              counts: { A: parsedA, B: parsedB },
              last_sync_time: new Date().toISOString(),
              current_status: 'Healthy',
            };
          }
          return u;
        })
      );

      // Create sync batch record
      const newBatch: SyncBatch = {
        id: `sb-${Date.now().toString().slice(-4)}`,
        unit_serial: selectedUnitSerial,
        courier_phone: currentUser.phone,
        courier_name: currentUser.name,
        courier_role: role,
        start_time: new Date(Date.now() - 2000).toISOString(),
        end_time: new Date().toISOString(),
        connection_type: 'BLE',
        event_count: total,
        sequence_range: [1000, 1000 + total],
        result: 'success',
        uploaded_to_server: isOnline,
      };
      setSyncBatches((prev) => [newBatch, ...prev]);

      setDeviceSyncStatus('connected');
      return {
        success: true,
        countA: parsedA,
        countB: parsedB,
        total,
        message: `Connected & Synced! A: ${parsedA} · B: ${parsedB} (Total: ${total})`,
      };
    } catch (err: any) {
      setDeviceSyncStatus('error');
      setDeviceSyncError(err.message || 'Sync failed.');
      return {
        success: false,
        message: err.message || 'Sync failed.',
      };
    }
  };

  const resetESP32HardwareCounts = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      await fetch(`${deviceIp}/reset`, { signal: controller.signal, mode: 'no-cors' }).catch(() => {});
      clearTimeout(timeoutId);
    } catch {}

    setHardware((prev) => ({
      ...prev,
      lcdCounts: { A: 0, B: 0, C: 0 },
      currentSessionId: prev.currentSessionId + 1,
    }));

    setUnits((prev) =>
      prev.map((u) => {
        if (u.serial === selectedUnitSerial || u.serial === 'CC-BIN-01') {
          return {
            ...u,
            counts: { A: 0, B: 0 },
            current_session_id: u.current_session_id + 1,
          };
        }
        return u;
      })
    );
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        units,
        organisations,
        locations,
        deployments,
        questions,
        bindings,
        syncBatches,
        tickets,
        adminConfig,
        updateAdminConfig,
        isOnline,
        setIsOnline,
        outboxBatches,
        flushOutbox,
        selectedUnitSerial,
        setSelectedUnitSerial,
        selectedUnit,
        hardware,
        triggerHardwareVote,
        triggerHardwareReset,
        toggleHardwarePower,
        toggleSensorStuck,
        toggleInRange,
        setClockDrift,
        syncState,
        startSync,
        dismissVictory,
        resetPromptOpen,
        dismissResetPrompt,
        submitServiceTicket,
        isAdminAuthenticated,
        adminAuthModalOpen,
        setAdminAuthModalOpen,
        adminLogin,
        adminLogout,
        bindQuestion,
        splitSession,
        mergeSessions,
        createQuestion,
        resolveTicket,
        sendDeviceCommand,
        deviceWifiModalOpen,
        setDeviceWifiModalOpen,
        deviceIp,
        setDeviceIp,
        deviceSyncStatus,
        deviceSyncError,
        syncWithESP32Device,
        resetESP32HardwareCounts,
        isHardwareConnected,
        activeHardwareMethod,
        hardwareStatusMsg,
        hardwareIsError,
        connectDeviceBluetooth,
        connectDeviceSerial,
        disconnectDevice,
        sendHardwareReset,
        liveReading,
        connectedUnitSerial,
        addSavedQuestion,
        questionLibraryError,
        refreshQuestionLibrary,
        isMobileFrame,
        setIsMobileFrame,
        simulatorOpen,
        setSimulatorOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
