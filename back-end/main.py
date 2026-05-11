"""
HOSHI Orbital Safety API — rewritten with 100% open, keyless sources:

  • Where The ISS At  (api.wheretheiss.at)       — real ISS position, no key
  • Open Notify       (api.open-notify.org)       — crew aboard, no key
  • Ivan Stanojević   (tle.ivanstanojevic.me)     — TLEs for any NORAD ID, no key
  • NOAA SWPC                                     — space weather, no key

All original business logic (risk, maneuver, simulation, WebSocket) preserved.
"""

import math
import asyncio
from datetime import datetime, timezone

import requests
from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from skyfield.api import EarthSatellite, load

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="HOSHI Orbital Safety API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Open-data source URLs  (zero API keys required)
# ---------------------------------------------------------------------------

# Real-time ISS position + velocity
WHERETHEISS_URL = "https://api.wheretheiss.at/v1/satellites/25544"

# Current crew aboard the ISS (and other vehicles)
OPEN_NOTIFY_CREW_URL = "http://api.open-notify.org/astros.json"

# TLE proxy — returns JSON with line1 / line2 for any NORAD catalogue ID
# Usage: /api/tle/{norad_id}
IVANSTANO_TLE_URL = "https://tle.ivanstanojevic.me/api/tle/{norad_id}"

# NOAA planetary K-index (1-minute cadence)
NOAA_KP_URL = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"

# A handful of interesting NORAD IDs to track alongside the ISS
TRACKED_NORAD_IDS = [
    25544,   # ISS
    20580,   # Hubble Space Telescope
    25338,   # NOAA-15
    28654,   # NOAA-18
    33591,   # NOAA-19
]

# ---------------------------------------------------------------------------
# Helpers: risk & maneuver (unchanged from original)
# ---------------------------------------------------------------------------

def calculate_collision_probability(distance_km: float, relative_velocity_kms: float) -> float:
    base = math.exp(-distance_km / 8)
    velocity_factor = min(relative_velocity_kms / 10, 1)
    probability = base * velocity_factor * 8
    return round(max(0.01, min(probability, 7.5)), 2)


def risk_level(probability: float) -> str:
    if probability >= 5:
        return "critical"
    if probability >= 2:
        return "elevated"
    if probability >= 0.8:
        return "moderate"
    return "low"


def recommend_maneuver(probability: float) -> dict:
    if probability >= 5:
        return {
            "type": "avoidance_burn",
            "action": "Raise orbit by +2.4 km",
            "delta_v_ms": 42.8,
            "burn_duration_s": 21.5,
            "fuel_cost_kg": 1.12,
            "fuel_saved_kg": round(1.0, 2),
            "window": "next 18 minutes",
            "confidence": 0.91,
        }
    if probability >= 2:
        return {
            "type": "avoidance_burn",
            "action": "Adjust trajectory by +1.2 km",
            "delta_v_ms": 24.9,
            "burn_duration_s": 12.6,
            "fuel_cost_kg": 0.73,
            "fuel_saved_kg": None,
            "window": "next 42 minutes",
            "confidence": 0.86,
        }
    return {
        "type": "monitor",
        "action": "No maneuver required. Continue tracking.",
        "delta_v_ms": 0,
        "burn_duration_s": 0,
        "fuel_cost_kg": 0,
        "fuel_saved_kg": None,
        "window": "monitoring only",
        "confidence": 0.78,
    }


def simulate_maneuver(distance_km: float) -> dict:
    improved_distance = distance_km + 150
    reduction = 0 if distance_km == 0 else round(
        ((improved_distance - distance_km) / distance_km) * 100, 2
    )
    return {
        "current_distance_km": round(distance_km, 2),
        "post_maneuver_distance_km": round(improved_distance, 2),
        "risk_reduction_percent": reduction,
    }

# ---------------------------------------------------------------------------
# Data fetchers — each hits one open endpoint
# ---------------------------------------------------------------------------

def fetch_iss_position() -> dict:
    """Real-time ISS lat/lon/altitude/velocity from wheretheiss.at"""
    r = requests.get(WHERETHEISS_URL, timeout=15)
    r.raise_for_status()
    d = r.json()
    return {
        "name": "ISS (ZARYA)",
        "norad_id": 25544,
        "latitude": round(d["latitude"], 4),
        "longitude": round(d["longitude"], 4),
        "altitude_km": round(d["altitude"], 2),
        "velocity_kms": round(d["velocity"] / 3600, 3),   # km/h → km/s
        "visibility": d.get("visibility", "unknown"),
        "source": "wheretheiss.at",
    }


