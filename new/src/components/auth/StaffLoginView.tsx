import React, { useState } from 'react';
import { StaffUser } from '../../types';
import { authenticateStaffUser } from '../../services/staffService';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import { Lock, Phone, ArrowLeft, ShieldAlert, CheckCircle2, UserCheck, Eye, EyeOff } from 'lucide-react';

interface StaffLoginViewProps {
  onSuccess: (staff: StaffUser) => void;
  onBackToWebsite: () => void;
}

export const StaffLoginView: React.FC<StaffLoginViewProps> = ({
  onSuccess,
  onBackToWebsite,
}) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const user = authenticateStaffUser(mobile, password);
    setSubmitting(false);

    if (user) {
      onSuccess(user);
    } else {
      setError('Invalid Mobile Number or Password. Only staff members registered by the Admin can log in.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-4 font-mono text-xs select-text">
      <div className="max-w-md w-full bg-[#0C1628] rounded-2xl border border-[#1E293B] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <CodeCircuitLogo size="sm" />
            <div>
              <span className="font-bold text-white text-sm block">STAFF LOGIN</span>
              <span className="text-[10px] text-[#7FD8E8]">Mobile Operational Terminal (CW-01)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToWebsite}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#94A3B8] hover:text-white bg-[#1E293B] rounded border border-[#334155] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </button>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-1">
            Authorized Personnel Only
          </h2>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            Enter your mobile number and staff password assigned by the Admin to connect hardware and manage survey sync.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#EF4444]/20 border border-[#EF4444]/50 rounded-xl text-[#EF4444] text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#94A3B8] mb-1 font-bold">
              Staff Mobile Number (User ID)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter registered mobile number"
                className="w-full bg-[#070D18] border border-[#334155] rounded-lg pl-9 pr-3 py-2.5 text-white outline-none focus:border-[#3B82F6] text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#94A3B8] mb-1 font-bold">
              Staff Password (पासवर्ड)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#070D18] border border-[#334155] rounded-lg pl-9 pr-10 py-2.5 text-white outline-none focus:border-[#3B82F6] text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>{submitting ? 'Authenticating…' : 'Log In to Staff Terminal (स्टाफ लॉगिन)'}</span>
          </button>
        </form>

        {/* Quick Test Demo Credentials for Staff */}
        <div className="pt-2 border-t border-[#1E293B] space-y-1.5 font-mono text-[10px]">
          <span className="text-[#64748B] block">Quick Test Login (तुरंत टेस्ट के लिए क्लिक करें):</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMobile('9829011420');
                setPassword('staff@123');
              }}
              className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] rounded border border-[#334155] cursor-pointer"
            >
              Manoj Kumar (9829011420 / staff@123)
            </button>
            <button
              type="button"
              onClick={() => {
                setMobile('9414155210');
                setPassword('tech@123');
              }}
              className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] rounded border border-[#334155] cursor-pointer"
            >
              Pooja Verma (9414155210 / tech@123)
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[10px] text-[#64748B]">
            Need credentials? Administrator can register or change staff password from the Admin Panel.
          </p>
        </div>
      </div>
    </div>
  );
};
