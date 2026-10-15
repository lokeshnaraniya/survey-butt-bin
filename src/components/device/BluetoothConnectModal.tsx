import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bluetooth,
  Wifi,
  Cpu,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Radio,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Activity,
  PlusCircle,
  Code,
  Copy,
  Check,
} from 'lucide-react';

interface BluetoothConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSerial?: string | null;
}

export const BluetoothConnectModal: React.FC<BluetoothConnectModalProps> = ({
  isOpen,
  onClose,
  targetSerial,
}) => {
  const {
    isHardwareConnected,
    activeHardwareMethod,
    hardwareStatusMsg,
    hardwareIsError,
    connectDeviceBluetooth,
    connectDeviceSimulated,
    simulateHardwareVote,
    disconnectDevice,
    liveReading,
    selectedUnitSerial,
    setSelectedUnitSerial,
    units,
  } = useApp();

  const [connectingReal, setConnectingReal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState<string>(
    targetSerial || selectedUnitSerial || 'CC-BIN-01'
  );
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [showCodeDrawer, setShowCodeDrawer] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isBleSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const handleConnectRealBle = async () => {
    setConnectingReal(true);
    try {
      setSelectedUnitSerial(selectedSerial);
      const success = await connectDeviceBluetooth(selectedSerial);
      if (success) {
        // Success
      } else {
        setShowTroubleshoot(true);
      }
    } finally {
      setConnectingReal(false);
    }
  };

  const handleConnectVirtualBle = () => {
    setSelectedUnitSerial(selectedSerial);
    connectDeviceSimulated(selectedSerial, `ESP32 SmartBin (${selectedSerial})`);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-archivo">
      <div className="bg-[#0C1628] border-2 border-[#10B981]/60 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0E1E3C] via-[#0A1424] to-[#0E1E3C] border-b border-[#10B981]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#10B981]/20 border border-[#10B981]/50 rounded-xl text-[#10B981] shadow-inner">
              <Bluetooth className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white font-michroma uppercase">
                  ESP-32 BLUETOOTH HUB
                </h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                    isHardwareConnected
                      ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                      : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                  }`}
                >
                  {isHardwareConnected ? 'CONNECTED ⚡' : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-[#7FD8E8] font-mono mt-0.5">
                सर्वे बिन ESP32 हार्डवेयर से वायरलेस ब्लूटूथ लिंक व लाइव वोटिंग
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-sm">
          {/* Active Connection Banner */}
          {isHardwareConnected ? (
            <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#10B981] font-mono font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>
                    ⚡ Connected to {liveReading?.deviceName || selectedSerial} via Bluetooth!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={disconnectDevice}
                  className="px-3 py-1 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 text-xs font-mono font-bold rounded-lg cursor-pointer transition-all"
                >
                  Disconnect
                </button>
              </div>

              {/* Live telemetry counters & quick vote triggers */}
              <div className="bg-[#070D18] p-3 rounded-lg border border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono text-xs">
                  <span className="text-[#94A3B8] block">Live Counts (ESP32):</span>
                  <span className="text-white font-bold text-sm">
                    Hole A: <b className="text-[#10B981]">{liveReading?.countA ?? 0}</b> | Hole B:{' '}
                    <b className="text-[#F05A28]">{liveReading?.countB ?? 0}</b> | Total:{' '}
                    <b className="text-[#F2B33D]">{liveReading?.total ?? 0}</b>
                  </span>
                </div>

                {/* Instant vote test trigger buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => simulateHardwareVote('A')}
                    className="px-2.5 py-1 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Simulate Hole A vote sensor pulse"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+1 Hole A</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateHardwareVote('B')}
                    className="px-2.5 py-1 bg-[#F05A28]/20 hover:bg-[#F05A28]/30 text-[#F05A28] border border-[#F05A28]/40 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Simulate Hole B vote sensor pulse"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+1 Hole B</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Target Bin Selection */}
              <div>
                <label className="block text-xs font-mono text-[#94A3B8] font-semibold mb-1.5 uppercase">
                  1. किस सर्वे बिन लोकेशन से लिंक करना है? (Target Bin):
                </label>
                <select
                  value={selectedSerial}
                  onChange={(e) => setSelectedSerial(e.target.value)}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-[#10B981] rounded-xl px-3 py-2 text-white font-mono text-sm outline-none cursor-pointer"
                >
                  {units.map((u) => (
                    <option key={u.serial} value={u.serial}>
                      {u.serial} — {u.product_type || 'Smart Bin'} ({u.current_status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status or Error Notice */}
              {hardwareStatusMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                    hardwareIsError
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
                      : 'bg-[#3B82F6]/10 border-[#3B82F6]/40 text-[#7FD8E8]'
                  }`}
                >
                  {hardwareIsError ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{hardwareStatusMsg}</span>
                </div>
              )}

              {/* Iframe Notice & Explanation */}
              {isIframe && (
                <div className="p-3 bg-[#F2B33D]/10 border border-[#F2B33D]/40 rounded-xl text-xs font-mono text-[#F2B33D] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <b className="block">ℹ️ AI Studio Iframe Preview Security Notice:</b>
                    <span>
                      ब्राउज़र सुरक्षा नियमों (Iframe Permissions Policy) के कारण AI Studio के प्रीव्यू
                      फ्रेम में असली ब्लूटूथ ब्लॉक हो सकता है। आप नीचे <b>"सिम्युलेटेड ESP32 ब्लूटूथ"</b>{' '}
                      से तुरंत 1-क्लिक में कनेक्ट करके पूरा लाइव मैप और वोटिंग सिस्टम टेस्ट कर सकते हैं!
                    </span>
                  </div>
                </div>
              )}

              {/* Connection Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Real Bluetooth */}
                <button
                  type="button"
                  onClick={handleConnectRealBle}
                  disabled={connectingReal}
                  className="p-3.5 bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-mono text-xs font-bold rounded-xl border border-[#3B82F6]/60 shadow-lg flex flex-col items-start gap-1 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-1.5 text-sm font-black">
                      <Bluetooth className="w-4 h-4 text-[#60A5FA]" />
                      <span>असली ESP32 ब्लूटूथ</span>
                    </span>
                    {connectingReal && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                  </div>
                  <span className="text-[11px] text-[#93C5FD] text-left">
                    फिजिकल ESP32 डिवाइस को Web BLE से सर्च करें
                  </span>
                </button>

                {/* 2. Virtual / Simulated Bluetooth (100% Reliable) */}
                <button
                  type="button"
                  onClick={handleConnectVirtualBle}
                  className="p-3.5 bg-gradient-to-r from-[#065F46] to-[#059669] hover:from-[#059669] hover:to-[#10B981] text-white font-mono text-xs font-bold rounded-xl border border-[#10B981]/60 shadow-lg flex flex-col items-start gap-1 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-1.5 text-sm font-black">
                      <Zap className="w-4 h-4 text-[#FDE047]" />
                      <span>सिम्युलेटेड ESP32 ब्लूटूथ ⚡</span>
                    </span>
                    <span className="px-1.5 py-0.2 bg-black/40 rounded text-[9px] text-[#6EE7B7]">100% WORK</span>
                  </div>
                  <span className="text-[11px] text-[#A7F3D0] text-left">
                    तुरंत 1-क्लिक टेस्ट: लाइव टेलीमेट्री व मैप पल्स चालू
                  </span>
                </button>
              </div>

              {/* Troubleshooting Drawer */}
              <div className="border border-[#1E293B] rounded-xl p-3 bg-[#070D18]/80 text-xs font-mono space-y-2">
                <button
                  type="button"
                  onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                  className="flex items-center justify-between w-full text-[#7FD8E8] font-bold cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#F2B33D]" />
                    <span>ब्लूटूथ कनेक्ट नहीं हो रहा है? समाधान देखें (Troubleshooting)</span>
                  </span>
                  <span>{showTroubleshoot ? '▲ छुपाएं' : '▼ देखें'}</span>
                </button>

                {showTroubleshoot && (
                  <div className="pt-2 text-[#94A3B8] space-y-2 border-t border-[#1E293B] leading-relaxed">
                    <p>
                      <b>1. ब्राउज़र:</b> Google Chrome या Microsoft Edge का उपयोग करें (Firefox या Safari में Web BLE डिफ़ॉल्ट रूप से नहीं होता)।
                    </p>
                    <p>
                      <b>2. Android फोन:</b> सेटिंग्स में <b>Location (GPS)</b> और <b>Bluetooth</b> दोनों चालू होने चाहिए, तभी Android पर BLE डिवाइस स्कैन होता है।
                    </p>
                    <p>
                      <b>3. ESP32 पावर:</b> सुनिश्चित करें कि ESP32 ऑन है और उसका BLE नाम <code className="text-[#10B981]">SmartBin</code> या <code className="text-[#10B981]">CC-BIN-01</code> प्रसारित हो रहा है।
                    </p>
                    <p>
                      <b>4. आईफ्रेम समस्या:</b> यदि AI Studio में पॉप-अप नहीं खुलता, तो ऊपर दिए गए हरे बटन <b>"सिम्युलेटेड ESP32 ब्लूटूथ"</b> पर क्लिक करें, जिससे बिना किसी रुकावट के पूरा सिस्टम काम करेगा।
                    </p>
                  </div>
                )}
              </div>

              {/* ESP32 Arduino Code Drawer for Pin 27, 26, LCD I2C & BLE */}
              <div className="border border-[#10B981]/40 rounded-xl p-3 bg-[#070D18]/90 text-xs font-mono space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCodeDrawer(!showCodeDrawer)}
                  className="flex items-center justify-between w-full text-[#10B981] font-bold cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-[#F2B33D]" />
                    <span>📋 ESP32 Arduino कोड (आपकी पिन 27, 26 व LCD 16x2 के अनुसार)</span>
                  </span>
                  <span className="text-white bg-[#10B981]/20 px-2 py-0.5 rounded text-[10px]">
                    {showCodeDrawer ? '▲ छुपाएं' : '▼ कोड देखें / कॉपी करें'}
                  </span>
                </button>

                {showCodeDrawer && (
                  <div className="pt-2 text-[#94A3B8] space-y-2.5 border-t border-[#1E293B]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#7FD8E8]">
                        पिन 27 (Sensor A), पिन 26 (Sensor B), SDA 21, SCL 22 + BLE
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const sketch = `/*
  CODE & CIRCUIT — ESP32 SMART BIN FIRMWARE
  Pins: Sensor A = 27, Sensor B = 26, LCD I2C = SDA 21, SCL 22
  BLE Name: SmartBin | SoftAP: SmartBin (12345678)
*/

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SENSOR_A 27
#define SENSOR_B 26
#define SDA_PIN 21
#define SCL_PIN 22

LiquidCrystal_I2C lcd(0x27, 16, 2);
WebServer server(80);
Preferences prefs;

const char* BIN_SERIAL = "${selectedSerial}";
const char* BLE_NAME   = "SmartBin";
const char* AP_SSID    = "SmartBin";
const char* AP_PASS    = "12345678";

#define BLE_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = nullptr;
BLECharacteristic* pBleChar = nullptr;
bool bleConnected = false;

unsigned long countA = 0;
unsigned long countB = 0;
bool lockA = false;
bool lockB = false;
unsigned long lastA = 0;
unsigned long lastB = 0;
const unsigned long debounce = 300;

void showLCD() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("A:"); lcd.print(countA);
  lcd.setCursor(7, 0);
  lcd.print("B:"); lcd.print(countB);
  lcd.setCursor(13, 0);
  lcd.print(bleConnected ? "BT*" : "   ");
  lcd.setCursor(0, 1);
  lcd.print("Tot:"); lcd.print(countA + countB);
  lcd.setCursor(8, 1);
  lcd.print("["); lcd.print(BIN_SERIAL); lcd.print("]");
}

void saveCounts() {
  prefs.putULong("A", countA);
  prefs.putULong("B", countB);
}

void notifyTelemetry() {
  String json = "{\\"serial\\":\\"" + String(BIN_SERIAL) + "\\",\\"countA\\":" + String(countA) + ",\\"countB\\":" + String(countB) + ",\\"total\\":" + String(countA + countB) + "}\\n";
  Serial.print(json);
  if (bleConnected && pBleChar) {
    pBleChar->setValue(json.c_str());
    pBleChar->notify();
  }
}

void resetCounts() {
  countA = 0; countB = 0;
  saveCounts(); showLCD(); notifyTelemetry();
}

void homePage() {
  String p = "<h1>Smart Bin " + String(BIN_SERIAL) + "</h1>";
  p += "<h2>A = " + String(countA) + "</h2><h2>B = " + String(countB) + "</h2><h2>Total = " + String(countA + countB) + "</h2>";
  p += "<p>BLE: " + String(bleConnected ? "CONNECTED" : "WAITING") + "</p>";
  p += "<a href='/reset'><button>RESET</button></a>";
  server.send(200, "text/html", p);
}

void apiData() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\\"serial\\":\\"" + String(BIN_SERIAL) + "\\",\\"countA\\":" + String(countA) + ",\\"countB\\":" + String(countB) + ",\\"total\\":" + String(countA + countB) + "}";
  server.send(200, "application/json", json);
}

class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* p) { bleConnected = true; showLCD(); notifyTelemetry(); }
  void onDisconnect(BLEServer* p) { bleConnected = false; showLCD(); p->startAdvertising(); }
};

class RxCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) {
    String rx = c->getValue().c_str(); rx.trim();
    if (rx == "READ" || rx == "GET") notifyTelemetry();
    else if (rx == "RESET") resetCounts();
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_A, INPUT);
  pinMode(SENSOR_B, INPUT);

  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init(); lcd.backlight();
  lcd.clear(); lcd.setCursor(0, 0); lcd.print("Smart Bin Start");

  prefs.begin("smartbin", false);
  countA = prefs.getULong("A", 0);
  countB = prefs.getULong("B", 0);
  delay(500); showLCD();

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);

  server.on("/", homePage);
  server.on("/data", apiData);
  server.on("/api/data", apiData);
  server.on("/reset", []() { resetCounts(); server.sendHeader("Location", "/"); server.send(303); });
  server.begin();

  BLEDevice::init(BLE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  BLEService* s = pServer->createService(BLE_SERVICE_UUID);
  pBleChar = s->createCharacteristic(BLE_CHAR_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_WRITE);
  pBleChar->addDescriptor(new BLE2902());
  pBleChar->setCallbacks(new RxCallbacks());
  s->start();

  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(BLE_SERVICE_UUID);
  adv->start();
  Serial.println("ESP32 BLE Ready: " + String(BLE_NAME));
}

void loop() {
  server.handleClient();

  if (digitalRead(SENSOR_A) == LOW && !lockA) {
    if (millis() - lastA > debounce) {
      countA++; lastA = millis(); lockA = true;
      saveCounts(); showLCD(); notifyTelemetry();
    }
  }
  if (digitalRead(SENSOR_A) == HIGH) lockA = false;

  if (digitalRead(SENSOR_B) == LOW && !lockB) {
    if (millis() - lastB > debounce) {
      countB++; lastB = millis(); lockB = true;
      saveCounts(); showLCD(); notifyTelemetry();
    }
  }
  if (digitalRead(SENSOR_B) == HIGH) lockB = false;

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n'); cmd.trim();
    if (cmd == "READ") notifyTelemetry();
    else if (cmd == "RESET") resetCounts();
  }
  delay(15);
}`;
                          navigator.clipboard.writeText(sketch);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2500);
                        }}
                        className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-black font-bold rounded flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? '✓ Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <pre className="p-2.5 bg-[#050B14] rounded-lg border border-[#334155] text-[10px] text-[#10B981] overflow-x-auto max-h-48 leading-relaxed">
{`// आपके कोड में जोड़ा गया: BLE Device "SmartBin" + LCD 16x2 I2C + WebServer
// Pin 27 = Sensor A, Pin 26 = Sensor B, SDA 21, SCL 22
// ऊपर "Copy Code" दबाकर पूरा कोड Arduino IDE में पेस्ट करें!`}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A1424] border-t border-[#1E293B] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#64748B]">
            Code & Circuit IoT Hardware Bridge v2.4
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white font-mono text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            बंद करें (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
