import React, { useState } from 'react';
import { DimensionLine, MissionPatch } from '../common/CosmicWorkshopComponents';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Cpu,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

export const EducationView: React.FC = () => {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [courseSelected, setCourseSelected] = useState('Cosmic Robotics Level 1');
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 8');
  const [studentPhone, setStudentPhone] = useState('');
  const [enquirySent, setEnquirySent] = useState(false);

  const courses = [
    {
      title: 'Cosmic Robotics Level 1 (CW-01)',
      target: 'Ages 9-14 · Beginners',
      desc: 'Hands-on electronic breadboarding, IR sensor circuits, microcontrollers, and building your first mechanical roving bot.',
      modules: '12 Lab Sessions · Hardware Kit Included',
      patch: 'BOT-01',
    },
    {
      title: 'ESP32 & Embedded IoT Engineering',
      target: 'Ages 13-18 · Intermediate',
      desc: 'C++ firmware, Bluetooth Low Energy (BLE) peripheral beacons, real-time clock RTC synchronization, and telemetry data pipes.',
      modules: '16 Lab Sessions · ESP32 Dev Kit',
      patch: 'IOT-02',
    },
    {
      title: 'Advanced Competitive Robotics & Autonomous Control',
      target: 'High School & Prep',
      desc: 'PID motor tuning, computer vision tracking, sensor fusion, and multi-robot radio telemetry networks.',
      modules: '20 Masterclasses · National Contest Track',
      patch: 'AI-03',
    },
  ];

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnquirySent(true);
    setTimeout(() => {
      setEnquirySent(false);
      setEnquiryOpen(false);
      setStudentName('');
      setStudentPhone('');
    }, 1800);
  };

  return (
    <div className="min-h-full bg-[#0E1E3C] text-[#F2EAD6] p-4 md:p-8 font-archivo pb-20 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center py-4">
          <CodeCircuitLogo size={56} className="mx-auto mb-3" sparkColor="#F2B33D" />
          <h1 className="font-michroma text-lg md:text-xl uppercase tracking-wider text-[#F2EAD6]">
            CODE & CIRCUIT ACADEMY
          </h1>
          <span className="font-mono text-xs text-[#7FD8E8] tracking-widest uppercase block mt-1">
            COSMIC WORKSHOP ROBOTICS CURRICULUM
          </span>
          <p className="font-archivo text-xs text-[#F2EAD6]/80 max-w-md mx-auto mt-2 leading-relaxed">
            From breadboards to IoT survey bins and autonomous robots. Build real hardware that counts in the real world.
          </p>
        </div>

        <DimensionLine label="CORE WORKSHOP TRACKS" theme="navy" />

        {/* Courses List */}
        <div className="space-y-4">
          {courses.map((c, i) => (
            <div
              key={i}
              className="border-2 border-[#7FD8E8]/40 bg-[#16336E]/60 p-5 hover:border-[#F2B33D] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <MissionPatch label={c.patch} sub="LAB" theme="gold" className="shrink-0" />
                <div>
                  <span className="font-mono text-[10px] text-[#F2B33D] uppercase tracking-wider font-bold">
                    {c.target}
                  </span>
                  <h3 className="font-michroma text-sm text-[#F2EAD6] uppercase mt-0.5">
                    {c.title}
                  </h3>
                  <p className="font-archivo text-xs text-[#F2EAD6]/80 mt-1 max-w-lg">
                    {c.desc}
                  </p>
                  <span className="font-mono text-[10px] text-[#7FD8E8] block mt-2">
                    ◈ {c.modules}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCourseSelected(c.title);
                  setEnquiryOpen(true);
                }}
                className="py-2.5 px-4 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono text-xs uppercase font-bold tracking-wider shrink-0 cursor-pointer self-start sm:self-center"
              >
                BOOK TRIAL CLASS
              </button>
            </div>
          ))}
        </div>

        {/* Philosophy Note from CW-01 */}
        <div className="border border-[#7FD8E8]/30 bg-[#16336E]/30 p-4 font-mono text-xs text-[#7FD8E8]/90">
          <span className="text-[#F2B33D] font-bold block mb-1">
            STANDARD CW-01 IDENTITY LOCK:
          </span>
          "Cream = understand it, navy = build it. In the app that becomes cream = read, navy = operate. The device is the source of truth."
        </div>
      </div>

      {/* Enquiry Modal */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1E3C]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#16336E] border-2 border-[#F2B33D] max-w-sm w-full p-5 text-[#F2EAD6]">
            <div className="flex items-center justify-between border-b border-[#7FD8E8]/20 pb-2 mb-3">
              <h3 className="font-michroma text-xs text-[#F2EAD6] uppercase">
                ROBOTICS ENQUIRY & TRIAL
              </h3>
              <button
                type="button"
                onClick={() => setEnquiryOpen(false)}
                className="text-[#7FD8E8] text-sm hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {enquirySent ? (
              <div className="py-8 text-center text-[#1F8F82]">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                <h4 className="font-michroma text-sm uppercase">ENQUIRY DISPATCHED</h4>
                <p className="font-archivo text-xs text-[#F2EAD6]/80 mt-1">
                  Our lab instructor will call you to schedule your demo class.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-3 font-archivo text-xs">
                <div>
                  <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                    SELECTED TRACK:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={courseSelected}
                    className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/40 p-2 font-mono text-xs text-[#F2B33D]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                    STUDENT FULL NAME:
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Aryan Sharma"
                    className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/40 p-2 text-xs text-[#F2EAD6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                      GRADE / CLASS:
                    </label>
                    <select
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                      className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/40 p-1.5 text-xs text-[#F2EAD6]"
                    >
                      <option value="Grade 5-7">Grade 5-7</option>
                      <option value="Grade 8-10">Grade 8-10</option>
                      <option value="Grade 11-12">Grade 11-12</option>
                      <option value="College">College / Prep</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] text-[#7FD8E8] uppercase mb-1">
                      WHATSAPP NUMBER:
                    </label>
                    <input
                      type="tel"
                      required
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="+91 98..."
                      className="w-full bg-[#0E1E3C] border border-[#7FD8E8]/40 p-1.5 font-mono text-xs text-[#F2EAD6]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-[#F05A28] hover:bg-[#d84818] text-[#F2EAD6] font-archivo font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  REQUEST WORKSHOP SEAT
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
