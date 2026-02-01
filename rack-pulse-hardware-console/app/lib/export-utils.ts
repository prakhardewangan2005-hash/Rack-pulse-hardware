import { ServerNode, ValidationRun } from '@/app/types';

export function export_fleet_csv(fleet: ServerNode[]): string {
  const headers = [
    'node_id',
    'datacenter',
    'rack',
    'zone',
    'server_sku',
    'cpu_temp_c',
    'cpu_util_pct',
    'power_w',
    'health_score',
    'status',
    'failure_class',
  ];

  const rows = fleet.map((node) => [
    node.node_id,
    node.datacenter,
    node.rack,
    node.zone,
    node.server_sku,
    node.cpu_temp_c.toFixed(1),
    node.cpu_util_pct.toFixed(1),
    node.power_w.toFixed(1),
    node.health_score.toFixed(0),
    node.status,
    node.failure_class,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
  return csv;
}

export function export_validation_report(validation_run: ValidationRun, fleet_size: number, quarantine_list: any[] = [], snapshot_diff: any = null): string {
  const failing_checks = validation_run.checks.filter(c => c.result === 'FAIL');
  
  // Group checks by domain
  const checks_by_domain: Record<string, any[]> = {
    THERMAL: [],
    POWER: [],
    MEMORY: [],
    NETWORK: [],
    FIRMWARE: [],
    OTHER: [],
  };
  
  validation_run.checks.forEach(check => {
    const domain = check.check_name.includes('Thermal') ? 'THERMAL' :
                   check.check_name.includes('Power') ? 'POWER' :
                   check.check_name.includes('ECC') || check.check_name.includes('Memory') ? 'MEMORY' :
                   check.check_name.includes('NIC') || check.check_name.includes('Network') ? 'NETWORK' :
                   check.check_name.includes('Reboot') || check.check_name.includes('Firmware') ? 'FIRMWARE' :
                   'OTHER';
    checks_by_domain[domain].push(check);
  });

  // Compute recommended next actions by domain
  const actions_by_domain: Record<string, string> = {
    THERMAL: '1. Check for dust/blockage in heatsinks. 2. Verify fan operation curves. 3. Test thermal interface material integrity. 4. Consider thermal recertification if degradation detected.',
    POWER: '1. Inspect all power connectors and rails. 2. Test PSU output voltage and stability. 3. Check for burnt components or oxidized contacts. 4. Validate power delivery thresholds.',
    MEMORY: '1. Run extended memory diagnostics (memtest86+). 2. Isolate affected DIMMs and test individually. 3. Log DIMM serial numbers for RMA. 4. Replace if errors persist.',
    NETWORK: '1. Update NIC firmware to latest stable version. 2. Test alternate NIC ports if available. 3. Inspect network cabling and connectors. 4. Validate switch port configuration.',
    FIRMWARE: '1. Review BIOS/firmware release notes for known issues. 2. Update to latest stable version. 3. Clear CMOS and reset to defaults if needed. 4. Log firmware change history.',
    OTHER: '1. Run comprehensive hardware diagnostics. 2. Check system logs for errors. 3. Validate all subsystems. 4. Escalate to hardware team if needed.',
  };
  
  const md = `# Hardware Validation Report

**Run ID:** ${validation_run.run_id}  
**Timestamp:** ${new Date(validation_run.timestamp).toISOString()}  
**Overall Status:** ${validation_run.overall_status === 'PASS' ? '✅ PASS' : '❌ FAIL'}

---

## Executive Summary

**Fleet Health Status:** ${validation_run.overall_status === 'PASS' ? 'All validation checks passed' : `${validation_run.failed_checks} validation checks failed`}

- **Total Nodes:** ${fleet_size}
- **Critical Nodes:** ${validation_run.critical_nodes}
- **Checks Passed:** ${validation_run.passed_checks}/${validation_run.passed_checks + validation_run.failed_checks}
- **Pass Rate:** ${((validation_run.passed_checks / (validation_run.passed_checks + validation_run.failed_checks)) * 100).toFixed(1)}%

---

## Validation Matrix

| Validation Check | Result | Threshold | Failed Nodes | Details |
|------------------|--------|-----------|--------------|---------|
${validation_run.checks.map((c) => `| ${c.check_name} | **${c.result}** | ${c.threshold} | ${c.failed_nodes} | ${c.description} |`).join('\n')}

---

## Blocking Issues

${
  failing_checks.length > 0
    ? failing_checks.map((c) => `- **${c.check_name}**: ${c.description}. Affects ${c.failed_nodes} nodes.`).join('\n')
    : 'None - fleet is operating within acceptable parameters.'
}

---

## Top Failure Classes

${
  validation_run.checks.length > 0
    ? `Review the validation matrix above. Failed checks indicate which hardware subsystems require attention.`
    : 'No validation data available.'
}

---

## Recommended Next Actions by Domain

${
  validation_run.failed_checks > 0
    ? Object.entries(checks_by_domain)
        .filter(([_, checks]) => checks.some(c => c.result === 'FAIL'))
        .map(([domain, checks]) => {
          const failed = checks.filter(c => c.result === 'FAIL');
          return `### ${domain}
${actions_by_domain[domain]}

Failing checks: ${failed.map(c => c.check_name).join(', ')}`;
        })
        .join('\n\n')
    : `### Fleet Status
All validation checks passed. Recommended actions:
1. **Continue Monitoring:** All checks passed. Continue regular telemetry refresh cycles
2. **Trend Analysis:** Monitor metrics over time for early detection of degradation patterns
3. **Preventive Maintenance:** Schedule routine maintenance windows as needed
4. **Documentation:** Review logs and maintain records of fleet health status`
}

---

## Blocked Checks Summary

${
  failing_checks.length > 0
    ? `${failing_checks.length} check(s) are currently blocking the fleet:\n\n${failing_checks.map(c => `- **${c.check_name}**: ${c.failed_nodes} nodes affected`).join('\n')}`
    : 'None - all checks are passing'
}

---

${quarantine_list && quarantine_list.length > 0 ? `
## Quarantine List

${quarantine_list.length} node(s) currently in quarantine:

| Node ID | Reason | Timestamp |
|---------|--------|-----------|
${quarantine_list.map(q => `| ${q.node_id} | ${q.reason} | ${new Date(q.timestamp).toISOString()} |`).join('\n')}

---
` : ''}

${snapshot_diff ? `
## Fleet Snapshot Diff

**Comparison Period:** ${new Date(snapshot_diff.timestamp_prev).toISOString()} → ${new Date(snapshot_diff.timestamp_curr).toISOString()}

- **New Critical Nodes:** ${snapshot_diff.new_critical.length}
- **Resolved Critical Nodes:** ${snapshot_diff.resolved_critical.length}
- **Failure Class Changes:** ${Object.keys(snapshot_diff.class_changes).length}
- **Fleet Size Change:** ${snapshot_diff.nodes_total_then} → ${snapshot_diff.nodes_total_now} (${snapshot_diff.nodes_total_now - snapshot_diff.nodes_total_then > 0 ? '+' : ''}${snapshot_diff.nodes_total_now - snapshot_diff.nodes_total_then})

---
` : ''}

Generated on ${new Date().toISOString()} by RackPulse Hardware Validation System
`;
  return md;
}

export function download_file(content: string, filename: string, mime_type: string): void {
  const blob = new Blob([content], { type: mime_type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
