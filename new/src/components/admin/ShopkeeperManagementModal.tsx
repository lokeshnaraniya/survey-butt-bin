import React, { useState, useEffect } from 'react';
import {
  getAllMerchants,
  addMerchant,
  updateMerchant,
  deleteMerchant,
  fetchMerchantsFromServer,
  MerchantProfile,
} from '../../services/merchantSyncService';
import {
  Store,
  MapPin,
  Phone,
  Trash2,
  Edit2,
  Plus,
  X,
  Search,
  CheckCircle2,
  Radio,
  ExternalLink,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  Key,
  Copy,
  Check,
} from 'lucide-react';

const KOTA_AVAILABLE_BINS = [
  { serial: 'CC-BIN-01', location: 'Gumanpura (Tea Corner)' },
  { serial: 'CC-BIN-02', location: 'Talwandi Circle (Student Chai)' },
  { serial: 'CC-BIN-03', location: 'Vigyan Nagar (Coaching Point)' },
  { serial: 'CC-BIN-04', location: 'Indra Vihar / Rangbari (Hostel Gate)' },
  { serial: 'CC-BIN-05', location: 'Nayapura (Bus Stand Tea)' },
];

interface ShopkeeperManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerchantUpdated?: () => void;
  currentRole?: 'admin' | 'staff';
}