def fetch_crew() -> dict:
    """Current crew aboard the ISS (and other craft) from Open Notify"""
    r = requests.get(OPEN_NOTIFY_CREW_URL, timeout=15)
    r.raise_for_status()
    d = r.json()
    iss_crew = [p["name"] for p in d.get("people", []) if p.get("craft") == "ISS"]
    return {
        "total_in_space": d.get("number", 0),
        "iss_crew": iss_crew,
        "iss_crew_count": len(iss_crew),
        "source": "open-notify.org",
    }


def fetch_tle(norad_id: int) -> tuple[str, str] | None:
    """Fetch TLE lines from Ivan Stanojević's open proxy"""
    url = IVANSTANO_TLE_URL.format(norad_id=norad_id)
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        d = r.json()
        return d["line1"], d["line2"]
    except Exception:
        return None


def fetch_orbit_states(norad_ids: list[int]) -> list[dict]:
    """Propagate TLEs through Skyfield to get current positions"""
    ts = load.timescale()
    t = ts.now()
    results = []
    for nid in norad_ids:
        tle = fetch_tle(nid)
        if tle is None:
            continue
        line1, line2 = tle
        sat = EarthSatellite(line1, line2, ts=ts)
        geo = sat.at(t)
        sp = geo.subpoint()
        results.append({
            "norad_id": nid,
            "name": sat.name or f"NORAD-{nid}",
            "latitude": round(sp.latitude.degrees, 4),
            "longitude": round(sp.longitude.degrees, 4),
            "altitude_km": round(sp.elevation.km, 2),
            "source": "tle.ivanstanojevic.me + Skyfield",
        })
    return results


def fetch_pairwise_risk(norad_a: int, norad_b: int) -> dict:
    """Compute collision risk between two objects using their TLEs"""
    ts = load.timescale()
    t = ts.now()

    tle_a = fetch_tle(norad_a)
    tle_b = fetch_tle(norad_b)

    if tle_a is None or tle_b is None:
        return {"error": "TLE unavailable for one or both objects"}

    sat_a = EarthSatellite(tle_a[0], tle_a[1], ts=ts)
    sat_b = EarthSatellite(tle_b[0], tle_b[1], ts=ts)

    p_a = sat_a.at(t).position.km
    p_b = sat_b.at(t).position.km

    dx, dy, dz = p_a[0]-p_b[0], p_a[1]-p_b[1], p_a[2]-p_b[2]
    distance_km = math.sqrt(dx*dx + dy*dy + dz*dz)

    # Use ISS velocity as representative relative velocity proxy
    rel_vel_kms = 7.66  # typical LEO relative approach speed

    probability = calculate_collision_probability(distance_km, rel_vel_kms)

    return {
        "source": "tle.ivanstanojevic.me + Skyfield",
        "primary": sat_a.name or f"NORAD-{norad_a}",
        "secondary": sat_b.name or f"NORAD-{norad_b}",
        "distance_km": round(distance_km, 2),
        "collision_probability_percent": probability,
        "risk_level": risk_level(probability),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def fetch_space_weather() -> dict:
    """Latest planetary K-index from NOAA SWPC"""
    r = requests.get(NOAA_KP_URL, timeout=15)
    r.raise_for_status()
    data = r.json()
    latest = data[-1]
    kp = float(latest.get("kp_index", 0))
    time_tag = latest.get("time_tag")

    if kp >= 7:
        drag_risk = "high"
        note = "Geomagnetic storm conditions may increase atmospheric drag risk."
    elif kp >= 5:
        drag_risk = "elevated"
        note = "Geomagnetic activity elevated. Monitor LEO orbit decay sensitivity."
    else:
        drag_risk = "nominal"
        note = "Space weather conditions nominal for current orbital monitoring."

    return {
        "source": "NOAA SWPC",
        "time_tag": time_tag,
        "kp_index": kp,
        "drag_risk": drag_risk,
        "operational_note": note,
    }

# ---------------------------------------------------------------------------
# Mission state aggregator
# ---------------------------------------------------------------------------

def get_mission_state() -> dict:
    iss = fetch_iss_position()
    crew = fetch_crew()
    orbit_states = fetch_orbit_states(TRACKED_NORAD_IDS)
    risk_data = fetch_pairwise_risk(25544, 20580)   # ISS vs Hubble
    weather = fetch_space_weather()
    simulation = simulate_maneuver(risk_data.get("distance_km", 0))
    probability = risk_data.get("collision_probability_percent", 0.01)
    maneuver = recommend_maneuver(probability)

    return {
        "mission": "HOSHI Mission Control",
        "mode": "live_orbital_data",
        "source": "wheretheiss.at + open-notify.org + tle.ivanstanojevic.me + NOAA SWPC",
        "status": "live",
        "timestamp": datetime.now(timezone.utc).isoformat(),

        # ISS real-time telemetry
        "iss": iss,
        "crew": crew,

        # Multi-satellite orbit states (Skyfield-propagated TLEs)
        "orbit_state": orbit_states,

        # Risk assessment
        "risk": risk_data,
        "maneuver": maneuver,
        "simulation": simulation,

        # Space weather
        "space_weather": weather,

        "decision_engine": "autonomous",

        "event_log": [
            {"time": "NOW", "event": "Live ISS position ingested from wheretheiss.at", "level": "info"},
            {"time": "NOW", "event": f"Crew aboard ISS: {crew['iss_crew_count']}", "level": "info"},
            {"time": "NOW", "event": f"Distance ISS ↔ Hubble: {risk_data.get('distance_km')} km", "level": "info"},
            {"time": "NOW", "event": f"Risk level: {risk_data.get('risk_level')}", "level": risk_data.get("risk_level")},
            {"time": "NOW", "event": maneuver["action"], "level": "recommendation"},
        ],

        "voice_copilot": {
            "active": True,
            "message": "Live orbital data processed. Maneuver recommendation ready.",
            "suggested_question": "Explain the maneuver decision.",
        },
    }

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"message": "HOSHI API online", "status": "nominal",
            "sources": ["wheretheiss.at", "open-notify.org",
                        "tle.ivanstanojevic.me", "NOAA SWPC"]}


