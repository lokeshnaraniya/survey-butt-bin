import React, { useEffect, useRef, useState } from 'react';
import {
  exportSurveyHistoryCsv,
  fetchSurveyHistory,
} from '../../services/surveyService';
import { SurveyHistoryFilter, SurveySnapshotRecord } from '../../types/survey';
import {
  Calendar,
  Database,
  Download,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';

export const SavedHistory: React.FC = () => {
  const [records, setRecords] = useState<SurveySnapshotRecord[]>([]);
  const [unitFilter, setUnitFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeFilters, setActiveFilters] = useState<SurveyHistoryFilter>({});
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [upperSequence, setUpperSequence] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const requestCounter = useRef(0);
  const inputClass =
    'w-full bg-white/80 border border-[#0E1E3C]/25 p-2 text-xs focus:border-[#F05A28] outline-none font-mono';

  const loadRecords = async (filters: SurveyHistoryFilter, isAppend = false) => {
    const currentReq = ++requestCounter.current;
    setLoading(true);
    setErrorMessage(null);

    if (!isAppend) {
      setActiveFilters(filters);
    }

    try {
      const res = await fetchSurveyHistory(
        filters,
        isAppend ? nextCursor ?? undefined : undefined,
        isAppend ? upperSequence : undefined
      );

      if (currentReq !== requestCounter.current) return;

      setRecords((prev) => (isAppend ? [...prev, ...res.records] : res.records));
      setNextCursor(res.nextCursor);
      if (!isAppend) {
        setUpperSequence(res.records[0]?.sequence);
      }
    } catch (err: any) {
      if (currentReq !== requestCounter.current) return;
      setErrorMessage(err instanceof Error ? err.message : 'History could not be loaded.');
    } finally {
      if (currentReq === requestCounter.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRecords({});
    return () => {
      requestCounter.current++;
    };
  }, []);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      setErrorMessage('The start date must be before the end date.');
      return;
    }
    setRecords([]);
    setStatusMessage(null);
    loadRecords({
      unit: unitFilter.trim() || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    });
  };

  const handleExport = async () => {
    setExporting(true);
    setExportCount(0);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await exportSurveyHistoryCsv(activeFilters, setExportCount);
      setStatusMessage(
        'CSV downloaded with all matching saves, including older records. Open it in Excel or import it into Google Sheets.'
      );
    } catch (err: any) {
      setErrorMessage(err instanceof Error ? err.message : 'Export failed. Please retry.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-4 select-text" aria-label="Saved survey history">
      {/* Top Banner */}
      <div className="border border-[#0E1E3C]/30 bg-white/70 p-4 flex flex-wrap items-start justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#1F8F82]" />
            <h2 className="font-michroma text-sm uppercase text-[#0E1E3C] tracking-wide">
              SAVED QUESTION-WISE HISTORY
            </h2>
          </div>
          <p className="text-xs mt-1.5 max-w-xl text-[#0E1E3C]/80 leading-relaxed font-archivo">
            Real saved records from the database. Every save is retained with its original question and option labels. These are cumulative snapshots captured directly from physical and virtual survey bins.
          </p>
        </div>

        <button
          type="button"
          disabled={exporting || loading}
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#1F8F82] hover:bg-[#18756a] active:scale-98 text-white py-2.5 px-4 font-mono text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? `EXPORTING ${exportCount} RECORDS…` : 'DOWNLOAD ALL MATCHING CSV'}</span>
        </button>
      </div>

      {/* Filter Form */}
      <form
        onSubmit={handleApplyFilter}
        className="grid sm:grid-cols-2 lg:grid-cols-4 items-end gap-3 border border-[#0E1E3C]/20 p-3 bg-white/50"
      >
        <label className="text-[11px] font-mono">
          <span className="text-[#0E1E3C]/70 font-bold block mb-1">UNIT SERIAL</span>
          <input
            value={unitFilter}
            maxLength={100}
            onChange={(e) => setUnitFilter(e.target.value)}
            placeholder="e.g. CC-BIN-01"
            className={inputClass}
          />
        </label>

        <label className="text-[11px] font-mono">
          <span className="text-[#0E1E3C]/70 font-bold block mb-1">SAVED FROM (UTC)</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="text-[11px] font-mono">
          <span className="text-[#0E1E3C]/70 font-bold block mb-1">SAVED THROUGH (UTC)</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={loading || exporting}
          className="flex items-center justify-center gap-2 py-2.5 bg-[#0E1E3C] hover:bg-[#16336E] text-[#F2EAD6] text-xs font-mono font-bold uppercase disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>APPLY / REFRESH</span>
        </button>
      </form>

      {/* Notifications */}
      {errorMessage && (
        <div role="alert" className="border-2 border-[#F05A28] bg-[#F05A28]/10 p-3 text-xs text-[#a8320c] font-mono font-bold flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            disabled={loading}
            onClick={() => loadRecords(activeFilters)}
            className="underline ml-2 cursor-pointer"
          >
            Retry loading
          </button>
        </div>
      )}

      {statusMessage && (
        <div role="status" className="p-3 bg-[#1F8F82]/10 border border-[#1F8F82] text-xs font-mono text-[#18756a] font-bold">
          {statusMessage}
        </div>
      )}

      {/* Records Table */}
      {loading && records.length === 0 ? (
        <div role="status" className="space-y-2" aria-label="Loading saved records">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-[#0E1E3C]/10 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 && !errorMessage ? (
        <div className="text-center border-2 border-dashed border-[#0E1E3C]/30 bg-white/40 p-8">
          <Database className="w-8 h-8 mx-auto text-[#1F8F82] mb-3" />
          <h3 className="font-michroma text-xs text-[#0E1E3C] uppercase">NO SAVED READINGS YET</h3>
          <p className="text-xs text-[#0E1E3C]/75 mt-1 max-w-md mx-auto">
            Connect an ESP32 in the Live Survey panel, select or write its question, then click "SAVE READING WITH QUESTION".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-[#0E1E3C]/25 bg-white shadow-xs">
            <table className="w-full min-w-[820px] text-xs text-left font-archivo">
              <thead className="bg-[#0E1E3C] text-[#F2EAD6] font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">SAVE / UNIT</th>
                  <th className="p-3">QUESTION</th>
                  <th className="p-3">OPTION A / COUNT</th>
                  <th className="p-3">OPTION B / COUNT</th>
                  <th className="p-3">TOTAL</th>
                  <th className="p-3">READING / SAVED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0E1E3C]/15">
                {records.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-[#0E1E3C]/5 hover:bg-[#7FD8E8]/10 align-top">
                    <td className="p-3 font-mono">
                      <span className="text-[#1F8F82] font-bold">#{r.sequence}</span>
                      <br />
                      <strong className="text-[#0E1E3C]">{r.unitSerial}</strong>
                      <div className="text-[10px] text-[#0E1E3C]/60 mt-1 uppercase">
                        {r.deviceName} · {r.connectionMethod}
                      </div>
                    </td>
                    <td className="p-3 max-w-xs break-words whitespace-pre-wrap font-semibold text-[#0E1E3C]">
                      {r.questionText}
                    </td>
                    <td className="p-3 font-mono">
                      <div className="break-words max-w-[160px] text-[11px] text-[#0E1E3C]/80 font-archivo">
                        {r.optionA}
                      </div>
                      <strong className="font-mono text-lg text-[#1F8F82]">{r.countA}</strong>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="break-words max-w-[160px] text-[11px] text-[#0E1E3C]/80 font-archivo">
                        {r.optionB}
                      </div>
                      <strong className="font-mono text-lg text-[#F05A28]">{r.countB}</strong>
                    </td>
                    <td className="p-3 font-mono font-bold text-base text-[#0E1E3C]">
                      {r.countA + r.countB}
                    </td>
                    <td className="p-3 whitespace-nowrap text-[10px] font-mono text-[#0E1E3C]/80">
                      <div>Read: {new Date(r.capturedAt).toLocaleString()}</div>
                      <div className="text-[#1F8F82] font-semibold mt-0.5">
                        Saved: {new Date(r.savedAt).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 text-xs font-mono text-[#0E1E3C]/80">
            <span>
              {records.length} saved records loaded · Times shown in your local timezone
            </span>
            {nextCursor !== null && (
              <button
                type="button"
                disabled={loading || exporting}
                onClick={() => loadRecords(activeFilters, true)}
                className="border border-[#0E1E3C]/40 bg-white py-1.5 px-3 font-mono text-xs font-bold uppercase hover:bg-[#0E1E3C] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'LOADING…' : 'LOAD OLDER SAVES'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
