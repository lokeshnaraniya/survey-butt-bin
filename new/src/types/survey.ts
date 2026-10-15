export interface SurveyQuestion {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  language?: string;
  category?: string;
  author?: string;
  activeStart?: string;
  activeEnd?: string;
  createdAt: string;
}

export interface SurveySnapshotRecord {
  sequence: number;
  id: string;
  unitSerial: string;
  deviceName: string;
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  countA: number;
  countB: number;
  connectionMethod: string;
  capturedAt: string;
  savedAt: string;
}

export interface SaveSurveyPayload {
  id: string;
  unitSerial: string;
  deviceName: string;
  questionText: string;
  optionA: string;
  optionB: string;
  countA: number;
  countB: number;
  connectionMethod: string;
  capturedAt: string;
}

export interface SurveyHistoryFilter {
  unit?: string;
  from?: string;
  to?: string;
}

export interface SurveyHistoryResponse {
  records: SurveySnapshotRecord[];
  nextCursor: number | null;
}

export interface LiveReading {
  countA: number;
  countB: number;
  total: number;
  unitSerial: string;
  deviceName: string;
  receivedAt: string;
}

