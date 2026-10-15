import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import { Eye, EyeOff, Lock, ShieldCheck, X } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { adminAuthModalOpen, setAdminAuthModalOpen, adminLogin } = useApp();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!adminAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const success = adminLogin(userId, password);
    if (success) {
      setUserId('');
      setPassword('');
      setAdminAuthModalOpen(false);
    } else {
      setError('Access Denied: Invalid User ID or Password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1E3C]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#16336E] border-2 border-[#7FD8E8] max-w-sm w-full p-6 text-[#F2EAD6] shadow-2xl relative">
        <button
          type="button"
          onClick={() => {
            setAdminAuthModalOpen(false);
            setError(null);
          }}
          className="absolute top-4 right-4 text-[#7FD8E8] hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-2 border-2 border-[#7FD8E8] bg-[#0E1E3C] flex items-center justify-center text-[#7FD8E8]">
            <Lock className="w-6 h-6 text-[#F2B33D]" />
          </div>
          <h3 className="font-michroma text-sm uppercase tracking-wider text-[#F2EAD6]">
            STAFF MISSION CONTROL
          </h3>
          <span className="font-mono text-[10px] text-[#7FD8E8] tracking-widest uppercase block mt-0.5">
            RESTRICTED ADMIN AUTHENTICATION
          </span>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-[#F05A28]/20 border border-[#F05A28] text-[#F05A28] font-mono text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-archivo text-xs">
          <div>
            <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
              STAFF EMAIL / USER ID
            </label>
            <input
              type="text"
              required
              autoFocus
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. lokeshnaraniya@gmail.com"
              className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/50 p-2.5 font-mono text-sm text-[#F2EAD6] focus:border-[#F2B33D] outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
              SECRET PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/50 p-2.5 pr-10 font-mono text-sm text-[#F2EAD6] focus:border-[#F2B33D] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-[#7FD8E8] hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#F05A28] hover:bg-[#d84818] active:scale-98 text-white font-archivo font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
            >
              AUTHENTICATE & ENTER
            </button>
          </div>

          <div className="text-center font-mono text-[10px] text-[#7FD8E8]/60 pt-1">
            SECURE LOGON · ALL ACTIONS ARE AUDIT-LOGGED
          </div>
        </form>
      </div>
    </div>
  );
};
