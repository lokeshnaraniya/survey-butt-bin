/**
 * Code & Circuit — Hardware Bridge Service
 * Supports Direct Web Bluetooth (Web BLE) and Web Serial (USB)
 * Communicates directly with ESP32 Smart Bin from inside the web app.
 */

export interface HardwareCounts {
  countA: number;
  countB: number;
  total: number;
}

export type ConnectionMethod = 'bluetooth' | 'serial' | 'wifi' | 'none';

export const BLE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const BLE_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

// Standard Nordic UART UUIDs as secondary fallback
export const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const UART_TX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
export const UART_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

export const COMMON_BLE_SERVICES = [
  BLE_SERVICE_UUID,
  UART_SERVICE_UUID,
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb',
  '00001801-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb',
  '0000180f-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  'battery_service',
  'device_information',
  'generic_access',
];

class HardwareBridge {
  private bleDevice: any = null;
  private bleServer: any = null;
  private bleCharacteristic: any = null;
  private serialPort: any = null;
  private serialReader: any = null;
  private isReadingSerial = false;
  private pollIntervalId: any = null;

  // Virtual / Simulated BLE mode for iframe previews & environments without physical ESP32
  private isSimulated = false;
  private simulatedName = 'ESP32 SmartBin (Virtual BLE)';
  private simulatedTimer: any = null;
  private simulatedCounts: HardwareCounts = { countA: 45, countB: 28, total: 73 };

  public activeMethod: ConnectionMethod = 'none';
  public isConnected = false;

  private onCountsCallback: ((counts: HardwareCounts) => void) | null = null;
  private onStatusCallback: ((status: string, isError?: boolean) => void) | null = null;

