// Mock data used as fallback when the API is unavailable or returns incomplete data

export const MOCK_MISSION_STATE = {
  mission_phase: "ORBITAL_OPS",
  status: "nominal",
  satellite_id: "HOSHI-1",
  uptime: "12d 04h 37m",
  last_contact: "2025-01-15T10:42:00Z",
  mode: "AUTO",
  battery_level: "87%",
  solar_power: "nominal",
  communications: "active",
  onboard_temp_c: 22.4,
};

export const MOCK_FRONTEND_STATE = {
  alerts: [],
  last_update: new Date().toISOString(),
  ui_mode: "operational",
  theme: "dark",
};

export const MOCK_ORBIT_STATE = {
  altitude_km: 412.8,
  inclination: 51.64,
  eccentricity: 0.000153,
  semi_major_axis_km: 6784.3,
  raan: 214.5,
  argument_of_perigee: 82.1,
  true_anomaly: 309.2,
  period: "92.68 min",
  orbital_period: "92.68 min",
  velocity_km_s: 7.66,
  ground_track_lat: -23.5,
  ground_track_lon: -46.6,
};

export const MOCK_RISK = {
  collision_risk: 0.12,
  debris_risk: 0.27,
  radiation_risk: 0.08,
  thermal_risk: 0.15,
  power_risk: 0.05,
  composite_risk: 2.4,
  overall_risk: 2.4,
  status: "safe",
  last_assessment: "2025-01-15T10:30:00Z",
  conjunction_count: 3,
  closest_approach_km: 8.4,
  watchlist_objects: 14,
  probability_of_collision: "0.0012%",
};

export const MOCK_SPACE_WEATHER = {
  kp_index: 2.3,
  solar_flux: 142.7,
  solar_wind_speed_km_s: 412,
  geomagnetic_storm: "none",
  proton_flux: "nominal",
  radiation_belt: "quiet",
  aurora_activity: "low",
  x_ray_flux_class: "A2.1",
  sunspot_number: 87,
  forecast: "calm",
};

export const MOCK_COORDINATE = {
  network_status: "active",
  status: "active",
  active_nodes: 7,
  consensus: "98.4%",
  consensus_level: "98.4%",
  sync_rate: "99.1%",
  synchronization_rate: "99.1%",
  protocol: "PBFT",
  last_block: 1048293,
  latency_ms: 42,
  nodes: [
    { id: "NODE-01", name: "Alpha Station", type: "Primary Relay", status: "active" },
    { id: "NODE-02", name: "Beta Groundstation", type: "Ground Control", status: "active" },
    { id: "NODE-03", name: "Gamma Relay", type: "Orbital Relay", status: "synced" },
    { id: "NODE-04", name: "Delta Observer", type: "Passive Monitor", status: "active" },
    { id: "NODE-05", name: "Epsilon Hub", type: "Data Aggregator", status: "synced" },
    { id: "NODE-06", name: "Zeta Uplink", type: "Uplink Station", status: "pending" },
    { id: "NODE-07", name: "Eta Reserve", type: "Backup Node", status: "active" },
  ],
};

export const MOCK_WS_DATA = {
  mission_phase: "ORBITAL_OPS",
  status: "nominal",
  altitude_km: 412.8,
  velocity_km_s: 7.659,
  battery_pct: 87,
  solar_power_w: 1420,
  temperature_c: 22.4,
  signal_strength_dbm: -72,
  data_rate_kbps: 1024,
  attitude_roll: 0.12,
  attitude_pitch: -0.08,
  attitude_yaw: 1.4,
  timestamp: new Date().toISOString(),
};