export const ShopkeeperManagementModal: React.FC<ShopkeeperManagementModalProps> = ({
  isOpen,
  onClose,
  onMerchantUpdated,
  currentRole = 'admin',
}) => {
  const [merchants, setMerchants] = useState<MerchantProfile[]>(() => getAllMerchants());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMerchant, setEditingMerchant] = useState<MerchantProfile | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Form fields for Add / Edit
  const [formName, setFormName] = useState('');
  const [formShopName, setFormShopName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('1234');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formLocality, setFormLocality] = useState('');
  const [formBinSerial, setFormBinSerial] = useState('CC-BIN-01');
  const [formLoading, setFormLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const loadData = async () => {
    const list = await fetchMerchantsFromServer();
    setMerchants(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingMerchant(null);
    setFormName('');
    setFormShopName('');
    setFormPhone('');
    setFormPassword('1234');
    setShowFormPassword(false);
    setFormLocality('');
    setFormBinSerial('CC-BIN-01');
    setIsAddFormOpen(true);
  };

  const handleOpenEdit = (m: MerchantProfile) => {
    setEditingMerchant(m);
    setFormName(m.name);
    setFormShopName(m.shopName);
    setFormPhone(m.phone);
    setFormPassword(m.password || '1234');
    setShowFormPassword(false);
    setFormLocality(m.locality);
    setFormBinSerial(m.assignedBinSerial);
    setIsAddFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formShopName.trim() || !formPhone.trim()) {
      showFeedback('कृपया नाम, दुकान का नाम और मोबाइल नंबर भरें!', 'error');
      return;
    }

    setFormLoading(true);
    try {
      if (editingMerchant) {
        // Update existing shopkeeper
        await updateMerchant(editingMerchant.id, {
          name: formName.trim(),
          shopName: formShopName.trim(),
          phone: formPhone.trim(),
          password: formPassword.trim() || '1234',
          locality: formLocality.trim() || 'Kota, Rajasthan',
          assignedBinSerial: formBinSerial.trim(),
        });
        showFeedback(`✓ Dukandar "${formName}" aur Bin (${formBinSerial}) update ho gaya!`);
      } else {
        // Add new shopkeeper
        await addMerchant({
          name: formName.trim(),
          shopName: formShopName.trim(),
          phone: formPhone.trim(),
          password: formPassword.trim() || '1234',
          locality: formLocality.trim() || 'Kota, Rajasthan',
          assignedBinSerial: formBinSerial.trim(),
          autoSyncEnabled: true,
          syncIntervalMinutes: 120,
        });
        showFeedback(`✓ Naya dukandar "${formName}" add ho gaya aur ${formBinSerial} link ho gaya!`);
      }

      await loadData();
      setIsAddFormOpen(false);
      if (onMerchantUpdated) onMerchantUpdated();
    } catch (err: any) {
      showFeedback('Error: ' + (err?.message || 'Failed to save'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Kya aap dukandar "${name}" ko delete karna chahte hain?`)) return;
    try {
      await deleteMerchant(id);
      await loadData();
      showFeedback(`Dukandar "${name}" delete ho gaya.`);
      if (onMerchantUpdated) onMerchantUpdated();
    } catch {}
  };

  const filteredList = merchants.filter((m) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      m.shopName.toLowerCase().includes(term) ||
      m.phone.includes(term) ||
      m.locality.toLowerCase().includes(term) ||
      m.assignedBinSerial.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-text overflow-y-auto">
      <div className="bg-[#0C1628] border-2 border-[#1E293B] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-xs">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E293B] bg-[#070D18] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F2B33D]/20 border border-[#F2B33D]/40 text-[#F2B33D] flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-archivo flex items-center gap-2">
                  <span>Shopkeeper & Bin Allocation</span>
                  <span className="text-[#F2B33D] text-sm font-bold font-sans">(दुकानदार और डस्टबिन)</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16336E] text-[#7FD8E8] uppercase font-bold border border-[#7FD8E8]/30">
                  {currentRole === 'staff' ? 'Staff Terminal' : 'Admin Console'}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Dukandar ka naam, location, mobile number aur unhe konsa bin diya hai yahan se manage karein.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div
            className={`p-3 font-mono text-xs font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'error'
                ? 'bg-[#EF4444]/20 border-b border-[#EF4444] text-[#EF4444]'
                : 'bg-[#10B981]/20 border-b border-[#10B981] text-[#10B981]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Toolbar: Search & Add Button */}
        <div className="p-4 border-b border-[#1E293B] bg-[#0A1424] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search shopkeeper, shop, phone, or bin serial…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070D18] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-[#F2B33D] text-xs font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#94A3B8] text-[11px] hidden sm:inline">
              Total: <b>{merchants.length}</b> Shopkeepers
            </span>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#F2B33D] hover:bg-[#d99e30] text-[#070D18] font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 text-xs font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Shopkeeper (+ नया दुकानदार)</span>
            </button>
          </div>
        </div>

        {/* Main Content: Add/Edit Form OR Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* INLINE ADD / EDIT FORM MODAL */}
          {isAddFormOpen && (
            <div className="bg-[#070D18] border-2 border-[#F2B33D]/60 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                <div className="flex items-center gap-2 text-[#F2B33D] font-bold">
                  {editingMerchant ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>
                    {editingMerchant
                      ? `Edit Shopkeeper: ${editingMerchant.name}`
                      : 'Naya Shopkeeper Add Karein & Bin Link Karein'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="text-[#94A3B8] hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shopkeeper Owner Name */}
                  <div>
                    <label className="block text-[#94A3B8] text-[11px] uppercase font-bold mb-1">
                      Shopkeeper Name (दुकानदार का नाम) *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Tiwari"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-[#0C1628] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-white font-sans text-xs outline-none focus:border-[#F2B33D]"
                      />
                    </div>
                  </div>

                  {/* Shop Name */}
                  <div>
                    <label className="block text-[#94A3B8] text-[11px] uppercase font-bold mb-1">
                      Shop / Stall Name (दुकान का नाम) *
                    </label>
                    <div className="relative">
                      <Store className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sharma Tea Point & Cafe"
                        value={formShopName}
                        onChange={(e) => setFormShopName(e.target.value)}
                        className="w-full bg-[#0C1628] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-white font-sans text-xs outline-none focus:border-[#F2B33D]"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[#94A3B8] text-[11px] uppercase font-bold mb-1">
                      Mobile Number (मोबाइल नंबर) *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 9829011420"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full bg-[#0C1628] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-white font-mono text-xs outline-none focus:border-[#F2B33D]"
                      />
                    </div>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">
                      Iss number se dukandar login karega.
                    </span>
                  </div>

                  {/* Password / PIN for Shopkeeper Login */}
                  <div>
                    <label className="block text-[#F2B33D] text-[11px] uppercase font-bold mb-1 flex items-center gap-1">
                      <Key className="w-3 h-3 text-[#F2B33D]" />
                      <span>Login Password / PIN (पासवर्ड) *</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        required
                        placeholder="Default: 1234"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full bg-[#0C1628] border border-[#F2B33D]/60 rounded-xl pl-9 pr-10 py-2 text-white font-mono text-xs outline-none focus:border-[#F2B33D]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                        title={showFormPassword ? 'Hide password' : 'Show password'}
                      >
                        {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] block mt-0.5">
                      Dukandar iss password se website par login karega (Default: 1234)
                    </span>
                  </div>

                  {/* Assigned Smart Bin Serial */}
                  <div>
                    <label className="block text-[#10B981] text-[11px] uppercase font-bold mb-1 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-[#10B981]" />
                      <span>Assigned Smart Bin (कौनसा बिन दिया है) *</span>
                    </label>
                    <select
                      value={formBinSerial}
                      onChange={(e) => setFormBinSerial(e.target.value)}
                      className="w-full bg-[#0C1628] border border-[#10B981]/50 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-[#10B981]"
                    >
                      {KOTA_AVAILABLE_BINS.map((b) => (
                        <option key={b.serial} value={b.serial}>
                          {b.serial} — {b.location}
                        </option>
                      ))}
                      <option value="CC-BIN-CUSTOM">Other / Custom Smart Bin</option>
                    </select>
                  </div>
                </div>

                {/* Location / Locality in Kota */}
                <div>
                  <label className="block text-[#94A3B8] text-[11px] uppercase font-bold mb-1">
                    Location & Landmark (दुकान का पता व स्थान) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-[#64748B]" />
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Landmark City, Kunhari, Near Allen Samarth Campus, Kota"
                      value={formLocality}
                      onChange={(e) => setFormLocality(e.target.value)}
                      className="w-full bg-[#0C1628] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-white font-sans text-xs outline-none focus:border-[#F2B33D]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddFormOpen(false)}
                    className="px-4 py-2 border border-[#334155] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 bg-[#F2B33D] hover:bg-[#d99e30] text-[#070D18] font-bold rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {formLoading ? 'Saving…' : editingMerchant ? 'Save Changes' : 'Register Shopkeeper'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SHOPKEEPERS LIST */}
          {filteredList.length === 0 ? (
            <div className="bg-[#070D18] border border-dashed border-[#334155] rounded-2xl p-10 text-center space-y-3 font-mono">
              <Store className="w-8 h-8 text-[#64748B] mx-auto" />
              <h4 className="text-white font-bold text-sm">Koi shopkeeper nahi mila</h4>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto font-sans">
                Aap upar diye gaye "+ Naya Shopkeeper Jodein" button se naya shopkeeper register kar sakte hain aur unhe bin allot kar sakte hain.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#070D18] border border-[#1E293B] hover:border-[#F2B33D]/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-md group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Shop Name & Bin Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-[#F2B33D] font-bold text-xs font-mono">
                          <Store className="w-3.5 h-3.5" />
                          <span>{m.shopName}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 font-sans">
                          {m.name}
                        </h3>
                      </div>

                      {/* Allocated Bin Serial Badge */}
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] font-mono font-bold text-xs shadow-xs">
                          <Radio className="w-3 h-3 text-[#10B981]" />
                          <span>{m.assignedBinSerial}</span>
                        </span>
                        <span className="block text-[10px] text-[#94A3B8] mt-0.5 font-mono">
                          Allotted Bin
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="p-2.5 bg-[#0C1628] rounded-xl border border-[#1E293B] text-xs font-sans text-[#CBD5E1] flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-[#64748B] block font-mono font-bold uppercase">
                          Location / Address:
                        </span>
                        <span>{m.locality}</span>
                      </div>
                    </div>

                    {/* Login Credentials Box (Mobile + Password) */}
                    <div className="p-2.5 bg-[#0C1628] rounded-xl border border-[#F2B33D]/30 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>Login ID: <b className="text-white">{m.phone}</b></span>
                        </span>
                        <a
                          href={`tel:${m.phone}`}
                          className="px-2 py-0.5 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 rounded font-bold flex items-center gap-1 text-[10px]"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#1E293B]">
                        <span className="text-[#F2B33D] flex items-center gap-1.5 text-[11px]">
                          <Key className="w-3 h-3 text-[#F2B33D]" />
                          <span>Password: <b className="text-white font-mono bg-[#1E293B] px-1.5 py-0.5 rounded border border-[#334155]">{m.password || '1234'}</b></span>
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          (Login PIN)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-[#1E293B] text-xs font-mono">
                    <span className="text-[10px] text-[#64748B]">
                      ID: {m.id}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const text = `Code & Circuit - Shopkeeper Login Details:\nWebsite: ${window.location.origin}\nUser ID (Mobile): ${m.phone}\nPassword: ${m.password || '1234'}\nAssigned Smart Bin: ${m.assignedBinSerial}\nShop: ${m.shopName}`;
                          navigator.clipboard.writeText(text);
                          setCopiedId(m.id);
                          showFeedback(`✓ Login credentials copied for "${m.name}"!`);
                          setTimeout(() => setCopiedId(null), 3000);
                        }}
                        className="px-2.5 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155] rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Copy credentials to send to shopkeeper"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            <span className="text-[#10B981]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span>Copy Login</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] border border-[#38BDF8]/30 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit / Reassign</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.name)}
                        className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/20 rounded-lg cursor-pointer transition-colors"
                        title="Delete Shopkeeper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#070D18] border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#94A3B8]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>Dono Admin aur Staff yahan se dukandar aur unka alloted bin update kar sakte hain.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded-lg cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
