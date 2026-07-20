// IoT Device Service
// Simulated device registry with safety guardrails

const MSD_MINUTES = 30; // Minimum State Duration — prevents relay damage

const DEFAULT_DEVICES = [
  {
    id: 'ev_charger',
    name: 'EV Charger',
    entityId: 'switch.ev_charger_plug',
    type: 'ev',
    powerDraw: 7200, // watts
    status: 'online',
    state: 'off',
    lastToggled: null,
    requiredRuntime: 4, // hours
    deadline: '07:00',
    icon: 'Zap',
    color: 'green',
  },
  {
    id: 'hvac',
    name: 'HVAC System',
    entityId: 'switch.hvac_unit',
    type: 'hvac',
    powerDraw: 3500,
    status: 'online',
    state: 'off',
    lastToggled: null,
    requiredRuntime: 6,
    deadline: '23:00',
    icon: 'Thermometer',
    color: 'blue',
  },
  {
    id: 'water_heater',
    name: 'Water Heater',
    entityId: 'switch.water_heater',
    type: 'heater',
    powerDraw: 4500,
    status: 'online',
    state: 'off',
    lastToggled: null,
    requiredRuntime: 2,
    deadline: '06:00',
    icon: 'Droplets',
    color: 'cyan',
  },
  {
    id: 'solar_inverter',
    name: 'Solar Inverter',
    entityId: 'switch.solar_inverter',
    type: 'solar',
    powerDraw: -2000, // negative = generation
    status: 'online',
    state: 'on',
    lastToggled: null,
    requiredRuntime: 0,
    deadline: null,
    icon: 'Sun',
    color: 'amber',
  },
];

let devices = JSON.parse(JSON.stringify(DEFAULT_DEVICES));

export function getDevices() {
  return devices;
}

export function getDevice(id) {
  return devices.find(d => d.id === id);
}

export function getMSDRemaining(device) {
  if (!device.lastToggled) return 0;
  const elapsed = (Date.now() - device.lastToggled) / 60000;
  return Math.max(0, MSD_MINUTES - elapsed);
}

export function canToggle(device) {
  return getMSDRemaining(device) <= 0;
}

export function toggleDevice(id) {
  const device = devices.find(d => d.id === id);
  if (!device) return { ok: false, error: 'Device not found' };
  if (device.status === 'offline') return { ok: false, error: 'Device offline' };

  const msdRemaining = getMSDRemaining(device);
  if (msdRemaining > 0) {
    return {
      ok: false,
      error: `MSD guardrail: ${Math.ceil(msdRemaining)} min remaining before toggle allowed`,
    };
  }

  // Simulate 5% failure rate
  if (Math.random() < 0.05) {
    return { ok: false, error: 'IoT command timed out (simulated)' };
  }

  device.state = device.state === 'on' ? 'off' : 'on';
  device.lastToggled = Date.now();
  return { ok: true, newState: device.state };
}

export function setDeviceState(id, state) {
  const device = devices.find(d => d.id === id);
  if (!device) return { ok: false, error: 'Device not found' };
  if (device.state === state) return { ok: true, newState: state };
  return toggleDevice(id);
}

export function updateDeviceConstraint(id, runtime, deadline) {
  const device = devices.find(d => d.id === id);
  if (!device) return;
  device.requiredRuntime = runtime;
  device.deadline = deadline;
}

export function getTotalPowerDraw() {
  return devices
    .filter(d => d.state === 'on')
    .reduce((sum, d) => sum + d.powerDraw, 0);
}

export function resetDevices() {
  devices = JSON.parse(JSON.stringify(DEFAULT_DEVICES));
}
