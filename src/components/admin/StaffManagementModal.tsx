import React, { useState } from 'react';
import { StaffUser } from '../../types';
import { getStaffList, addStaffUser, deleteStaffUser } from '../../services/staffService';
import {
  Users,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  Phone,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [staffList, setStaffList] = useState<StaffUser[]>(() => getStaffList());
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Field Agent' | 'Technician' | 'Supervisor'>('Field Agent');
  const [showPasswords, setShowPasswords] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !password.trim()) {
      setFeedback({ message: 'All fields (Name, Mobile, Password) are required!', type: 'error' });
      return;
    }

    const newUser = addStaffUser({
      name,
      mobile,
      password,
      role,
    });

    setStaffList(getStaffList());
    setName('');
    setMobile('');
    setPassword('');
    setFeedback({
      message: `✓ Staff "${newUser.name}" (Mobile ID: ${newUser.mobile}) registered successfully!`,
      type: 'success',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteStaff = (id: string, staffName: string) => {
    if (window.confirm(`Are you sure you want to delete "${staffName}"? They will lose access to the Staff Terminal.`)) {
      const remaining = deleteStaffUser(id);
      setStaffList(remaining);
      setFeedback({ message: `Staff member "${staffName}" removed.`, type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1E3C]/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-text font-mono text-xs animate-in fade-in duration-150">
      <div className="bg-[#0C1628] border-2 border-[#7FD8E8] max-w-2xl w-full p-5 sm:p-6 text-[#F2EAD6] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#7FD8E8]/30 pb-3 mb-4 shrink-0">
          <div className="flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-[#8B5CF6]" />
            <div>
              <h3 className="font-michroma text-sm text-white uppercase font-bold tracking-wider">
                STAFF ACCOUNTS MANAGER / स्टाफ जोड़ें व हटाएँ
              </h3>
              <span className="text-[10px] text-[#7FD8E8]">
                Authorized Staff Mobile Credentials for SmartBin Operational Terminal
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7FD8E8] hover:text-white p-1 rounded hover:bg-[#16336E] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div
            className={`p-2.5 mb-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-[#10B981]/20 border border-[#10B981] text-[#10B981]'
                : 'bg-[#EF4444]/20 border border-[#EF4444] text-[#EF4444]'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="overflow-y-auto space-y-5 pr-1">
          {/* Add Staff Member Form */}
          <div className="p-4 bg-[#081226] border border-[#7FD8E8]/30 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-[#F2B33D] font-bold text-xs uppercase">
              <UserPlus className="w-4 h-4" />
              <span>+ REGISTER NEW STAFF MEMBER (नया स्टाफ जोड़ें)</span>
            </div>

            <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#7FD8E8] text-[10px] mb-1 uppercase font-bold">
                  Staff Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0E1E3C] border border-[#334155] rounded pl-8 pr-2 py-2 text-white outline-none focus:border-[#8B5CF6] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#7FD8E8] text-[10px] mb-1 uppercase font-bold">
                  Mobile Number (Staff User ID) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9829012345"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-[#0E1E3C] border border-[#334155] rounded pl-8 pr-2 py-2 text-white outline-none focus:border-[#8B5CF6] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#7FD8E8] text-[10px] mb-1 uppercase font-bold">
                  Staff Password / PIN *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    required
                    placeholder="Enter password or PIN"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0E1E3C] border border-[#334155] rounded pl-8 pr-2 py-2 text-white outline-none focus:border-[#8B5CF6] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#7FD8E8] text-[10px] mb-1 uppercase font-bold">
                  Staff Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-[#0E1E3C] border border-[#334155] rounded px-2 py-2 text-white outline-none focus:border-[#8B5CF6] text-xs font-mono"
                >
                  <option value="Field Agent">Field Agent</option>
                  <option value="Technician">Technician</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white font-bold rounded shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 uppercase tracking-wider"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Staff Member</span>
                </button>
              </div>
            </form>
          </div>

          {/* Registered Staff Accounts Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white">
                REGISTERED STAFF ACCOUNTS ({staffList.length})
              </span>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-1 text-[#38BDF8] hover:underline cursor-pointer text-[11px]"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-[#7FD8E8]/30 rounded-lg">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-[#0E1E3C] text-[#7FD8E8] border-b border-[#7FD8E8]/30">
                    <th className="p-2.5">Staff Name</th>
                    <th className="p-2.5">Mobile (User ID)</th>
                    <th className="p-2.5">Password</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7FD8E8]/20 bg-[#081226]">
                  {staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-[#16336E]/40 transition-colors">
                      <td className="p-2.5 text-white font-semibold">{s.name}</td>
                      <td className="p-2.5 text-[#10B981] font-bold">{s.mobile}</td>
                      <td className="p-2.5 text-[#F59E0B] font-mono">
                        {showPasswords ? s.password : '••••••••'}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16336E] text-[#7FD8E8]">
                          {s.role}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(s.id, s.name)}
                          className="px-2 py-1 bg-[#EF4444]/20 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/40 rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#7FD8E8]/20 mt-4 flex items-center justify-between text-[11px] text-[#94A3B8] shrink-0">
          <span>Staff will log in using their registered Mobile Number and Password.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#1E293B] hover:bg-[#334155] text-white rounded font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