@app.get("/iss")
def iss_position():
    """Real-time ISS position and velocity (no key required)"""
    return fetch_iss_position()


@app.get("/crew")
def crew():
    """Current crew aboard the ISS (no key required)"""
    return fetch_crew()


@app.get("/orbit-state")
def orbit_state():
    """Current positions of tracked satellites via open TLE proxy + Skyfield"""
    return {
        "source": "tle.ivanstanojevic.me + Skyfield",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "satellites": fetch_orbit_states(TRACKED_NORAD_IDS),
    }


@app.get("/risk")
def risk(primary: int = 25544, secondary: int = 20580):
    """Collision risk between any two NORAD objects (default: ISS vs Hubble)"""
    return fetch_pairwise_risk(primary, secondary)


@app.get("/space-weather")
def space_weather():
    """Latest K-index from NOAA SWPC (no key required)"""
    return fetch_space_weather()


@app.get("/mission-state")
def mission_state():
    """Full aggregated mission state — single call for frontends"""
    return get_mission_state()


@app.get("/frontend-state")
def frontend_state():
    """Flat, frontend-friendly view of the mission state"""
    state = get_mission_state()
    risk = state["risk"]
    weather = state["space_weather"]
    maneuver = state["maneuver"]
    simulation = state["simulation"]
    iss = state["iss"]
    crew = state["crew"]

    return {
        "mission": state["mission"],
        "status": state["status"],
        "mode": state["mode"],
        "timestamp": state["timestamp"],

        # ISS telemetry
        "iss_latitude": iss["latitude"],
        "iss_longitude": iss["longitude"],
        "iss_altitude_km": iss["altitude_km"],
        "iss_velocity_kms": iss["velocity_kms"],
        "iss_visibility": iss["visibility"],

        # Crew
        "iss_crew_count": crew["iss_crew_count"],
        "iss_crew": crew["iss_crew"],
        "total_in_space": crew["total_in_space"],

        # Risk
        "primary_object": risk.get("primary"),
        "secondary_object": risk.get("secondary"),
        "distance_km": risk.get("distance_km"),
        "collision_probability_percent": risk.get("collision_probability_percent"),
        "risk_level": risk.get("risk_level"),

        # Space weather
        "space_weather": weather.get("drag_risk"),
        "kp_index": weather.get("kp_index"),

        # Maneuver
        "maneuver_action": maneuver.get("action"),
        "maneuver_type": maneuver.get("type"),
        "delta_v_ms": maneuver.get("delta_v_ms"),
        "burn_duration_s": maneuver.get("burn_duration_s"),
        "fuel_cost_kg": maneuver.get("fuel_cost_kg"),
        "maneuver_window": maneuver.get("window"),

        # Simulation
        "projection_distance_km": simulation.get("post_maneuver_distance_km"),

        # Orbit table
        "orbit_count": len(state["orbit_state"]),
        "orbit_state": state["orbit_state"],
    }


