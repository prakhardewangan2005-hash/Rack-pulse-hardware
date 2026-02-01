# RackPulse — Hardware Systems Validation & Fleet Triage Console

**Live Demo:** https://v0.app/chat/rack-pulse-hardware-console-jTX3f9rlVT3?ref=N6H6A3 
**Stack:** React + TypeScript + Vite (pure CSS) • In-browser simulation • Deploy: Vercel  
**Domain:** Hardware Systems Engineering • Power/Thermal • Fleet Diagnostics • Validation Automation

RackPulse is a production-style internal console that simulates how hyperscale infrastructure teams validate server hardware (bring-up → burn-in → production), analyze fleet telemetry, and triage failures across thermal, power, memory (ECC), network, and firmware domains.

---

## Why this exists 
- **Tools + automation framework:** one-click validation suite runs with run_id, pass/fail gating, and audit-ready exports.
- **Cross-functional workflow:** failures are mapped to owning domains (Thermal/Mechanical, Power, Memory, Network, Firmware) with actionable next steps.
- **Fleet-scale analysis:** P95 KPIs + rack-level hot-spotting + failure distribution.
- **Documentation:** exportable Markdown validation report + triage packet suitable for stakeholder updates.

---

## Key Features
### Fleet Simulation (2000 nodes)
Each node includes realistic server signals:
`cpu_temp_c, power_w, fan_rpm, thermal_throttle_events, ecc_corrected/uncorrected, nic_crc_errors, link_flaps, reboot_count, bios/firmware versions, last_seen, lifecycle_phase`.

### Validation Automation
**Run Validation Suite** generates a `run_id` and executes lifecycle-aware test plans:
- Thermal margin validation
- Power stability validation
- ECC reliability thresholds
- NIC health validation
- Reboot stability check
- Firmware consistency check

### Root Cause Engine 
RackPulse doesn’t just label a failure class — it correlates signals to produce:
- **Primary + secondary suspected causes**
- **Confidence score (0–1)**
- **Evidence list (signals + reasons)**
- **Owning engineering domain**
- **Recommended triage action**
- **Escalation severity (SEV3/SEV2/SEV1)**

### Triage UI
- Filter + search fleet by status, failure class, datacenter/zone/SKU
- Click a node to open detailed telemetry + root cause + recommended action
- Rack-level “problematic racks” analysis to spot correlated failure domains

### Exports 
- **CSV export** of filtered fleet view
- **Validation Report (Markdown)**: run summary, gating failures, top failure classes, recommended actions
- **Triage Packet (Markdown)**: top critical nodes + suspected causes + owning domains

### Timeline
Tracks telemetry regenerations and validation suite runs for auditability.

---

## System Design 
- **UI:** Tabs (Dashboard, Fleet, Analytics, Validation Matrix, Validation, Timeline)
- **Data layer:** deterministic generator (seeded) + snapshot storage
- **Analytics:** percentile KPIs (P95), rack aggregation, failure distribution
- **Validation:** lifecycle-aware thresholds + gating logic
- **Root cause:** scoring + correlation boosts → explainable hypothesis

---

## Metrics & Targets 
- UI responsiveness: render 2000 rows with virtualization/pagination (future)
- Telemetry compute time: <150ms snapshot generation target (simulated)
- Validation suite runtime: <250ms (client-side)
- Error rate: 0 runtime exceptions; deterministic exports

---

## Runbook 
1. **Refresh Telemetry** to generate a new snapshot (fleet health changes)
2. Check **Dashboard KPIs** (P95 CPU temp, power, critical nodes)
3. Use **Analytics** to find problematic racks/zones
4. Run **Validation Matrix** to understand which test plans are failing
5. Run **Validation** to produce run_id + pass/fail gating
6. Export **Report** and share with owning domain (thermal/power/memory/network/firmware)

---

## Notes
This project intentionally runs with **no backend** to keep deployments one-click; the validation and analytics logic is implemented as deterministic, production-style client-side modules.

