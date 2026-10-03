/**
 * Code & Circuit App — Data Models & Types
 * Cosmic Workshop Standard CW-01
 */

export type Role = 'super_admin' | 'admin' | 'field_agent' | 'merchant' | 'player' | 'student';

export type UnitHealth = 'Healthy' | 'Quiet' | 'Silent' | 'Faulty' | 'Unassigned' | 'Retired';

export type EventType =
  | 'vote'
  | 'power_on'
  | 'power_off'
  | 'heartbeat'
  | 'session_open'
  | 'session_close'
  | 'reset'
  | 'time_set'
  | 'sync_start'
  | 'sync_end'
  | 'fault';

export interface TelemetryEvent {
  unit_serial: string;
  event_type: EventType;
  sequence_number: number;
  device_timestamp: string; // ISO string from RTC
  server_receive_time?: string;
  payload: Record<string, any>;
  sync_batch_id?: string;
  courier_phone_id?: string;
  courier_name?: string;
}

export interface UnitConfig {
  serial: string;
  number_of_holes: 2 | 3;
  hole_labels: {
    A: string;
    B: string;
    C?: string;
  };
  lcd_enabled: boolean;
  reset_behaviour: 'zero_session' | 'zero_lifetime';
  heartbeat_interval_min: number;
}

export interface Unit {
  serial: string;
  product_type: string;
  hardware_revision: string;
  firmware_version: string;
  per_device_secret: string;
  assembly_date: string;
  current_status: UnitHealth;
  parent_unit?: string | null;
  battery_level: number; // percentage
  power_source: 'mains' | 'battery';
  clock_drift_ms: number;
  last_sync_time: string;
  last_power_on: string;
  last_vote_time: string;
  current_session_id: number;
  storage_fill_pct: number;
  // Current session counts
  counts: {
    A: number;
    B: number;
    C?: number;
  };
  // Deployment metadata
  location_id?: string;
  org_id?: string;
}

export interface Organisation {
  id: string;
  name: string;
  contact_phone: string;
  contact_person: string;
  type: 'shop' | 'cafe' | 'institute';
  onboarding_date: string;
  status: 'active' | 'pending' | 'inactive';
}

export interface Location {
  id: string;
  org_id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photo_url?: string;
  area_locality_tag: string; // e.g. "Rangbari", "Talwandi", "Vigyan Nagar"
  descriptor: string; // e.g. "Outside main gate, left of counter"
}

export interface Deployment {
  id: string;
  unit_serial: string;
  location_id: string;
  installed_date: string;
  removed_date?: string;
  installed_by: string;
  notes: string;
  photo_url?: string;
  active: boolean;
}

export interface SyncBatch {
  id: string;
  unit_serial: string;
  courier_phone: string;
  courier_name: string;
  courier_role: Role;
  start_time: string;
  end_time: string;
  connection_type: 'BLE';
  event_count: number;
  sequence_range: [number, number];
  result: 'success' | 'failed' | 'partial';
  failure_reason?: string;
  uploaded_to_server: boolean;
}

export interface QuestionOption {
  hole_id: 'A' | 'B' | 'C';
  label: string;
}

export interface Question {
  id: string;
  text: string;
  language: 'Hindi' | 'English';
  options: QuestionOption[];
  category: 'Education' | 'Civic' | 'Commerce' | 'Youth' | 'Lifestyle';
  active_start: string;
  active_end: string;
  author: string;
  created_at: string;
}

export type BindingSource =
  | 'device_command'
  | 'manual_backend'
  | 'merchant_confirmed'
  | 'inferred'
  | 'unbound';

export type BindingConfidence = 'High' | 'Medium-high' | 'Medium' | 'Low' | 'None';

export interface QuestionBinding {
  id: string;
  unit_serial: string;
  deployment_id: string;
  question_id?: string;
  session_id: number;
  start_time: string;
  end_time?: string;
  source: BindingSource;
  confidence: BindingConfidence;
  recorded_by: string;
  recorded_at: string;
  hole_mapping_override?: Record<string, string>;
  votes_count: number;
  notes?: string;
}

export interface ServiceTicket {
  id: string;
  unit_serial: string;
  location_name: string;
  merchant_name: string;
  merchant_phone: string;
  issue_type: 'bin_full' | 'bin_damaged' | 'counter_wrong' | 'card_torn' | 'bin_moved' | 'other';
  notes: string;
  photo_url?: string;
  voice_note_present?: boolean;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface AdminConfig {
  pilot_bin_count: number;
  pilot_start_date: string;
  pilot_end_date: string;
  heartbeat_interval_min: number;
  storage_retention_days: number;
  storage_fill_warning_pct: number;
  clock_drift_tolerance_sec: number;
  min_sensor_gap_ms: number;
  lcd_display_mode: 'session' | 'lifetime';
  target_syncs_per_merchant_day: number;
  silent_threshold_hours: number;
  scan_duration_sec: number;
  max_unsent_batches: number;
  sync_on_foreground: boolean;
  unbound_session_max_hours: number;
  merchant_reset_confirm_prompt: boolean;
  default_manual_confidence: BindingConfidence;
  include_low_confidence_in_reports: boolean;
  max_notifications_per_day: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  merchants_see_leaderboard: boolean;
  vote_rate_drop_alert_pct: number;
}