  public setCallbacks(
    onCounts: (counts: HardwareCounts) => void,
    onStatus: (status: string, isError?: boolean) => void
  ) {
    this.onCountsCallback = onCounts;
    this.onStatusCallback = onStatus;
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getDeviceName(): string | null {
    if (this.isSimulated) return this.simulatedName;
    return this.bleDevice?.name || null;
  }

  public isVirtual(): boolean {
    return this.isSimulated;
  }

  public isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Connect to a Virtual / Simulated ESP32 via Simulated BLE
   * Works 100% in all environments (iframes, Safari, Firefox, desktops without BLE hardware)
   */
  public connectSimulated(
    deviceName: string = 'ESP32 SmartBin (BLE)',
    initialCounts?: Partial<HardwareCounts>
  ): boolean {
    this.disconnect();
    this.isSimulated = true;
    this.isConnected = true;
    this.activeMethod = 'bluetooth';
    this.simulatedName = deviceName;

    if (initialCounts) {
      const a = initialCounts.countA ?? 45;
      const b = initialCounts.countB ?? 28;
      this.simulatedCounts = { countA: a, countB: b, total: a + b };
    }

    this.onStatusCallback?.(`⚡ Connected to ${this.simulatedName} (Bluetooth Live Telemetry Active)!`);
    this.onCountsCallback?.({ ...this.simulatedCounts });

    // Periodic heartbeat / simulated background sync
    if (this.simulatedTimer) clearInterval(this.simulatedTimer);
    this.simulatedTimer = setInterval(() => {
      if (this.isConnected && this.isSimulated) {
        this.onCountsCallback?.({ ...this.simulatedCounts });
      }
    }, 4000);

    return true;
  }

  /**
   * Simulate a physical vote registered on Hole A or Hole B on the ESP32
   */
  public simulateVote(hole: 'A' | 'B') {
    if (hole === 'A') {
      this.simulatedCounts.countA += 1;
    } else {
      this.simulatedCounts.countB += 1;
    }
    this.simulatedCounts.total = this.simulatedCounts.countA + this.simulatedCounts.countB;
    this.onCountsCallback?.({ ...this.simulatedCounts });
    this.onStatusCallback?.(`⚡ Sensor Pulse: New vote recorded on Hole ${hole} (${this.simulatedName})!`);
  }

  /**
   * Request real-time counts from connected ESP32 immediately
   */
  public async requestCounts(): Promise<void> {
    if (!this.isConnected) return;

    if (this.activeMethod === 'bluetooth' && this.bleCharacteristic) {
      // Direct characteristic read
      try {
        const val = await this.bleCharacteristic.readValue();
        const decoder = new TextDecoder('utf-8');
        const str = decoder.decode(val);
        if (str && str.trim() && str.trim() !== 'READ') {
          this.parseIncomingData(str);
        }
      } catch {}
    } else if (this.activeMethod === 'serial' && this.serialPort) {
      try {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(new TextEncoder().encode('READ\n'));
        writer.releaseLock();
      } catch {}
    }
  }

  /**
   * Connect to ESP32 directly via Web Bluetooth
   */
  public async connectBluetooth(mode: 'filtered' | 'all' = 'all'): Promise<boolean> {
    if (!this.isBluetoothSupported()) {
      this.onStatusCallback?.(
        'Web Bluetooth is not supported on this browser. Use Chrome or Edge on Android or PC.',
        true
      );
      return false;
    }

    try {
      this.onStatusCallback?.('Scanning for Bluetooth devices... (Select SmartBin)');

      const navBluetooth = (navigator as any).bluetooth;
      let dev: any = null;

      if (mode === 'filtered') {
        try {
          dev = await navBluetooth.requestDevice({
            filters: [
              { name: 'SmartBin' },
              { namePrefix: 'Smart' },
              { services: [BLE_SERVICE_UUID] },
            ],
            optionalServices: [BLE_SERVICE_UUID, UART_SERVICE_UUID, '0000ffe0-0000-1000-8000-00805f9b34fb'],
          });
        } catch (filterErr: any) {
          if (filterErr?.name === 'NotFoundError' && filterErr?.message?.includes('User cancelled')) {
            throw filterErr;
          }
          // Fallback to all devices
          dev = await navBluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [BLE_SERVICE_UUID, UART_SERVICE_UUID, '0000ffe0-0000-1000-8000-00805f9b34fb'],
          });
        }
      } else {
        // Fast direct chooser: lists all nearby devices so SmartBin is never missed!
        dev = await navBluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [BLE_SERVICE_UUID, UART_SERVICE_UUID, '0000ffe0-0000-1000-8000-00805f9b34fb'],
        });
      }

      this.bleDevice = dev;
      this.onStatusCallback?.(`Found ${this.bleDevice.name || 'Device'}. Connecting to GATT server...`);

      this.bleDevice.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.activeMethod = 'none';
        this.onStatusCallback?.('Bluetooth device disconnected.', true);
      });

      // Ensure clean connection state
      if (this.bleDevice.gatt && this.bleDevice.gatt.connected) {
        try {
          this.bleDevice.gatt.disconnect();
          await new Promise((r) => setTimeout(r, 250));
        } catch {}
      }

      this.bleServer = await this.bleDevice.gatt.connect();
      this.onStatusCallback?.('Connected to GATT. Discovering telemetry services...');

      // Attempt to get custom telemetry service or fallback UART
      let service: any = null;
      try {
        service = await this.bleServer.getPrimaryService(BLE_SERVICE_UUID);
        this.bleCharacteristic = await service.getCharacteristic(BLE_CHAR_UUID);
      } catch {
        try {
          service = await this.bleServer.getPrimaryService(UART_SERVICE_UUID);
          this.bleCharacteristic = await service.getCharacteristic(UART_TX_CHAR_UUID);
        } catch {
          try {
            // HM-10 / generic serial characteristic 0xFFE0
            service = await this.bleServer.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
            this.bleCharacteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
          } catch {
            // Fallback to any available primary service
            const services = await this.bleServer.getPrimaryServices();
            if (services && services.length > 0) {
              for (const s of services) {
                try {
                  const chars = await s.getCharacteristics();
                  if (chars && chars.length > 0) {
                    service = s;
                    this.bleCharacteristic = chars[0];
                    break;
                  }
                } catch {}
              }
            }
          }
        }
      }

      if (this.bleCharacteristic) {
        await this.bleCharacteristic.startNotifications();
        this.bleCharacteristic.addEventListener(
          'characteristicvaluechanged',
          (event: any) => {
            const value = event.target.value;
            const decoder = new TextDecoder('utf-8');
            const str = decoder.decode(value);
            this.parseIncomingData(str);
          }
        );
      }

      this.isConnected = true;
      this.activeMethod = 'bluetooth';
      this.onStatusCallback?.(`⚡ Connected to ${this.bleDevice.name || 'ESP32 SmartBin'} via Bluetooth!`);

      // Immediately request counts in rapid succession so real counts are received immediately on connect
      this.requestCounts();
      setTimeout(() => this.requestCounts(), 200);
      setTimeout(() => this.requestCounts(), 500);
      setTimeout(() => this.requestCounts(), 1000);
      setTimeout(() => this.requestCounts(), 2000);

      // Background telemetry poll every 2.5s while connected
      if (this.pollIntervalId) clearInterval(this.pollIntervalId);
      this.pollIntervalId = setInterval(() => {
        if (this.isConnected) {
          this.requestCounts();
        } else {
          clearInterval(this.pollIntervalId);
          this.pollIntervalId = null;
        }
      }, 2500);

      return true;
    } catch (err: any) {
      let msg = err?.message || 'Bluetooth connection failed.';
      if (err?.name === 'SecurityError' || msg.includes('permissions policy') || msg.includes('disallowed')) {
        msg = '⚠️ Browser Iframe Security: AI Studio preview iframe me Bluetooth blocked hai. Kripya upar "Open Full Tab ↗" par click karein!';
      } else if (err?.name === 'NotFoundError' || msg.includes('User cancelled') || msg.includes('cancelled')) {
        msg = 'Bluetooth scan cancel hua ya SmartBin nahi mila. Android me Location (GPS) aur Bluetooth dono ON karein.';
      } else if (msg.includes('GATT')) {
        msg = 'GATT connection error. ESP32 ko ek baar restart karein aur dubara connect dabayein.';
      }
      this.onStatusCallback?.(msg, true);
      return false;
    }
  }

  /**
   * Connect to ESP32 directly via USB Cable (Web Serial)
   */
  public async connectSerial(): Promise<boolean> {
    if (!this.isSerialSupported()) {
      this.onStatusCallback?.(
        'Web Serial is not supported on this browser. Plug USB on Chrome or Edge (PC/Mac/Android).',
        true
      );
      return false;
    }

    try {
      this.onStatusCallback?.('Selecting USB Serial port (115200 baud)...');
      const navSerial = (navigator as any).serial;
      this.serialPort = await navSerial.requestPort();

      await this.serialPort.open({ baudRate: 115200 });

      this.isConnected = true;
      this.activeMethod = 'serial';
      this.isReadingSerial = true;
      this.onStatusCallback?.('Connected via USB Serial at 115200 baud!');

      this.readSerialStream();
      return true;
    } catch (err: any) {
      this.onStatusCallback?.(err.message || 'Serial connection cancelled.', true);
      return false;
    }
  }

  private async readSerialStream() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.serialPort.readable.pipeTo(textDecoder.writable);
    this.serialReader = textDecoder.readable.getReader();

    let buffer = '';
    try {
      while (this.isReadingSerial) {
        const { value, done } = await this.serialReader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            this.parseIncomingData(line.trim());
          }
        }
      }
    } catch (err) {
      this.onStatusCallback?.('Serial stream closed.', true);
    } finally {
      this.serialReader?.releaseLock();
    }
  }

  /**
   * Send a reset command to ESP32 hardware via active channel
   */
  public async sendResetCommand(): Promise<boolean> {
    if (!this.isConnected) return false;

    const command = 'RESET\n';
    const encoder = new TextEncoder();
    const data = encoder.encode(command);

    try {
      if (this.activeMethod === 'bluetooth' && this.bleCharacteristic) {
        if (this.bleCharacteristic.writeValueWithResponse) {
          await this.bleCharacteristic.writeValueWithResponse(data);
        } else {
          await this.bleCharacteristic.writeValue(data);
        }
      } else if (this.activeMethod === 'serial' && this.serialPort) {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
      }

      this.onStatusCallback?.('Reset command transmitted to ESP32 hardware.');
      return true;
    } catch (err: any) {
      this.onStatusCallback?.('Failed to send reset command: ' + err.message, true);
      return false;
    }
  }

  /**
   * Parse incoming string from Bluetooth or Serial:
   * Handles formats:
   * 1. JSON: {"countA": 12, "countB": 24, "total": 36}
   * 2. Key-value: "A:12,B:24,Total:36" or "A=12,B=24"
   * 3. Serial log line: "A = 12" / "B = 24"
   */
  public parseIncomingData(rawText: string) {
    if (!rawText || !rawText.trim()) return;

    const clean = rawText.trim();
    // Ignore non-telemetry control strings
    if (clean === 'READ' || clean === 'RESET' || clean === 'OK') return;

    // Try JSON
    try {
      const json = JSON.parse(clean);
      if (typeof json === 'object' && json !== null) {
        if ('countA' in json || 'countB' in json || 'A' in json || 'B' in json) {
          const a = Number(json.countA ?? json.A ?? 0);
          const b = Number(json.countB ?? json.B ?? 0);
          const total = Number(json.total ?? a + b);
          this.onCountsCallback?.({ countA: a, countB: b, total });
          return;
        }
      }
    } catch {}

    // Try regex: A: \d+ or A = \d+
    const matchA = rawText.match(/A\s*[:=]\s*(\d+)/i);
    const matchB = rawText.match(/B\s*[:=]\s*(\d+)/i);
    const matchTotal = rawText.match(/Total\s*[:=]\s*(\d+)/i);

    if (matchA || matchB) {
      const a = matchA ? parseInt(matchA[1], 10) : undefined;
      const b = matchB ? parseInt(matchB[1], 10) : undefined;

      // Read current state or emit partial
      if (a !== undefined && b !== undefined) {
        this.onCountsCallback?.({
          countA: a,
          countB: b,
          total: matchTotal ? parseInt(matchTotal[1], 10) : a + b,
        });
      } else if (a !== undefined) {
        this.onCountsCallback?.({ countA: a, countB: -1, total: -1 });
      } else if (b !== undefined) {
        this.onCountsCallback?.({ countA: -1, countB: b, total: -1 });
      }
    }
  }

  public disconnect() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.simulatedTimer) {
      clearInterval(this.simulatedTimer);
      this.simulatedTimer = null;
    }
    this.isSimulated = false;

    try {
      if (this.bleDevice?.gatt?.connected) {
        this.bleDevice.gatt.disconnect();
      }
      this.isReadingSerial = false;
      this.serialPort?.close();
    } catch {}

    this.isConnected = false;
    this.activeMethod = 'none';
    this.onStatusCallback?.('Disconnected from hardware.');
  }
}

export const hardwareBridge = new HardwareBridge();
