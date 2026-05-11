import { useQuery } from "@tanstack/react-query";
import { hoshiApi } from "./hoshiApi";

export function useMissionState() {
  return useQuery({
    queryKey: ["missionState"],
    queryFn: () => hoshiApi.getMissionState(),
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 2000,
  });
}

export function useFrontendState() {
  return useQuery({
    queryKey: ["frontendState"],
    queryFn: () => hoshiApi.getFrontendState(),
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 2000,
  });
}

export function useSpaceWeather() {
  return useQuery({
    queryKey: ["spaceWeather"],
    queryFn: () => hoshiApi.getSpaceWeather(),
    refetchInterval: 60000,
    retry: 3,
  });
}

export function useOrbitState() {
  return useQuery({
    queryKey: ["orbitState"],
    queryFn: () => hoshiApi.getOrbitState(),
    refetchInterval: 15000,
    retry: 3,
  });
}

export function useRisk() {
  return useQuery({
    queryKey: ["risk"],
    queryFn: () => hoshiApi.getRisk(),
    refetchInterval: 20000,
    retry: 3,
  });
}

export function useCoordinate() {
  return useQuery({
    queryKey: ["coordinate"],
    queryFn: () => hoshiApi.getCoordinate(),
    refetchInterval: 30000,
    retry: 3,
  });
}

export function useBackendHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => hoshiApi.getHealth(),
    refetchInterval: 15000,
    retry: 2,
  });
}