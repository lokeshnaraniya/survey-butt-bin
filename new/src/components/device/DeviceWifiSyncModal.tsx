import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeCircuitLogo } from '../common/CodeCircuitLogo';
import { DimensionLine, RubberStamp } from '../common/CosmicWorkshopComponents';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bluetooth,
  CheckCircle2,
  Cloud,
  CloudRain,
  Code2,
  Copy,
  Cpu,
  Edit3,
  ExternalLink,
  Info,
  Radio,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Terminal,
  Usb,
  Wifi,
  X,
} from 'lucide-react';

export const DeviceWifiSyncModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    deviceIp,
    setDeviceIp,
    syncWithESP32Device,
    resetESP32HardwareCounts,
    deviceSyncStatus,
    deviceSyncError,
    hardware,
    isHardwareConnected,
    activeHardwareMethod,
    hardwareStatusMsg,
    hardwareIsError,
    connectDeviceBluetooth,
    connectDeviceSerial,
    disconnectDevice,
    sendHardwareReset,
    selectedUnit,
    triggerHardwareVote,
    liveReading,
  } = useApp();

  const liveA = liveReading ? liveReading.countA : selectedUnit.counts.A;
  const liveB = liveReading ? liveReading.countB : selectedUnit.counts.B;
  const liveTotal = liveReading ? liveReading.total : liveA + liveB;

  const [activeTab, setActiveTab] = useState<'cloud' | 'bluetooth' | 'serial' | 'code'>('cloud');
  const [copiedCode, setCopiedCode] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);

  // Detect if running inside iframe (which triggers the browser Permissions Policy restriction)
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  if (!isOpen) return null;

  // Poll cloud telemetry endpoint
  const handleCloudSync = async () => {
    setCloudSyncing(true);
    setCloudMsg(null);
    try {
      const res = await fetch('/api/bin/counts');
      if (res.ok) {
        const data = await res.json();
        await syncWithESP32Device(JSON.stringify(data));
        setCloudMsg(`Cloud Synced! Hole A: ${data.countA} · Hole B: ${data.countB} (Total: ${data.total})`);
      } else {
        throw new Error('Cloud endpoint responded with status ' + res.status);
      }
    } catch (err: any) {
      setCloudMsg('Could not fetch from /api/bin/counts: ' + err.message);
    } finally {
      setCloudSyncing(false);
    }
  };

  const openInFullTab = () => {
    window.open(window.location.href, '_blank');
  };

  // Complete, ready-to-flash ESP32 sketch with Cloud Wi-Fi Sync + BLE + LCD + Preferences
  const appHost = typeof window !== 'undefined' ? window.location.origin : 'https://YOUR_APP_URL';

  const completeArduinoSketch = `// =========================================================================
// CODE & CIRCUIT — ESP32 SMART BIN FIRMWARE (CW-01 CLOUD + BLE + LCD)
// 100% Reliable: Connects via Wi-Fi Cloud Sync OR Web Bluetooth
// =========================================================================
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Preferences.h>

// PIN CONFIGURATION
#define SENSOR_A 27
#define SENSOR_B 26
#define SDA_PIN  21
#define SCL_PIN  22

// -------------------------------------------------------------
// OPTION 1: WI-FI CLOUD SYNC (PUT YOUR PHONE HOTSPOT OR HOME WI-FI)
// -------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_PHONE_HOTSPOT";  // Change to your mobile hotspot or Wi-Fi
const char* WIFI_PASSWORD = "YOUR_PASSWORD";       // Hotspot password
const char* CLOUD_SERVER  = "${appHost}"; // Cloud Endpoint

// BLUETOOTH UUIDs (For Direct In-App Connect)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

LiquidCrystal_I2C lcd(0x27, 16, 2);
WebServer server(80);
Preferences prefs;

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool bleConnected = false;

unsigned long countA = 0;
unsigned long countB = 0;
bool lockA = false;
bool lockB = false;
unsigned long lastA = 0;
unsigned long lastB = 0;
const unsigned long debounce = 300;

// ---------- LCD UPDATE ----------
void showLCD() {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("A:"); lcd.print(countA);
  lcd.setCursor(8, 0); lcd.print("B:"); lcd.print(countB);
  lcd.setCursor(0, 1); lcd.print("Total:"); lcd.print(countA + countB);
}

// ---------- SAVE TO FLASH MEMORY ----------
void saveCounts() {
  prefs.putULong("A", countA);
  prefs.putULong("B", countB);
}

// ---------- SEND DATA TO CLOUD & BLUETOOTH ----------
void syncTelemetry() {
  // 1. Send via Bluetooth if connected
  if (bleConnected && pCharacteristic != NULL) {
    String payload = "{\\"countA\\":" + String(countA) + ",\\"countB\\":" + String(countB) + ",\\"total\\":" + String(countA + countB) + "}";
    pCharacteristic->setValue(payload.c_str());
    pCharacteristic->notify();
  }

  // 2. Send via Wi-Fi to Cloud Server (with SSL setInsecure for HTTPS)
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    String url = String(CLOUD_SERVER) + "/api/bin/sync?serial=CC-BIN-01&a=" + String(countA) + "&b=" + String(countB);
    if (http.begin(client, url)) {
      int httpCode = http.GET();
      http.end();
    }
  }

  Serial.print("A = "); Serial.print(countA);
  Serial.print(" | B = "); Serial.println(countB);
}

// ---------- RESET COUNTS ----------
void resetCounts() {
  countA = 0;
  countB = 0;
  saveCounts();
  showLCD();
  syncTelemetry();
  Serial.println("Counts Reset to 0");
}

// ---------- WEB SERVER ROUTES (WITH CORS) ----------
void homePage() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String page = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width'><meta http-equiv='refresh' content='2'><title>Smart Bin</title><style>body{text-align:center;font-family:Arial;margin-top:40px}.box{font-size:28px;margin:15px}button{font-size:20px;padding:12px 25px;background:#F05A28;color:white;border:none}</style></head><body><h1>Smart Bin</h1><div class='box'>A = " + String(countA) + "</div><div class='box'>B = " + String(countB) + "</div><div class='box'>Total = " + String(countA + countB) + "</div><br><a href='/reset'><button>RESET</button></a></body></html>";
  server.send(200, "text/html", page);
}

void jsonCounts() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\"countA\":" + String(countA) + ",\"countB\":" + String(countB) + ",\"total\":" + String(countA + countB) + "}";
  server.send(200, "application/json", json);
}

void resetWeb() {
  resetCounts();
  server.sendHeader("Location", "/");
  server.send(303);
}

class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    bleConnected = true;
    Serial.println("App Connected via Bluetooth!");
    showLCD();
    // Pre-populate characteristic value so immediate readValue() gets current counts
    String payload = "{\"countA\":" + String(countA) + ",\"countB\":" + String(countB) + ",\"total\":" + String(countA + countB) + "}";
    if (pCharacteristic != NULL) {
      pCharacteristic->setValue(payload.c_str());
    }
  }
  void onDisconnect(BLEServer* pServer) {
    bleConnected = false;
    Serial.println("Bluetooth Disconnected.");
    BLEDevice::startAdvertising();
  }
};

class CharacteristicCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pChar) {
    String rxValue = pChar->getValue();
    rxValue.trim();
    if (rxValue.indexOf("RESET") >= 0) {
      resetCounts();
    } else {
      // Whenever app connects and sends READ or queries status, respond immediately!
      showLCD();
      syncTelemetry();
    }
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_A, INPUT);
  pinMode(SENSOR_B, INPUT);

  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Code & Circuit");
  lcd.setCursor(0, 1); lcd.print("SmartBin Ready");

  prefs.begin("smartbin", false);
  countA = prefs.getULong("A", 0);
  countB = prefs.getULong("B", 0);
  delay(500);
  showLCD(); // Immediately show real counts on LCD right on power on!

  // Dual Wi-Fi Mode: SoftAP (192.168.4.1) + Station (Hotspot Cloud Sync)
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("SmartBin", "12345678");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.println("Wi-Fi & SoftAP initialized.");

  // Web Server Routes
  server.on("/", homePage);
  server.on("/counts", jsonCounts);
  server.on("/reset", resetWeb);
  server.begin();

  // Start BLE Bluetooth
  BLEDevice::init("SmartBin");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new CharacteristicCallbacks());

  // Set initial characteristic value with saved counts so reading it on connect works immediately
  String initialPayload = "{\"countA\":" + String(countA) + ",\"countB\":" + String(countB) + ",\"total\":" + String(countA + countB) + "}";
  pCharacteristic->setValue(initialPayload.c_str());

  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("Bluetooth Active as 'SmartBin' (Immediate telemetry enabled)!");
}

void loop() {
  server.handleClient();

  // AUTOMATIC SYNC ON CONNECT WITHOUT WAITING FOR ENTRY
  static bool wasConnected = false;
  static unsigned long connectSyncTimer = 0;
  static unsigned long lastHeartbeat = 0;

  if (bleConnected && !wasConnected) {
    wasConnected = true;
    connectSyncTimer = millis();
    showLCD(); // update LCD immediately on connect!
  }
  if (!bleConnected) {
    wasConnected = false;
  }

  // Push telemetry 500ms after connect (when browser notifications are guaranteed active)
  if (wasConnected && connectSyncTimer > 0 && (millis() - connectSyncTimer > 500)) {
    connectSyncTimer = 0;
    showLCD();
    syncTelemetry();
    Serial.println("Sent immediate telemetry to app on connect!");
  }

  // Heartbeat telemetry every 3 seconds while connected
  if (bleConnected && (millis() - lastHeartbeat > 3000)) {
    lastHeartbeat = millis();
    showLCD();
    syncTelemetry();
  }

  // Check USB Serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd.equalsIgnoreCase("RESET")) {
      resetCounts();
    } else {
      showLCD();
      syncTelemetry();
    }
  }

  // SENSOR A TRIGGER
  if (digitalRead(SENSOR_A) == LOW && !lockA) {
    if (millis() - lastA > debounce) {
      countA++;
      lastA = millis();
      lockA = true;
      saveCounts();
      showLCD();
      syncTelemetry();
    }
  }
  if (digitalRead(SENSOR_A) == HIGH) {
    lockA = false;
  }

  // SENSOR B TRIGGER
  if (digitalRead(SENSOR_B) == LOW && !lockB) {
    if (millis() - lastB > debounce) {
      countB++;
      lastB = millis();
      lockB = true;
      saveCounts();
      showLCD();
      syncTelemetry();
    }
  }
  if (digitalRead(SENSOR_B) == HIGH) {
    lockB = false;
  }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(completeArduinoSketch);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1E3C]/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#16336E] border-2 border-[#7FD8E8] max-w-lg w-full p-5 text-[#F2EAD6] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#7FD8E8]/30 pb-3">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-5 h-5 text-[#F2B33D] animate-pulse" />
            <div>
              <h3 className="font-michroma text-xs text-[#F2EAD6] uppercase">
                ESP32 HARDWARE SYNC HUB
              </h3>
              <span className="font-mono text-[9px] text-[#7FD8E8]">
                CLOUDSYNC · WEB BLUETOOTH · USB · MANUAL
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7FD8E8] hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Counts Bar (Displays Real Hardware Counts) */}
        <div className="my-2 p-2.5 bg-[#0E1E3C] border border-[#7FD8E8]/40 flex items-center justify-between font-mono text-xs shadow-inner">
          <div>
            <span className="text-[10px] text-[#7FD8E8] uppercase block font-bold">
              CURRENT BIN COUNTS (REAL HARDWARE):
            </span>
            <span className="font-bold text-[#F2EAD6]">
              A: <span className="text-[#10B981] text-base font-black">{liveA}</span> · B:{' '}
              <span className="text-[#F05A28] text-base font-black">{liveB}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#7FD8E8] uppercase block font-bold">TOTAL:</span>
            <span className="font-bold text-[#F2B33D] text-base font-black">
              {liveTotal}
            </span>
          </div>
        </div>

        {/* 192.168.4.1 Error Solution Card */}
        <div className="mb-2 p-2.5 bg-[#081226] border border-[#F2B33D]/60 text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-[#F2B33D] font-mono text-[10px] font-bold uppercase mb-1">
            <Info className="w-3.5 h-3.5 text-[#F2B33D]" />
            <span>192.168.4.1 TIMEOUT ERROR FIX / समाधान</span>
          </div>
          <p className="font-archivo text-[#F2EAD6]/90 text-[11px] leading-relaxed">
            <b>192.168.4.1 took too long to respond</b> error isliye aata hai kyunki phone ESP32 ke Wi-Fi se link nahi hota ya internet disconnected rehta hai.
            Ab aap sidhe is app me connect kar sakte hain:
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="bg-[#16336E]/60 p-1.5 border border-[#7FD8E8]/30">
              <span className="text-[#1F8F82] font-bold block">1. Wi-Fi Hotspot (Cloud):</span>
              Phone ka hotspot on karein. ESP32 sidhe internet se is app ko count bhejega!
            </div>
            <div className="bg-[#16336E]/60 p-1.5 border border-[#7FD8E8]/30">
              <span className="text-[#7FD8E8] font-bold block">2. Web Bluetooth (BLE):</span>
              Bina kisi Wi-Fi ke sidhe browser se pair karein (Tab 2).
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1 font-mono text-[9px] border-b border-[#7FD8E8]/20 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`py-1.5 px-1 text-center uppercase font-bold cursor-pointer transition-colors ${
              activeTab === 'cloud'
                ? 'bg-[#0E1E3C] text-[#1F8F82] border border-[#1F8F82]'
                : 'text-[#F2EAD6]/70 hover:text-white'
            }`}
          >
            1. CLOUD
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bluetooth')}
            className={`py-1.5 px-1 text-center uppercase font-bold cursor-pointer transition-colors ${
              activeTab === 'bluetooth'
                ? 'bg-[#0E1E3C] text-[#7FD8E8] border border-[#7FD8E8]'
                : 'text-[#F2EAD6]/70 hover:text-white'
            }`}
          >
            2. BLE
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('serial')}
            className={`py-1.5 px-1 text-center uppercase font-bold cursor-pointer transition-colors ${
              activeTab === 'serial'
                ? 'bg-[#0E1E3C] text-[#F2B33D] border border-[#F2B33D]'
                : 'text-[#F2EAD6]/70 hover:text-white'
            }`}
          >
            3. USB
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-1.5 px-1 text-center uppercase font-bold cursor-pointer transition-colors ${
              activeTab === 'code'
                ? 'bg-[#0E1E3C] text-[#F2EAD6] border border-[#F2EAD6]'
                : 'text-[#F2EAD6]/70 hover:text-white'
            }`}
          >
            4. CODE
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 font-archivo text-xs">
          {/* TAB 1: CLOUD WI-FI SYNC (MOST RELIABLE - WORKS EVERYWHERE) */}
          {activeTab === 'cloud' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#0E1E3C] border border-[#1F8F82]/50 text-xs">
                <span className="font-mono text-[10px] text-[#1F8F82] uppercase block font-semibold mb-1 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-[#1F8F82]" />
                  OPTION 1: AUTOMATIC WI-FI CLOUD SYNC (RECOMMENDED)
                </span>
                <p className="font-archivo text-[#F2EAD6]/90 text-[11px] leading-relaxed">
                  In this mode, your ESP32 connects to your <b>Mobile Hotspot</b> or home Wi-Fi and automatically sends every vote to this cloud server endpoint:
                  <code className="block mt-1 p-1 bg-[#16336E] text-[#7FD8E8] text-[10px] font-mono break-all">
                    {appHost}/api/bin/sync
                  </code>
                </p>
              </div>

              {cloudMsg && (
                <div className="p-2 font-mono text-[11px] border border-[#1F8F82] bg-[#1F8F82]/20 text-[#1F8F82]">
                  {cloudMsg}
                </div>
              )}

              <button
                type="button"
                disabled={cloudSyncing}
                onClick={handleCloudSync}
                className="w-full py-3.5 bg-[#1F8F82] hover:bg-[#18756a] active:scale-98 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${cloudSyncing ? 'animate-spin' : ''}`} />
                <span>FETCH LATEST CLOUD TELEMETRY NOW</span>
              </button>

              <div className="p-2.5 bg-[#0E1E3C]/60 border border-[#7FD8E8]/20 text-[11px] space-y-1">
                <span className="font-bold text-[#F2B33D] font-mono text-[10px]">HOW IT WORKS:</span>
                <div>1. In Arduino code, enter your mobile hotspot name and password.</div>
                <div>2. Turn on your mobile hotspot. ESP32 connects automatically!</div>
                <div>3. Every cigarette dropped calls the cloud API and updates this dashboard live!</div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT WEB BLUETOOTH */}
          {activeTab === 'bluetooth' && (
            <div className="space-y-3">
              {/* If in iframe, explain Permissions Policy */}
              {isInIframe && (
                <div className="p-3 bg-[#F05A28]/20 border border-[#F05A28] text-xs">
                  <span className="font-mono text-[10px] text-[#F05A28] uppercase block font-semibold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#F05A28]" />
                    IFRAME PERMISSION POLICY NOTICE:
                  </span>
                  <p className="font-archivo text-[#F2EAD6]/90 text-[11px] leading-relaxed">
                    Browser security blocks Bluetooth inside the AI Studio editor preview iframe (which caused your error).
                    <b> To use Bluetooth directly on your phone or laptop, simply open the app in a full browser tab:</b>
                  </p>
                  <button
                    type="button"
                    onClick={openInFullTab}
                    className="mt-2.5 py-2 px-3 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>OPEN IN FULL TAB FOR DIRECT BLUETOOTH</span>
                  </button>
                </div>
              )}

              {/* Status Message */}
              <div
                className={`p-2 font-mono text-[11px] border ${
                  hardwareIsError
                    ? 'border-[#F05A28] bg-[#F05A28]/20 text-[#F05A28]'
                    : activeHardwareMethod === 'bluetooth' && isHardwareConnected
                    ? 'border-[#10B981] bg-[#10B981]/20 text-[#10B981]'
                    : 'border-[#7FD8E8]/40 bg-[#0E1E3C] text-[#7FD8E8]'
                }`}
              >
                Status: {activeHardwareMethod === 'bluetooth' && isHardwareConnected ? '⚡ Connected to SmartBin via Bluetooth!' : hardwareStatusMsg}
              </div>

              {!(activeHardwareMethod === 'bluetooth' && isHardwareConnected) ? (
                <button
                  type="button"
                  onClick={async () => {
                    await connectDeviceBluetooth();
                  }}
                  className="w-full py-3.5 bg-[#7FD8E8] hover:bg-[#68c6d6] active:scale-98 text-[#0E1E3C] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>SCAN & PAIR BLUETOOTH (SMARTBIN)</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={sendHardwareReset}
                    className="py-2.5 bg-[#0E1E3C] border border-[#F05A28] text-[#F05A28] hover:bg-[#F05A28] hover:text-white font-mono text-xs font-bold uppercase cursor-pointer"
                  >
                    RESET COUNTS
                  </button>
                  <button
                    type="button"
                    onClick={disconnectDevice}
                    className="py-2.5 bg-[#16336E] border border-[#7FD8E8]/40 text-[#F2EAD6] font-mono text-xs uppercase cursor-pointer hover:bg-[#1E293B]"
                  >
                    DISCONNECT BLE
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USB CABLE (WEB SERIAL) */}
          {activeTab === 'serial' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#0E1E3C] border border-[#F2B33D]/50 text-xs">
                <span className="font-mono text-[10px] text-[#F2B33D] uppercase block font-semibold mb-1 flex items-center gap-1.5">
                  <Usb className="w-3.5 h-3.5 text-[#F2B33D]" />
                  PLUG ESP32 VIA USB CABLE
                </span>
                <p className="font-archivo text-[#F2EAD6]/90 text-[11px] leading-relaxed">
                  Plug your ESP32 into your computer or mobile OTG port. Works in Chrome or Edge at 115200 baud!
                </p>
              </div>

              {!(activeHardwareMethod === 'serial' && isHardwareConnected) ? (
                <button
                  type="button"
                  onClick={connectDeviceSerial}
                  className="w-full py-3.5 bg-[#F2B33D] hover:bg-[#dba032] active:scale-98 text-[#0E1E3C] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Usb className="w-4 h-4" />
                  <span>SELECT USB SERIAL PORT</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={sendHardwareReset}
                    className="py-2.5 bg-[#0E1E3C] border border-[#F05A28] text-[#F05A28] hover:bg-[#F05A28] hover:text-white font-mono text-xs font-bold uppercase cursor-pointer"
                  >
                    RESET COUNTS
                  </button>
                  <button
                    type="button"
                    onClick={disconnectDevice}
                    className="py-2.5 bg-[#16336E] border border-[#7FD8E8]/40 text-[#F2EAD6] font-mono text-xs uppercase cursor-pointer hover:bg-[#1E293B]"
                  >
                    DISCONNECT USB
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLETE READY-TO-FLASH ARDUINO CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#0E1E3C] border border-[#1F8F82]/50 text-xs">
                <span className="font-mono text-[10px] text-[#1F8F82] uppercase block font-semibold mb-1">
                  COMPLETE UPDATED ESP32 ARDUINO SKETCH:
                </span>
                <p className="font-archivo text-[#F2EAD6]/90 text-[11px] leading-relaxed">
                  Includes <b>Wi-Fi Cloud Sync</b> to this app + <b>Bluetooth (BLE)</b> + <b>16x2 LCD</b> + <b>Memory Storage</b>.
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-[#7FD8E8] uppercase">
                  READY-TO-FLASH CODE:
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="py-1.5 px-3 bg-[#F05A28] hover:bg-[#d84818] text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'COPIED TO CLIPBOARD!' : 'COPY CODE'}</span>
                </button>
              </div>

              <pre className="p-3 bg-[#081226] border border-[#7FD8E8]/30 font-mono text-[10px] text-[#7FD8E8] max-h-64 overflow-y-auto leading-relaxed select-all">
                {completeArduinoSketch}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
