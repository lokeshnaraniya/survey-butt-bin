import {
  SaveSurveyPayload,
  SurveyHistoryFilter,
  SurveyHistoryResponse,
  SurveyQuestion,
  SurveySnapshotRecord,
} from '../types/survey';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    signal: AbortSignal.timeout(20000),
    ...init,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status}). Please retry.`);
  }
  if (!json) {
    throw new Error('Server response was not confirmed. Please retry.');
  }
  return json as T;
}

export async function fetchSurveyQuestions(): Promise<{ questions: SurveyQuestion[] }> {
  return requestJson<{ questions: SurveyQuestion[] }>('/api/survey/questions');
}

export async function saveSurveySnapshot(
  payload: SaveSurveyPayload
): Promise<{ success: boolean; record: SurveySnapshotRecord; question: SurveyQuestion }> {
  return requestJson<{ success: boolean; record: SurveySnapshotRecord; question: SurveyQuestion }>(
    '/api/survey/save',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

export async function createSurveyQuestion(
  question: Omit<SurveyQuestion, 'id' | 'createdAt'>
): Promise<{ success: boolean; question: SurveyQuestion }> {
  return requestJson<{ success: boolean; question: SurveyQuestion }>(
    '/api/survey/questions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    }
  );
}

export async function fetchSurveyHistory(
  filters: SurveyHistoryFilter,
  cursor?: number,
  upperSequence?: number
): Promise<SurveyHistoryResponse> {
  const params = new URLSearchParams();
  if (filters.unit) params.set('unit', filters.unit);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (cursor !== undefined) params.set('cursor', String(cursor));
  if (upperSequence !== undefined) params.set('upperSequence', String(upperSequence));

  return requestJson<SurveyHistoryResponse>(`/api/survey/history?${params.toString()}`);
}

function escapeCsvField(val: string | number): string {
  const s = String(val);
  const sanitized = /^[\s]*[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${sanitized.replaceAll('"', '""')}"`;
}

export function generateSurveyHistoryCsv(records: SurveySnapshotRecord[]): string {
  const headers = [
    'Save ID',
    'Unit serial',
    'Device name',
    'Question ID',
    'Question',
    'Option A',
    'A count',
    'Option B',
    'B count',
    'Total',
    'Connection',
    'Reading time (UTC)',
    'Saved time (UTC)',
  ];

  const rows = records.map((r) => [
    r.id,
    r.unitSerial,
    r.deviceName,
    r.questionId,
    r.questionText,
    r.optionA,
    r.countA,
    r.optionB,
    r.countB,
    r.countA + r.countB,
    r.connectionMethod,
    r.capturedAt,
    r.savedAt,
  ]);

  return (
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map(escapeCsvField).join(','))
      .join('\r\n')
  );
}

export async function exportSurveyHistoryCsv(
  filters: SurveyHistoryFilter,
  onProgress: (loaded: number) => void
): Promise<void> {
  const allRecords: SurveySnapshotRecord[] = [];
  let nextCursor: number | undefined;
  let upperSeq: number | undefined;

  do {
    const res = await fetchSurveyHistory(filters, nextCursor, upperSeq);
    if (upperSeq === undefined && res.records.length > 0) {
      upperSeq = res.records[0].sequence;
    }
    allRecords.push(...res.records);
    onProgress(allRecords.length);
    nextCursor = res.nextCursor ?? undefined;
  } while (nextCursor !== undefined);

  if (allRecords.length === 0) {
    throw new Error('No saved records match these filters.');
  }

  const csv = generateSurveyHistoryCsv(allRecords);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `question-wise-history-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
