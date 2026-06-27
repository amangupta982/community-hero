// Pre-built demo clusters inserted by POST /api/demo/seed.
// Each document mirrors what the 7-agent pipeline would produce so every UI
// feature (map, cards, document center, timeline, dashboard) is populated.
//
// Coordinates are deliberately chosen:
//   clusters 0 & 1 are 12 m apart → they show geo-clustering/duplicate detection
//   when a live report is submitted at DEMO_SPOTS[1] (next to cluster 0).

function svgPhoto(emoji, label, bg = "#1e293b") {
  // Inline SVG thumbnail — bypasses GCS for demo data.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bg}" stop-opacity="1"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="640" height="480" fill="url(#bg)"/>
    <text x="320" y="210" font-size="160" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${emoji}</text>
    <text x="320" y="360" font-size="30" text-anchor="middle" fill="rgba(255,255,255,0.65)" font-family="system-ui, sans-serif" font-weight="500">${label}</text>
    <text x="320" y="400" font-size="20" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-family="system-ui, sans-serif">Community Hero — Demo Data</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 86_400_000).toISOString();

export const DEMO_CLUSTERS = [
  // ──────────────────────────────────────────────────────────────────────────
  // 0. POTHOLE — MG Road (Critical · reportCount 3 · DEMO SPOT 0)
  //    Designed so a live submission at DEMO_SPOTS[1] (12m away) will MERGE.
  // ──────────────────────────────────────────────────────────────────────────
  {
    demoSeeded: true,
    photo: svgPhoto("🕳️", "Critical Pothole — MG Road", "#7c2d12"),
    issueType: "Pothole",
    isCivicIssue: true,
    severity: "Critical",
    confidence: 96,
    description: "Large 3-foot diameter pothole exposing sub-base on MG Road near Trinity Circle. Active water pooling. Two minor accidents already reported this week.",
    lat: 12.97160,
    lng: 77.59460,
    reportCount: 3,
    department: "Roads & Infrastructure Department",
    complaint: `Date: ${new Date(daysAgo(5)).toDateString()}
To: Roads & Infrastructure Department, BBMP
CC: Ward Engineer – Ward 76 | BBMP Commissioner

Subject: URGENT — Critical Pothole at MG Road, Trinity Circle

Sir/Madam,

I write on behalf of 3 citizens who independently reported a critical road-safety hazard on MG Road near Trinity Circle, Bengaluru (12.9716°N, 77.5946°E).

A 3-foot pothole has formed in the primary carriageway, fully exposing sub-base material and accumulating water during recent rains. The stretch sees approximately 2,000 vehicles per hour at peak. Two minor two-wheeler accidents have been reported at this location in the past 72 hours.

AI Risk Assessment: Priority Score 89/100 | Severity: CRITICAL | Urgency: 9.2/10
Estimated Repair Cost: ₹45,000–₹60,000 | Recommended Resolution: 7 days

Immediate action is requested: emergency repair crew deployment, temporary barricading, and diversion signage until permanent repair is complete.

Yours faithfully,
Community Hero — Civic Issue Tracking System`,
    complaintSubject: "URGENT: Critical Pothole at MG Road, Trinity Circle – Immediate Repair Required",
    workOrder: {
      title: "Emergency Pothole Repair – MG Road, Trinity Circle",
      priority: "P1 - Emergency",
      issueSummary: "3-foot diameter pothole on MG Road exposing sub-base material. Active water pooling. Two accidents reported.",
      steps: [
        "Deploy traffic control and temporary barricades at the site within 2 hours",
        "Clear standing water and debris from the pothole cavity",
        "Cut clean edges around the damaged area (cold-milling or sawcutting)",
        "Apply tack coat (bitumen emulsion) to bonding surfaces",
        "Fill with hot-mix asphalt in 50 mm lifts, compact each layer",
        "Apply final surface course and check level with surrounding pavement",
        "Remove barricades and restore traffic flow",
        "Document with before/after photographs for records",
      ],
      requiredResources: [
        "Hot-mix asphalt (approx. 1.2 tonnes)",
        "Plate compactor or pneumatic roller",
        "Bitumen emulsion (tack coat)",
        "Cold-milling machine (if edges are irregular)",
        "Traffic cones, barricades, warning signs",
        "Crew: 1 supervisor + 4 labourers",
      ],
      safetyPrecautions: [
        "Place warning signs 50 m in advance of work zone",
        "Ensure all crew wear high-visibility vests and hard hats",
        "Use dewatering pump before filling if water is present",
        "Do not open traffic until asphalt surface temperature drops below 60°C",
        "Night work requires additional lighting and reflective gear",
      ],
    },
    citizenSummary: "Your report about a dangerous pothole on MG Road has been received and escalated to the Roads & Infrastructure Department with CRITICAL priority. Three citizens have reported this same hazard — which increases its urgency score. A repair crew is expected to be deployed within 24–48 hours. You may follow up using reference number BBMP-2026-RD-00431.",
    followUpDate: daysAgo(-7),
    statusHistory: [
      { status: "Reported",        at: daysAgo(5), note: "7-agent AI pipeline completed" },
      { status: "Complaint Drafted", at: daysAgo(5), note: "Formal complaint filed to Roads & Infrastructure Department" },
      { status: "Escalated",       at: daysAgo(3), note: "Escalated due to 3 duplicate citizen reports" },
    ],
    geoContext: { available: true, road: "MG Road", suburb: "Trinity Circle", city: "Bengaluru", displayName: "MG Road, Trinity Circle, Bengaluru" },
    riskAssessment: {
      priorityScore: 89,
      urgencyScore: 9.2,
      trafficImpact: "severe",
      repairCostEstimate: "₹45,000–₹60,000",
      repairDurationDays: 1,
      estimatedResolutionDays: 7,
      weatherInfluence: "Active monsoon rains are accelerating pothole expansion and increasing accident risk",
      proximityRisk: "Located 80m from Trinity Circle hospital — ambulance route affected",
      recommendedActions: [
        "Deploy emergency repair crew within 24 hours",
        "Install temporary warning signage and barricades immediately",
        "Notify traffic police for diversion during repair",
      ],
      reasoningChain: [
        "Critical severity (+40 pts) from exposed sub-base and active water pooling",
        "High traffic volume: 2,000 vehicles/hr peak (+20 pts)",
        "3 citizen duplicate reports signal persistent high-risk hazard (+15 pts)",
        "Proximity to hospital emergency route (+10 pts)",
        "Active monsoon season amplifies expansion risk (+4 pts)",
      ],
    },
    contextResult: {
      available: true,
      places: [
        { name: "Trinity Circle Hospital", type: "hospital", distanceM: 80 },
        { name: "MG Road Metro Station", type: "subway_station", distanceM: 120 },
      ],
      weather: { temperature: 22, precipitation: 8.4, condition: "Heavy Rain" },
      historical: { count: 5, avgSeverity: "High", note: "5 pothole reports within 100m in past 6 months" },
    },
    createdAt: daysAgo(5),
    estimatedResolutionDays: 7,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 1. OPEN MANHOLE — Indiranagar (Critical · highest risk score)
  // ──────────────────────────────────────────────────────────────────────────
  {
    demoSeeded: true,
    photo: svgPhoto("⚠️", "Open Manhole — Indiranagar", "#450a0a"),
    issueType: "Open Manhole",
    isCivicIssue: true,
    severity: "Critical",
    confidence: 98,
    description: "Uncovered sewer manhole (60 cm diameter) on 100 Feet Road, Indiranagar. No cover, no barricade. Pedestrians and two-wheelers at immediate fall risk.",
    lat: 12.97840,
    lng: 77.64080,
    reportCount: 1,
    department: "Roads & Infrastructure Department",
    complaint: `Date: ${new Date(daysAgo(2)).toDateString()}
To: Roads & Infrastructure Department, BBMP
CC: Health Officer – Ward 79 | BBMP Commissioner | Traffic Police (East)

Subject: EMERGENCY — Uncovered Manhole on 100 Feet Road, Indiranagar

Sir/Madam,

An open, uncovered sewer manhole (60 cm diameter) has been reported on 100 Feet Road, Indiranagar, Bengaluru (12.9784°N, 77.6408°E). There is no cover, no barricade, and no warning sign. The location is on a busy pedestrian footpath adjacent to high-speed two-wheeler traffic.

AI Risk Assessment: Priority Score 95/100 | Severity: CRITICAL | Urgency: 9.8/10

This is a LIFE SAFETY hazard. A person falling into an open sewer manhole faces risk of drowning, toxic gas exposure, and serious injury. Immediate intervention is required.

We request emergency deployment of a temporary cover and barricade within 2 hours, followed by permanent cover installation within 48 hours.

Yours faithfully,
Community Hero — Civic Issue Tracking System`,
    complaintSubject: "EMERGENCY: Uncovered Manhole on 100 Feet Road, Indiranagar – Immediate Hazard",
    workOrder: {
      title: "Emergency Manhole Cover Replacement – 100 Feet Rd, Indiranagar",
      priority: "P1 - Emergency",
      issueSummary: "Open 60cm manhole with no cover, barricade, or warning. Life-safety hazard on busy pedestrian stretch.",
      steps: [
        "Deploy crew immediately with temporary manhole cover (steel plate) and barricades",
        "Install minimum 3 traffic cones and 1 warning sign around the opening",
        "Measure manhole opening diameter for replacement cover procurement",
        "Procure and install standard CI (cast iron) frame & cover within 48 hours",
        "Verify the installed cover meets load-bearing specifications (BIS 1726)",
        "Backfill any road damage around the frame",
        "Document completion with geo-tagged photograph",
      ],
      requiredResources: [
        "Temporary steel plate cover (60 cm or 90 cm universal cover)",
        "CI frame & cover (BIS 1726 Grade A)",
        "Barricades and traffic cones (minimum 3)",
        "Warning sign: 'Open Manhole — Danger'",
        "Crow bar for seating the permanent cover",
      ],
      safetyPrecautions: [
        "DO NOT enter the manhole — toxic H₂S gas may be present",
        "Maintain 1 m exclusion zone around the opening at all times",
        "Crew must wear gas-detection badge during proximity work",
        "Inform traffic police to slow vehicles near the work site",
        "Complete cover installation before leaving the site unattended",
      ],
    },
    citizenSummary: "Your emergency report about an open manhole on 100 Feet Road has been flagged as a CRITICAL life-safety hazard and sent to the Roads Department with top priority. An emergency crew should be on site within 2 hours to install a temporary cover. Permanent repair is scheduled within 48 hours.",
    followUpDate: daysAgo(-2),
    statusHistory: [
      { status: "Reported",        at: daysAgo(2), note: "7-agent AI pipeline completed" },
      { status: "Complaint Drafted", at: daysAgo(2), note: "Emergency complaint filed to Roads & Infrastructure Department" },
    ],
    geoContext: { available: true, road: "100 Feet Road", suburb: "Indiranagar", city: "Bengaluru", displayName: "100 Feet Road, Indiranagar, Bengaluru" },
    riskAssessment: {
      priorityScore: 95,
      urgencyScore: 9.8,
      trafficImpact: "severe",
      repairCostEstimate: "₹3,000–₹8,000",
      repairDurationDays: 1,
      estimatedResolutionDays: 2,
      weatherInfluence: "Rain makes the exposed cavity invisible, dramatically increasing fall risk at night",
      proximityRisk: "Located adjacent to restaurant row — high pedestrian foot traffic after 7 PM",
      recommendedActions: [
        "Deploy emergency temporary cover within 2 hours",
        "Install permanent CI cover within 48 hours",
        "Notify traffic police for pedestrian safety measures",
      ],
      reasoningChain: [
        "Life-safety hazard — direct fall/drowning/gas-exposure risk (+45 pts)",
        "No cover, no barricade — zero mitigation in place (+20 pts)",
        "High footfall area, adjacent to restaurant row (+15 pts)",
        "Night rain reduces visibility of open cavity (+10 pts)",
        "Quick fix (₹8k cover) vs. catastrophic liability (+5 pts)",
      ],
    },
    contextResult: {
      available: true,
      places: [
        { name: "Indiranagar Restaurant Strip", type: "food", distanceM: 30 },
        { name: "Indiranagar Metro Station", type: "subway_station", distanceM: 200 },
      ],
      weather: { temperature: 24, precipitation: 3.2, condition: "Light Rain" },
      historical: { count: 2, avgSeverity: "Critical", note: "2 manhole incidents on this stretch in past year" },
    },
    createdAt: daysAgo(2),
    estimatedResolutionDays: 2,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. BROKEN STREETLIGHT — Koramangala (High · safety at night)
  // ──────────────────────────────────────────────────────────────────────────
  {
    demoSeeded: true,
    photo: svgPhoto("💡", "Broken Streetlight — Koramangala", "#1e3a5f"),
    issueType: "Broken Streetlight",
    isCivicIssue: true,
    severity: "High",
    confidence: 91,
    description: "4 consecutive streetlights non-functional on 80 Feet Road, Koramangala 4th Block. 200m stretch is completely dark after 8 PM. Multiple chain-snatching incidents reported in the area.",
    lat: 12.93520,
    lng: 77.62450,
    reportCount: 2,
    department: "Electrical / Street Lighting Department",
    complaint: `Date: ${new Date(daysAgo(4)).toDateString()}
To: Electrical / Street Lighting Department, BESCOM
CC: Ward Councillor – Ward 151 | Police Station – Koramangala

Subject: Urgent — 4 Non-Functional Streetlights on 80 Feet Road, Koramangala

Sir/Madam,

Four consecutive streetlights on 80 Feet Road, 4th Block, Koramangala are non-functional (12.9352°N, 77.6245°E). A 200-metre stretch is completely unlit after 8 PM, creating a security and safety hazard. The area has reported multiple chain-snatching incidents in recent months.

AI Risk Assessment: Priority Score 67/100 | Severity: HIGH | Urgency: 7.1/10

We request urgent inspection and restoration of lighting within 3 working days.

Yours faithfully,
Community Hero — Civic Issue Tracking System`,
    complaintSubject: "Urgent: 4 Non-Functional Streetlights on 80 Feet Road, Koramangala – Safety Risk",
    workOrder: {
      title: "Street Light Repair – 80 Feet Road, 4th Block Koramangala",
      priority: "P2 - Urgent",
      issueSummary: "4 consecutive lights non-functional for >5 days. 200m dark zone with security incidents.",
      steps: [
        "Identify root cause: check feeder pillar, fuses, and individual lamp assemblies",
        "Replace fused or damaged sodium/LED lamps",
        "Check and replace corroded ballasts or drivers where required",
        "Test all 4 lights at dusk to confirm restoration",
        "Escalate to feeder line repair if root cause is upstream",
      ],
      requiredResources: [
        "LED street-light replacement units × 4 (80W, 5500K)",
        "Bucket truck / cherry picker for 8m pole access",
        "Electrical testing kit (multimeter, clamp meter)",
        "Fuse wire / MCCB replacement",
      ],
      safetyPrecautions: [
        "Isolate feeder pillar before any work begins",
        "Display 'Electrical Work in Progress' signage",
        "Crew must wear insulated gloves rated for 11kV",
        "Do not work during active rain or thunderstorm",
      ],
    },
    citizenSummary: "Your report about non-functional streetlights on 80 Feet Road has been sent to BESCOM's Electrical Department. Two citizens have flagged this same stretch. A repair team is expected to restore lighting within 3 working days. The area police have also been notified about the safety concern.",
    followUpDate: daysAgo(-3),
    statusHistory: [
      { status: "Reported",        at: daysAgo(4), note: "7-agent AI pipeline completed" },
      { status: "Complaint Drafted", at: daysAgo(4), note: "Formal complaint filed to Electrical / Street Lighting Department" },
    ],
    geoContext: { available: true, road: "80 Feet Road", suburb: "Koramangala 4th Block", city: "Bengaluru", displayName: "80 Feet Road, Koramangala, Bengaluru" },
    riskAssessment: {
      priorityScore: 67,
      urgencyScore: 7.1,
      trafficImpact: "moderate",
      repairCostEstimate: "₹12,000–₹20,000",
      repairDurationDays: 1,
      estimatedResolutionDays: 3,
      weatherInfluence: "Monsoon dampness may have accelerated ballast corrosion",
      proximityRisk: "200m dark zone near ATM and residential apartments — security concern",
      recommendedActions: [
        "Restore lighting within 3 working days",
        "Alert local police about the dark stretch",
        "Inspect all feeder pillars in the ward proactively",
      ],
      reasoningChain: [
        "4 lights non-functional — extended dark zone (+30 pts)",
        "Reported security incidents in area (+20 pts)",
        "2 citizen reports confirm persistence (+10 pts)",
        "Near residential area and ATM (+7 pts)",
      ],
    },
    contextResult: {
      available: true,
      places: [
        { name: "SBI ATM", type: "atm", distanceM: 45 },
        { name: "Koramangala 4th Block Apartments", type: "residential", distanceM: 60 },
      ],
      weather: { temperature: 21, precipitation: 1.8, condition: "Overcast" },
      historical: { count: 3, avgSeverity: "Medium", note: "3 streetlight complaints on this road in 12 months" },
    },
    createdAt: daysAgo(4),
    estimatedResolutionDays: 3,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. GARBAGE DUMP — HSR Layout (High · reportCount 2)
  // ──────────────────────────────────────────────────────────────────────────
  {
    demoSeeded: true,
    photo: svgPhoto("🗑️", "Garbage Dump — HSR Layout", "#14532d"),
    issueType: "Garbage Dump",
    isCivicIssue: true,
    severity: "High",
    confidence: 88,
    description: "Large illegal garbage dump (approx. 3 tonnes) at the end of 27th Main, HSR Layout Sector 2. Mixed waste including construction debris and food waste. Stray dogs breeding in the dump.",
    lat: 12.91160,
    lng: 77.63700,
    reportCount: 2,
    department: "Solid Waste Management Department",
    complaint: `Date: ${new Date(daysAgo(7)).toDateString()}
To: Solid Waste Management Department, BBMP
CC: Ward Health Officer – Ward 174 | BBMP Marshals

Subject: Illegal Garbage Dump at 27th Main, HSR Layout Sector 2

Sir/Madam,

An uncontrolled garbage dump of approximately 3 tonnes has formed at the end of 27th Main, HSR Layout Sector 2 (12.9116°N, 77.6370°E). The dump contains mixed waste including construction debris and food waste. Stray dogs are breeding in the area, creating a public health hazard.

AI Risk Assessment: Priority Score 71/100 | Severity: HIGH | Urgency: 7.4/10

We request removal of the dump, sanitisation of the area, and installation of a concrete wall or bollards to prevent re-dumping.

Yours faithfully,
Community Hero — Civic Issue Tracking System`,
    complaintSubject: "Illegal Garbage Dump at 27th Main, HSR Layout – Immediate Removal Required",
    workOrder: {
      title: "Illegal Dump Clearance & Site Sanitisation – HSR Layout",
      priority: "P2 - Urgent",
      issueSummary: "~3 tonne mixed waste dump with construction debris. Stray animals breeding. Public health risk.",
      steps: [
        "Deploy compactor truck and loader to site",
        "Segregate and load waste — construction debris separate from organic waste",
        "Transport to authorised processing facility (KCDC Compost Plant or C&D Waste Facility)",
        "Sanitise the cleared area with lime and disinfectant spray",
        "Install 2–3 concrete bollards at dump entry point to prevent re-dumping",
        "Photograph the cleared site and submit report",
      ],
      requiredResources: [
        "Compactor truck (6 tonne capacity)",
        "JCB / Mini-loader",
        "Protective gear (gloves, masks, boots) for crew × 4",
        "Lime powder (50 kg)",
        "Disinfectant concentrate",
        "Concrete bollards × 3 (pre-cast)",
      ],
      safetyPrecautions: [
        "Crew must wear N95 masks — risk of leptospirosis and E. coli",
        "Do not disturb stray animal pups; contact BBMP Animal Control first",
        "Ensure compactor does not rupture any buried material that could be hazardous",
      ],
    },
    citizenSummary: "Your complaint about the illegal garbage dump on 27th Main has been received. Two residents have reported this location. The BBMP Solid Waste Management team has been alerted to clear the 3-tonne dump and sanitise the area within 5 working days. Bollards will be installed to prevent re-dumping.",
    followUpDate: daysAgo(-5),
    statusHistory: [
      { status: "Reported",        at: daysAgo(7), note: "7-agent AI pipeline completed" },
      { status: "Complaint Drafted", at: daysAgo(7), note: "Formal complaint filed to Solid Waste Management Department" },
    ],
    geoContext: { available: true, road: "27th Main", suburb: "HSR Layout Sector 2", city: "Bengaluru", displayName: "27th Main, HSR Layout, Bengaluru" },
    riskAssessment: {
      priorityScore: 71,
      urgencyScore: 7.4,
      trafficImpact: "low",
      repairCostEstimate: "₹18,000–₹25,000",
      repairDurationDays: 1,
      estimatedResolutionDays: 5,
      weatherInfluence: "Monsoon rains are washing leachate into storm drain — groundwater contamination risk",
      proximityRisk: "School within 150m — children exposed to health hazard daily",
      recommendedActions: [
        "Clear dump within 5 days",
        "Sanitise area post-clearance",
        "Install bollards to prevent recurrence",
      ],
      reasoningChain: [
        "3-tonne mixed waste with construction debris — high volume (+30 pts)",
        "Stray animals breeding — disease vector (+20 pts)",
        "School proximity (+15 pts)",
        "Leachate risk from monsoon (+6 pts)",
      ],
    },
    contextResult: {
      available: true,
      places: [
        { name: "HSR Primary School", type: "school", distanceM: 150 },
        { name: "Storm Water Drain (SWD)", type: "waterway", distanceM: 20 },
      ],
      weather: { temperature: 23, precipitation: 5.0, condition: "Moderate Rain" },
      historical: { count: 4, avgSeverity: "High", note: "Repeat dumping location — 4 complaints in 6 months" },
    },
    createdAt: daysAgo(7),
    estimatedResolutionDays: 5,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. WATERLOGGING — Whitefield (High)
  // ──────────────────────────────────────────────────────────────────────────
  {
    demoSeeded: true,
    photo: svgPhoto("🌊", "Waterlogging — Whitefield", "#0c4a6e"),
    issueType: "Waterlogging",
    isCivicIssue: true,
    severity: "High",
    confidence: 85,
    description: "Severe waterlogging on ITPL Main Road near Whitefield KPCT Mall. Water depth 2 feet. Road completely impassable for two-wheelers. Major tech park arterial route blocked.",
    lat: 12.96980,
    lng: 77.74990,
    reportCount: 1,
    department: "Storm Water Drain Management Department",
    complaint: `Date: ${new Date(daysAgo(1)).toDateString()}
To: Storm Water Drain Management Department, BBMP
CC: Ward Engineer – Ward 85 | Traffic Police (Whitefield)

Subject: Severe Waterlogging on ITPL Main Road, Whitefield

Sir/Madam,

ITPL Main Road near Whitefield KPCT Mall (12.9698°N, 77.7499°E) is experiencing severe waterlogging with water depth of approximately 2 feet. The road is impassable for two-wheelers. This is a primary arterial route serving over 150,000 IT professionals in Whitefield, causing significant economic disruption.

AI Risk Assessment: Priority Score 62/100 | Severity: HIGH | Urgency: 6.8/10

We request emergency dewatering and drain clearance within 24 hours.

Yours faithfully,
Community Hero — Civic Issue Tracking System`,
    complaintSubject: "Severe Waterlogging on ITPL Main Road, Whitefield – Emergency Dewatering Needed",
    workOrder: {
      title: "Emergency Dewatering & Drain Clearance – ITPL Main Road, Whitefield",
      priority: "P2 - Urgent",
      issueSummary: "2-foot waterlogging blocking primary tech-park arterial. Storm drain likely blocked by debris.",
      steps: [
        "Deploy dewatering pump(s) to clear standing water",
        "Locate and clear blocked storm water drain openings — remove debris",
        "Jet-flush the drain channel to restore flow",
        "Inspect drain outlet at nearest SWD canal for blockage",
        "Conduct CCTV survey of drain if blockage cannot be located visually",
        "Install temporary diversion sign until road surface dries",
      ],
      requiredResources: [
        "Dewatering pump (diesel, 6-inch, min 150 LPS capacity)",
        "Jet-rodding machine",
        "Drain rod set",
        "CCTV crawler (if required)",
        "Traffic diversion signs",
      ],
      safetyPrecautions: [
        "Do not allow crew to wade in standing water — electrical cables may be submerged",
        "Mark submerged manhole locations with high-visibility cones before dewatering",
        "Coordinate with traffic police before setting up diversion",
      ],
    },
    citizenSummary: "Your waterlogging report on ITPL Main Road has been sent to the Storm Water Drain Management Department. Emergency dewatering equipment should be deployed within 24 hours. As a major tech-park route, this has been escalated to the Ward Engineer for priority action.",
    followUpDate: daysAgo(-1),
    statusHistory: [
      { status: "Reported",        at: daysAgo(1), note: "7-agent AI pipeline completed" },
      { status: "Complaint Drafted", at: daysAgo(1), note: "Formal complaint filed to Storm Water Drain Management Department" },
    ],
    geoContext: { available: true, road: "ITPL Main Road", suburb: "Whitefield", city: "Bengaluru", displayName: "ITPL Main Road, Whitefield, Bengaluru" },
    riskAssessment: {
      priorityScore: 62,
      urgencyScore: 6.8,
      trafficImpact: "severe",
      repairCostEstimate: "₹8,000–₹15,000",
      repairDurationDays: 1,
      estimatedResolutionDays: 1,
      weatherInfluence: "Ongoing monsoon rains will worsen flooding if drain not cleared within 24 hours",
      proximityRisk: "Major tech-park route — 150k+ daily commuters affected",
      recommendedActions: [
        "Emergency dewatering within 6 hours",
        "Drain clearance to prevent recurrence",
        "Traffic diversion advisory via traffic police",
      ],
      reasoningChain: [
        "2-foot water depth — road impassable (+35 pts)",
        "High economic impact — IT hub arterial (+15 pts)",
        "Active monsoon will worsen unless drain is cleared (+8 pts)",
        "1-day resolution possible with rapid deployment (+4 pts)",
      ],
    },
    contextResult: {
      available: true,
      places: [
        { name: "KPCT Mall", type: "shopping_mall", distanceM: 40 },
        { name: "ITPL Tech Park", type: "office", distanceM: 200 },
      ],
      weather: { temperature: 20, precipitation: 12.8, condition: "Heavy Rain" },
      historical: { count: 6, avgSeverity: "High", note: "Recurring waterlogging at this underpass — 6 reports in 2 seasons" },
    },
    createdAt: daysAgo(1),
    estimatedResolutionDays: 1,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. FOOTPATH DAMAGE — Jayanagar (Medium)
  // ──────────────────────────────────────────────────────────────────────────
  {
    demoSeeded: true,
    photo: svgPhoto("🚶", "Footpath Damage — Jayanagar", "#292524"),
    issueType: "Footpath Damage",
    isCivicIssue: true,
    severity: "Medium",
    confidence: 82,
    description: "Broken and uneven footpath tiles on 11th Main, Jayanagar 4th Block. Several tiles missing, exposing soil. Dangerous for elderly and visually impaired pedestrians.",
    lat: 12.93080,
    lng: 77.58330,
    reportCount: 1,
    department: "Roads & Infrastructure Department",
    complaint: `Date: ${new Date(daysAgo(10)).toDateString()}
To: Roads & Infrastructure Department, BBMP
CC: Ward Councillor – Ward 164

Subject: Footpath Damage on 11th Main, Jayanagar 4th Block

Sir/Madam,

The footpath on 11th Main, Jayanagar 4th Block (12.9308°N, 77.5833°E) has multiple broken and missing tiles, exposing bare soil and creating a tripping hazard for elderly residents and visually impaired pedestrians.

AI Risk Assessment: Priority Score 45/100 | Severity: MEDIUM | Urgency: 4.8/10

We request scheduled repair within 30 days.

Yours faithfully,
Community Hero — Civic Issue Tracking System`,
    complaintSubject: "Damaged Footpath on 11th Main, Jayanagar – Repair Required",
    workOrder: {
      title: "Footpath Tile Replacement – 11th Main, Jayanagar 4th Block",
      priority: "P3 - Standard",
      issueSummary: "Multiple broken/missing footpath tiles. Trip hazard, particularly for elderly.",
      steps: [
        "Survey the affected stretch and mark all damaged/missing tiles",
        "Remove broken tile fragments and clear base",
        "Lay fresh cement mortar bed",
        "Install matching granite/vitrified tiles",
        "Cure and check for level before opening to pedestrians",
      ],
      requiredResources: [
        "Footpath tiles (matching specification) – approx. 15 sqm",
        "Cement, sand, water for mortar",
        "Tile cutter",
        "Crew: 1 mason + 2 helpers",
      ],
      safetyPrecautions: [
        "Barricade work zone with reflective tape",
        "Ensure pedestrian diversion is signposted",
      ],
    },
    citizenSummary: "Your footpath damage report on 11th Main, Jayanagar has been logged with the Roads Department. Scheduled repair is expected within 30 days under the BBMP Footpath Renewal Programme.",
    followUpDate: daysAgo(-20),
    statusHistory: [
      { status: "Reported",        at: daysAgo(10), note: "7-agent AI pipeline completed" },
      { status: "Complaint Drafted", at: daysAgo(10), note: "Formal complaint filed to Roads & Infrastructure Department" },
    ],
    geoContext: { available: true, road: "11th Main", suburb: "Jayanagar 4th Block", city: "Bengaluru", displayName: "11th Main, Jayanagar 4th Block, Bengaluru" },
    riskAssessment: {
      priorityScore: 45,
      urgencyScore: 4.8,
      trafficImpact: "low",
      repairCostEstimate: "₹6,000–₹10,000",
      repairDurationDays: 1,
      estimatedResolutionDays: 30,
      weatherInfluence: "Rain weakens exposed soil base, increasing tile subsidence",
      proximityRisk: "Senior citizen walking park 80m away — elderly pedestrians frequently use this stretch",
      recommendedActions: [
        "Schedule repair within 30 days",
        "Consider anti-skid tiles given elderly population",
      ],
      reasoningChain: [
        "Medium severity — tripping hazard but not life-threatening (+25 pts)",
        "Elderly and disabled pedestrian area (+15 pts)",
        "Single citizen report (+5 pts)",
      ],
    },
    contextResult: {
      available: true,
      places: [
        { name: "Jayanagar Senior Citizens' Park", type: "park", distanceM: 80 },
      ],
      weather: { temperature: 22, precipitation: 1.0, condition: "Partly Cloudy" },
      historical: { count: 1, avgSeverity: "Medium", note: "First report on this stretch" },
    },
    createdAt: daysAgo(10),
    estimatedResolutionDays: 30,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. TREE HAZARD — Rajajinagar (High · post-storm)
  // ──────────────────────────────────────────────────────────────────────────
  {
    demoSeeded: true,
    photo: svgPhoto("🌳", "Fallen Tree Hazard — Rajajinagar", "#14532d"),
    issueType: "Tree Fallen/Hazard",
    isCivicIssue: true,
    severity: "High",
    confidence: 90,
    description: "Large rain tree (approximately 20m tall) dangerously leaning at 45° after last night's storm. Located on 5th Cross, Rajajinagar. Root ball partially exposed. Risk of full collapse onto vehicles and pedestrians.",
    lat: 12.99860,
    lng: 77.55300,
    reportCount: 1,
    department: "Parks & Horticulture Department",
    complaint: `Date: ${new Date(daysAgo(0)).toDateString()}
To: Parks & Horticulture Department, BBMP
CC: Ward Engineer – Ward 18 | Traffic Police (Rajajinagar)

Subject: Urgent — Dangerously Leaning Tree on 5th Cross, Rajajinagar

Sir/Madam,

A large rain tree (approximately 20m tall) is leaning at a 45° angle on 5th Cross, Rajajinagar (12.9986°N, 77.5530°E) following last night's storm. The root ball is partially exposed, indicating structural instability. The tree risks full collapse onto the road, parked vehicles, and passing pedestrians.

AI Risk Assessment: Priority Score 74/100 | Severity: HIGH | Urgency: 8.1/10

We request emergency felling or cable bracing within 12 hours to prevent collapse.

Yours faithfully,
Community Hero — Civic Issue Tracking System`,
    complaintSubject: "URGENT: Dangerously Leaning Tree on 5th Cross, Rajajinagar – Emergency Felling Required",
    workOrder: {
      title: "Emergency Tree Felling / Cable Bracing – 5th Cross, Rajajinagar",
      priority: "P2 - Urgent",
      issueSummary: "20m rain tree leaning 45° with exposed root ball after storm. Collapse risk within 24–48 hours.",
      steps: [
        "Arborist assessment within 2 hours to determine felling vs. cable-bracing viability",
        "Close road and deploy traffic diversion while assessment is underway",
        "If felling: systematic crown reduction then trunk felling in sections",
        "If cable-bracing: anchor cables to adjacent stable trees/structures",
        "Clear all debris from road surface",
        "Remove stump or reduce to below ground level",
        "Inspect neighbouring trees for similar storm damage",
      ],
      requiredResources: [
        "Aerial work platform (cherry picker) — 25m reach",
        "Chainsaw crew × 2 (licensed arborists)",
        "Wood chipper",
        "Steel cable and anchor hardware (if bracing)",
        "Traffic diversion equipment",
      ],
      safetyPrecautions: [
        "Establish 1.5× tree-height exclusion zone (30m) before any work",
        "Confirm no power lines in fall zone before cutting",
        "All ground crew to wear hard hats and face shields",
        "Do not work during wind gusts >40 km/h",
        "Notify BESCOM if tree is near overhead cables",
      ],
    },
    citizenSummary: "Your tree hazard report on 5th Cross, Rajajinagar has been flagged as urgent. An arborist crew should assess the tree within 2 hours. The road will be temporarily closed for safety. Emergency felling or cable-bracing will be completed within 12 hours.",
    followUpDate: daysAgo(-1),
    statusHistory: [
      { status: "Reported",        at: daysAgo(0), note: "7-agent AI pipeline completed" },
      { status: "Complaint Drafted", at: daysAgo(0), note: "Formal complaint filed to Parks & Horticulture Department" },
    ],
    geoContext: { available: true, road: "5th Cross", suburb: "Rajajinagar 1st Block", city: "Bengaluru", displayName: "5th Cross, Rajajinagar, Bengaluru" },
    riskAssessment: {
      priorityScore: 74,
      urgencyScore: 8.1,
      trafficImpact: "severe",
      repairCostEstimate: "₹25,000–₹40,000",
      repairDurationDays: 1,
      estimatedResolutionDays: 1,
      weatherInfluence: "Additional rain in the next 12 hours will further destabilise the root ball",
      proximityRisk: "Located next to residential building — risk of roof damage if tree falls",
      recommendedActions: [
        "Emergency assessment within 2 hours",
        "Close road segment immediately",
        "Fell or brace within 12 hours",
      ],
      reasoningChain: [
        "45° lean with exposed root ball — imminent collapse risk (+40 pts)",
        "Rain forecast will accelerate instability (+15 pts)",
        "Adjacent residential building at risk (+12 pts)",
        "Fast resolution possible with crew on site (+7 pts)",
      ],
    },
    contextResult: {
      available: true,
      places: [
        { name: "Rajajinagar Residential Colony", type: "residential", distanceM: 15 },
        { name: "BESCOM Overhead Lines", type: "utility", distanceM: 8 },
      ],
      weather: { temperature: 19, precipitation: 15.2, condition: "Stormy" },
      historical: { count: 0, avgSeverity: null, note: "First report — storm-damage event" },
    },
    createdAt: daysAgo(0),
    estimatedResolutionDays: 1,
  },
];
