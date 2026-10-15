import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { UnitHealth } from '../../types';
import {
  MapPin,
  Navigation,
  Radio,
  Battery,
  Layers,
  Store,
  Info,
  CheckCircle2,
  BarChart3,
  Filter,
  Plus,
  Edit3,
  Trash2,
  X,
  LocateFixed,
  Compass,
  Check,
  ChevronRight,
  Cpu,
  Code,
  Copy,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  EyeOff,
  Bluetooth,
  Vote,
} from 'lucide-react';

export interface BinInstallationRecord {
  serial: string;
  name: string;
  address: string;
  landmark: string;
  area: string;
  merchantName: string;
  lat: number;
  lng: number;
  baseA: number;
  baseB: number;
}

export const INITIAL_KOTA_INSTALLATIONS: BinInstallationRecord[] = [
  {
    serial: 'CC-BIN-01',
    name: 'Landmark City Hub Bin #01',
    address: 'Shop #14, Main Commercial Complex, Landmark City, Kunhari, Kota 324008',
    landmark: 'Opposite Allen Samyak & Vibrant Academy Mess Strip',
    area: 'Landmark City (Kunhari)',
    merchantName: 'Sharma Tea Point & Cafe',
    lat: 25.1962,
    lng: 75.8312,
    baseA: 182,
    baseB: 124,
  },
  {
    serial: 'CC-BIN-02',
    name: 'Talwandi Commerce Circle Bin #02',
    address: 'Plot 4, Commerce College Road, Near Circle, Talwandi, Kota 324005',
    landmark: 'High-footfall student corridor beside juice stalls',
    area: 'Talwandi',
    merchantName: 'Jai Hind Refreshment Stall',
    lat: 25.1528,
    lng: 75.8427,
    baseA: 145,
    baseB: 98,
  },
  {
    serial: 'CC-BIN-03',
    name: 'Vigyan Nagar Coaching Strip Bin #03',
    address: 'Road No. 2, Near City Mall Junction, Vigyan Nagar, Kota 324005',
    landmark: 'Near Bansal Classes & Resonance Front Walkway',
    area: 'Vigyan Nagar',
    merchantName: 'Kota Chai Point',
    lat: 25.1611,
    lng: 75.8541,
    baseA: 95,
    baseB: 67,
  },
  {
    serial: 'CC-BIN-04',
    name: 'Rangbari Main Gate Bin #04',
    address: 'Plot 14, Main Road, Rangbari, Kota, Rajasthan 324005',
    landmark: 'Outside main counter, right next to customer checkout point',
    area: 'Rangbari',
    merchantName: 'Royal Paan Palace',
    lat: 25.1384,
    lng: 75.8362,
    baseA: 78,
    baseB: 42,
  },
  {
    serial: 'CC-BIN-05',
    name: 'Gumanpura Market Center Bin #05',
    address: 'Shop 88, Multi-Purpose School Road, Gumanpura, Kota 324007',
    landmark: 'Center street junction under street canopy',
    area: 'Gumanpura',
    merchantName: 'Central City Tobacco Kiosk',
    lat: 25.1762,
    lng: 75.8398,
    baseA: 112,
    baseB: 89,
  },
];

const KOTA_AREA_PRESETS = [
  { label: 'Landmark City (कुन्हाड़ी - कोचिंग हब)', area: 'Landmark City (Kunhari)', lat: 25.1962, lng: 75.8312 },
  { label: 'Talwandi Circle (तलवंडी - कॉमर्स कॉलेज)', area: 'Talwandi', lat: 25.1528, lng: 75.8427 },
  { label: 'Vigyan Nagar (विज्ञान नगर - सिटी मॉल)', area: 'Vigyan Nagar', lat: 25.1611, lng: 75.8541 },
  { label: 'Rangbari Market Gate (रंगबाड़ी)', area: 'Rangbari', lat: 25.1384, lng: 75.8362 },
  { label: 'Gumanpura Bazar (गुमानपुरा बाजार)', area: 'Gumanpura', lat: 25.1762, lng: 75.8398 },
  { label: 'Nayapura Bus Stand (नयापुरा बस स्टैंड)', area: 'Nayapura', lat: 25.1884, lng: 75.8456 },
  { label: 'Kota Junction Railway Station (कोटा जंक्शन)', area: 'Station Road', lat: 25.2180, lng: 75.8640 },
  { label: 'Aerodrome Circle (एरोड्रम सर्किल)', area: 'Aerodrome', lat: 25.1450, lng: 75.8490 },
  { label: 'Mahaveer Nagar Ext. (महावीर नगर)', area: 'Mahaveer Nagar', lat: 25.1320, lng: 75.8410 },
  { label: 'Dadabari / Chambal Garden (दादाबाड़ी)', area: 'Dadabari', lat: 25.1580, lng: 75.8230 },
];

export interface BinGeoData {
  serial: string;
  name: string;
  address: string;
  landmark: string;
  area: string;
  merchantName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: UnitHealth;
  batteryLevel: number;
  powerSource: 'mains' | 'battery';
  isHardwareLive: boolean;
  questionVotes: {
    optionA: number;
    optionB: number;
    total: number;
  };
}

interface SurveyBinNetworkMapProps {
  selectedQuestionId?: string;
  onSelectQuestion?: (questionId: string) => void;
  className?: string;
  showAdminTools?: boolean;
}

