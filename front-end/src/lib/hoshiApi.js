import {
  MOCK_MISSION_STATE,
  MOCK_FRONTEND_STATE,
  MOCK_ORBIT_STATE,
  MOCK_RISK,
  MOCK_SPACE_WEATHER,
  MOCK_COORDINATE,
} from "./mockData";

const BASE_URL = "https://geovannalim-back-end-hoshi-v1.onrender.com";
const WS_URL = "wss://geovannalim-back-end-hoshi-v1.onrender.com/ws/mission";

const TIMEOUT_MS = 6000;

async function fetchWithFallback(url, fallback) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    const data = await res.json();
    // Merge with fallback so missing fields are always filled
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return { ...fallback, ...data };
    }
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export const hoshiApi = {
  async getHealth() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`${BASE_URL}/`, { signal: controller.signal });
      clearTimeout(timer);
      return res.json();
    } catch {
      return { status: "mock", message: "Using offline mock data" };
    }
  },

  async getMissionState() {
    return fetchWithFallback(`${BASE_URL}/mission-state`, MOCK_MISSION_STATE);
  },

  async getFrontendState() {
    return fetchWithFallback(`${BASE_URL}/frontend-state`, MOCK_FRONTEND_STATE);
  },

  async askHoshi(question) {
    const res = await fetch(`${BASE_URL}/ask-hoshi?question=${encodeURIComponent(question)}`);
    return res.json();
  },

  async getSpaceWeather() {
    return fetchWithFallback(`${BASE_URL}/space-weather`, MOCK_SPACE_WEATHER);
  },

  async getOrbitState() {
    return fetchWithFallback(`${BASE_URL}/orbit-state`, MOCK_ORBIT_STATE);
  },

  async getRisk() {
    return fetchWithFallback(`${BASE_URL}/risk`, MOCK_RISK);
  },

  async getCoordinate() {
    return fetchWithFallback(`${BASE_URL}/coordinate`, MOCK_COORDINATE);
  },

  connectWebSocket(onMessage, onError, onClose) {
    let ws;
    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("[HOSHI WS] Connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch {
          onMessage(event.data);
        }
      };

      ws.onerror = (err) => {
        console.warn("[HOSHI WS] Error — falling back to mock ticker");
        if (onError) onError(err);
      };

      ws.onclose = () => {
        console.log("[HOSHI WS] Disconnected");
        if (onClose) onClose();
      };
    } catch {
      if (onError) onError(new Error("WebSocket unavailable"));
    }
    return ws;
  },
};

export { BASE_URL, WS_URL };