// RackPulse Hardware Systems Validation Types

// Constants exported for use in components
export const DATACENTERS = ['DC-US-WEST', 'DC-US-EAST', 'DC-EU-CENTRAL', 'DC-APAC-SG', 'DC-APAC-JP'];
export const ZONES = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D'];

export type ServerStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
export type FailureClass = 'THERMAL' | 'POWER' | 'MEMORY' | 'NETWORK' | 'FIRMWARE' | 'NONE';
export type LifecyclePhase = 'BRING_UP' | 'BURN_IN' | 'PRODUCTION';
export type EngineeringDomain = 'THERMAL' | 'POWER' | 'MEMORY' | 'NETWORK' | 'FIRMWARE' | 'OTHER';
export type EscalationSeverity = 'SEV3' | 'SEV2' | 'SEV1';

export interface EvidenceItem {
  signal: string;
  value: string;
  contribution: number; // 0-100
}

export interface RootCauseAnalysis {
  primary_cause: string;
  secondary_causes: string[];
  hypothesis: string;
  confidence: number; // 0-1
  evidence: EvidenceItem[];
  owning_domain: EngineeringDomain;
  suggested_next_step: string;
  escalation_severity: EscalationSeverity;
  correlated_signals: string[];
}

// Keep legacy interface for backward compatibility
export interface RootCause {
  suspected_cause: string;
  confidence: number; // 0-100
  owning_domain: EngineeringDomain;
  recommended_action: string;
}

export interface ServerNode {
  node_id: string;
  datacenter: string;
  rack: string;
  zone: string;
  server_sku: string;
  cpu_model: string;
  cpu_temp_c: number;
  cpu_util_pct: number;
  power_w: number;
  power_rail_mv: number;
  vrm_temp_c: number;
  fan_rpm: number;
  thermal_throttle_events: number;
  ecc_corrected_errors: number;
  ecc_uncorrected_errors: number;
  nic_crc_errors: number;
  nic_link_flaps: number;
  reboot_count: number;
  bios_version: string;
  firmware_version: string;
  last_seen: number; // timestamp
  health_score: number; // 0-100
  status: ServerStatus;
  failure_class: FailureClass;
  lifecycle_phase: LifecyclePhase;
  root_cause: RootCause | null;
}

export interface ValidationCheck {
  check_name: string;
  result: 'PASS' | 'FAIL';
  failed_nodes: number;
  description: string;
  threshold: string;
  lifecycle_phase: LifecyclePhase;
}

export interface ValidationRun {
  run_id: string;
  timestamp: number;
  checks: ValidationCheck[];
  passed_checks: number;
  failed_checks: number;
  overall_status: 'PASS' | 'FAIL';
  fleet_size: number;
  critical_nodes: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'TELEMETRY_REGEN' | 'VALIDATION_RUN' | 'FLEET_TRANSITION';
  description: string;
  details?: Record<string, unknown>;
}

export interface FailureDistribution {
  THERMAL: number;
  POWER: number;
  MEMORY: number;
  NETWORK: number;
  FIRMWARE: number;
  NONE: number;
}

export interface FleetAnalytics {
  fleet_size: number;
  critical_nodes: number;
  degraded_nodes: number;
  healthy_nodes: number;
  p95_cpu_temp: number;
  p95_power_draw: number;
  avg_health_score: number;
  failure_distribution: FailureDistribution;
}

export interface RackAnalysis {
  rack_id: string;
  datacenter: string;
  zone: string;
  node_count: number;
  critical_count: number;
  dominant_failure_class: FailureClass;
  avg_health_score: number;
}

export interface QuarantineEntry {
  node_id: string;
  reason: string;
  timestamp: number;
  quarantine_id: string;
  datacenter?: string;
  zone?: string;
}

export interface FirmwareFreeze {
  freeze_id: string;
  datacenter: string;
  zone: string | null; // null means entire datacenter
  current_version: string;
  frozen_version: string;
  timestamp: number;
  reason: string;
}

export interface FleetSnapshot {
  snapshot_id: string;
  timestamp: number;
  fleet: ServerNode[];
  validation_run: ValidationRun | null;
}

export interface FleetDiff {
  snapshot_id_prev: string;
  snapshot_id_curr: string;
  timestamp_prev: number;
  timestamp_curr: number;
  new_critical: string[]; // node_ids
  resolved_critical: string[];
  class_changes: Record<string, FailureClass>; // node_id -> new class
  nodes_total_then: number;
  nodes_total_now: number;
}