export const SurveyBinNetworkMap: React.FC<SurveyBinNetworkMapProps> = ({
  selectedQuestionId,
  onSelectQuestion,
  className = '',
  showAdminTools = false,
}) => {
  const {
    units,
    questions,
    liveReading,
    isHardwareConnected,
    connectedUnitSerial,
    setConnectedUnitSerial,
    connectDeviceBluetooth,
    disconnectDevice,
    setSelectedUnitSerial,
    selectedUnitSerial,
    openBluetoothModal,
    theme,
  } = useApp();

  // Collapsible Open / Close & Zoom state requested by user
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(true);
  const [mapHeightMode, setMapHeightMode] = useState<'compact' | 'normal' | 'expanded'>('normal');
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [serial: string]: L.Marker }>({});

  // Zoom control handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetKota = () => {
    mapInstanceRef.current?.setView([25.1720, 75.8420], 12.8, { animate: true });
  };

  const handleFitAllBins = () => {
    if (!mapInstanceRef.current || installations.length === 0) return;
    const bounds = L.latLngBounds(installations.map((b) => [b.lat, b.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
  };

  // Persisted Bin Installation Locations
  const [installations, setInstallations] = useState<BinInstallationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cc_bin_installations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_KOTA_INSTALLATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cc_bin_installations', JSON.stringify(installations));
    } catch {}
  }, [installations]);

  const [activeBinSerial, setActiveBinSerial] = useState<string>('CC-BIN-01');
  const [internalSelectedQId, setInternalSelectedQId] = useState<string>(
    selectedQuestionId || questions[0]?.id || 'q-01'
  );
  const [filterArea, setFilterArea] = useState<string>('all');

  // Multi-bin server telemetry
  const [cloudBinCounts, setCloudBinCounts] = useState<Record<string, { countA: number; countB: number; total: number }>>({});
  const [codeModalBin, setCodeModalBin] = useState<BinInstallationRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Poll cloud server for multi-bin telemetry
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/bin/counts');
        if (res.ok) {
          const data = await res.json();
          if (data && data.bins) {
            setCloudBinCounts(data.bins);
          }
        }
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 2500);
    return () => clearInterval(interval);
  }, []);

  // Modal State for Adding or Editing Bin Installation
  const [isAddBinModalOpen, setIsAddBinModalOpen] = useState(false);
  const [editingBinSerial, setEditingBinSerial] = useState<string | null>(null);
  const [isMappingGuideOpen, setIsMappingGuideOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [binModalForm, setBinModalForm] = useState<BinInstallationRecord>({
    serial: 'CC-BIN-06',
    name: 'Nayapura Bus Stand Smart Bin',
    area: 'Nayapura',
    address: 'Near Private Bus Stand, Station Road, Nayapura, Kota 324001',
    landmark: 'Opposite ticket counter #3, high footfall corridor',
    merchantName: 'Jodhpur Sweets & Chai Point',
    lat: 25.1884,
    lng: 75.8456,
    baseA: 45,
    baseB: 30,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // On-Site GPS Auto-Detect
  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ इस ब्राउज़र में Geolocation सपोर्ट नहीं है।');
      return;
    }
    showToast('📍 GPS से दुकान की सटीक लोकेशन खोजी जा रही है...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setBinModalForm((prev) => ({
          ...prev,
          lat,
          lng,
          address: prev.address || `GPS: ${lat}, ${lng}, Kota, Rajasthan`,
        }));
        showToast(`✓ GPS लोकेशन मिल गई: ${lat}, ${lng} (सटीकता: ~${Math.round(pos.coords.accuracy)} मीटर)`);
      },
      (err) => {
        showToast('⚠️ GPS एरर: ' + err.message + '। ब्राउज़र में लोकेशन परमिशन दें।');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLinkHardwareToBin = (serial: string) => {
    setSelectedUnitSerial(serial);
    openBluetoothModal(serial);
  };

  // Invalidate Leaflet size whenever map expands
  useEffect(() => {
    if (mapInstanceRef.current && isMapExpanded) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isMapExpanded]);

  // Sync internal question state with external prop
  useEffect(() => {
    if (selectedQuestionId) {
      setInternalSelectedQId(selectedQuestionId);
    }
  }, [selectedQuestionId]);

  const activeQ = useMemo(() => {
    return questions.find((q) => q.id === internalSelectedQId) || questions[0] || {
      id: 'q-01',
      text: 'JEE / NEET तैयारी में ऑनलाइन vs ऑफलाइन टेस्ट सीरीज़: कौन अधिक मददगार है?',
      options: [
        { hole_id: 'A', label: 'ऑनलाइन / ONLINE' },
        { hole_id: 'B', label: 'ऑफलाइन / OFFLINE' },
      ],
      category: 'Civic',
    };
  }, [questions, internalSelectedQId]);

  const labelA = activeQ.options?.find((o) => o.hole_id === 'A')?.label || 'Option A';
  const labelB = activeQ.options?.find((o) => o.hole_id === 'B')?.label || 'Option B';

  // Build high-fidelity Geo Data for all physical bins with hardware binding
  const binGeoList: BinGeoData[] = useMemo(() => {
    return installations.map((inst) => {
      const matchedUnit = units.find((u) => u.serial === inst.serial);
      const isCurrentlyConnected =
        isHardwareConnected &&
        (connectedUnitSerial === inst.serial || (!connectedUnitSerial && inst.serial === selectedUnitSerial));

      let countA = inst.baseA;
      let countB = inst.baseB;

      // 1. If physical hardware is connected to this bin, use live telemetry
      if (isCurrentlyConnected && liveReading) {
        countA = liveReading.countA;
        countB = liveReading.countB;
      }
      // 2. Else if cloud sync has reported votes for this specific serial
      else if (cloudBinCounts[inst.serial]) {
        countA = cloudBinCounts[inst.serial].countA;
        countB = cloudBinCounts[inst.serial].countB;
      }
      // 3. Fallback to matched unit or initial base counts
      else if (matchedUnit) {
        countA = matchedUnit.counts.A || inst.baseA;
        countB = matchedUnit.counts.B || inst.baseB;
      }

      const total = countA + countB;

      return {
        serial: inst.serial,
        name: inst.name,
        address: inst.address,
        landmark: inst.landmark,
        area: inst.area,
        merchantName: inst.merchantName,
        coordinates: { lat: inst.lat, lng: inst.lng },
        status: isCurrentlyConnected ? 'Healthy' : matchedUnit ? matchedUnit.current_status : 'Healthy',
        batteryLevel: matchedUnit ? matchedUnit.battery_level : 94,
        powerSource: matchedUnit ? matchedUnit.power_source : 'mains',
        isHardwareLive: isCurrentlyConnected,
        questionVotes: {
          optionA: countA,
          optionB: countB,
          total,
        },
      };
    });
  }, [
    installations,
    units,
    liveReading,
    isHardwareConnected,
    connectedUnitSerial,
    selectedUnitSerial,
    cloudBinCounts,
    internalSelectedQId,
  ]);

  // Filtered by locality
  const filteredBins = useMemo(() => {
    if (filterArea === 'all') return binGeoList;
    return binGeoList.filter((b) => b.area.toLowerCase().includes(filterArea.toLowerCase()));
  }, [binGeoList, filterArea]);

  // Aggregate totals for the active question
  const aggregateMetrics = useMemo(() => {
    let sumA = 0;
    let sumB = 0;
    filteredBins.forEach((b) => {
      sumA += b.questionVotes.optionA;
      sumB += b.questionVotes.optionB;
    });
    const total = sumA + sumB;
    const pctA = total > 0 ? Math.round((sumA / total) * 100) : 50;
    const pctB = total > 0 ? 100 - pctA : 50;
    return { sumA, sumB, total, pctA, pctB };
  }, [filteredBins]);

  const activeBin = useMemo<BinGeoData>(() => {
    return binGeoList.find((b) => b.serial === activeBinSerial) || binGeoList[0] || {
      serial: 'CC-BIN-01',
      name: 'Smart Bin',
      address: 'Kota, Rajasthan',
      landmark: '',
      area: 'Kota',
      merchantName: '',
      coordinates: { lat: 25.17, lng: 75.84 },
      status: 'Healthy',
      batteryLevel: 94,
      powerSource: 'mains',
      isHardwareLive: false,
      questionVotes: { optionA: 0, optionB: 0, total: 0 },
    };
  }, [binGeoList, activeBinSerial]);

  // Initialize and maintain the Real Leaflet OpenStreetMap (OSM)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Kota
      const map = L.map(mapContainerRef.current, {
        center: [25.1720, 75.8420],
        zoom: 12.8,
        zoomControl: true,
        attributionControl: false,
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Standard OpenStreetMap (OSM) Tiles — Shows road names, areas & landmarks in Kota
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Add markers for each bin on the real map
    filteredBins.forEach((bin) => {
      const isSelected = bin.serial === activeBinSerial;
      const pctA = bin.questionVotes.total > 0
        ? Math.round((bin.questionVotes.optionA / bin.questionVotes.total) * 100)
        : 50;

      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
          ${bin.isHardwareLive ? `
            <div class="absolute -inset-2 bg-[#10B981] rounded-full animate-ping opacity-75"></div>
          ` : ''}

          <div class="relative flex flex-col items-center">
            <div class="px-2.5 py-1 rounded-lg border-2 shadow-2xl flex items-center gap-1.5 font-mono text-[11px] font-bold transition-transform ${
              isSelected
                ? 'bg-[#0E1E3C] border-[#F2B33D] text-[#F2B33D] scale-110 ring-4 ring-[#F2B33D]/30'
                : 'bg-[#0A1424] border-[#7FD8E8] text-[#F2EAD6] hover:scale-105'
            }">
              <span class="w-2 h-2 rounded-full ${bin.isHardwareLive ? 'bg-[#10B981] animate-pulse' : 'bg-[#7FD8E8]'}"></span>
              <span>${bin.serial}</span>
              <span class="px-1.5 py-0.2 bg-[#1E293B] rounded text-[10px] text-[#10B981]">${bin.questionVotes.total}v</span>
            </div>

            <div class="w-14 h-1.5 bg-[#1E293B] rounded-full mt-0.5 overflow-hidden border border-black/40 flex">
              <div style="width: ${pctA}%" class="bg-[#10B981] h-full"></div>
              <div style="width: ${100 - pctA}%" class="bg-[#F05A28] h-full"></div>
            </div>

            <div class="w-2.5 h-3 bg-gradient-to-b from-[#7FD8E8] to-transparent rotate-45 -mt-1"></div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-bin-marker',
        html: iconHtml,
        iconSize: [64, 46],
        iconAnchor: [32, 46],
      });

      const marker = L.marker([bin.coordinates.lat, bin.coordinates.lng], {
        icon: customIcon,
        title: `${bin.serial} - ${bin.name}`,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #0E1E3C; min-width: 250px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #7FD8E8; padding-bottom: 4px; margin-bottom: 6px;">
            <b style="font-size: 13px; color: #0E1E3C;">📍 ${bin.serial}</b>
            <span style="font-size: 10px; background: #10B981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
              ${bin.status.toUpperCase()}
            </span>
          </div>
          <div style="font-weight: 600; color: #1E293B; margin-bottom: 2px;">${bin.name}</div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">🏢 <i>${bin.merchantName}</i></div>
          <div style="font-size: 10px; color: #64748B; margin-bottom: 8px;">📌 ${bin.address}</div>

          <div style="background: #F1F5F9; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
            <div style="font-size: 10px; color: #475569; font-weight: bold; text-transform: uppercase;">QUESTION VOTES:</div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span style="color: #059669; font-weight: bold;">A: ${bin.questionVotes.optionA}</span>
              <span style="color: #EA580C; font-weight: bold;">B: ${bin.questionVotes.optionB}</span>
              <span style="font-weight: 800; color: #0E1E3C;">Total: ${bin.questionVotes.total}</span>
            </div>
            <div style="height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden; display: flex; margin-top: 4px;">
              <div style="width: ${pctA}%; background: #10B981;"></div>
              <div style="width: ${100 - pctA}%; background: #F05A28;"></div>
            </div>
          </div>
          <div style="font-size: 10px; color: #0284C7; font-weight: 600;">
            🔋 Battery: ${bin.batteryLevel}% · ${bin.powerSource === 'mains' ? '⚡ Mains' : '🔋 Cell'}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setActiveBinSerial(bin.serial);
      });

      markersRef.current[bin.serial] = marker;
    });

    // Invalidate size if container resized
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [filteredBins, activeBinSerial]);

  // Center on bin when clicked
  const focusBin = (bin: BinGeoData) => {
    setActiveBinSerial(bin.serial);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([bin.coordinates.lat, bin.coordinates.lng], 14.5, {
        animate: true,
        duration: 1.2,
      });
      const marker = markersRef.current[bin.serial];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleQuestionChange = (qId: string) => {
    setInternalSelectedQId(qId);
    if (onSelectQuestion) {
      onSelectQuestion(qId);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingBinSerial(null);
    const nextNum = installations.length + 1;
    const serialStr = `CC-BIN-${nextNum < 10 ? '0' + nextNum : nextNum}`;
    setBinModalForm({
      serial: serialStr,
      name: `Kota New Smart Bin #${nextNum}`,
      area: 'Nayapura',
      address: 'Station Road, Near Bus Stand, Nayapura, Kota 324001',
      landmark: 'Near public convenience & tea stall corner',
      merchantName: 'Kota Highway Sweets',
      lat: 25.1884,
      lng: 75.8456,
      baseA: 35,
      baseB: 25,
    });
    setIsAddBinModalOpen(true);
  };

  // Open Edit Modal for active bin
  const handleOpenEditModal = (bin: BinInstallationRecord) => {
    setEditingBinSerial(bin.serial);
    setBinModalForm({ ...bin });
    setIsAddBinModalOpen(true);
  };

  // Save or update bin installation
  const handleSaveBinInstallation = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSerial = binModalForm.serial.trim().toUpperCase();
    if (!cleanSerial) return;

    setInstallations((prev) => {
      const idx = prev.findIndex((b) => b.serial === cleanSerial);
      if (idx >= 0) {
        // Update existing
        const copy = [...prev];
        copy[idx] = { ...binModalForm, serial: cleanSerial };
        return copy;
      }
      // Add new
      return [...prev, { ...binModalForm, serial: cleanSerial }];
    });

    setActiveBinSerial(cleanSerial);
    setIsAddBinModalOpen(false);

    // If on real map, fly to the newly deployed bin!
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([binModalForm.lat, binModalForm.lng], 15, { animate: true, duration: 1 });
    }

    showToast(`✓ Smart Bin ${cleanSerial} successfully installed & deployed at ${binModalForm.area}!`);
  };

  // Delete custom bin
  const handleDeleteBin = (serial: string) => {
    if (serial === 'CC-BIN-01') {
      alert('CC-BIN-01 is the primary hardware bin and cannot be removed.');
      return;
    }
    if (confirm(`Are you sure you want to uninstall and remove ${serial} from the map?`)) {
      setInstallations((prev) => prev.filter((b) => b.serial !== serial));
      setActiveBinSerial('CC-BIN-01');
      showToast(`✓ Smart Bin ${serial} removed from map.`);
    }
  };

  return (
    <div className={`bg-[#0C1628] border-2 border-[#7FD8E8]/40 rounded-2xl shadow-2xl overflow-hidden font-archivo ${className}`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-[#10B981] text-black px-4 py-2 font-mono text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP HEADER & MAP CONTROLS */}
      <div className="p-4 sm:p-5 bg-[#0C1628] border-b border-[#1E293B]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#10B981]/20 border border-[#10B981]/40 rounded-xl text-[#10B981]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Kota Smart Bins Map
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] rounded border border-[#10B981]/30">
                  OpenStreetMap
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Kota ke 5 Smart Bins aur Live Votes
              </p>
            </div>
          </div>

          {/* Clean Controls: Single Kota Reset button & Admin Add Bin */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetKota}
              className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#F2B33D] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow"
              title="Kota Center par laayein"
            >
              <LocateFixed className="w-4 h-4 text-[#F2B33D]" />
              <span>Kota Center</span>
            </button>

            {/* Admin Add Bin */}
            {showAdminTools && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Naya Bin</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Selector & Area Filter */}
        <div className="bg-[#070D18] p-3 rounded-xl border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Vote className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="text-[#94A3B8] font-bold shrink-0">Poll:</span>
            <select
              value={internalSelectedQId}
              onChange={(e) => handleQuestionChange(e.target.value)}
              className="w-full bg-[#0E1E3C] border border-[#334155] focus:border-[#10B981] rounded-lg px-3 py-1.5 text-white font-semibold outline-none cursor-pointer text-xs"
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.text}
                </option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <MapPin className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span className="text-[#94A3B8] font-bold">Area:</span>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="bg-[#0E1E3C] border border-[#334155] rounded-lg px-2.5 py-1.5 text-white text-xs outline-none"
            >
              <option value="all">Kota ke Saare Areas ({binGeoList.length} Bins)</option>
              {Array.from(new Set(installations.map((i) => i.area))).map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aggregate Network Tally Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#1E293B] text-xs">
          <div className="bg-[#070D18] p-2.5 rounded-lg border border-[#1E293B] flex items-center gap-2.5">
            <div className="p-2 bg-[#10B981]/20 text-[#10B981] rounded-lg">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#94A3B8] block">ACTIVE BINS</span>
              <span className="text-sm font-bold text-white">{filteredBins.length} Bins</span>
            </div>
          </div>

          <div className="bg-[#070D18] p-2.5 rounded-lg border border-[#1E293B] flex items-center gap-2.5">
            <div className="p-2 bg-[#F2B33D]/20 text-[#F2B33D] rounded-lg">
              <Vote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#94A3B8] block">TOTAL VOTES</span>
              <span className="text-sm font-bold text-[#F2B33D]">{aggregateMetrics.total}</span>
            </div>
          </div>

          <div className="bg-[#070D18] p-2.5 rounded-lg border border-[#1E293B] flex items-center gap-2.5">
            <div className="p-2 bg-[#10B981]/20 text-[#10B981] rounded-lg font-bold text-xs">
              A
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#10B981] block truncate">{labelA}</span>
              <span className="text-sm font-bold text-[#10B981]">{aggregateMetrics.sumA} ({aggregateMetrics.pctA}%)</span>
            </div>
          </div>

          <div className="bg-[#070D18] p-2.5 rounded-lg border border-[#38BDF8]/20 text-[#38BDF8] rounded-lg flex items-center gap-2.5">
            <div className="p-2 bg-[#38BDF8]/20 text-[#38BDF8] rounded-lg font-bold text-xs">
              B
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#38BDF8] block truncate">{labelB}</span>
              <span className="text-sm font-bold text-[#38BDF8]">{aggregateMetrics.sumB} ({aggregateMetrics.pctB}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strict CSS Isolation for Leaflet: Prevents any Leaflet element from bleeding or overlapping */}
      <style>{`
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          z-index: 1 !important;
          position: relative !important;
        }
        .leaflet-pane {
          z-index: 2 !important;
        }
        .leaflet-top, .leaflet-bottom {
          z-index: 5 !important;
        }
        .leaflet-control {
          z-index: 5 !important;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 2. DIRECT OPENSTREETMAP VIEWPORT & SIDE DETAILS DRAWER                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px] relative isolate z-0 overflow-hidden">
        {/* Real OpenStreetMap (OSM) */}
        <div className="lg:col-span-8 relative border-b lg:border-b-0 lg:border-r border-[#1E293B] overflow-hidden bg-[#070D18] h-[380px] sm:h-[480px]">
          <div className="w-full h-full relative isolate z-0">
            <div ref={mapContainerRef} className="w-full h-full bg-[#050B14]" />

            {/* Floating Quick Map Zoom Pill */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#0C1628]/90 backdrop-blur-md p-1 rounded-lg border border-[#1E293B] shadow-xl">
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-7 h-7 bg-[#1E293B] hover:bg-[#334155] text-white rounded font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 text-sm"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-7 h-7 bg-[#1E293B] hover:bg-[#334155] text-white rounded font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 text-sm"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetKota}
                className="w-7 h-7 bg-[#1E293B] hover:bg-[#334155] text-[#F2B33D] rounded font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 text-sm"
                title="Kota Center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Floating Instructions Pill */}
            <div className="absolute bottom-3 left-3 z-10 bg-[#0C1628]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1E293B] shadow-xl text-xs text-[#CBD5E1] flex items-center gap-2 pointer-events-none">
              <Radio className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
              <span>Kota Map: Pin par click karein aur votes dekhein</span>
            </div>
          </div>
        </div>

        {/* Selected Bin Detailed Location & Vote Card */}
        <div className="lg:col-span-4 bg-[#081226] p-4 sm:p-5 flex flex-col justify-between overflow-y-auto max-h-[500px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#10B981] text-black font-mono text-xs font-black rounded">
                  {activeBin.serial}
                </span>
                <span className="font-bold text-white text-sm">
                  {activeBin.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                  <span>Active</span>
                </span>
                {showAdminTools && (
                  <button
                    type="button"
                    onClick={() => {
                      const inst = installations.find((i) => i.serial === activeBin.serial);
                      if (inst) handleOpenEditModal(inst);
                    }}
                    className="p-1 text-[#F2B33D] hover:bg-[#F2B33D]/20 rounded border border-[#F2B33D]/40 cursor-pointer"
                    title="Edit Bin Location"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Location & Shop */}
            <div className="p-3 bg-[#0E1E3C] rounded-xl border border-[#1E293B] space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F2B33D] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#7FD8E8] uppercase font-bold block">
                    LOCATION & ADDRESS:
                  </span>
                  <p className="text-white text-xs font-semibold leading-snug mt-0.5">
                    {activeBin.address}
                  </p>
                </div>
              </div>

              {activeBin.landmark && (
                <div className="text-[11px] text-[#94A3B8] pl-6">
                  <b>Landmark:</b> {activeBin.landmark}
                </div>
              )}

              {activeBin.merchantName && (
                <div className="text-[11px] text-[#7FD8E8] pl-6 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#7FD8E8]" />
                  <span>Shopkeeper: <b>{activeBin.merchantName}</b></span>
                </div>
              )}
            </div>

            {/* Question Breakdown at THIS Bin */}
            <div className="p-3.5 bg-[#0C1628] rounded-xl border-2 border-[#10B981]/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#10B981] flex items-center gap-1.5">
                  <Vote className="w-4 h-4" />
                  <span>VOTES AT THIS BIN:</span>
                </span>
                <span className="text-white font-mono">{activeBin.questionVotes.total} Total</span>
              </div>

              {(() => {
                const total = activeBin.questionVotes.total;
                const pctA = total > 0 ? Math.round((activeBin.questionVotes.optionA / total) * 100) : 50;
                const pctB = total > 0 ? 100 - pctA : 50;
                return (
                  <div>
                    <div className="h-3 w-full bg-[#1E293B] rounded-full overflow-hidden flex border border-[#334155]">
                      <div style={{ width: `${pctA}%` }} className="bg-[#10B981] h-full transition-all duration-500"></div>
                      <div style={{ width: `${pctB}%` }} className="bg-[#38BDF8] h-full transition-all duration-500"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
                      <div className="p-2 bg-[#070D18] rounded border border-[#10B981]/40 text-center">
                        <span className="text-[10px] text-[#10B981] block truncate font-bold">
                          {labelA}
                        </span>
                        <span className="text-lg font-black text-white">
                          {activeBin.questionVotes.optionA}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] block">{pctA}%</span>
                      </div>

                      <div className="p-2 bg-[#070D18] rounded border border-[#38BDF8]/40 text-center">
                        <span className="text-[10px] text-[#38BDF8] block truncate font-bold">
                          {labelB}
                        </span>
                        <span className="text-lg font-black text-white">
                          {activeBin.questionVotes.optionB}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] block">{pctB}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Hardware Diagnostics */}
            <div className="p-2.5 bg-[#070D18] rounded-lg border border-[#1E293B] text-xs text-[#94A3B8] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Battery className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Battery: <b>{activeBin.batteryLevel}%</b></span>
              </span>
              <span>Power: <b>{activeBin.powerSource.toUpperCase()}</b></span>
            </div>

            {/* Admin Only Hardware Controls */}
            {showAdminTools && (
              <div className="p-3 bg-[#081226] border-2 border-[#10B981]/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#10B981]" />
                    <span>ESP32 Hardware Link:</span>
                  </span>
                  {activeBin.isHardwareLive ? (
                    <span className="text-[#10B981] font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]">Offline</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {activeBin.isHardwareLive ? (
                    <button
                      type="button"
                      onClick={disconnectDevice}
                      className="w-full py-2 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/50 rounded text-xs font-bold cursor-pointer transition-colors"
                    >
                      Disconnect ESP32
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLinkHardwareToBin(activeBin.serial)}
                      className="w-full py-2 bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold rounded flex items-center justify-center gap-2 cursor-pointer shadow"
                    >
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Connect ESP32</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const inst = installations.find((i) => i.serial === activeBin.serial);
                      if (inst) setCodeModalBin(inst);
                    }}
                    className="w-full py-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#7FD8E8] border border-[#7FD8E8]/40 rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Get Arduino Code</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Bottom Actions */}
          <div className="pt-3 border-t border-[#1E293B] mt-4 flex items-center justify-between gap-2">
            {showAdminTools ? (
              <button
                type="button"
                onClick={() => {
                  const inst = installations.find((i) => i.serial === activeBin.serial);
                  if (inst) handleOpenEditModal(inst);
                }}
                className="px-3 py-1.5 bg-[#0E1E3C] hover:bg-[#16336E] text-[#F2B33D] border border-[#F2B33D]/50 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Bin</span>
              </button>
            ) : (
              <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Active Bin</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => focusBin(activeBin)}
              className="px-3.5 py-1.5 bg-[#1F8F82] hover:bg-[#18756a] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Center on Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NETWORK BINS LIST STRIP */}
      {/* ========================================================================= */}
      <div className="p-4 bg-[#060D19] border-t border-[#7FD8E8]/30">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 font-mono text-xs">
          <span className="text-white font-bold flex items-center gap-1.5 uppercase">
            <Layers className="w-4 h-4 text-[#F2B33D]" />
            <span>ALL SURVEY BINS IN KOTA NETWORK ({installations.length} UNITS)</span>
          </span>
          {showAdminTools && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add / Register another Bin location</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {binGeoList.map((b) => {
            const isSelected = b.serial === activeBinSerial;
            return (
              <button
                type="button"
                key={b.serial}
                onClick={() => focusBin(b)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0E1E3C] border-[#F2B33D] shadow-lg ring-2 ring-[#F2B33D]/30'
                    : 'bg-[#081226] border-[#1E293B] hover:border-[#7FD8E8]/50 hover:bg-[#0C1628]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-black text-[#10B981]">
                      {b.serial}
                    </span>
                    <span className="font-mono text-[10px] text-[#F2B33D] font-bold">
                      {b.questionVotes.total} votes
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {b.area}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] truncate mt-0.5">
                    {b.merchantName || b.name}
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#1E293B] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#10B981]">A: {b.questionVotes.optionA}</span>
                  <span className="text-[#F05A28]">B: {b.questionVotes.optionB}</span>
                  <ChevronRight className="w-3 h-3 text-[#7FD8E8]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ADD / EDIT BIN INSTALLATION MODAL */}
      {/* ========================================================================= */}
      {isAddBinModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#0E1E3C]/85 backdrop-blur-md flex items-center justify-center p-3 select-text font-mono text-xs">
          <div className="bg-[#0C1628] border-2 border-[#10B981] max-w-xl w-full p-5 text-[#F2EAD6] shadow-2xl rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#10B981]/40 pb-3">
              <div className="flex items-center gap-2 text-[#10B981] font-bold">
                <Store className="w-5 h-5" />
                <span className="uppercase text-sm">
                  {editingBinSerial ? `EDIT BIN LOCATION: ${editingBinSerial}` : 'ADD NEW SMART BIN INSTALLATION'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBinModalOpen(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBinInstallation} className="space-y-3 font-archivo">
              {/* Quick Area Presets */}
              <div className="p-3 bg-[#081226] border border-[#7FD8E8]/30 rounded-xl space-y-1.5">
                <span className="text-[11px] font-mono text-[#F2B33D] font-bold uppercase block">
                  ⚡ KOTA LOCATION QUICK PRESET (प्रसिद्ध इलाके से भरें):
                </span>
                <select
                  onChange={(e) => {
                    const preset = KOTA_AREA_PRESETS.find((p) => p.area === e.target.value);
                    if (preset) {
                      setBinModalForm((prev) => ({
                        ...prev,
                        area: preset.area,
                        lat: preset.lat,
                        lng: preset.lng,
                        address: `${preset.area}, Kota, Rajasthan`,
                      }));
                    }
                  }}
                  className="w-full bg-[#0E1E3C] border border-[#334155] text-white p-2 text-xs rounded outline-none"
                >
                  <option value="">-- प्रसिद्ध कोटा इलाका चुनें (Auto-fill coordinates) --</option>
                  {KOTA_AREA_PRESETS.map((p) => (
                    <option key={p.area} value={p.area}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-mono text-[#7FD8E8] uppercase block mb-1">
                    BIN SERIAL ID (सीरियल नंबर):
                  </label>
                  <input
                    required
                    type="text"
                    value={binModalForm.serial}
                    onChange={(e) => setBinModalForm({ ...binModalForm, serial: e.target.value.toUpperCase() })}
                    placeholder="e.g. CC-BIN-06"
                    className="w-full bg-[#0E1E3C] border border-[#334155] p-2 text-white font-mono rounded outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#7FD8E8] uppercase block mb-1">
                    LOCALITY / AREA (इलाका):
                  </label>
                  <input
                    required
                    type="text"
                    value={binModalForm.area}
                    onChange={(e) => setBinModalForm({ ...binModalForm, area: e.target.value })}
                    placeholder="e.g. Nayapura, Landmark City, Talwandi"
                    className="w-full bg-[#0E1E3C] border border-[#334155] p-2 text-white rounded outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#7FD8E8] uppercase block mb-1">
                  DISPLAY NAME (बिन का नाम):
                </label>
                <input
                  required
                  type="text"
                  value={binModalForm.name}
                  onChange={(e) => setBinModalForm({ ...binModalForm, name: e.target.value })}
                  placeholder="e.g. Nayapura Bus Stand Smart Bin"
                  className="w-full bg-[#0E1E3C] border border-[#334155] p-2 text-white rounded outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#7FD8E8] uppercase block mb-1">
                  FULL PHYSICAL ADDRESS (सटीक पता):
                </label>
                <textarea
                  required
                  rows={2}
                  value={binModalForm.address}
                  onChange={(e) => setBinModalForm({ ...binModalForm, address: e.target.value })}
                  placeholder="e.g. Shop #12, Private Bus Terminal Road, Nayapura, Kota 324001"
                  className="w-full bg-[#0E1E3C] border border-[#334155] p-2 text-white rounded outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-mono text-[#7FD8E8] uppercase block mb-1">
                    LANDMARK (लैंडमार्क / पहचान):
                  </label>
                  <input
                    type="text"
                    value={binModalForm.landmark}
                    onChange={(e) => setBinModalForm({ ...binModalForm, landmark: e.target.value })}
                    placeholder="e.g. Outside Platform 2 waiting hall"
                    className="w-full bg-[#0E1E3C] border border-[#334155] p-2 text-white rounded outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#7FD8E8] uppercase block mb-1">
                    HOST MERCHANT / SHOP NAME (दुकानदार):
                  </label>
                  <input
                    type="text"
                    value={binModalForm.merchantName}
                    onChange={(e) => setBinModalForm({ ...binModalForm, merchantName: e.target.value })}
                    placeholder="e.g. Jodhpur Sweets & Chai"
                    className="w-full bg-[#0E1E3C] border border-[#334155] p-2 text-white rounded outline-none"
                  />
                </div>
              </div>

              {/* Coordinates & Quick GPS Capture */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-[#7FD8E8] uppercase block mb-1">
                      LATITUDE (अक्षांश):
                    </label>
                    <input
                      required
                      type="number"
                      step="0.000001"
                      value={binModalForm.lat}
                      onChange={(e) => setBinModalForm({ ...binModalForm, lat: parseFloat(e.target.value) || 25.17 })}
                      className="w-full bg-[#0E1E3C] border border-[#334155] p-2 text-white font-mono rounded outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#7FD8E8] uppercase block mb-1">
                      LONGITUDE (देशांतर):
                    </label>
                    <input
                      required
                      type="number"
                      step="0.000001"
                      value={binModalForm.lng}
                      onChange={(e) => setBinModalForm({ ...binModalForm, lng: parseFloat(e.target.value) || 75.84 })}
                      className="w-full bg-[#0E1E3C] border border-[#334155] p-2 text-white font-mono rounded outline-none"
                    />
                  </div>
                </div>

                {/* Instant On-Site Hardware & GPS Mapping Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                  <button
                    type="button"
                    onClick={handleAutoDetectGPS}
                    className="px-3 py-1.5 bg-[#1F8F82] hover:bg-[#18756a] text-white font-mono text-[11px] font-bold rounded flex items-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>📍 मेरी वर्तमान लोकेशन से GPS भरें (Detect On-Site GPS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      showToast('🔍 Scanning nearby Bluetooth ESP32...');
                      const success = await connectDeviceBluetooth(binModalForm.serial);
                      if (success) {
                        showToast(`✓ Nearby ESP32 connected! Linked to ${binModalForm.serial}`);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#0E1E3C] border border-[#10B981]/50 text-[#10B981] font-mono text-[11px] font-bold rounded flex items-center gap-1.5 cursor-pointer hover:bg-[#0C1628] active:scale-95 transition-all"
                  >
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>🔍 स्कैन करके पास का ESP-32 लिंक करें</span>
                  </button>
                </div>
              </div>

              {/* Baseline Votes */}
              <div className="p-3 bg-[#081226] rounded-xl border border-[#334155] space-y-1">
                <span className="text-[11px] font-mono text-[#94A3B8] uppercase block font-bold">
                  INITIAL / BASELINE VOTES AT THIS BIN:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#10B981] font-mono block">Option A Votes:</label>
                    <input
                      type="number"
                      min="0"
                      value={binModalForm.baseA}
                      onChange={(e) => setBinModalForm({ ...binModalForm, baseA: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-[#0E1E3C] border border-[#10B981]/40 p-1.5 text-white font-mono rounded outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#F05A28] font-mono block">Option B Votes:</label>
                    <input
                      type="number"
                      min="0"
                      value={binModalForm.baseB}
                      onChange={(e) => setBinModalForm({ ...binModalForm, baseB: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-[#0E1E3C] border border-[#F05A28]/40 p-1.5 text-white font-mono rounded outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#7FD8E8]/20 font-mono">
                {editingBinSerial && editingBinSerial !== 'CC-BIN-01' ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteBin(editingBinSerial)}
                    className="px-3 py-2 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 rounded font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हटाएँ (Delete)</span>
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBinModalOpen(false)}
                    className="px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black rounded font-black cursor-pointer shadow-lg active:scale-98"
                  >
                    ✓ DEPLOY & SAVE ON MAP
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 5. ESP-32 ARDUINO CODE & HARDWARE LINK MODAL */}
      {/* ========================================================================= */}
      {codeModalBin && (
        <div className="fixed inset-0 z-[99999] bg-[#0E1E3C]/85 backdrop-blur-md flex items-center justify-center p-3 select-text font-mono text-xs">
          <div className="bg-[#0C1628] border-2 border-[#7FD8E8] max-w-2xl w-full p-5 text-[#F2EAD6] shadow-2xl rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#7FD8E8]/40 pb-3">
              <div className="flex items-center gap-2 text-[#7FD8E8] font-bold">
                <Code className="w-5 h-5 text-[#10B981]" />
                <span className="uppercase text-sm">
                  ESP32 HARDWARE LINK & ARDUINO CODE: {codeModalBin.serial}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCodeModalBin(null)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation of how the App identifies this ESP32 */}
            <div className="p-3 bg-[#081226] border border-[#10B981]/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#10B981] font-bold">
                <Cpu className="w-4 h-4" />
                <span>ऐप को कैसे पता चलेगा कि यह कौनसा ESP-32 बिन है? (How App Identifies This Bin):</span>
              </div>
              <ul className="text-[#94A3B8] space-y-1.5 list-disc pl-5">
                <li>
                  <b className="text-white">1. Bluetooth BLE Name:</b> नीचे दिए गए कोड में <code className="text-[#10B981] bg-[#0E1E3C] px-1 py-0.5 rounded">#define BLE_NAME "{codeModalBin.serial}"</code> सेट है। जब आप ब्लूटूथ से कनेक्ट करेंगे, तो फोन इसे सीधे <b className="text-[#10B981]">{codeModalBin.serial} ({codeModalBin.name})</b> के रूप में पहचान लेगा!
                </li>
                <li>
                  <b className="text-white">2. Wi-Fi Auto Telemetry:</b> जब ESP32 वाई-फाई से कनेक्ट होगा, तो वह <code className="text-[#7FD8E8] bg-[#0E1E3C] px-1 py-0.5 rounded">/api/bin/sync?serial={codeModalBin.serial}</code> पर वोट भेजेगा, जिससे कोटा के नक्शे पर इस पिन का डेटा अपने आप लाइव अपडेट होगा।
                </li>
                <li>
                  <b className="text-white">3. Direct App Linking:</b> यदि आपका कोई भी ESP32 अभी कनेक्ट है, तो आप नीचे बटन दबाकर उसे तुरंत इस लोकेशन (<b className="text-white">{codeModalBin.area}</b>) से जोड़ सकते हैं!
                </li>
              </ul>

              {/* Direct Bind Button */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#334155]">
                <span className="text-[11px] text-white">लोकेशन: <b>{codeModalBin.name} ({codeModalBin.area})</b></span>
                <button
                  type="button"
                  onClick={() => {
                    handleLinkHardwareToBin(codeModalBin.serial);
                    setCodeModalBin(null);
                  }}
                  className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-black font-bold rounded flex items-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>⚡ Link Currently Connected ESP32 to {codeModalBin.serial}</span>
                </button>
              </div>
            </div>

            {/* Code View with Copy Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#7FD8E8] font-bold">
                  ARDUINO C++ SKETCH FOR {codeModalBin.serial} ({codeModalBin.area}):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const code = `/*
  =============================================================================
  CODE & CIRCUIT — ESP32 SMART SURVEY BIN FIRMWARE (KOTA NETWORK)
  Bin Serial : ${codeModalBin.serial}
  Site       : ${codeModalBin.name} (${codeModalBin.area}, Kota)
  GPS Coords : ${codeModalBin.lat}, ${codeModalBin.lng}
  =============================================================================
*/

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Preferences.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define SENSOR_A_PIN    18    // IR Sensor / Button for Option A
#define SENSOR_B_PIN    19    // IR Sensor / Button for Option B
#define BUZZER_PIN      21    // Buzzer for voter sound feedback
#define STATUS_LED_PIN   2    // Onboard Blue LED

#define BIN_SERIAL      "${codeModalBin.serial}"
#define BLE_NAME        "SmartBin-${codeModalBin.serial}"

// Nordic UART BLE UUIDs
#define SERVICE_UUID    "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHAR_RX_UUID    "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHAR_TX_UUID    "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// Optional Wi-Fi Cloud Sync (3 times a day auto-sync engine)
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASS     = "YOUR_WIFI_PASSWORD";
const char* CLOUD_API_URL = "https://ais-dev-rhrfg37v6ckindul6ip4v5-559507065653.asia-east1.run.app/api/bin/sync";

Preferences prefs;
volatile int countA = ${codeModalBin.baseA};
volatile int countB = ${codeModalBin.baseB};
volatile unsigned long lastA = 0;
volatile unsigned long lastB = 0;
bool pendingSave = false;
bool bleConnected = false;

BLEServer* pServer = nullptr;
BLECharacteristic* pTxChar = nullptr;

// 3 times a day sync timer (every 4 hours = 14,400,000 ms)
unsigned long lastSyncMillis = 0;
const unsigned long SYNC_INTERVAL = 4UL * 60UL * 60UL * 1000UL;

class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* p) { bleConnected = true; digitalWrite(STATUS_LED_PIN, HIGH); }
  void onDisconnect(BLEServer* p) { bleConnected = false; digitalWrite(STATUS_LED_PIN, LOW); p->startAdvertising(); }
};

class RxCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) {
    String rx = c->getValue().c_str();
    rx.trim();
    if (rx == "READ" || rx == "GET") sendTelemetry();
    else if (rx == "RESET") { countA = 0; countB = 0; saveCounts(); sendTelemetry(); }
  }
};

void sendTelemetry() {
  String pkt = "COUNT:A=" + String(countA) + ",B=" + String(countB) + ",TOT=" + String(countA + countB) + ",SERIAL=" + BIN_SERIAL + "\\n";
  Serial.print("[BLE TX] " + pkt);
  if (bleConnected && pTxChar) {
    pTxChar->setValue(pkt.c_str());
    pTxChar->notify();
  }
}

void saveCounts() {
  prefs.begin("bin", false);
  prefs.putInt("a", countA);
  prefs.putInt("b", countB);
  prefs.end();
}

void syncCloudOnline() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    unsigned long t = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - t < 7000) delay(200);
  }
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(CLOUD_API_URL) + "?serial=" + BIN_SERIAL + "&countA=" + String(countA) + "&countB=" + String(countB);
    http.begin(url);
    int code = http.GET();
    Serial.printf("[CLOUD SYNC 3x/DAY] Code: %d\\n", code);
    http.end();
    lastSyncMillis = millis();
  }
}

