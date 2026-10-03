import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DimensionLine,
  OrbitRing,
  RubberStamp,
} from '../common/CosmicWorkshopComponents';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Cpu,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  MapPin,
  Plus,
  Printer,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sliders,
  Split,
  Store,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { SAMPLE_HOURLY_FOOTFALL } from '../../services/mockData';
import { BindingConfidence, BindingSource, UnitHealth } from '../../types';
import { SavedHistory } from './SavedHistory';

export const AdminDashboard: React.FC = () => {
  const {
    units,
    questions,
    bindings,
    organisations,
    locations,
    syncBatches,
    tickets,
    adminConfig,
    updateAdminConfig,
    bindQuestion,
    splitSession,
    mergeSessions,
    createQuestion,
    resolveTicket,
    sendDeviceCommand,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'history' | 'unbound' | 'fleet' | 'questions' | 'reports' | 'merchants' | 'config'
  >('history');

  // Filter states for fleet
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [localityFilter, setLocalityFilter] = useState<string>('all');
  const [selectedUnitSerial, setSelectedUnitSerial] = useState<string | null>(null);

  // Unbound binding modal
  const [bindingModalOpen, setBindingModalOpen] = useState(false);
  const [selectedBindingId, setSelectedBindingId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(questions[0]?.id || '');
  const [bindingSource, setBindingSource] = useState<BindingSource>('manual_backend');
  const [bindingConfidence, setBindingConfidence] = useState<BindingConfidence>('Medium');

  // Split tool modal
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitBindingId, setSplitBindingId] = useState<string | null>(null);
  const [splitTimestamp, setSplitTimestamp] = useState('14:30');
  const [splitNewQuestionId, setSplitNewQuestionId] = useState<string>(questions[1]?.id || '');

  // New question form
  const [newQuestionModalOpen, setNewQuestionModalOpen] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQLang, setNewQLang] = useState<'Hindi' | 'English'>('Hindi');
  const [newQCategory, setNewQCategory] = useState<
    'Education' | 'Civic' | 'Commerce' | 'Youth' | 'Lifestyle'
  >('Civic');
  const [newQOptionA, setNewQOptionA] = useState('हाँ / YES');
  const [newQOptionB, setNewQOptionB] = useState('नहीं / NO');

  // Question Card Bulk Print preview
  const [printCardModalOpen, setPrintCardModalOpen] = useState(false);
  const [printCardQuestion, setPrintCardQuestion] = useState(questions[0]);

  // Selected unit for detail view
  const unitDetail = units.find((u) => u.serial === selectedUnitSerial);

  // Compute fleet metrics
  const totalBins = units.length;
  const reportingToday = units.filter(
    (u) =>
      u.last_sync_time &&
      new Date(u.last_sync_time).toDateString() === new Date().toDateString()
  ).length;
  const silentBins = units.filter((u) => u.current_status === 'Silent').length;
  const faultyBins = units.filter((u) => u.current_status === 'Faulty').length;
  const totalVotesToday = units.reduce((acc, u) => acc + (u.counts.A + u.counts.B), 0);
  const unboundCount = bindings.filter((b) => b.source === 'unbound').length;

  const handleOpenBindingModal = (bindingId: string) => {
    setSelectedBindingId(bindingId);
    setBindingModalOpen(true);
  };

  const handleConfirmBinding = () => {
    if (!selectedBindingId) return;
    bindQuestion(selectedBindingId, selectedQuestionId, bindingSource, bindingConfidence);
    setBindingModalOpen(false);
    setSelectedBindingId(null);
  };

  const handleConfirmSplit = () => {
    if (!splitBindingId) return;
    const nowIso = new Date().toISOString();
    splitSession(splitBindingId, nowIso, splitNewQuestionId);
    setSplitModalOpen(false);
    setSplitBindingId(null);
  };

  const handleCreateQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuestion({
      text: newQText,
      language: newQLang,
      category: newQCategory,
      options: [
        { hole_id: 'A', label: newQOptionA },
        { hole_id: 'B', label: newQOptionB },
      ],
      active_start: '2026-10-01',
      active_end: '2026-10-20',
      author: 'Admin Team (Web Console)',
    });
    setNewQuestionModalOpen(false);
    setNewQText('');
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Unit_Serial,Location,Session,Hole_A_Votes,Hole_B_Votes,Total_Votes,Status,Last_Sync\n' +
      units
        .map(
          (u) =>
            `${u.serial},${u.location_id || 'N/A'},${u.current_session_id},${u.counts.A},${
              u.counts.B
            },${u.counts.A + u.counts.B},${u.current_status},${u.last_sync_time}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `survey_bin_pilot_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered fleet
  const filteredUnits = units.filter((u) => {
    if (healthFilter !== 'all' && u.current_status !== healthFilter) return false;
    if (localityFilter !== 'all') {
      const loc = locations.find((l) => l.id === u.location_id);
      if (loc?.area_locality_tag !== localityFilter) return false;
    }
    return true;
  });

  return (
    <div className="min-h-full bg-[#F2EAD6] text-[#0E1E3C] font-archivo pb-20 selection:bg-[#F05A28] selection:text-white">
      {/* Top Admin Bar on Hangar Navy */}
      <div className="bg-[#0E1E3C] text-[#F2EAD6] border-b-2 border-[#7FD8E8] px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <CodeCircuitLogo size={32} strokeColor="#F2EAD6" sparkColor="#7FD8E8" />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-michroma text-sm uppercase tracking-wider text-[#F2EAD6]">
                  PILOT MISSION CONTROL
                </h1>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#16336E] text-[#7FD8E8] border border-[#7FD8E8]/40">
                  STANDARD CW-01
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#7FD8E8]/80">
                KOTA PILOT · 8 PHYSICAL BINS · FLEET TELEMETRY
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-4 font-mono text-xs">
            <div className="text-right">
              <span className="block text-[9px] text-[#7FD8E8] uppercase">TODAY'S VOTES</span>
              <span className="text-[#F2B33D] font-bold text-sm">{totalVotesToday}</span>
            </div>
            <div className="h-6 w-px bg-[#7FD8E8]/30" />
            <div className="text-right">
              <span className="block text-[9px] text-[#7FD8E8] uppercase">REPORTING BINS</span>
              <span className="text-[#1F8F82] font-bold text-sm">
                {reportingToday}/{totalBins}
              </span>
            </div>
            <div className="h-6 w-px bg-[#7FD8E8]/30" />
            <div className="text-right">
              <span className="block text-[9px] text-[#7FD8E8] uppercase">UNBOUND QUEUE</span>
              <span
                className={`font-bold text-sm px-1.5 py-0.2 ${
                  unboundCount > 0 ? 'bg-[#F05A28] text-white' : 'text-[#7FD8E8]'
                }`}
              >
                {unboundCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="bg-[#0E1E3C] border-b border-[#7FD8E8]/30 px-4">
        <div className="max-w-6xl mx-auto flex space-x-1 overflow-x-auto py-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 px-3 border-b-2 font-bold uppercase transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-[#7FD8E8] text-[#7FD8E8] bg-[#16336E]/60'
                : 'border-transparent text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#1F8F82]" />
            <span>SAVED HISTORY</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unbound')}
            className={`py-2 px-3 border-b-2 font-bold uppercase transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'unbound'
                ? 'border-[#F05A28] text-[#F05A28] bg-[#16336E]/60'
                : 'border-transparent text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
            }`}
          >
            <span>UNBOUND QUEUE</span>
            {unboundCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#F05A28] text-white text-[10px] font-bold">
                {unboundCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`py-2 px-3 border-b-2 font-bold uppercase transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'fleet'
                ? 'border-[#7FD8E8] text-[#7FD8E8] bg-[#16336E]/60'
                : 'border-transparent text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>FLEET & HEALTH</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-3 border-b-2 font-bold uppercase transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'questions'
                ? 'border-[#7FD8E8] text-[#7FD8E8] bg-[#16336E]/60'
                : 'border-transparent text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>QUESTION LIBRARY</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-3 border-b-2 font-bold uppercase transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-[#7FD8E8] text-[#7FD8E8] bg-[#16336E]/60'
                : 'border-transparent text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>FOOTFALL & REPORTS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('merchants')}
            className={`py-2 px-3 border-b-2 font-bold uppercase transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'merchants'
                ? 'border-[#7FD8E8] text-[#7FD8E8] bg-[#16336E]/60'
                : 'border-transparent text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>MERCHANT PERFORMANCE</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-2 px-3 border-b-2 font-bold uppercase transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-[#7FD8E8] text-[#7FD8E8] bg-[#16336E]/60'
                : 'border-transparent text-[#F2EAD6]/70 hover:text-[#F2EAD6]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>PILOT CONFIG</span>
          </button>
        </div>
      </div>

      {/* Main Content Area in Launchpad Cream */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* ================= TAB 0: SAVED HISTORY ================= */}
        {activeTab === 'history' && <SavedHistory />}

        {/* ================= TAB 1: UNBOUND SESSION QUEUE (Section 10 & 16) ================= */}
        {activeTab === 'unbound' && (
          <div className="space-y-4">
            <div className="border-2 border-[#0E1E3C] bg-white/70 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#0E1E3C]/20 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-michroma text-base text-[#0E1E3C] uppercase tracking-wide">
                      THE UNBOUND SESSION QUEUE
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 bg-[#F05A28] text-white font-bold">
                      ADMIN'S DAILY JOB
                    </span>
                  </div>
                  <p className="font-archivo text-xs text-[#0E1E3C]/80 mt-1 max-w-2xl">
                    Bins count votes on physical paper cards without internet. When a merchant resets the bin, a new session is minted. You must bind newly reported sessions to the physical question card active during that timeframe.
                  </p>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="text-[#0E1E3C]/70">PENDING BINDINGS:</span>
                  <span className="font-bold text-lg text-[#F05A28]">{unboundCount}</span>
                </div>
              </div>

              {/* Unbound Queue Items */}
              <div className="mt-4 space-y-3">
                {bindings
                  .filter((b) => b.source === 'unbound')
                  .map((b) => {
                    const u = units.find((item) => item.serial === b.unit_serial);
                    const loc = locations.find((l) => l.id === u?.location_id);

                    return (
                      <div
                        key={b.id}
                        className="border-2 border-[#F05A28] bg-[#F05A28]/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-[#0E1E3C]">
                              {b.unit_serial}
                            </span>
                            <span className="font-mono text-xs text-[#0E1E3C]/60">·</span>
                            <span className="font-mono text-xs text-[#0E1E3C]/80">
                              SESSION #{b.session_id}
                            </span>
                            <RubberStamp status="PENDING" size="sm" />
                          </div>

                          <div className="font-archivo text-xs text-[#0E1E3C] font-semibold mt-1">
                            {loc?.name || 'Assigned Location'} ({loc?.area_locality_tag || 'Kota'})
                          </div>

                          <div className="font-mono text-[11px] text-[#0E1E3C]/70 mt-1">
                            Reset event at {new Date(b.start_time).toLocaleString()} · {b.votes_count} votes logged so far
                          </div>

                          {b.notes && (
                            <div className="font-archivo text-xs text-[#F05A28] mt-1 italic">
                              "{b.notes}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenBindingModal(b.id)}
                            className="py-2 px-3 bg-[#1F8F82] hover:bg-[#18756a] text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                          >
                            BIND QUESTION NOW
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {unboundCount === 0 && (
                  <div className="p-8 text-center border border-dashed border-[#0E1E3C]/30 bg-white/40">
                    <CheckCircle2 className="w-8 h-8 text-[#1F8F82] mx-auto mb-2" />
                    <h3 className="font-michroma text-xs uppercase text-[#0E1E3C]">
                      QUEUE CLEAR · ALL SESSIONS BOUND
                    </h3>
                    <p className="font-archivo text-xs text-[#0E1E3C]/70 mt-1">
                      Data quality intact. Every recorded vote is mapped to an authoritative question card.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Bindings Audit Table */}
            <div className="border border-[#0E1E3C]/30 bg-white/60 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-[#0E1E3C]/10 pb-2">
                <h3 className="font-michroma text-xs uppercase text-[#0E1E3C]">
                  ALL ACTIVE & ARCHIVED SESSION BINDINGS ({bindings.length})
                </h3>
                <span className="font-mono text-[10px] text-[#0E1E3C]/60">
                  CONFIDENCE LOCK ACTIVE
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#0E1E3C]/5 text-[10px] uppercase border-b border-[#0E1E3C]/20">
                    <tr>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Session</th>
                      <th className="p-2">Question Bound</th>
                      <th className="p-2">Votes</th>
                      <th className="p-2">Source</th>
                      <th className="p-2">Confidence</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0E1E3C]/10">
                    {bindings.map((b) => {
                      const q = questions.find((item) => item.id === b.question_id);
                      return (
                        <tr key={b.id} className="hover:bg-white/80">
                          <td className="p-2 font-bold">{b.unit_serial}</td>
                          <td className="p-2">#{b.session_id}</td>
                          <td className="p-2 max-w-xs truncate" title={q?.text}>
                            {q ? q.text : <span className="text-[#F05A28]">Unbound</span>}
                          </td>
                          <td className="p-2 font-bold">{b.votes_count}</td>
                          <td className="p-2 uppercase text-[10px]">{b.source}</td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold ${
                                b.confidence === 'High' || b.confidence === 'Medium-high'
                                  ? 'bg-[#1F8F82]/20 text-[#1F8F82]'
                                  : b.confidence === 'Medium'
                                  ? 'bg-[#F2B33D]/30 text-[#0E1E3C]'
                                  : 'bg-[#F05A28]/20 text-[#F05A28]'
                              }`}
                            >
                              {b.confidence}
                            </span>
                          </td>
                          <td className="p-2 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSplitBindingId(b.id);
                                setSplitModalOpen(true);
                              }}
                              title="Split session if card was swapped without reset"
                              className="px-2 py-0.5 border border-[#0E1E3C]/30 hover:bg-[#0E1E3C] hover:text-[#F2EAD6] text-[10px] font-mono cursor-pointer"
                            >
                              SPLIT
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: FLEET & HEALTH (Section 6, 8 & 9) ================= */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border border-[#0E1E3C]/30 bg-white/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#0E1E3C] flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> STATUS:
                </span>
                {['all', 'Healthy', 'Quiet', 'Silent', 'Faulty', 'Unassigned', 'Retired'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setHealthFilter(st)}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase cursor-pointer border ${
                      healthFilter === st
                        ? 'bg-[#0E1E3C] text-[#F2EAD6] border-[#0E1E3C]'
                        : 'bg-white border-[#0E1E3C]/30 text-[#0E1E3C] hover:bg-[#0E1E3C]/10'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#0E1E3C]">LOCALITY:</span>
                <select
                  value={localityFilter}
                  onChange={(e) => setLocalityFilter(e.target.value)}
                  className="bg-white border border-[#0E1E3C]/30 px-2 py-1 text-xs font-mono"
                >
                  <option value="all">ALL LOCALITIES</option>
                  <option value="Rangbari">Rangbari</option>
                  <option value="Talwandi">Talwandi</option>
                  <option value="Vigyan Nagar">Vigyan Nagar</option>
                  <option value="Gumanpura">Gumanpura</option>
                </select>
              </div>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredUnits.map((u) => {
                const loc = locations.find((l) => l.id === u.location_id);
                const isSelected = selectedUnitSerial === u.serial;

                return (
                  <div
                    key={u.serial}
                    onClick={() => setSelectedUnitSerial(u.serial)}
                    className={`border-2 p-4 bg-white cursor-pointer transition-all hover:border-[#F05A28] ${
                      isSelected
                        ? 'border-[#0E1E3C] shadow-lg ring-2 ring-[#7FD8E8]'
                        : 'border-[#0E1E3C]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between border-b border-[#0E1E3C]/10 pb-2">
                      <div>
                        <h4 className="font-michroma text-xs uppercase font-bold text-[#0E1E3C]">
                          {u.serial}
                        </h4>
                        <span className="font-mono text-[10px] text-[#0E1E3C]/70">
                          {u.hardware_revision} · {u.firmware_version}
                        </span>
                      </div>
                      <RubberStamp
                        status={
                          u.current_status === 'Healthy'
                            ? 'HEALTHY'
                            : u.current_status === 'Silent'
                            ? 'SILENT'
                            : u.current_status === 'Faulty'
                            ? 'FAULTY'
                            : 'PENDING'
                        }
                        size="sm"
                      />
                    </div>

                    <div className="my-2 space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#0E1E3C]/70">LOCALITY:</span>
                        <span className="font-bold">{loc?.area_locality_tag || 'UNASSIGNED'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0E1E3C]/70">TODAY COUNTS:</span>
                        <span className="font-bold text-[#0E1E3C]">
                          A:{u.counts.A} · B:{u.counts.B}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0E1E3C]/70">SESSION:</span>
                        <span>#{u.current_session_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0E1E3C]/70">POWER / BAT:</span>
                        <span className={u.battery_level < 20 ? 'text-[#F05A28] font-bold' : ''}>
                          {u.power_source === 'mains' ? 'MAINS' : `${u.battery_level}%`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#0E1E3C]/10 flex items-center justify-between text-[10px] font-mono text-[#0E1E3C]/80">
                      <span>SYNC: {new Date(u.last_sync_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[#1F8F82] font-bold">VIEW TELEMETRY ►</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unit Detail Drawer / Inspector */}
            {unitDetail && (
              <div className="border-2 border-[#0E1E3C] bg-white p-5 shadow-xl animate-in fade-in duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#0E1E3C]/20 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-michroma text-sm uppercase text-[#0E1E3C]">
                        UNIT DETAIL: {unitDetail.serial}
                      </h3>
                      <RubberStamp
                        status={unitDetail.current_status === 'Healthy' ? 'HEALTHY' : 'PENDING'}
                        size="sm"
                      />
                    </div>
                    <span className="font-mono text-xs text-[#0E1E3C]/70">
                      SECRET HASH: [MINTED_SHA256_HIDDEN] · ASSEMBLED: {unitDetail.assembly_date}
                    </span>
                  </div>

                  {/* Remote Signed Commands (Section 10 & 13) */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => sendDeviceCommand(unitDetail.serial, 'SET_DEVICE_TIME')}
                      className="py-1.5 px-3 bg-[#0E1E3C] text-[#F2EAD6] font-mono text-xs uppercase hover:bg-[#16336E] cursor-pointer"
                    >
                      SYNC RTC CLOCK
                    </button>
                    <button
                      type="button"
                      onClick={() => alert(`Command queued for ${unitDetail.serial}: ZERO_SESSION`)}
                      className="py-1.5 px-3 border border-[#F05A28] text-[#F05A28] hover:bg-[#F05A28] hover:text-white font-mono text-xs uppercase cursor-pointer"
                    >
                      QUEUE RESET
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUnitSerial(null)}
                      className="p-1 text-[#0E1E3C] hover:bg-[#0E1E3C]/10 text-xs font-mono font-bold cursor-pointer"
                    >
                      ✕ CLOSE
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 font-mono text-xs">
                  <div className="p-3 bg-[#0E1E3C]/5 border border-[#0E1E3C]/10">
                    <span className="text-[10px] text-[#0E1E3C]/70 uppercase block mb-1">
                      HARDWARE STATE
                    </span>
                    <div>Status: <b>{unitDetail.current_status}</b></div>
                    <div>Clock Drift: <b>{unitDetail.clock_drift_ms} ms</b></div>
                    <div>Storage Buffer: <b>{unitDetail.storage_fill_pct}% full</b></div>
                    <div>Power: <b>{unitDetail.power_source} ({unitDetail.battery_level}%)</b></div>
                  </div>

                  <div className="p-3 bg-[#0E1E3C]/5 border border-[#0E1E3C]/10">
                    <span className="text-[10px] text-[#0E1E3C]/70 uppercase block mb-1">
                      DEPLOYMENT & LOCALITY
                    </span>
                    <div>Location: <b>Rangbari Road Main Gate</b></div>
                    <div>Merchant: <b>Shree Balaji Paan</b></div>
                    <div>Installed: <b>2026-09-20 by FA-Manoj</b></div>
                    <div>GPS: <b>25.1384° N, 75.8362° E</b></div>
                  </div>

                  <div className="p-3 bg-[#0E1E3C]/5 border border-[#0E1E3C]/10">
                    <span className="text-[10px] text-[#0E1E3C]/70 uppercase block mb-1">
                      ACTIVE SESSION COUNTS
                    </span>
                    <div className="text-xl font-bold text-[#F05A28] my-1">
                      A: {unitDetail.counts.A}  ·  B: {unitDetail.counts.B}
                    </div>
                    <div className="text-[10px] text-[#0E1E3C]/70">
                      Total Session #{unitDetail.current_session_id}: {unitDetail.counts.A + unitDetail.counts.B} votes
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: QUESTION LIBRARY & BULK PRINT (Section 6 & 10) ================= */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#0E1E3C]/30 bg-white/60 p-4">
              <div>
                <h2 className="font-michroma text-base text-[#0E1E3C] uppercase">
                  QUESTION LIBRARY & BULK-PRINT
                </h2>
                <p className="font-archivo text-xs text-[#0E1E3C]/80 mt-0.5">
                  Reusable opinion prompts printed in Cosmic Workshop CW-01 style for physical paper slot mounting.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNewQuestionModalOpen(true)}
                  className="py-2 px-3 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono text-xs font-bold uppercase flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>NEW QUESTION</span>
                </button>
              </div>
            </div>

            {/* Question Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div key={q.id} className="border-2 border-[#0E1E3C] bg-white p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#0E1E3C]/10 pb-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#F05A28]">
                        ID: {q.id}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-[#0E1E3C]/10 uppercase font-semibold">
                        {q.category} · {q.language}
                      </span>
                    </div>

                    <p className="font-archivo text-sm font-semibold text-[#0E1E3C] leading-snug">
                      "{q.text}"
                    </p>

                    <div className="grid grid-cols-2 gap-2 my-3 font-mono text-xs">
                      {q.options.map((opt) => (
                        <div
                          key={opt.hole_id}
                          className="border border-[#0E1E3C]/30 bg-[#0E1E3C]/5 p-2 text-center"
                        >
                          <span className="text-[10px] text-[#0E1E3C]/70 block font-bold">
                            HOLE [{opt.hole_id}]
                          </span>
                          <span className="font-bold text-[#0E1E3C]">{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#0E1E3C]/10 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#0E1E3C]/70">
                      Author: {q.author}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPrintCardQuestion(q);
                        setPrintCardModalOpen(true);
                      }}
                      className="py-1.5 px-3 bg-[#0E1E3C] text-[#F2EAD6] font-mono text-xs uppercase flex items-center space-x-1.5 hover:bg-[#16336E] cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PRINT CARD VIEW</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: REPORTS & FOOTFALL SIGNAL (Section 11) ================= */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#0E1E3C]/30 bg-white/60 p-4">
              <div>
                <h2 className="font-michroma text-base text-[#0E1E3C] uppercase">
                  PILOT FOOTFALL & VOTE REPORTS
                </h2>
                <p className="font-archivo text-xs text-[#0E1E3C]/80 mt-0.5">
                  Hourly street distribution curves derived from per-vote RTC timestamps (the commercial footfall signal).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="py-2 px-3 bg-[#1F8F82] hover:bg-[#18756a] text-white font-mono text-xs font-bold uppercase flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>EXPORT CSV</span>
                </button>
              </div>
            </div>

            {/* Hourly Footfall Graph Card */}
            <div className="border-2 border-[#0E1E3C] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-[#0E1E3C]/10 pb-2">
                <div>
                  <h3 className="font-michroma text-xs uppercase text-[#0E1E3C]">
                    STREET FOOTFALL CURVE (KOTA PILOT AGGREGATE)
                  </h3>
                  <span className="font-mono text-[10px] text-[#0E1E3C]/70">
                    RTC-DERIVED HOURLY VOLUMES (06:00 - 22:00)
                  </span>
                </div>
                <div className="flex items-center space-x-3 font-mono text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-[#16336E]" />
                    <span>HOLE A</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-[#F05A28]" />
                    <span>HOLE B</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Representation */}
              <div className="h-48 flex items-end justify-between gap-1 pt-4 px-2 border-b-2 border-[#0E1E3C]">
                {SAMPLE_HOURLY_FOOTFALL.map((h, i) => {
                  const maxTotal = 200;
                  const heightPct = (h.total / maxTotal) * 100;
                  const aPct = (h.votesA / h.total) * 100;
                  const bPct = (h.votesB / h.total) * 100;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="hidden group-hover:block absolute -top-12 z-20 bg-[#0E1E3C] text-white text-[10px] font-mono p-1 rounded-xs whitespace-nowrap shadow-md">
                        {h.hour}: {h.total} votes (A:{h.votesA}, B:{h.votesB})
                      </div>

                      {/* Stacked bar */}
                      <div
                        className="w-full max-w-[18px] flex flex-col justify-end transition-all group-hover:scale-105"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div className="w-full bg-[#F05A28]" style={{ height: `${bPct}%` }} />
                        <div className="w-full bg-[#16336E]" style={{ height: `${aPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart X-axis Labels */}
              <div className="flex justify-between font-mono text-[9px] text-[#0E1E3C]/70 pt-2 px-1">
                <span>06:00</span>
                <span>09:00 (PEAK AM)</span>
                <span>12:00</span>
                <span>15:00</span>
                <span>18:00 (PEAK PM)</span>
                <span>22:00</span>
              </div>
            </div>

            {/* Locality Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#0E1E3C]/30 bg-white p-4">
                <h4 className="font-michroma text-xs uppercase mb-3">
                  RESULTS BY LOCALITY (RANGBARI VS TALWANDI)
                </h4>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold">RANGBARI ROAD (COACHING CLUSTER)</span>
                      <span>1,244 VOTES</span>
                    </div>
                    <div className="h-3 w-full bg-[#0E1E3C]/10 flex">
                      <div className="bg-[#16336E]" style={{ width: '58%' }} />
                      <div className="bg-[#F05A28]" style={{ width: '42%' }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#0E1E3C]/70 mt-0.5">
                      <span>HOLE A: 58%</span>
                      <span>HOLE B: 42%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold">TALWANDI CIRCLE (COMMERCE STRIP)</span>
                      <span>980 VOTES</span>
                    </div>
                    <div className="h-3 w-full bg-[#0E1E3C]/10 flex">
                      <div className="bg-[#16336E]" style={{ width: '44%' }} />
                      <div className="bg-[#F05A28]" style={{ width: '56%' }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#0E1E3C]/70 mt-0.5">
                      <span>HOLE A: 44%</span>
                      <span>HOLE B: 56%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Tickets Audit */}
              <div className="border border-[#0E1E3C]/30 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-michroma text-xs uppercase">
                    ACTIVE SERVICE TICKETS ({tickets.filter((t) => t.status !== 'resolved').length})
                  </h4>
                  <span className="font-mono text-[10px] text-[#F05A28] font-bold">
                    FIELD QUEUE
                  </span>
                </div>

                <div className="space-y-2">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 border border-[#0E1E3C]/20 bg-[#0E1E3C]/5 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold">{t.unit_serial}</span>
                          <span className="font-mono text-[10px] uppercase text-[#F05A28] font-bold">
                            [{t.issue_type}]
                          </span>
                        </div>
                        <p className="font-archivo text-xs text-[#0E1E3C]/80 mt-0.5">
                          {t.notes}
                        </p>
                        <span className="font-mono text-[9px] text-[#0E1E3C]/60 block mt-1">
                          Reported by {t.merchant_name} · {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {t.status !== 'resolved' ? (
                        <button
                          type="button"
                          onClick={() => resolveTicket(t.id, 'Resolved by Field Staff')}
                          className="py-1 px-2 bg-[#1F8F82] hover:bg-[#18756a] text-white font-mono text-[10px] uppercase font-bold shrink-0 cursor-pointer"
                        >
                          RESOLVE
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] text-[#1F8F82] font-bold">
                          RESOLVED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: MERCHANT PERFORMANCE & LEADERBOARD (Section 11) ================= */}
        {activeTab === 'merchants' && (
          <div className="space-y-4">
            <div className="border border-[#0E1E3C]/30 bg-white/60 p-4">
              <h2 className="font-michroma text-base text-[#0E1E3C] uppercase">
                MERCHANT COURIER PERFORMANCE LEADERBOARD
              </h2>
              <p className="font-archivo text-xs text-[#0E1E3C]/80 mt-0.5">
                The pilot's core scientific hypothesis: does merchant-as-gateway work? Target is 3 syncs/day.
              </p>
            </div>

            <div className="border-2 border-[#0E1E3C] bg-white p-4 overflow-x-auto shadow-sm">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#0E1E3C]/5 text-[10px] uppercase border-b-2 border-[#0E1E3C]">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Merchant / Shop</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Syncs / Day (Target: 3)</th>
                    <th className="p-3">Consistency</th>
                    <th className="p-3">Attempts vs Success</th>
                    <th className="p-3">Median Data Lag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0E1E3C]/10">
                  <tr className="hover:bg-white/80">
                    <td className="p-3 font-bold text-[#F2B33D]">★ #1</td>
                    <td className="p-3">
                      <div className="font-bold">Ramesh Tiwari</div>
                      <div className="text-[10px] text-[#0E1E3C]/70">Shree Balaji Paan, Rangbari</div>
                    </td>
                    <td className="p-3 font-bold">CC-BIN-01</td>
                    <td className="p-3 font-bold text-[#1F8F82]">3.2 / day</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#1F8F82]/20 text-[#1F8F82] font-bold">
                        98% ON TIME
                      </span>
                    </td>
                    <td className="p-3">48 / 48 (100%)</td>
                    <td className="p-3">42 mins</td>
                  </tr>

                  <tr className="hover:bg-white/80">
                    <td className="p-3 font-bold text-[#0E1E3C]">#2</td>
                    <td className="p-3">
                      <div className="font-bold">Suresh Sharma</div>
                      <div className="text-[10px] text-[#0E1E3C]/70">Jai Hind Corner, Talwandi</div>
                    </td>
                    <td className="p-3 font-bold">CC-BIN-02</td>
                    <td className="p-3 font-bold text-[#1F8F82]">2.8 / day</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#1F8F82]/20 text-[#1F8F82] font-bold">
                        92% ON TIME
                      </span>
                    </td>
                    <td className="p-3">42 / 45 (93%)</td>
                    <td className="p-3">1.2 hours</td>
                  </tr>

                  <tr className="hover:bg-white/80">
                    <td className="p-3 font-bold text-[#0E1E3C]">#3</td>
                    <td className="p-3">
                      <div className="font-bold">Vikram Chauhan</div>
                      <div className="text-[10px] text-[#0E1E3C]/70">Kota Chai, Vigyan Nagar</div>
                    </td>
                    <td className="p-3 font-bold">CC-BIN-03</td>
                    <td className="p-3 font-bold text-[#F2B33D]">1.4 / day</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#F2B33D]/30 text-[#0E1E3C] font-bold">
                        WARNING (LOW)
                      </span>
                    </td>
                    <td className="p-3">22 / 31 (70%)</td>
                    <td className="p-3">6.4 hours</td>
                  </tr>

                  <tr className="hover:bg-white/80">
                    <td className="p-3 font-bold text-[#F05A28]">#4</td>
                    <td className="p-3">
                      <div className="font-bold">Deepak Verma</div>
                      <div className="text-[10px] text-[#0E1E3C]/70">Royal Paan Palace, Gumanpura</div>
                    </td>
                    <td className="p-3 font-bold">CC-BIN-04</td>
                    <td className="p-3 font-bold text-[#F05A28]">0.4 / day</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#F05A28]/20 text-[#F05A28] font-bold">
                        NEEDS VISIT
                      </span>
                    </td>
                    <td className="p-3">6 / 18 (33%)</td>
                    <td className="p-3">52 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 6: PILOT CONFIG (Section 17) ================= */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="border border-[#0E1E3C]/30 bg-white/60 p-4">
              <h2 className="font-michroma text-base text-[#0E1E3C] uppercase">
                ADMIN CONFIGURATION VARIABLES (SECTION 17)
              </h2>
              <p className="font-archivo text-xs text-[#0E1E3C]/80 mt-0.5">
                "Everything tunable is a config, not a release. Pilot parameters, thresholds, intervals and counts live in admin settings."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sync & Pilot Parameters */}
              <div className="border-2 border-[#0E1E3C] bg-white p-4 space-y-3 font-mono text-xs">
                <h3 className="font-michroma text-xs uppercase border-b border-[#0E1E3C]/10 pb-2">
                  SYNC & THRESHOLD VARIABLES
                </h3>

                <div>
                  <label className="block text-[10px] text-[#0E1E3C]/70 uppercase">
                    TARGET SYNCS PER MERCHANT / DAY: {adminConfig.target_syncs_per_merchant_day}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={adminConfig.target_syncs_per_merchant_day}
                    onChange={(e) =>
                      updateAdminConfig({ target_syncs_per_merchant_day: Number(e.target.value) })
                    }
                    className="w-full accent-[#F05A28]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#0E1E3C]/70 uppercase">
                    SILENT THRESHOLD BEFORE ALERT: {adminConfig.silent_threshold_hours} HOURS
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="96"
                    step="12"
                    value={adminConfig.silent_threshold_hours}
                    onChange={(e) =>
                      updateAdminConfig({ silent_threshold_hours: Number(e.target.value) })
                    }
                    className="w-full accent-[#F05A28]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#0E1E3C]/70 uppercase">
                    MAX UNSENT BATCHES ON PHONE BEFORE WARNING: {adminConfig.max_unsent_batches}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={adminConfig.max_unsent_batches}
                    onChange={(e) =>
                      updateAdminConfig({ max_unsent_batches: Number(e.target.value) })
                    }
                    className="w-full accent-[#F05A28]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="font-archivo text-xs">Auto Sync on App Foreground</span>
                  <input
                    type="checkbox"
                    checked={adminConfig.sync_on_foreground}
                    onChange={(e) => updateAdminConfig({ sync_on_foreground: e.target.checked })}
                    className="w-4 h-4 accent-[#F05A28]"
                  />
                </div>
              </div>

              {/* Hardware & Question Rules */}
              <div className="border-2 border-[#0E1E3C] bg-white p-4 space-y-3 font-mono text-xs">
                <h3 className="font-michroma text-xs uppercase border-b border-[#0E1E3C]/10 pb-2">
                  DEVICE & QUESTION BINDING RULES
                </h3>

                <div>
                  <label className="block text-[10px] text-[#0E1E3C]/70 uppercase">
                    CLOCK DRIFT TOLERANCE BEFORE AUTO TIME_SET: {adminConfig.clock_drift_tolerance_sec}s
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="600"
                    step="30"
                    value={adminConfig.clock_drift_tolerance_sec}
                    onChange={(e) =>
                      updateAdminConfig({ clock_drift_tolerance_sec: Number(e.target.value) })
                    }
                    className="w-full accent-[#F05A28]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#0E1E3C]/70 uppercase">
                    MIN SENSOR GAP (DEBOUNCE): {adminConfig.min_sensor_gap_ms} MS
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={adminConfig.min_sensor_gap_ms}
                    onChange={(e) =>
                      updateAdminConfig({ min_sensor_gap_ms: Number(e.target.value) })
                    }
                    className="w-full accent-[#F05A28]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="font-archivo text-xs">Show Merchant Reset Confirmation Prompt</span>
                  <input
                    type="checkbox"
                    checked={adminConfig.merchant_reset_confirm_prompt}
                    onChange={(e) =>
                      updateAdminConfig({ merchant_reset_confirm_prompt: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#F05A28]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-archivo text-xs">Merchants See Leaderboard Rank</span>
                  <input
                    type="checkbox"
                    checked={adminConfig.merchants_see_leaderboard}
                    onChange={(e) =>
                      updateAdminConfig({ merchants_see_leaderboard: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#F05A28]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: BIND QUESTION TO UNBOUND SESSION ================= */}
      {bindingModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1E3C]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F2EAD6] border-2 border-[#0E1E3C] max-w-md w-full p-5 text-[#0E1E3C]">
            <div className="flex items-center justify-between border-b border-[#0E1E3C]/20 pb-2 mb-3">
              <h3 className="font-michroma text-xs uppercase font-bold">
                BIND QUESTION TO SESSION
              </h3>
              <button
                type="button"
                onClick={() => setBindingModalOpen(false)}
                className="text-xs font-mono font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-archivo text-xs">
              <div>
                <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                  SELECT PHYSICAL QUESTION CARD INSTALLED:
                </label>
                <select
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  className="w-full bg-white border border-[#0E1E3C]/40 p-2 font-mono text-xs"
                >
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      [{q.id}] {q.text.slice(0, 55)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                    SOURCE PROVENANCE:
                  </label>
                  <select
                    value={bindingSource}
                    onChange={(e: any) => setBindingSource(e.target.value)}
                    className="w-full bg-white border border-[#0E1E3C]/40 p-1.5 font-mono text-xs"
                  >
                    <option value="manual_backend">manual_backend</option>
                    <option value="merchant_confirmed">merchant_confirmed</option>
                    <option value="device_command">device_command</option>
                    <option value="inferred">inferred</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                    CONFIDENCE LEVEL:
                  </label>
                  <select
                    value={bindingConfidence}
                    onChange={(e: any) => setBindingConfidence(e.target.value)}
                    className="w-full bg-white border border-[#0E1E3C]/40 p-1.5 font-mono text-xs"
                  >
                    <option value="High">High</option>
                    <option value="Medium-high">Medium-high</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <p className="font-archivo text-[11px] text-[#0E1E3C]/70 italic mt-1">
                Binding connects raw sensor beam events to this question. Confidence tag prevents unverified data in analytics.
              </p>

              <button
                type="button"
                onClick={handleConfirmBinding}
                className="w-full py-2.5 mt-2 bg-[#1F8F82] hover:bg-[#18756a] text-white font-mono font-bold text-xs uppercase cursor-pointer"
              >
                CONFIRM & LOCK BINDING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SPLIT SESSION (Section 10) ================= */}
      {splitModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1E3C]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F2EAD6] border-2 border-[#0E1E3C] max-w-md w-full p-5 text-[#0E1E3C]">
            <div className="flex items-center justify-between border-b border-[#0E1E3C]/20 pb-2 mb-3">
              <h3 className="font-michroma text-xs uppercase font-bold flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5" /> SPLIT SESSION AT TIMESTAMP
              </h3>
              <button
                type="button"
                onClick={() => setSplitModalOpen(false)}
                className="text-xs font-mono font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="font-archivo text-xs text-[#0E1E3C]/80 mb-3">
              Use this if a merchant swapped the question card without pressing the internal reset switch. Per-vote timestamps allow slicing the session retroactively!
            </p>

            <div className="space-y-3 font-archivo text-xs">
              <div>
                <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                  NEW QUESTION FOR 2ND HALF:
                </label>
                <select
                  value={splitNewQuestionId}
                  onChange={(e) => setSplitNewQuestionId(e.target.value)}
                  className="w-full bg-white border border-[#0E1E3C]/40 p-2 font-mono text-xs"
                >
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      [{q.id}] {q.text.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                  ESTIMATED SWAP TIME TODAY:
                </label>
                <input
                  type="time"
                  value={splitTimestamp}
                  onChange={(e) => setSplitTimestamp(e.target.value)}
                  className="w-full bg-white border border-[#0E1E3C]/40 p-2 font-mono text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleConfirmSplit}
                className="w-full py-2.5 mt-2 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono font-bold text-xs uppercase cursor-pointer"
              >
                EXECUTE SESSION SPLIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: NEW QUESTION FORM ================= */}
      {newQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1E3C]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F2EAD6] border-2 border-[#0E1E3C] max-w-md w-full p-5 text-[#0E1E3C]">
            <div className="flex items-center justify-between border-b border-[#0E1E3C]/20 pb-2 mb-3">
              <h3 className="font-michroma text-xs uppercase font-bold">
                CREATE NEW QUESTION PROMPT
              </h3>
              <button
                type="button"
                onClick={() => setNewQuestionModalOpen(false)}
                className="text-xs font-mono font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuestionSubmit} className="space-y-3 font-archivo text-xs">
              <div>
                <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                  QUESTION TEXT (HINDI / ENGLISH):
                </label>
                <textarea
                  rows={2}
                  required
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="e.g. क्या कोचिंग हॉस्टल में रविवार को छुट्टी होनी चाहिए?"
                  className="w-full bg-white border border-[#0E1E3C]/40 p-2 font-archivo text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                    LANGUAGE:
                  </label>
                  <select
                    value={newQLang}
                    onChange={(e: any) => setNewQLang(e.target.value)}
                    className="w-full bg-white border border-[#0E1E3C]/40 p-1.5 font-mono text-xs"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                    CATEGORY:
                  </label>
                  <select
                    value={newQCategory}
                    onChange={(e: any) => setNewQCategory(e.target.value)}
                    className="w-full bg-white border border-[#0E1E3C]/40 p-1.5 font-mono text-xs"
                  >
                    <option value="Civic">Civic</option>
                    <option value="Education">Education</option>
                    <option value="Youth">Youth</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                    HOLE A OPTION LABEL:
                  </label>
                  <input
                    type="text"
                    required
                    value={newQOptionA}
                    onChange={(e) => setNewQOptionA(e.target.value)}
                    className="w-full bg-white border border-[#0E1E3C]/40 p-1.5 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#0E1E3C]/70 uppercase mb-1">
                    HOLE B OPTION LABEL:
                  </label>
                  <input
                    type="text"
                    required
                    value={newQOptionB}
                    onChange={(e) => setNewQOptionB(e.target.value)}
                    className="w-full bg-white border border-[#0E1E3C]/40 p-1.5 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono font-bold text-xs uppercase cursor-pointer"
              >
                SAVE TO LIBRARY
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: COSMIC WORKSHOP BULK PRINT CARD VIEW (Section 6) ================= */}
      {printCardModalOpen && printCardQuestion && (
        <div className="fixed inset-0 z-50 bg-[#0E1E3C]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#0E1E3C] max-w-lg w-full p-6 text-[#0E1E3C] shadow-2xl relative">
            {/* Cut marks at 4 corners */}
            <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-400">┌ CUT MARK</div>
            <div className="absolute top-2 right-2 text-[9px] font-mono text-gray-400">CUT MARK ┐</div>
            <div className="absolute bottom-2 left-2 text-[9px] font-mono text-gray-400">└ CUT MARK</div>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-400">CUT MARK ┘</div>

            <div className="flex items-center justify-between border-b-2 border-[#0E1E3C] pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <CodeCircuitLogo size={28} strokeColor="#0E1E3C" sparkColor="#F05A28" />
                <div>
                  <span className="font-michroma text-xs tracking-wider block">
                    CODE & CIRCUIT · SURVEY BIN
                  </span>
                  <span className="font-mono text-[9px] text-gray-600">
                    CARD SPEC: CW-01-A5 · PHYSICAL BIN INSERT
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPrintCardModalOpen(false)}
                className="text-xs font-mono font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printed Card Center Surface */}
            <div className="border-2 border-[#0E1E3C] bg-[#F2EAD6] p-6 text-center">
              <span className="font-mono text-[10px] text-[#0E1E3C]/70 tracking-widest uppercase block mb-1">
                TODAY'S COMMUNITY QUESTION · आज का सवाल
              </span>
              <h2 className="font-archivo text-xl font-extrabold text-[#0E1E3C] leading-snug my-4 px-2">
                {printCardQuestion.text}
              </h2>

              <DimensionLine label="DROP CIGARETTE BUTT IN YOUR CHOICE HOLE" theme="cream" />

              {/* Physical Hole Targets */}
              <div className="grid grid-cols-2 gap-6 my-4">
                <div className="border-2 border-dashed border-[#0E1E3C] bg-white p-4">
                  <div className="w-10 h-10 rounded-full border-2 border-[#0E1E3C] bg-[#0E1E3C] text-white flex items-center justify-center font-michroma text-base mx-auto mb-2">
                    A
                  </div>
                  <span className="font-archivo text-base font-bold block text-[#0E1E3C]">
                    {printCardQuestion.options[0]?.label || 'YES / हाँ'}
                  </span>
                </div>

                <div className="border-2 border-dashed border-[#0E1E3C] bg-white p-4">
                  <div className="w-10 h-10 rounded-full border-2 border-[#0E1E3C] bg-[#0E1E3C] text-white flex items-center justify-center font-michroma text-base mx-auto mb-2">
                    B
                  </div>
                  <span className="font-archivo text-base font-bold block text-[#0E1E3C]">
                    {printCardQuestion.options[1]?.label || 'NO / नहीं'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#0E1E3C]/20 text-[9px] font-mono text-[#0E1E3C]/70">
                <span>QUESTION #{printCardQuestion.id}</span>
                <span>NO CAMERAS · ANONYMOUS VOTE</span>
                <span>CODEANDCIRCUIT.IN</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-xs text-gray-500">
                Scale: 100% · Printable on 300 GSM Matte Cardstock
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 bg-[#0E1E3C] hover:bg-[#16336E] text-white font-mono text-xs uppercase font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>SEND TO PRINTER</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
