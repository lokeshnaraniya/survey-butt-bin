import React from 'react';
import { useApp } from '../../context/AppContext';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import { DimensionLine } from '../common/CosmicWorkshopComponents';
import { BookOpen, Cpu, ShieldCheck, Store, Wrench } from 'lucide-react';
import { Role } from '../../types';

export const FirstLaunchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { setRole, isAdminAuthenticated, setAdminAuthModalOpen } = useApp();

  if (!isOpen) return null;

  const handleSelect = (r: Role) => {
    if (r === 'admin' && !isAdminAuthenticated) {
      onClose();
      setAdminAuthModalOpen(true);
      return;
    }
    setRole(r);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1E3C] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#16336E] border-2 border-[#7FD8E8] p-6 text-[#F2EAD6] shadow-2xl relative">
        <div className="text-center mb-5">
          <CodeCircuitLogo size={56} className="mx-auto mb-2" sparkColor="#7FD8E8" strokeColor="#F2EAD6" />
          <h2 className="font-michroma text-base uppercase tracking-wider text-[#F2EAD6]">
            CODE & CIRCUIT
          </h2>
          <span className="font-mono text-[10px] text-[#7FD8E8] tracking-widest uppercase block">
            COSMIC WORKSHOP PLATFORM · CW-01
          </span>
          <p className="font-archivo text-xs text-[#F2EAD6]/80 mt-2">
            Select your entrance door into the survey bin telemetry network:
          </p>
        </div>

        <div className="space-y-3 font-archivo text-xs">
          {/* Choice 1: Merchant */}
          <button
            type="button"
            onClick={() => handleSelect('merchant')}
            className="w-full p-3.5 bg-[#0E1E3C] border border-[#7FD8E8]/40 hover:border-[#F05A28] hover:bg-[#0E1E3C]/80 text-left flex items-center space-x-3 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 border border-[#F05A28] bg-[#F05A28]/20 flex items-center justify-center text-[#F05A28] shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-michroma text-xs text-[#F2EAD6] uppercase block group-hover:text-[#F05A28]">
                I'M A MERCHANT
              </span>
              <span className="font-archivo text-[11px] text-[#F2EAD6]/70">
                Paan & shop owners. View today's counts and auto-drain bin.
              </span>
            </div>
          </button>

          {/* Choice 2: Field Agent */}
          <button
            type="button"
            onClick={() => handleSelect('field_agent')}
            className="w-full p-3.5 bg-[#0E1E3C] border border-[#7FD8E8]/40 hover:border-[#1F8F82] hover:bg-[#0E1E3C]/80 text-left flex items-center space-x-3 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 border border-[#1F8F82] bg-[#1F8F82]/20 flex items-center justify-center text-[#1F8F82] shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-michroma text-xs text-[#F2EAD6] uppercase block group-hover:text-[#1F8F82]">
                FIELD AGENT COURIER
              </span>
              <span className="font-archivo text-[11px] text-[#F2EAD6]/70">
                Nearby BLE radar, drain any bin, and install/service queue.
              </span>
            </div>
          </button>

          {/* Choice 3: Robotics */}
          <button
            type="button"
            onClick={() => handleSelect('student')}
            className="w-full p-3.5 bg-[#0E1E3C] border border-[#7FD8E8]/40 hover:border-[#F2B33D] hover:bg-[#0E1E3C]/80 text-left flex items-center space-x-3 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 border border-[#F2B33D] bg-[#F2B33D]/20 flex items-center justify-center text-[#F2B33D] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-michroma text-xs text-[#F2EAD6] uppercase block group-hover:text-[#F2B33D]">
                I'M LEARNING ROBOTICS
              </span>
              <span className="font-archivo text-[11px] text-[#F2EAD6]/70">
                Cosmic Workshop courses, hardware kits & enrollment.
              </span>
            </div>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-[#7FD8E8]/20 flex justify-between items-center text-[10px] font-mono text-[#7FD8E8]/70">
          <span>NO PASSWORDS · SECURE OTP</span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white uppercase underline cursor-pointer"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};