void IRAM_ATTR isrA() {
  unsigned long now = millis();
  if (now - lastA > 500) { countA++; lastA = now; pendingSave = true; }
}

void IRAM_ATTR isrB() {
  unsigned long now = millis();
  if (now - lastB > 500) { countB++; lastB = now; pendingSave = true; }
}

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_A_PIN, INPUT_PULLUP);
  pinMode(SENSOR_B_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  prefs.begin("bin", false);
  countA = prefs.getInt("a", ${codeModalBin.baseA});
  countB = prefs.getInt("b", ${codeModalBin.baseB});
  prefs.end();

  attachInterrupt(digitalPinToInterrupt(SENSOR_A_PIN), isrA, FALLING);
  attachInterrupt(digitalPinToInterrupt(SENSOR_B_PIN), isrB, FALLING);

  BLEDevice::init(BLE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  BLEService* s = pServer->createService(SERVICE_UUID);
  pTxChar = s->createCharacteristic(CHAR_TX_UUID, BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ);
  pTxChar->addDescriptor(new BLE2902());
  BLECharacteristic* pRx = s->createCharacteristic(CHAR_RX_UUID, BLECharacteristic::PROPERTY_WRITE);
  pRx->setCallbacks(new RxCallbacks());
  s->start();

  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
  Serial.println("ESP32 BLE Ready: " + String(BLE_NAME));
}

void loop() {
  if (pendingSave) {
    pendingSave = false;
    saveCounts();
    digitalWrite(BUZZER_PIN, HIGH); delay(80); digitalWrite(BUZZER_PIN, LOW);
    sendTelemetry();
  }
  // Auto-sync online 3 times daily
  if (millis() - lastSyncMillis > SYNC_INTERVAL) {
    syncCloudOnline();
  }
  delay(20);
}`;
                    navigator.clipboard.writeText(code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2500);
                  }}
                  className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#334155] text-white border border-[#7FD8E8]/40 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#F2B33D]" />
                  <span>{copiedCode ? '✓ Copied!' : 'Copy Sketch'}</span>
                </button>
              </div>

              <pre className="bg-[#050B14] border border-[#1E293B] p-3 rounded-xl overflow-x-auto text-[11px] font-mono text-[#10B981] max-h-60 leading-relaxed select-all">
{`// ==============================================================
// ESP32 FIRMWARE FOR BIN ${codeModalBin.serial} (${codeModalBin.area})
// ==============================================================
#define BIN_SERIAL   "${codeModalBin.serial}"
#define BLE_NAME     "SmartBin-${codeModalBin.serial}"

// Nordic UART Service (Automatically detected by App):
#define SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHAR_TX_UUID "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHAR_RX_UUID "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"

// Pins: IR Sensor A -> Pin 18, IR Sensor B -> Pin 19, Buzzer -> Pin 21
// Auto-Sync 3x/Day via WiFi + Real-Time Telemetry over Bluetooth
// Click "Copy Sketch" button above to copy complete Arduino C++ code!`}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCodeModalBin(null)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 6. HOW TO MAP BINS TO LOCATIONS PRACTICAL STEP-BY-STEP MODAL */}
      {/* ========================================================================= */}
      {isMappingGuideOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#0E1E3C]/85 backdrop-blur-md flex items-center justify-center p-3 select-text font-mono text-xs">
          <div className="bg-[#0C1628] border-2 border-[#F2B33D] max-w-2xl w-full p-5 text-[#F2EAD6] shadow-2xl rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F2B33D]/40 pb-3">
              <div className="flex items-center gap-2 text-[#F2B33D] font-bold">
                <HelpCircle className="w-5 h-5" />
                <span className="uppercase text-sm">
                  💡 स्मार्ट बिन की मैपिंग और लिंकिंग कैसे करें? (BIN MAPPING GUIDE)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMappingGuideOpen(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Practical Steps */}
            <div className="space-y-3 font-sans text-xs">
              <p className="text-[#94A3B8] leading-relaxed font-mono text-[11px]">
                फील्ड में नया स्मार्ट बिन लगाते समय लोकेशन, दुकानदार और ESP-32 को आपस में लिंक करने का 4-चरणीय सरल तरीका:
              </p>

              {/* Step 1 */}
              <div className="p-3.5 bg-[#070D18] border border-[#10B981]/40 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-[#10B981] font-bold font-mono">
                  <span className="w-5 h-5 rounded-full bg-[#10B981] text-black flex items-center justify-center text-xs">1</span>
                  <span>चरण 1: मौके पर जाकर GPS ऑटो-कैप्चर (On-Site GPS Capture)</span>
                </div>
                <p className="text-[#94A3B8] pl-7 leading-relaxed">
                  जब फील्ड एजेंट कोटा की किसी चाय दुकान या कोचिंग के बाहर बिन स्थापित करता है, तो 'नया बिन जोड़ें' फॉर्म खोलकर <b>'📍 मेरी वर्तमान लोकेशन से GPS भरें'</b> बटन दबाएं। फोन का GPS अपने आप उस दुकान का सटीक अक्षांश व देशांतर (Latitude/Longitude) ले लेगा।
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-[#070D18] border border-[#3B82F6]/40 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-[#38BDF8] font-bold font-mono">
                  <span className="w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs">2</span>
                  <span>चरण 2: ESP-32 हार्डवेयर ब्लूटूथ पेयरिंग (Bluetooth Hardware Lock)</span>
                </div>
                <p className="text-[#94A3B8] pl-7 leading-relaxed">
                  बिन का स्विच ऑन करें और <b>'🔍 स्कैन करके पास का ESP-32 लिंक करें'</b> दबाएं। मोबाइल पास वाले ESP-32 से कनेक्ट होकर उसका सीरियल आईडी (जैसे <code className="text-[#10B981]">CC-BIN-01</code>) इस दुकान के नाम और पते के साथ हमेशा के लिए लॉक कर देता है।
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-[#070D18] border border-[#F2B33D]/40 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-[#F2B33D] font-bold font-mono">
                  <span className="w-5 h-5 rounded-full bg-[#F2B33D] text-black flex items-center justify-center text-xs">3</span>
                  <span>चरण 3: दुकानदार का खाता व फोन लिंकिंग (Merchant Shop Assignment)</span>
                </div>
                <p className="text-[#94A3B8] pl-7 leading-relaxed">
                  दुकानदार का नाम और मोबाइल नंबर भरें (जैसे 'Sharma Tea Point, Kunhari')। दुकानदार के फोन में ऐप का <b>'दुकानदार पोर्टल (Merchant View)'</b> खोलें। दुकानदार का फोन ब्लूटूथ से बिन से जुड़ा रहेगा।
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 bg-[#070D18] border border-[#8B5CF6]/40 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-[#A78BFA] font-bold font-mono">
                  <span className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs">4</span>
                  <span>चरण 4: दिन में 3 बार ऑटो ऑनलाइन अपलोड (Daily 3-Times Auto Sync)</span>
                </div>
                <p className="text-[#94A3B8] pl-7 leading-relaxed">
                  दुकानदार का फोन 12 घंटे दुकान पर ही रहता है। ऐप में निर्धारित शेड्यूल — <b>सुबह 10:00 बजे (Morning Rush)</b>, <b>दोपहर 03:00 बजे (Coaching Break)</b>, और <b>रात 09:00 बजे (Closing Rush)</b> — पर ऐप ब्लूटूथ से वोट्स पढ़कर सर्वर पर अपने आप लाइव कर देता है!
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => {
                  setIsMappingGuideOpen(false);
                  handleOpenAddModal();
                }}
                className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>अभी नया बिन मैप करें (Add Bin Now)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMappingGuideOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded-lg font-bold cursor-pointer"
              >
                समझ गया (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
