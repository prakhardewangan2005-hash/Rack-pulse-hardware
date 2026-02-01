import { ServerNode, FailureClass, ServerStatus, TimelineEvent, FailureDistribution, FleetAnalytics, RackAnalysis, LifecyclePhase, RootCause, RootCauseAnalysis, EscalationSeverity, QuarantineEntry, FirmwareFreeze, FleetSnapshot, FleetDiff } from '@/app/types';

const DATACENTERS = ['DC-US-WEST', 'DC-US-EAST', 'DC-EU-CENTRAL', 'DC-APAC-SG', 'DC-APAC-JP'];
const ZONES = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D'];
const SERVER_SKUS = ['Meta-OCP-v4', 'Meta-OCP-v5', 'Meta-GPU-v2', 'Meta-Storage-v3'];
const CPU_MODELS = ['EPYC-7713', 'EPYC-9004', 'Xeon-Platinum-8490'];
const BIOS_VERSIONS = ['2.1.0', '2.2.1', '2.3.0', '2.4.2'];
const FW_VERSIONS = ['1.2.3', '1.3.0', '1.3.1', '1.4.0'];

export class FleetSimulator {
  private fleet: ServerNode[] = [];
  private timeline: TimelineEvent[] = [];
  private validation_history: any[] = [];
  private snapshots: FleetSnapshot[] = [];
  private quarantine_list: QuarantineEntry[] = [];
  private firmware_freezes: FirmwareFreeze[] = [];
  private root_cause_cache: Map<string, RootCauseAnalysis> = new Map();

