import { useState, useEffect, useRef, useCallback } from "react";
import { hoshiApi } from "./hoshiApi";
import { MOCK_WS_DATA } from "./mockData";

function generateLiveWsData(base) {
  return {
    ...base,
    altitude_km: +(base.altitude_km + (Math.random() - 0.5) * 0.4).toFixed(2),
    velocity_km_s: +(base.velocity_km_s + (Math.random() - 0.5) * 0.005).toFixed(4),
    battery_pct: Math.min(100, Math.max(60, +(base.battery_pct + (Math.random() - 0.49) * 0.3).toFixed(1))),
    solar_power_w: Math.round(base.solar_power_w + (Math.random() - 0.5) * 40),
    temperature_c: +(base.temperature_c + (Math.random() - 0.5) * 0.2).toFixed(2),
    signal_strength_dbm: Math.round(base.signal_strength_dbm + (Math.random() - 0.5) * 2),
    data_rate_kbps: Math.round(base.data_rate_kbps + (Math.random() - 0.5) * 50),
    attitude_roll: +((Math.random() - 0.5) * 0.5).toFixed(3),
    attitude_pitch: +((Math.random() - 0.5) * 0.3).toFixed(3),
    attitude_yaw: +(base.attitude_yaw + (Math.random() - 0.5) * 0.1).toFixed(3),
    timestamp: new Date().toISOString(),
  };
}

export function useWebSocket() {
  const [wsData, setWsData] = useState(generateLiveWsData(MOCK_WS_DATA));
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mockTickerRef = useRef(null);
  const mockBaseRef = useRef({ ...MOCK_WS_DATA });

  const startMockTicker = useCallback(() => {
    if (mockTickerRef.current) return;
    mockTickerRef.current = setInterval(() => {
      mockBaseRef.current = generateLiveWsData(mockBaseRef.current);
      setWsData({ ...mockBaseRef.current });
    }, 2500);
  }, []);

  const stopMockTicker = useCallback(() => {
    if (mockTickerRef.current) {
      clearInterval(mockTickerRef.current);
      mockTickerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    wsRef.current = hoshiApi.connectWebSocket(
      (data) => {
        stopMockTicker();
        setWsData(data);
        setIsConnected(true);
      },
      () => {
        setIsConnected(false);
        startMockTicker();
        scheduleReconnect();
      },
      () => {
        setIsConnected(false);
        startMockTicker();
        scheduleReconnect();
      }
    );

    // If ws failed to create at all, start mock
    if (!wsRef.current) {
      startMockTicker();
    }
  }, [startMockTicker, stopMockTicker]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, 8000);
  }, [connect]);

  useEffect(() => {
    // Always start mock ticker initially so data is visible immediately
    startMockTicker();
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      stopMockTicker();
    };
  }, [connect, startMockTicker, stopMockTicker]);

  return { wsData, isConnected };
}