// IoT Device Service
// Simulated device registry with safety guardrails and extended metrics

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
    priority: 'high',
    chargeTarget: 80, // %
    health: 'Good',
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
    priority: 'high',
    targetTemp: 21, // °C
    comfortRange: { min: 18, max: 24 },
    currentTemp: 21.5,
    health: 'Good',
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
    priority: 'medium',
    currentTemp: 48, // °C
    targetTemp: 55,
    health: 'Good',
  },
  {
    id: 'washing_machine',
    name: 'Washing Machine',
    entityId: 'switch.washing_machine',
    type: 'appliance',
    powerDraw: 2200,
    status: 'online',
    state: 'off',
    lastToggled: null,
    requiredRuntime: 2,
    deadline: '18:00',
    icon: 'RefreshCw',
    color: 'purple',
    priority: 'medium',
    health: 'Good',
  },
  {
    id: 'dishwasher',
    name: 'Dishwasher',
    entityId: 'switch.dishwasher',
    type: 'appliance',
    powerDraw: 1800,
    status: 'online',
    state: 'off',
    lastToggled: null,
    requiredRuntime: 1.5,
    deadline: '20:00',
    icon: 'GlassWater',
    color: 'pink',
    priority: 'low',
    health: 'Good',
  },
  {
    id: 'pool_pump',
    name: 'Pool Pump',
    entityId: 'switch.pool_pump',
    type: 'pump',
    powerDraw: 1500,
    status: 'online',
    state: 'off',
    lastToggled: null,
    requiredRuntime: 3,
    deadline: '16:00',
    icon: 'Waves',
    color: 'teal',
    priority: 'low',
    health: 'Service Required',
  },
  {
    id: 'smart_plug',
    name: 'Smart Plug (Living)',
    entityId: 'switch.smart_plug_living',
    type: 'plug',
    powerDraw: 1200,
    status: 'online',
    state: 'off',
    lastToggled: null,
    requiredRuntime: 1,
    deadline: '22:00',
    icon: 'Plug',
    color: 'slate',
    priority: 'low',
    health: 'Good',
  },
  {
    id: 'battery_storage',
    name: 'Home Battery',
    entityId: 'sensor.home_battery_soc',
    type: 'battery',
    powerDraw: 0, // dynamic: charge (+) or discharge (-)
    capacity: 10000, // Wh (10 kWh)
    maxChargeRate: 5000, // W
    maxDischargeRate: 5000, // W
    soc: 45, // % State of Charge
    status: 'online',
    state: 'idle', // idle, charging, discharging
    lastToggled: null,
    icon: 'Battery',
    color: 'emerald',
    priority: 'high',
    health: 'Good',
  },
  {
    id: 'solar_inverter',
    name: 'Solar Inverter',
    entityId: 'sensor.solar_inverter_generation',
    type: 'solar',
    powerDraw: 0, // generation (-) handled separately
    status: 'online',
    state: 'on',
    lastToggled: null,
    generation: 1800, // W
    icon: 'Sun',
    color: 'amber',
    health: 'Good',
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
  // Battery and Inverter don't enforce physical MSD guards in the same way, but let's check normal toggles
  if (device.type === 'battery' || device.type === 'solar') return true;
  return getMSDRemaining(device) <= 0;
}

export function toggleDevice(id, simFailureRate = 0.05) {
  const device = devices.find(d => d.id === id);
  if (!device) return { ok: false, error: 'Device not found' };
  if (device.status === 'offline') return { ok: false, error: 'Device is offline' };

  // Check MSD guardrail (only for controllable appliance relays)
  if (device.type !== 'battery' && device.type !== 'solar') {
    const msdRemaining = getMSDRemaining(device);
    if (msdRemaining > 0) {
      return {
        ok: false,
        error: `MSD guardrail: ${Math.ceil(msdRemaining)} min remaining before toggle allowed`,
      };
    }
  }

  // Simulate potential connection failures
  if (Math.random() < simFailureRate) {
    return { ok: false, error: 'IoT network connection timed out (simulated)' };
  }

  if (device.type === 'battery') {
    // Battery cycles through: idle -> charging -> discharging -> idle
    const states = ['idle', 'charging', 'discharging'];
    const currentIdx = states.indexOf(device.state);
    device.state = states[(currentIdx + 1) % states.length];
    device.powerDraw = device.state === 'charging' ? 3000 : device.state === 'discharging' ? -2500 : 0;
  } else {
    device.state = device.state === 'on' ? 'off' : 'on';
  }

  device.lastToggled = Date.now();
  return { ok: true, newState: device.state };
}

export function setDeviceState(id, state) {
  const device = devices.find(d => d.id === id);
  if (!device) return { ok: false, error: 'Device not found' };
  if (device.state === state) return { ok: true, newState: state };
  
  if (device.type === 'battery') {
    device.state = state; // idle, charging, discharging
    device.powerDraw = state === 'charging' ? 3000 : state === 'discharging' ? -2500 : 0;
    device.lastToggled = Date.now();
    return { ok: true, newState: state };
  }
  
  return toggleDevice(id, 0); // direct command, bypass random failure
}

export function updateDeviceConstraint(id, runtime, deadline) {
  const device = devices.find(d => d.id === id);
  if (!device) return;
  device.requiredRuntime = runtime;
  device.deadline = deadline;
}

export function updateDeviceProperty(id, property, value) {
  const device = devices.find(d => d.id === id);
  if (!device) return;
  device[property] = value;
}

export function getTotalPowerDraw() {
  return devices.reduce((sum, d) => {
    if (d.type === 'solar') {
      return sum - (d.state === 'on' ? d.generation : 0);
    }
    if (d.type === 'battery') {
      return sum + d.powerDraw; // charging is positive, discharging is negative
    }
    return sum + (d.state === 'on' ? d.powerDraw : 0);
  }, 0);
}

export function resetDevices() {
  devices = JSON.parse(JSON.stringify(DEFAULT_DEVICES));
}