@app.get("/coordinate")
def coordinate():
    return {
        "network": "Solana",
        "consensus": "confirmed",
        "maneuver_hash": "0xA91B72",
        "status": "coordination logged",
    }


# ---------------------------------------------------------------------------
# WebSocket — pushes full mission state every 2 s
# ---------------------------------------------------------------------------

@app.websocket("/ws/mission")
async def websocket_mission(websocket: WebSocket):
    await websocket.accept()
    while True:
        await websocket.send_json(get_mission_state())
        await asyncio.sleep(2)


# ---------------------------------------------------------------------------
# AI copilot (optional — works without OpenRouter key)
# ---------------------------------------------------------------------------

conversation_memory: list[dict] = []


def format_mission_status_answer(state: dict) -> str:
    risk = state.get("risk", {})
    maneuver = state.get("maneuver", {})
    weather = state.get("space_weather", {})
    simulation = state.get("simulation", {})
    iss = state.get("iss", {})
    crew = state.get("crew", {})

    if maneuver.get("type") == "monitor":
        maneuver_line = "Maneuver: Monitoring only. No maneuver required."
    else:
        maneuver_line = (
            f"Maneuver: {maneuver.get('action')} | "
            f"Delta-v: {maneuver.get('delta_v_ms')} m/s | "
            f"Duration: {maneuver.get('burn_duration_s')} s | "
            f"Fuel: {maneuver.get('fuel_cost_kg')} kg | "
            f"Window: {maneuver.get('window')}"
        )

    return f"""
MISSION STATUS — LIVE ORBITAL DATA

ISS position: lat {iss.get('latitude')}, lon {iss.get('longitude')}, alt {iss.get('altitude_km')} km
ISS velocity: {iss.get('velocity_kms')} km/s | Visibility: {iss.get('visibility')}
Crew aboard ISS: {crew.get('iss_crew_count')} ({', '.join(crew.get('iss_crew', []))})

Tracked objects: {risk.get('primary')} vs {risk.get('secondary')}
Distance: {risk.get('distance_km')} km
Collision probability: {risk.get('collision_probability_percent')}% | Risk: {risk.get('risk_level')}
Space weather Kp: {weather.get('kp_index')} ({weather.get('drag_risk')})
{maneuver_line}
Post-maneuver distance estimate: {simulation.get('post_maneuver_distance_km')} km
""".strip()


def should_use_fixed_mission_status(question: str) -> bool:
    q = question.lower()
    keywords = ["mission", "status", "risk", "collision", "maneuver",
                 "distance", "tracking", "iss", "crew", "weather"]
    return any(k in q for k in keywords)


@app.get("/ask-hoshi")
def ask_hoshi(question: str = Query("What is the current mission status?")):
    import os
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

    state = get_mission_state()
    conversation_memory.append({"role": "user", "content": question})

    if should_use_fixed_mission_status(question) or not OPENROUTER_API_KEY:
        answer = format_mission_status_answer(state)
        conversation_memory.append({"role": "assistant", "content": answer})
        return {"question": question, "answer": answer, "mode": "local"}

    system_prompt = f"""
You are HOSHI, an orbital intelligence copilot. Calm, technical, mission-control style.
RULES: Use only the CURRENT MISSION STATE. No markdown. Max 5 lines. English only.
CURRENT MISSION STATE:
{state}
""".strip()

    messages = [{"role": "system", "content": system_prompt}] + conversation_memory[-6:]

    try:
        import requests as req
        resp = req.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}",
                     "Content-Type": "application/json"},
            json={"model": "openrouter/free", "messages": messages},
            timeout=60,
        )
        data = resp.json()
        if "choices" in data:
            answer = data["choices"][0]["message"]["content"]
        else:
            answer = format_mission_status_answer(state)
    except Exception as e:
        answer = format_mission_status_answer(state)
        conversation_memory.append({"role": "assistant", "content": answer})
        return {"question": question, "answer": answer, "mode": "local", "error": str(e)}

    conversation_memory.append({"role": "assistant", "content": answer})
    return {"question": question, "answer": answer, "mode": "conversational"}