  constructor(node_count: number = 2000) {
    this.generate_fleet(node_count);
    this.add_timeline_event('TELEMETRY_REGEN', 'Initial fleet generation');
  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private random_float(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private generate_fleet(count: number): void {
    for (let i = 0; i < count; i++) {
      const node = this.generate_node(i);
      this.fleet.push(node);
    }
  }

  private generate_node(index: number): ServerNode {
    const datacenter = DATACENTERS[this.random(0, DATACENTERS.length - 1)];
    const zone = ZONES[this.random(0, ZONES.length - 1)];
    const rack_num = this.random(1, 200);
    const sku = SERVER_SKUS[this.random(0, SERVER_SKUS.length - 1)];
    
    // Assign lifecycle phase
    const lifecycle_phases: LifecyclePhase[] = ['BRING_UP', 'BURN_IN', 'PRODUCTION'];
    const lifecycle_phase = lifecycle_phases[this.random(0, 2)];
    
    // Simulate hardware degradation patterns
    const cpu_temp = this.random_float(35, 95);
    const power_w = this.random_float(200, 2500);
    const ecc_uncorrected = this.random(0, 5);
    const nic_link_flaps = this.random(0, 8);
    const reboot_count = this.random(0, 15);

    // Determine failure class and status based on metrics
    let failure_class: FailureClass = 'NONE';
    let health_score = 100;

    if (cpu_temp > 85) {
      failure_class = 'THERMAL';
      health_score -= 40;
    }
    if (power_w < 250 || power_w > 2400) {
      failure_class = 'POWER';
      health_score -= 35;
    }
    if (ecc_uncorrected > 2) {
      failure_class = 'MEMORY';
      health_score -= 45;
    }
    if (nic_link_flaps > 5) {
      failure_class = 'NETWORK';
      health_score -= 30;
    }
    if (reboot_count > 10) {
      failure_class = 'FIRMWARE';
      health_score -= 35;
    }

    health_score = Math.max(0, Math.min(100, health_score + this.random(-5, 5)));

    let status: ServerStatus = 'HEALTHY';
    if (health_score < 30) status = 'CRITICAL';
    else if (health_score < 70) status = 'DEGRADED';

    // Generate root cause if there's a failure
    let root_cause: RootCause | null = null;
    if (failure_class !== 'NONE') {
      root_cause = this.generate_root_cause(failure_class, cpu_temp, power_w, ecc_uncorrected, nic_link_flaps, reboot_count);
    }

    return {
      node_id: `node-${String(index).padStart(5, '0')}`,
      datacenter,
      rack: `${datacenter}-R${String(rack_num).padStart(3, '0')}`,
      zone,
      server_sku: sku,
      cpu_model: CPU_MODELS[this.random(0, CPU_MODELS.length - 1)],
      cpu_temp_c: cpu_temp,
      cpu_util_pct: this.random_float(5, 95),
      power_w,
      power_rail_mv: this.random_float(11.8, 12.2) * 1000,
      vrm_temp_c: this.random_float(40, 85),
      fan_rpm: this.random(2000, 8000),
      thermal_throttle_events: this.random(0, 10),
      ecc_corrected_errors: this.random(0, 50),
      ecc_uncorrected_errors: ecc_uncorrected,
      nic_crc_errors: this.random(0, 100),
      nic_link_flaps,
      reboot_count,
      bios_version: BIOS_VERSIONS[this.random(0, BIOS_VERSIONS.length - 1)],
      firmware_version: FW_VERSIONS[this.random(0, FW_VERSIONS.length - 1)],
      last_seen: Date.now(),
      health_score,
      status,
      failure_class,
      lifecycle_phase,
      root_cause,
    };
  }

  private generate_root_cause(failure_class: FailureClass, cpu_temp: number, power_w: number, ecc_uncorrected: number, nic_link_flaps: number, reboot_count: number): RootCause {
    const causes: Record<FailureClass, { cause: string; action: string }> = {
      THERMAL: {
        cause: 'CPU cooling subsystem failure or thermal interface degradation detected',
        action: 'Check thermal paste application, verify fan operation, inspect heatsink for debris blockage',
      },
      POWER: {
        cause: 'Power delivery or voltage regulation deviation from nominal specs',
        action: 'Inspect power connectors and rails, test PSU output, validate VRM conditioning',
      },
      MEMORY: {
        cause: 'DIMM fault or memory controller degradation with multiple uncorrectable errors',
        action: 'Run extensive memory diagnostics, perform DIMM swap test, consider memory module replacement',
      },
      NETWORK: {
        cause: 'NIC firmware issue or physical network link instability',
        action: 'Update NIC firmware, test with alternate network port, verify cable integrity',
      },
      FIRMWARE: {
        cause: 'BIOS/Firmware instability causing repeated boot cycles',
        action: 'Review system logs, update BIOS/firmware, perform CMOS reset if needed',
      },
      NONE: { cause: 'No issues detected', action: 'Continue normal operation' },
    };

    const { cause, action } = causes[failure_class];
    const base_confidence = 60 + this.random(0, 35);

    return {
      suspected_cause: cause,
      confidence: Math.min(100, base_confidence),
      owning_domain: failure_class as any,
      recommended_action: action,
    };
  }

  get_fleet(): ServerNode[] {
    return [...this.fleet];
  }

  refresh_telemetry(): void {
    this.fleet.forEach((node) => {
      // Simulate telemetry updates
      node.cpu_temp_c += this.random_float(-5, 8);
      node.cpu_util_pct = this.random_float(5, 95);
      node.power_w += this.random_float(-100, 150);
      node.vrm_temp_c += this.random_float(-3, 5);
      node.fan_rpm += this.random(-500, 800);

      // Simulate error accumulation
      node.thermal_throttle_events += this.random(0, 3);
      node.ecc_corrected_errors += this.random(0, 5);
      node.ecc_uncorrected_errors += this.random(0, 1);
      node.nic_link_flaps += this.random(0, 2);
      node.reboot_count += this.random(0, 1);

      // Recalculate health
      let health_score = 100;
      if (node.cpu_temp_c > 85) health_score -= 40;
      if (node.power_w < 250 || node.power_w > 2400) health_score -= 35;
      if (node.ecc_uncorrected_errors > 2) health_score -= 45;
      if (node.nic_link_flaps > 5) health_score -= 30;
      if (node.reboot_count > 10) health_score -= 35;

      node.health_score = Math.max(0, Math.min(100, health_score + this.random(-5, 5)));

      // Update status
      if (node.health_score < 30) node.status = 'CRITICAL';
      else if (node.health_score < 70) node.status = 'DEGRADED';
      else node.status = 'HEALTHY';

      // Update failure class
      let new_failure_class: FailureClass = 'NONE';
      if (node.cpu_temp_c > 85) new_failure_class = 'THERMAL';
      else if (node.power_w < 250 || node.power_w > 2400) new_failure_class = 'POWER';
      else if (node.ecc_uncorrected_errors > 2) new_failure_class = 'MEMORY';
      else if (node.nic_link_flaps > 5) new_failure_class = 'NETWORK';
      else if (node.reboot_count > 10) new_failure_class = 'FIRMWARE';

      node.failure_class = new_failure_class;

      // Update root cause if failure class changed
      if (new_failure_class !== 'NONE') {
        node.root_cause = this.generate_root_cause(new_failure_class, node.cpu_temp_c, node.power_w, node.ecc_uncorrected_errors, node.nic_link_flaps, node.reboot_count);
      } else {
        node.root_cause = null;
      }

      node.last_seen = Date.now();
    });

    this.add_timeline_event('TELEMETRY_REGEN', `Fleet telemetry updated: ${this.fleet.length} nodes`);
  }

  run_validation_suite(): any {
    const run_id = `validation-${Date.now()}`;
    const checks: any[] = [];
    const fleet = this.get_fleet();

    // Helper to get lifecycle-aware thresholds
    const get_thresholds = (phase: LifecyclePhase) => {
      switch (phase) {
        case 'BRING_UP':
          return { thermal: 88, temp_tolerance: 0.10, power_tolerance: 0.10, ecc: 5, nic_flaps: 10, reboot: 20 };
        case 'BURN_IN':
          return { thermal: 86, temp_tolerance: 0.08, power_tolerance: 0.08, ecc: 3, nic_flaps: 8, reboot: 15 };
        case 'PRODUCTION':
          return { thermal: 85, temp_tolerance: 0.05, power_tolerance: 0.05, ecc: 2, nic_flaps: 5, reboot: 10 };
      }
    };

    // Thermal margin validation (phase-aware)
    const thermal_checks = fleet.map((n) => {
      const threshold = get_thresholds(n.lifecycle_phase);
      return n.cpu_temp_c > threshold.thermal ? 1 : 0;
    });
    const thermal_failures = thermal_checks.reduce((a, b) => a + b, 0);
    const thermal_threshold = `Max ${get_thresholds('PRODUCTION').thermal}°C (PRODUCTION), ${get_thresholds('BURN_IN').thermal}°C (BURN_IN), ${get_thresholds('BRING_UP').thermal}°C (BRING_UP)`;
    checks.push({
      check_name: 'Thermal Margin Validation',
      result: thermal_failures < fleet.length * 0.05 ? 'PASS' : 'FAIL',
      failed_nodes: thermal_failures,
      description: `${thermal_failures} nodes exceed thermal thresholds for their lifecycle phase`,
      threshold: thermal_threshold,
      lifecycle_phase: 'PRODUCTION',
    });

    // Power stability validation (phase-aware)
    const power_checks = fleet.map((n) => {
      const threshold = get_thresholds(n.lifecycle_phase);
      const min_power = 250;
      const max_power = 2400;
      return n.power_w < min_power || n.power_w > max_power ? 1 : 0;
    });
    const power_failures = power_checks.reduce((a, b) => a + b, 0);
    checks.push({
      check_name: 'Power Stability Validation',
      result: power_failures < fleet.length * 0.05 ? 'PASS' : 'FAIL',
      failed_nodes: power_failures,
      description: `${power_failures} nodes show power rail deviation from 250-2400W range`,
      threshold: '250W - 2400W',
      lifecycle_phase: 'PRODUCTION',
    });

    // ECC error threshold checks (phase-aware)
    const ecc_checks = fleet.map((n) => {
      const threshold = get_thresholds(n.lifecycle_phase);
      return n.ecc_uncorrected_errors > threshold.ecc ? 1 : 0;
    });
    const ecc_failures = ecc_checks.reduce((a, b) => a + b, 0);
    const ecc_threshold = `Max 2 (PRODUCTION), Max 3 (BURN_IN), Max 5 (BRING_UP)`;
    checks.push({
      check_name: 'ECC Error Threshold',
      result: ecc_failures < fleet.length * 0.02 ? 'PASS' : 'FAIL',
      failed_nodes: ecc_failures,
      description: `${ecc_failures} nodes exceed ECC uncorrected error threshold for their lifecycle phase`,
      threshold: ecc_threshold,
      lifecycle_phase: 'PRODUCTION',
    });

    // NIC health checks (phase-aware)
    const nic_checks = fleet.map((n) => {
      const threshold = get_thresholds(n.lifecycle_phase);
      return n.nic_link_flaps > threshold.nic_flaps ? 1 : 0;
    });
    const nic_failures = nic_checks.reduce((a, b) => a + b, 0);
    const nic_threshold = `Max 5 flaps (PRODUCTION), Max 8 (BURN_IN), Max 10 (BRING_UP)`;
    checks.push({
      check_name: 'NIC Health Validation',
      result: nic_failures < fleet.length * 0.03 ? 'PASS' : 'FAIL',
      failed_nodes: nic_failures,
      description: `${nic_failures} nodes show NIC instability for their lifecycle phase`,
      threshold: nic_threshold,
      lifecycle_phase: 'PRODUCTION',
    });

    // Reboot stability checks (phase-aware)
    const reboot_checks = fleet.map((n) => {
      const threshold = get_thresholds(n.lifecycle_phase);
      return n.reboot_count > threshold.reboot ? 1 : 0;
    });
    const reboot_failures = reboot_checks.reduce((a, b) => a + b, 0);
    const reboot_threshold = `Max 10 (PRODUCTION), Max 15 (BURN_IN), Max 20 (BRING_UP)`;
    checks.push({
      check_name: 'Reboot Stability Check',
      result: reboot_failures < fleet.length * 0.04 ? 'PASS' : 'FAIL',
      failed_nodes: reboot_failures,
      description: `${reboot_failures} nodes exceed reboot threshold for their lifecycle phase`,
      threshold: reboot_threshold,
      lifecycle_phase: 'PRODUCTION',
    });

    // Firmware consistency checks
    const fw_versions = new Set(fleet.map((n) => n.firmware_version)).size;
    checks.push({
      check_name: 'Firmware Consistency',
      result: fw_versions <= 2 ? 'PASS' : 'FAIL',
      failed_nodes: fw_versions,
      description: `${fw_versions} different firmware versions detected across fleet`,
      threshold: 'Max 2 distinct versions',
      lifecycle_phase: 'PRODUCTION',
    });

    const passed = checks.filter((c) => c.result === 'PASS').length;
    const failed = checks.filter((c) => c.result === 'FAIL').length;

    const validation_run = {
      run_id,
      timestamp: Date.now(),
      checks,
      passed_checks: passed,
      failed_checks: failed,
      overall_status: failed === 0 ? 'PASS' : 'FAIL',
      fleet_size: fleet.length,
      critical_nodes: fleet.filter((n) => n.status === 'CRITICAL').length,
    };

    this.validation_history.push(validation_run);
    this.add_timeline_event('VALIDATION_RUN', `Validation suite run: ${passed} passed, ${failed} failed`);

    return validation_run;
  }

  get_analytics(): FleetAnalytics {
    const fleet = this.get_fleet();

    const critical = fleet.filter((n) => n.status === 'CRITICAL').length;
    const degraded = fleet.filter((n) => n.status === 'DEGRADED').length;
    const healthy = fleet.filter((n) => n.status === 'HEALTHY').length;

    const temps = fleet.map((n) => n.cpu_temp_c).sort((a, b) => a - b);
    const powers = fleet.map((n) => n.power_w).sort((a, b) => a - b);

    const failure_dist: FailureDistribution = {
      THERMAL: fleet.filter((n) => n.failure_class === 'THERMAL').length,
      POWER: fleet.filter((n) => n.failure_class === 'POWER').length,
      MEMORY: fleet.filter((n) => n.failure_class === 'MEMORY').length,
      NETWORK: fleet.filter((n) => n.failure_class === 'NETWORK').length,
      FIRMWARE: fleet.filter((n) => n.failure_class === 'FIRMWARE').length,
      NONE: fleet.filter((n) => n.failure_class === 'NONE').length,
    };

    return {
      fleet_size: fleet.length,
      critical_nodes: critical,
      degraded_nodes: degraded,
      healthy_nodes: healthy,
      p95_cpu_temp: temps[Math.floor(temps.length * 0.95)],
      p95_power_draw: powers[Math.floor(powers.length * 0.95)],
      avg_health_score: fleet.reduce((sum, n) => sum + n.health_score, 0) / fleet.length,
      failure_distribution: failure_dist,
    };
  }

  get_problematic_racks(): RackAnalysis[] {
    const fleet = this.get_fleet();
    const rack_map: Record<string, ServerNode[]> = {};

    fleet.forEach((node) => {
      if (!rack_map[node.rack]) rack_map[node.rack] = [];
      rack_map[node.rack].push(node);
    });

    return Object.entries(rack_map)
      .map(([rack_id, nodes]) => {
        const dc_zone = nodes[0].datacenter.split('-')[2];
        return {
          rack_id,
          datacenter: nodes[0].datacenter,
          zone: nodes[0].zone,
          node_count: nodes.length,
          critical_count: nodes.filter((n) => n.status === 'CRITICAL').length,
          dominant_failure_class: this.get_dominant_failure(nodes),
          avg_health_score: nodes.reduce((sum, n) => sum + n.health_score, 0) / nodes.length,
        };
      })
      .sort((a, b) => b.critical_count - a.critical_count)
      .slice(0, 20);
  }

  private get_dominant_failure(nodes: ServerNode[]): FailureClass {
    const counts = { THERMAL: 0, POWER: 0, MEMORY: 0, NETWORK: 0, FIRMWARE: 0, NONE: 0 };
    nodes.forEach((n) => {
      counts[n.failure_class]++;
    });

    let max_class: FailureClass = 'NONE';
    let max_count = 0;

    for (const [failure_class, count] of Object.entries(counts)) {
      if (count > max_count) {
        max_count = count;
        max_class = failure_class as FailureClass;
      }
    }

    return max_class;
  }

  get_timeline(): TimelineEvent[] {
    return [...this.timeline];
  }

  private add_timeline_event(type: 'TELEMETRY_REGEN' | 'VALIDATION_RUN' | 'FLEET_TRANSITION', description: string): void {
    this.timeline.push({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      type,
      description,
    });
  }

  get_validation_history(): any[] {
    return [...this.validation_history];
  }

  get_node_by_id(node_id: string): ServerNode | undefined {
    return this.fleet.find((n) => n.node_id === node_id);
  }

  // ===== ROOT CAUSE ENGINE =====
  analyze_root_cause(node: ServerNode): RootCauseAnalysis {
    const cache_key = `${node.node_id}-${node.last_seen}`;
    if (this.root_cause_cache.has(cache_key)) {
      return this.root_cause_cache.get(cache_key)!;
    }

    const evidence: any[] = [];
    let primary_cause = 'Unknown degradation';
    let secondary_causes: string[] = [];
    let owning_domain: any = 'OTHER';
    let severity: EscalationSeverity = 'SEV3';
    let confidence = 0;
    const correlated = new Set<string>();

    // THERMAL analysis
    if (node.cpu_temp_c > 85) {
      primary_cause = 'CPU thermal runaway detected';
      owning_domain = 'THERMAL';
      severity = node.cpu_temp_c > 95 ? 'SEV1' : 'SEV2';
      confidence = Math.min(1, 0.7 + (node.cpu_temp_c - 85) / 20 * 0.3);
      evidence.push({
        signal: 'cpu_temp_c',
        value: `${node.cpu_temp_c.toFixed(1)}°C`,
        contribution: 60,
      });

      // Correlated thermal signals
      if (node.thermal_throttle_events > 5) {
        evidence.push({ signal: 'thermal_throttle_events', value: `${node.thermal_throttle_events}`, contribution: 25 });
        correlated.add('thermal_throttle_events');
      }
      if (node.fan_rpm < 3000) {
        secondary_causes.push('Fan subsystem underperformance');
        evidence.push({ signal: 'fan_rpm', value: `${node.fan_rpm}`, contribution: 15 });
        correlated.add('fan_rpm');
      }
      if (node.vrm_temp_c > 80) {
        secondary_causes.push('Power delivery subsystem overheating (thermal-induced)');
        evidence.push({ signal: 'vrm_temp_c', value: `${node.vrm_temp_c.toFixed(1)}°C`, contribution: 10 });
        correlated.add('vrm_temp_c');
      }
    }

    // POWER analysis
    if (node.power_w < 250 || node.power_w > 2400) {
      if (!primary_cause.includes('thermal')) {
        primary_cause = 'Power delivery rail deviation';
        owning_domain = 'POWER';
        severity = 'SEV2';
      } else {
        secondary_causes.push('Power rail instability (power-induced)');
      }
      confidence = Math.max(confidence, 0.65);
      const deviation = node.power_w < 250 ? 250 - node.power_w : node.power_w - 2400;
      evidence.push({
        signal: 'power_w',
        value: `${node.power_w.toFixed(0)}W`,
        contribution: 50,
      });

      // Correlated power signals
      if (node.power_rail_mv < 11800 || node.power_rail_mv > 12200) {
        evidence.push({ signal: 'power_rail_mv', value: `${node.power_rail_mv.toFixed(0)}mV`, contribution: 25 });
        correlated.add('power_rail_mv');
      }
      if (node.reboot_count > 8) {
        secondary_causes.push('Repeated reboots (power-induced stability)');
        evidence.push({ signal: 'reboot_count', value: `${node.reboot_count}`, contribution: 15 });
        correlated.add('reboot_count');
      }
    }

    // MEMORY (ECC) analysis
    if (node.ecc_uncorrected_errors > 2) {
      if (!primary_cause.includes('thermal') && !primary_cause.includes('Power')) {
        primary_cause = 'Memory DIMM degradation or controller fault';
        owning_domain = 'MEMORY';
        severity = node.ecc_uncorrected_errors > 5 ? 'SEV1' : 'SEV2';
      } else {
        secondary_causes.push(`Memory errors (${node.ecc_uncorrected_errors} uncorrected)`);
      }
      confidence = Math.max(confidence, 0.75);
      evidence.push({
        signal: 'ecc_uncorrected_errors',
        value: `${node.ecc_uncorrected_errors}`,
        contribution: 65,
      });

      // Thermal-induced ECC boost
      if (node.cpu_temp_c > 75) {
        evidence.push({
          signal: 'thermal_induced_ecc',
          value: 'High temp + ECC errors',
          contribution: 20,
        });
        correlated.add('thermal_induced_ecc');
      }
    }

    // NETWORK analysis
    if (node.nic_link_flaps > 5) {
      if (primary_cause === 'Unknown degradation') {
        primary_cause = 'NIC firmware instability or physical link degradation';
        owning_domain = 'NETWORK';
        severity = 'SEV2';
      } else {
        secondary_causes.push('Network instability detected');
      }
      confidence = Math.max(confidence, 0.6);
      evidence.push({
        signal: 'nic_link_flaps',
        value: `${node.nic_link_flaps}`,
        contribution: 70,
      });

      if (node.nic_crc_errors > 50) {
        evidence.push({
          signal: 'nic_crc_errors',
          value: `${node.nic_crc_errors}`,
          contribution: 15,
        });
        correlated.add('nic_crc_errors');
      }
    }

    // FIRMWARE analysis
    if (node.reboot_count > 10) {
      if (primary_cause === 'Unknown degradation') {
        primary_cause = 'BIOS/Firmware stability issue causing boot loops';
        owning_domain = 'FIRMWARE';
        severity = 'SEV2';
      } else {
        secondary_causes.push('Repeated reboot instability');
      }
      confidence = Math.max(confidence, 0.7);
      evidence.push({
        signal: 'reboot_count',
        value: `${node.reboot_count}`,
        contribution: 65,
      });

      // Firmware-skew causing NIC issues
      if (node.nic_link_flaps > 3) {
        evidence.push({
          signal: 'firmware_skew_nic',
          value: 'Reboots + NIC flaps',
          contribution: 15,
        });
        correlated.add('firmware_skew_nic');
      }
    }

    // Normalize confidence and escalation
    if (confidence === 0) {
      confidence = 0.5;
      primary_cause = 'Degraded performance detected';
    }

    const analysis: RootCauseAnalysis = {
      primary_cause,
      secondary_causes,
      hypothesis: `${primary_cause}. Contributing factors: ${evidence.map((e) => e.signal).join(', ')}. Confidence: ${(confidence * 100).toFixed(0)}%.`,
      confidence,
      evidence,
      owning_domain,
      suggested_next_step: this.get_triage_action(owning_domain, node),
      escalation_severity: severity,
      correlated_signals: Array.from(correlated),
    };

    this.root_cause_cache.set(cache_key, analysis);
    return analysis;
  }

  private get_triage_action(domain: string, node: ServerNode): string {
    const actions: Record<string, string> = {
      THERMAL: `1. Check heatsink for dust/blockage on ${node.node_id}. 2. Verify thermal paste application. 3. Test fan subsystem. 4. If persistent, schedule thermal recertification or node replacement.`,
      POWER: `1. Inspect power connectors and cables on ${node.node_id}. 2. Test power supply output with multimeter. 3. Validate PSU efficiency curves. 4. Check for loose power rail pins or burnt components.`,
      MEMORY: `1. Run extensive memory diagnostics on ${node.node_id} (memtest86+). 2. Swap DIMM to adjacent slot. 3. If errors persist, mark DIMM for RMA. 4. Consider memory module replacement if multiple slots affected.`,
      NETWORK: `1. Update NIC firmware on ${node.node_id} to latest version. 2. Test with alternate NIC port. 3. Check network cable and connector integrity. 4. Validate switch port configuration.`,
      FIRMWARE: `1. Review BIOS/firmware logs on ${node.node_id}. 2. Update to latest stable BIOS/firmware version. 3. Perform CMOS reset. 4. Isolate node for single-threaded diagnostics.`,
      OTHER: `1. Run full hardware diagnostics on ${node.node_id}. 2. Check event logs for errors. 3. Validate all subsystems. 4. Consider full system reseating if needed.`,
    };
    return actions[domain] || actions.OTHER;
  }

  // ===== OPERATIONAL CONTROLS =====
  add_to_quarantine(node_id: string, reason: string): QuarantineEntry {
    const node = this.get_node_by_id(node_id);
    const entry: QuarantineEntry = {
      node_id,
      reason,
      timestamp: Date.now(),
      quarantine_id: `q-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      datacenter: node?.datacenter,
      zone: node?.zone,
    };
    this.quarantine_list.push(entry);
    this.add_timeline_event('FLEET_TRANSITION', `Node ${node_id} quarantined: ${reason}`);
    return entry;
  }

  get_quarantine_list(): QuarantineEntry[] {
    return [...this.quarantine_list];
  }

  remove_from_quarantine(quarantine_id: string): boolean {
    const idx = this.quarantine_list.findIndex((q) => q.quarantine_id === quarantine_id);
    if (idx >= 0) {
      const entry = this.quarantine_list[idx];
      this.quarantine_list.splice(idx, 1);
      this.add_timeline_event('FLEET_TRANSITION', `Node ${entry.node_id} removed from quarantine`);
      return true;
    }
    return false;
  }

  freeze_firmware(datacenter: string, zone: string | null, reason: string): FirmwareFreeze {
    const current_fw = FW_VERSIONS[this.random(0, FW_VERSIONS.length - 1)];
    const freeze: FirmwareFreeze = {
      freeze_id: `fw-freeze-${Date.now()}`,
      datacenter,
      zone,
      current_version: current_fw,
      frozen_version: current_fw,
      timestamp: Date.now(),
      reason,
    };
    this.firmware_freezes.push(freeze);
    const scope = zone ? `${datacenter}/${zone}` : datacenter;
    this.add_timeline_event('FLEET_TRANSITION', `Firmware rollout frozen for ${scope}: ${reason}`);
    return freeze;
  }

  get_firmware_freezes(): FirmwareFreeze[] {
    return [...this.firmware_freezes];
  }

  unfreeze_firmware(freeze_id: string): boolean {
    const idx = this.firmware_freezes.findIndex((f) => f.freeze_id === freeze_id);
    if (idx >= 0) {
      this.firmware_freezes.splice(idx, 1);
      this.add_timeline_event('FLEET_TRANSITION', `Firmware freeze lifted`);
      return true;
    }
    return false;
  }

  // ===== SNAPSHOT & DIFF =====
  create_snapshot(validation_run: any = null): FleetSnapshot {
    const snapshot: FleetSnapshot = {
      snapshot_id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      fleet: JSON.parse(JSON.stringify(this.fleet)), // Deep copy
      validation_run,
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  get_snapshots(): FleetSnapshot[] {
    return this.snapshots.map((s) => ({
      ...s,
      fleet: s.fleet.slice(0, 3), // Return sample, not full fleet for performance
    }));
  }

  compute_fleet_diff(snapshot_prev_idx: number, snapshot_curr_idx: number): FleetDiff {
    if (snapshot_prev_idx < 0 || snapshot_curr_idx < 0 || snapshot_prev_idx >= this.snapshots.length || snapshot_curr_idx >= this.snapshots.length) {
      throw new Error('Invalid snapshot indices');
    }

    const prev = this.snapshots[snapshot_prev_idx];
    const curr = this.snapshots[snapshot_curr_idx];

    const prev_critical = new Set(prev.fleet.filter((n) => n.status === 'CRITICAL').map((n) => n.node_id));
    const curr_critical = new Set(curr.fleet.filter((n) => n.status === 'CRITICAL').map((n) => n.node_id));

    const new_critical = Array.from(curr_critical).filter((id) => !prev_critical.has(id));
    const resolved_critical = Array.from(prev_critical).filter((id) => !curr_critical.has(id));

    const class_changes: Record<string, FailureClass> = {};
    const prev_by_id = new Map(prev.fleet.map((n) => [n.node_id, n]));
    const curr_by_id = new Map(curr.fleet.map((n) => [n.node_id, n]));

    curr_by_id.forEach((curr_node, node_id) => {
      const prev_node = prev_by_id.get(node_id);
      if (prev_node && prev_node.failure_class !== curr_node.failure_class) {
        class_changes[node_id] = curr_node.failure_class;
      }
    });

    return {
      snapshot_id_prev: prev.snapshot_id,
      snapshot_id_curr: curr.snapshot_id,
      timestamp_prev: prev.timestamp,
      timestamp_curr: curr.timestamp,
      new_critical,
      resolved_critical,
      class_changes,
      nodes_total_then: prev.fleet.length,
      nodes_total_now: curr.fleet.length,
    };
  }
}
