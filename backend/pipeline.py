import json
import re
from ollama_client import generate

def run_pipeline(raw_report: str, manual_location: str = None, manual_casualties: int = None):
    """
    Hybrid AI Pipeline:
    1. Uses Rule-based analysis for instant classification and safety fallback.
    2. Uses Ollama (Llama3) for sophisticated dispatch strategy and analysis.
    """
    print(f"\n[PIPELINE] Analyzing report: {raw_report[:80]}...")
    
    # 1. Baseline Analysis (Rule-based)
    data = rule_based_analysis(raw_report, manual_location)
    
    # 2. AI Enhancement (Ollama)
    ai_success = False
    try:
        prompt = f"""
        Analyze this emergency report and provide a structured JSON response.
        REPORT: "{raw_report}"
        
        RULES:
        - Disaster Type: Categorize accurately.
        - Severity: low, medium, high, or critical.
        - Resources: List specific units needed.
        - Triage: Brief summary of the situation.
        - Dispatch: Detailed tactical orders for field units.
        
        JSON FORMAT:
        {{
            "disaster_type": "string",
            "severity": "string",
            "location": "string",
            "casualties_estimate": number,
            "resources_needed": ["list"],
            "triage_assessment": "string",
            "dispatch_orders": "string"
        }}
        """
        print("[AI] Refining analysis with Ollama (Llama3)...")
        ai_response = generate(prompt, json_format=True, timeout=12)
        ai_data = json.loads(ai_response)
        
        # Merge AI results (AI wins on logic, Rules provide safety base)
        data.update(ai_data)
        ai_success = True
        print("[AI] Successfully integrated AI intelligence.")
    except Exception as e:
        print(f"[AI] Skipping AI refinement (using rules only): {e}")

    # Manual Overrides & Safeguards based on User Input
    if manual_casualties is not None:
        data["casualties_estimate"] = manual_casualties
        if manual_casualties >= 50: 
            data["severity"] = "critical"
        elif manual_casualties >= 10: 
            data["severity"] = "high"
        elif manual_casualties >= 1: 
            data["severity"] = "medium"
        else: 
            data["severity"] = "low"

    # Formatting for Database
    loc_val = data.get("location", manual_location or "Unknown")
    location = json.dumps(loc_val) if isinstance(loc_val, (dict, list)) else str(loc_val)
    
    dt_val = data.get("disaster_type", "Emergency")
    disaster_type = json.dumps(dt_val) if isinstance(dt_val, (dict, list)) else str(dt_val)

    try:
        casualties = int(data.get("casualties_estimate", 0))
    except:
        casualties = 0

    severity = str(data.get("severity", "medium")).lower()
    if severity not in ["low", "medium", "high", "critical"]: severity = "medium"

    resources_needed = data.get("resources_needed", [])
    if not isinstance(resources_needed, list): resources_needed = ["Standard Units"]

    triage_assessment = data.get("triage_assessment", "Manual triage required.")
    dispatch_orders = data.get("dispatch_orders", "Dispatch units immediately.")

    full_dispatch_instruction = f"Triage Assessment:\n{triage_assessment}\n\nDispatch Orders:\n{dispatch_orders}"
    if ai_success:
        full_dispatch_instruction = "--- AI ASSISTED ANALYSIS (OLLAMA) ---\n\n" + full_dispatch_instruction

    print(f"[PIPELINE] Result: {disaster_type} | {severity}")

    return {
        "location": location,
        "disaster_type": disaster_type,
        "casualties_estimate": casualties,
        "severity": severity,
        "resources_needed": json.dumps(resources_needed),
        "dispatch_instruction": full_dispatch_instruction
    }

def rule_based_analysis(raw_report: str, manual_location: str = None) -> dict:
    """Instant rule-based triage engine."""
    text_lower = raw_report.lower()

    # DISASTER TYPE DETECTION
    if any(w in text_lower for w in ["earthquake", "quake", "tremor", "seismic"]):
        disaster_type = "Earthquake"
        resources = ["Urban Search & Rescue (USAR)", "Structural Engineers", "Medical Teams"]
        severity = "critical"
        triage = "Seismic event confirmed. Structural collapse risk is HIGH."
        dispatch = "Deploy all available USAR units to collapse zones. Medical Command post to be established 500m from epicenter."
    elif any(w in text_lower for w in ["fire", "flame", "burning", "blaze", "smoke", "engulfed"]):
        disaster_type = "Fire"
        resources = ["Fire Suppression Units", "Aerial Water Bombers", "EMS Teams"]
        severity = "high" if any(w in text_lower for w in ["house", "building", "structure", "forest"]) else "medium"
        triage = "Active fire confirmed. Life-safety zone established."
        dispatch = "Dispatch Engine Companies to perimeter. Establish Incident Command at safe distance upwind."
    elif any(w in text_lower for w in ["flood", "flooding", "river", "levee", "water level"]):
        disaster_type = "Flood"
        resources = ["Swift Water Rescue", "Helicopters", "Evacuation Boats"]
        severity = "high"
        triage = "Rising water levels detected. Swift water rescue conditions."
        dispatch = "Deploy swift water rescue teams immediately. Request helicopter support for rooftop rescues."
    elif any(w in text_lower for w in ["chemical", "hazmat", "spill", "leak", "toxic"]):
        disaster_type = "Chemical Spill / HazMat"
        resources = ["HazMat Team", "Decontamination Units", "EMS"]
        severity = "critical"
        triage = "Hazardous material release confirmed. Immediate decontamination required."
        dispatch = "HazMat teams en route. Establish 500m exclusion zone. Evacuate downwind sectors immediately."
    else:
        disaster_type = "General Emergency"
        resources = ["Multi-Agency Response Team", "EMS", "Police"]
        severity = "medium"
        triage = "Nature of incident under assessment."
        dispatch = "Dispatch initial assessment unit. Police for scene security."

    # SEVERITY OVERRIDE
    if any(w in text_lower for w in ["mass casualty", "many dead", "catastrophic"]):
        severity = "critical"

    # CASUALTY ESTIMATION
    casualties = 0
    numbers = re.findall(r'(\d+)\s*(?:people|victims?|casualties|injured|trapped)', text_lower)
    if numbers: casualties = int(numbers[0])
    elif "many" in text_lower: casualties = 15

    # LOCATION
    location = manual_location or extract_location(raw_report) or "Location Unconfirmed"

    return {
        "location": location,
        "disaster_type": disaster_type,
        "casualties_estimate": casualties,
        "severity": severity,
        "resources_needed": resources,
        "triage_assessment": triage,
        "dispatch_orders": dispatch
    }

def extract_location(text: str) -> str:
    """Attempt to extract a location from the report text."""
    match = re.search(r'\b(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:St|Ave|Rd|Blvd|Dr|Ln|Way|Hwy|Highway))?)\b', text)
    if match: return match.group(1)
    match = re.search(r'\b(?:at|near|on|in)\s+(?:the\s+)?([A-Z][a-zA-Z0-9\s]{3,30}?)(?:\.|,|\s+(?:and|there|the|it|we))', text)
    if match: return match.group(1).strip()
    return None
