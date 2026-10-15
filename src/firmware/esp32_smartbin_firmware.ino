/*
 =========================================================================================
   CODE & CIRCUIT (KOTA) — ESP32 SMART SURVEY BIN PRODUCTION FIRMWARE
   =======================================================================================
   HARDWARE PINOUT & SPECIFICATIONS (AS PER YOUR CIRCUIT):
     - LCD 16x2 I2C  : I2C Address 0x27 | SDA = GPIO 21 | SCL = GPIO 22
     - Sensor A      : GPIO 27 (Hole A / Option A)
     - Sensor B      : GPIO 26 (Hole B / Option B)
     - Memory        : Non-volatile Flash (Preferences "smartbin" keys "A" and "B")
     - Local Hotspot : SoftAP SSID "SmartBin" | Pass "12345678" | IP: 192.168.4.1
     - Bluetooth BLE : Device Name "SmartBin" (App connects via Web Bluetooth)
     - Web Server    : Port 80 with JSON API & CORS for Web App integration
     - Auto-Sync     : Merchant Phone App connects via BLE & syncs online 3x daily!
 =========================================================================================
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

// ---------------------------------------------------------------------------------------
// 1. PIN CONFIGURATION & HARDWARE INSTANCES
// ---------------------------------------------------------------------------------------
#define SENSOR_A 27
#define SENSOR_B 26

#define SDA_PIN 21
#define SCL_PIN 22

LiquidCrystal_I2C lcd(0x27, 16, 2);
WebServer server(80);
Preferences prefs;

// ---------------------------------------------------------------------------------------
// 2. DEVICE IDENTITY & LOCAL WI-FI HOTSPOT
// ---------------------------------------------------------------------------------------
const char* BIN_SERIAL = "CC-BIN-01";         // इस बिन का सीरियल नंबर (मर्चेंट अकाउंट से लिंक)
const char* BLE_NAME   = "SmartBin";          // वेब ऐप इस नाम को ब्लूटूथ पर ढूंढता है
const char* AP_SSID    = "SmartBin";          // ESP32 का वाई-फाई हॉटस्पॉट नाम
const char* AP_PASS    = "12345678";          // वाई-फाई पासवर्ड

// ---------------------------------------------------------------------------------------
// 3. BLUETOOTH LOW ENERGY (BLE) UUIDs (Compatible with Code & Circuit Web App)
// ---------------------------------------------------------------------------------------
#define BLE_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Nordic UART fallback (Web BLE standard)
#define UART_SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define UART_TX_CHAR_UUID "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
#define UART_RX_CHAR_UUID "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"

BLEServer* pServer = nullptr;
BLECharacteristic* pBleChar = nullptr;
BLECharacteristic* pUartTxChar = nullptr;
bool bleClientConnected = false;
bool oldBleClientConnected = false;

// ---------------------------------------------------------------------------------------
// 4. COUNTERS & TIMINGS
// ---------------------------------------------------------------------------------------
unsigned long countA = 0;
unsigned long countB = 0;

bool lockA = false;
bool lockB = false;

unsigned long lastA = 0;
unsigned long lastB = 0;
const unsigned long debounce = 300; // 300ms डिबाउंस

// ---------------------------------------------------------------------------------------
// 5. LCD DISPLAY FUNCTION
// ---------------------------------------------------------------------------------------
void showLCD() {
  lcd.clear();

  // पहली लाइन: A और B के वोट्स
  lcd.setCursor(0, 0);
  lcd.print("A:");
  lcd.print(countA);

  lcd.setCursor(7, 0);
  lcd.print("B:");
  lcd.print(countB);

  // यदि ब्लूटूथ कनेक्टेड है तो इंडिकेटर दिखाएं
  lcd.setCursor(13, 0);
  if (bleClientConnected) {
    lcd.print("BT*");
  } else {
    lcd.print("   ");
  }

  // दूसरी लाइन: कुल वोट्स और सीरियल नंबर
  lcd.setCursor(0, 1);
  lcd.print("Tot:");
  lcd.print(countA + countB);

  lcd.setCursor(8, 1);
  lcd.print("[");
  lcd.print(BIN_SERIAL);
  lcd.print("]");
}

// ---------------------------------------------------------------------------------------
// 6. FLASH MEMORY STORAGE (वोट हमेशा सुरक्षित)
// ---------------------------------------------------------------------------------------
void saveCounts() {
  prefs.putULong("A", countA);
  prefs.putULong("B", countB);
}

// ---------------------------------------------------------------------------------------
// 7. TELEMETRY BROADCAST (Sends to Bluetooth, Serial & Web)
// ---------------------------------------------------------------------------------------
void notifyAppTelemetry() {
  unsigned long total = countA + countB;

  // 1. JSON स्ट्रिंग (वेब ऐप तुरंत पार्स करता है)
  String jsonStr = "{\"serial\":\"" + String(BIN_SERIAL) + 
                   "\",\"countA\":" + String(countA) + 
                   ",\"countB\":" + String(countB) + 
                   ",\"total\":" + String(total) + "}\n";

  // 2. टेक्स्ट प्रोटोकॉल स्ट्रिंग
  String rawStr = "COUNT:A=" + String(countA) + 
                  ",B=" + String(countB) + 
                  ",TOT=" + String(total) + 
                  ",SERIAL=" + String(BIN_SERIAL) + "\n";

  // Serial पर प्रिंट करें
  Serial.print("[TELEMETRY] ");
  Serial.print(jsonStr);

  // यदि कोई फोन या ऐप ब्लूटूथ से कनेक्ट है, तो उसे लाइव नोटिफिकेशन भेजें
  if (bleClientConnected) {
    if (pBleChar != nullptr) {
      pBleChar->setValue(jsonStr.c_str());
      pBleChar->notify();
    }
    if (pUartTxChar != nullptr) {
      pUartTxChar->setValue(rawStr.c_str());
      pUartTxChar->notify();
    }
  }
}

// ---------------------------------------------------------------------------------------
// 8. RESET FUNCTION
// ---------------------------------------------------------------------------------------
void resetCounts() {
  countA = 0;
  countB = 0;
  saveCounts();
  showLCD();
  notifyAppTelemetry();
  Serial.println("[RESET] Counters reset to 0.");
}

// ---------------------------------------------------------------------------------------
// 9. WEB SERVER ENDPOINTS (HTML + JSON API WITH CORS)
// ---------------------------------------------------------------------------------------

// CORS Headers: ताकि ब्राउज़र बिना रोक-टोक डेटा ले सके
void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

// HTML Dashboard
void homePage() {
  String page = "<!DOCTYPE html><html><head>";
  page += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  page += "<meta http-equiv='refresh' content='2'>";
  page += "<title>Code & Circuit Smart Bin</title>";
  page += "<style>";
  page += "body{text-align:center;font-family:'Segoe UI',Arial,sans-serif;background:#070D18;color:#F2EAD6;padding:20px;margin:0}";
  page += ".card{max-width:400px;margin:20px auto;background:#0C1628;border:2px solid #10B981;border-radius:16px;padding:25px;box-shadow:0 10px 30px rgba(0,0,0,0.5)}";
  page += "h1{color:#10B981;margin-bottom:5px;font-size:24px}";
  page += ".serial{color:#F2B33D;font-family:monospace;font-size:14px;margin-bottom:20px}";
  page += ".stat{display:flex;justify-content:space-between;padding:12px 16px;margin:10px 0;background:#070D18;border-radius:10px;font-size:20px;font-weight:bold}";
  page += ".stat.a{border-left:4px solid #10B981;color:#10B981}";
  page += ".stat.b{border-left:4px solid #38BDF8;color:#38BDF8}";
  page += ".stat.tot{border-left:4px solid #F2B33D;color:#FFF;background:#1E293B}";
  page += ".btn{background:#EF4444;color:#FFF;border:none;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;margin-top:15px;width:100%}";
  page += ".badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;margin-top:15px;background:#10B981;color:#000;font-weight:bold}";
  page += "</style></head><body>";

  page += "<div class='card'>";
  page += "<h1>SMART SURVEY BIN</h1>";
  page += "<div class='serial'>Unit: " + String(BIN_SERIAL) + " | BLE: " + String(BLE_NAME) + "</div>";

  page += "<div class='stat a'><span>HOLE A:</span><span>" + String(countA) + "</span></div>";
  page += "<div class='stat b'><span>HOLE B:</span><span>" + String(countB) + "</span></div>";
  page += "<div class='stat tot'><span>TOTAL:</span><span>" + String(countA + countB) + "</span></div>";

  page += "<div class='badge'>";
  page += (bleClientConnected ? "⚡ Bluetooth: Connected to App" : "📡 Bluetooth: Ready to Connect");
  page += "</div><br>";

  page += "<a href='/reset' onclick=\"return confirm('Reset counts to 0?')\"><button class='btn'>RESET COUNTERS</button></a>";
  page += "</div>";
  page += "</body></html>";

  server.send(200, "text/html", page);
}

// JSON API Endpoint: वेब ऐप सीधे इस यूआरएल से डेटा फैच कर सकता है
void handleApiData() {
  setCorsHeaders();
  unsigned long total = countA + countB;
  String json = "{\"serial\":\"" + String(BIN_SERIAL) + 
                "\",\"countA\":" + String(countA) + 
                ",\"countB\":" + String(countB) + 
                ",\"total\":" + String(total) + 
                ",\"bleConnected\":" + (bleClientConnected ? "true" : "false") + "}";
  server.send(200, "application/json", json);
}

void resetWeb() {
  resetCounts();
  server.sendHeader("Location", "/");
  server.send(303);
}

// ---------------------------------------------------------------------------------------
// 10. BLUETOOTH LOW ENERGY (BLE) CALLBACKS
// ---------------------------------------------------------------------------------------
class BleServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* p) {
    bleClientConnected = true;
    Serial.println("[BLE] Web App / Merchant Phone Connected!");
    showLCD();
    notifyAppTelemetry();
  }

  void onDisconnect(BLEServer* p) {
    bleClientConnected = false;
    Serial.println("[BLE] Disconnected. Restarting Advertising...");
    showLCD();
  }
};

class BleRxCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pChar) {
    String rx = pChar->getValue().c_str();
    rx.trim();
    if (rx.length() > 0) {
      Serial.print("[BLE RX]: ");
      Serial.println(rx);

      if (rx == "READ" || rx == "GET" || rx == "POLL") {
        notifyAppTelemetry();
      } else if (rx == "RESET") {
        resetCounts();
      }
    }
  }
};

// ---------------------------------------------------------------------------------------
// 11. SETUP
// ---------------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=======================================================");
  Serial.println("  CODE & CIRCUIT — ESP32 SMART BIN FIRMWARE V2.5       ");
  Serial.println("=======================================================");

  // सेंसर पिन्स
  pinMode(SENSOR_A, INPUT);
  pinMode(SENSOR_B, INPUT);

  // I2C LCD डिस्प्ले
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Bin Init..");
  lcd.setCursor(0, 1);
  lcd.print("BLE: " + String(BLE_NAME));

  // फ़्लैश मेमोरी से पुराने काउंट्स लोड करें
  prefs.begin("smartbin", false);
  countA = prefs.getULong("A", 0);
  countB = prefs.getULong("B", 0);

  delay(600);
  showLCD();

  // 1. Wi-Fi SoftAP शुरू करें
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);

  Serial.print("WiFi SoftAP SSID: ");
  Serial.println(AP_SSID);
  Serial.print("IP Address: ");
  Serial.println(WiFi.softAPIP());

  // 2. Web Server एंडपॉइंट्स रजिस्टर करें
  server.on("/", homePage);
  server.on("/reset", resetWeb);
  server.on("/api/data", HTTP_GET, handleApiData);
  server.on("/data", HTTP_GET, handleApiData);
  server.on("/api/data", HTTP_OPTIONS, handleOptions);
  server.on("/data", HTTP_OPTIONS, handleOptions);
  server.begin();
  Serial.println("Web server started on port 80");

  // 3. Bluetooth Low Energy (BLE) शुरू करें
  BLEDevice::init(BLE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new BleServerCallbacks());

  // Primary Custom Telemetry Service
  BLEService* pService = pServer->createService(BLE_SERVICE_UUID);
  pBleChar = pService->createCharacteristic(
               BLE_CHAR_UUID,
               BLECharacteristic::PROPERTY_READ |
               BLECharacteristic::PROPERTY_NOTIFY |
               BLECharacteristic::PROPERTY_WRITE
             );
  pBleChar->addDescriptor(new BLE2902());
  pBleChar->setCallbacks(new BleRxCallbacks());
  pService->start();

  // Secondary Nordic UART Service (Maximum compatibility across browsers)
  BLEService* pUartService = pServer->createService(UART_SERVICE_UUID);
  pUartTxChar = pUartService->createCharacteristic(
                  UART_TX_CHAR_UUID,
                  BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ
                );
  pUartTxChar->addDescriptor(new BLE2902());

  BLECharacteristic* pUartRxChar = pUartService->createCharacteristic(
                                     UART_RX_CHAR_UUID,
                                     BLECharacteristic::PROPERTY_WRITE
                                   );
  pUartRxChar->setCallbacks(new BleRxCallbacks());
  pUartService->start();

  // BLE एडवरटाइजिंग शुरू करें ताकि ऐप इसे तुरंत डिटेक्ट कर सके
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  pAdvertising->addServiceUUID(UART_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE Advertising as: " + String(BLE_NAME));
  Serial.println("SYSTEM READY! Ready to link with Merchant App.");
}

// ---------------------------------------------------------------------------------------
// 12. LOOP
// ---------------------------------------------------------------------------------------
void loop() {
  // Web Server क्लाइंट्स हैंडल करें
  server.handleClient();

  // SENSOR A (Hole A / Option A)
  if (digitalRead(SENSOR_A) == LOW && !lockA) {
    if (millis() - lastA > debounce) {
      countA++;
      lastA = millis();
      lockA = true;

      saveCounts();
      showLCD();
      notifyAppTelemetry();

      Serial.print("A = ");
      Serial.println(countA);
    }
  }

  if (digitalRead(SENSOR_A) == HIGH) {
    lockA = false;
  }

  // SENSOR B (Hole B / Option B)
  if (digitalRead(SENSOR_B) == LOW && !lockB) {
    if (millis() - lastB > debounce) {
      countB++;
      lastB = millis();
      lockB = true;

      saveCounts();
      showLCD();
      notifyAppTelemetry();

      Serial.print("B = ");
      Serial.println(countB);
    }
  }

  if (digitalRead(SENSOR_B) == HIGH) {
    lockB = false;
  }

  // BLE री-एडवरटाइजिंग हैंडलर (डिस्कनेक्ट होने पर दोबारा सिग्नल भेजना)
  if (!bleClientConnected && oldBleClientConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("[BLE] Restarted advertising after disconnect.");
    oldBleClientConnected = bleClientConnected;
  }
  if (bleClientConnected && !oldBleClientConnected) {
    oldBleClientConnected = bleClientConnected;
  }

  // Serial Monitor या Web Serial से इनपुट हैंडलिंग (USB Cable सपोर्ट)
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "READ" || cmd == "GET") {
      notifyAppTelemetry();
    } else if (cmd == "RESET") {
      resetCounts();
    }
  }

  delay(15);
}
