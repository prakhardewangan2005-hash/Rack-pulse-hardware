'use client';

import { useState, useMemo } from 'react';
import { ServerNode, RootCauseAnalysis } from '@/app/types';
import { FleetSimulator } from '@/app/lib/fleet-simulator';

interface NodePanelProps {
  node: ServerNode;
  onClose: () => void;
  simulator?: FleetSimulator;
}

export default function NodePanel({ node, onClose, simulator }: NodePanelProps) {
  const rootCauseAnalysis = useMemo(() => {
    if (simulator && node.status !== 'HEALTHY') {
      return simulator.analyze_root_cause(node);
    }
    return null;
  }, [node, simulator]);
  const get_recommended_action = (): string => {
    if (node.status === 'CRITICAL') {
      if (node.cpu_temp_c > 85) {
        return 'Immediate action required: Check CPU cooling system and thermal paste. Consider emergency shutdown for maintenance.';
      }
      if (node.ecc_uncorrected_errors > 2) {
        return 'Critical memory issue detected: Run memory diagnostics and plan for DIMM replacement.';
      }
      if (node.reboot_count > 10) {
        return 'Reboot loop detected: Check BIOS/firmware logs. Plan firmware update and hardware validation.';
      }
      return 'Critical status: Perform full hardware diagnostics and plan maintenance window.';
    }

    if (node.status === 'DEGRADED') {
      if (node.cpu_temp_c > 75) {
        return 'Monitor thermal trends closely. Verify fan operation and consider cleaning intake filters.';
      }
      if (node.nic_link_flaps > 3) {
        return 'Network instability detected: Check cable connections and NIC firmware. Test with different port.';
      }
      return 'Monitor metrics closely. Schedule maintenance within next week.';
    }

    return 'No immediate action required. Continue monitoring.';
  };

  const get_health_trend = (): string => {
    if (node.health_score >= 80) return 'Stable';
    if (node.health_score >= 60) return 'Declining';
    return 'Critical Trend';
  };

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <div className="side-panel-title">Node Details</div>
        <button className="side-panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="side-panel-content">
        {/* Identity */}
        <div className="panel-section">
          <div className="panel-section-title">Identity</div>
          <div className="panel-field">
            <div className="panel-label">Node ID</div>
            <div className="panel-value">{node.node_id}</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Rack</div>
            <div className="panel-value">{node.rack}</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Datacenter</div>
            <div className="panel-value">{node.datacenter}</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Zone</div>
            <div className="panel-value">{node.zone}</div>
          </div>
        </div>

        <div className="panel-divider" />

        {/* Lifecycle & Status */}
        <div className="panel-section">
          <div className="panel-section-title">Lifecycle & Status</div>
          <div className="panel-field">
            <div className="panel-label">Lifecycle Phase</div>
            <div className="panel-value" style={{
              backgroundColor: node.lifecycle_phase === 'PRODUCTION' ? 'rgba(76, 175, 80, 0.15)' : 
                              node.lifecycle_phase === 'BURN_IN' ? 'rgba(255, 193, 7, 0.15)' :
                              'rgba(33, 150, 243, 0.15)',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: 500
            }}>
              {node.lifecycle_phase}
            </div>
          </div>
        </div>

        <div className="panel-divider" />

        {/* Hardware */}
        <div className="panel-section">
          <div className="panel-section-title">Hardware</div>
          <div className="panel-field">
            <div className="panel-label">Server SKU</div>
            <div className="panel-value">{node.server_sku}</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">CPU Model</div>
            <div className="panel-value">{node.cpu_model}</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">BIOS Version</div>
            <div className="panel-value">{node.bios_version}</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Firmware Version</div>
            <div className="panel-value">{node.firmware_version}</div>
          </div>
        </div>

        <div className="panel-divider" />

        {/* Thermal & Power */}
        <div className="panel-section">
          <div className="panel-section-title">Thermal & Power</div>
          <div className="panel-field">
            <div className="panel-label">CPU Temperature</div>
            <div className={`panel-value ${node.cpu_temp_c > 85 ? 'critical' : node.cpu_temp_c > 75 ? 'warning' : ''}`}>
              {node.cpu_temp_c.toFixed(1)}°C
            </div>
            <div className="panel-progress">
              <div
                className={`panel-progress-bar ${node.cpu_temp_c > 85 ? 'critical' : node.cpu_temp_c > 75 ? 'warning' : ''}`}
                style={{
                  width: `${(node.cpu_temp_c / 100) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="panel-field">
            <div className="panel-label">CPU Utilization</div>
            <div className="panel-value">{node.cpu_util_pct.toFixed(1)}%</div>
            <div className="panel-progress">
              <div
                className="panel-progress-bar"
                style={{
                  width: `${node.cpu_util_pct}%`,
                }}
              />
            </div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Power Draw</div>
            <div
              className={`panel-value ${node.power_w < 250 || node.power_w > 2400 ? 'critical' : ''}`}
            >
              {node.power_w.toFixed(0)}W
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              Expected: 250-2400W
            </div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Power Rail Voltage</div>
            <div className="panel-value">{(node.power_rail_mv / 1000).toFixed(2)}V</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">VRM Temperature</div>
            <div className={`panel-value ${node.vrm_temp_c > 75 ? 'warning' : ''}`}>
              {node.vrm_temp_c.toFixed(1)}°C
            </div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Fan RPM</div>
            <div className="panel-value">{node.fan_rpm}</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Thermal Throttle Events</div>
            <div className={`panel-value ${node.thermal_throttle_events > 5 ? 'warning' : ''}`}>
              {node.thermal_throttle_events}
            </div>
          </div>
        </div>

        <div className="panel-divider" />

        {/* Memory & Reliability */}
        <div className="panel-section">
          <div className="panel-section-title">Memory & Reliability</div>
          <div className="panel-field">
            <div className="panel-label">ECC Corrected Errors</div>
            <div className="panel-value">{node.ecc_corrected_errors}</div>
          </div>
          <div className="panel-field">
            <div
              className={`panel-label ${node.ecc_uncorrected_errors > 2 ? 'critical' : ''}`}
            >
              ECC Uncorrected Errors
            </div>
            <div className={`panel-value ${node.ecc_uncorrected_errors > 2 ? 'critical' : ''}`}>
              {node.ecc_uncorrected_errors}
            </div>
          </div>
        </div>

        <div className="panel-divider" />

        {/* Network */}
        <div className="panel-section">
          <div className="panel-section-title">Network</div>
          <div className="panel-field">
            <div className="panel-label">NIC CRC Errors</div>
            <div className="panel-value">{node.nic_crc_errors}</div>
          </div>
          <div className="panel-field">
            <div className={`panel-label ${node.nic_link_flaps > 5 ? 'critical' : ''}`}>
              NIC Link Flaps
            </div>
            <div className={`panel-value ${node.nic_link_flaps > 5 ? 'critical' : ''}`}>
              {node.nic_link_flaps}
            </div>
          </div>
        </div>

        <div className="panel-divider" />

        {/* System Status */}
        <div className="panel-section">
          <div className="panel-section-title">System Status</div>
          <div className="panel-field">
            <div className="panel-label">Status</div>
            <span className={`status-badge ${node.status.toLowerCase()}`}>{node.status}</span>
          </div>
          <div className="panel-field">
            <div className="panel-label">Failure Class</div>
            <span className={`failure-badge ${node.failure_class.toLowerCase()}`}>{node.failure_class}</span>
          </div>
          <div className="panel-field">
            <div className="panel-label">Reboot Count</div>
            <div className={`panel-value ${node.reboot_count > 10 ? 'critical' : ''}`}>
              {node.reboot_count}
            </div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Health Score</div>
            <div className={`panel-value ${node.health_score < 50 ? 'critical' : node.health_score < 70 ? 'warning' : ''}`}>
              {node.health_score.toFixed(0)}%
            </div>
            <div className="panel-progress">
              <div
                className={`panel-progress-bar ${node.health_score < 50 ? 'critical' : node.health_score < 70 ? 'warning' : ''}`}
                style={{
                  width: `${node.health_score}%`,
                }}
              />
            </div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Health Trend</div>
            <div className="panel-value">{get_health_trend()}</div>
          </div>
          <div className="panel-field">
            <div className="panel-label">Last Seen</div>
            <div className="panel-value" style={{ fontSize: '11px' }}>
              {new Date(node.last_seen).toISOString().split('.')[0]}
            </div>
          </div>
        </div>

        <div className="panel-divider" />

        {/* Advanced Root Cause Analysis */}
        {rootCauseAnalysis && (
          <>
            <div className="panel-divider" />
            <div className="panel-section">
              <div className="panel-section-title">Root Cause Analysis Engine</div>
              
              <div className="panel-field">
                <div className="panel-label">Primary Cause</div>
                <div className="panel-value" style={{ fontSize: '13px', lineHeight: 1.5, fontWeight: 600 }}>
                  {rootCauseAnalysis.primary_cause}
                </div>
              </div>

              {rootCauseAnalysis.secondary_causes.length > 0 && (
                <div className="panel-field">
                  <div className="panel-label">Secondary Causes</div>
                  <ul style={{ marginTop: '6px', paddingLeft: '16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {rootCauseAnalysis.secondary_causes.map((cause, idx) => (
                      <li key={idx}>{cause}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="panel-field">
                <div className="panel-label">Confidence</div>
                <div className="panel-value">{(rootCauseAnalysis.confidence * 100).toFixed(0)}%</div>
                <div className="panel-progress">
                  <div
                    className={`panel-progress-bar ${rootCauseAnalysis.confidence < 0.6 ? 'warning' : ''}`}
                    style={{
                      width: `${rootCauseAnalysis.confidence * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="panel-field">
                <div className="panel-label">Escalation Severity</div>
                <span
                  style={{
                    backgroundColor:
                      rootCauseAnalysis.escalation_severity === 'SEV1'
                        ? 'rgba(244, 67, 54, 0.2)'
                        : rootCauseAnalysis.escalation_severity === 'SEV2'
                          ? 'rgba(255, 193, 7, 0.2)'
                          : 'rgba(255, 152, 0, 0.2)',
                    color:
                      rootCauseAnalysis.escalation_severity === 'SEV1'
                        ? '#F44336'
                        : rootCauseAnalysis.escalation_severity === 'SEV2'
                          ? '#FFC107'
                          : '#FF9800',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                >
                  {rootCauseAnalysis.escalation_severity}
                </span>
              </div>

              <div className="panel-field">
                <div className="panel-label">Owning Domain</div>
                <span className={`failure-badge ${rootCauseAnalysis.owning_domain.toLowerCase()}`}>
                  {rootCauseAnalysis.owning_domain}
                </span>
              </div>

              {rootCauseAnalysis.correlated_signals.length > 0 && (
                <div className="panel-field">
                  <div className="panel-label">Correlated Signals</div>
                  <div style={{
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    marginTop: '4px'
                  }}>
                    {rootCauseAnalysis.correlated_signals.join(', ')}
                  </div>
                </div>
              )}

              <div className="panel-field">
                <div className="panel-label">Evidence</div>
                <table style={{ width: '100%', fontSize: '11px', marginTop: '6px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '4px', color: 'var(--color-text-secondary)' }}>Signal</th>
                      <th style={{ textAlign: 'right', padding: '4px', color: 'var(--color-text-secondary)' }}>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rootCauseAnalysis.evidence.map((ev, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-faint)' }}>
                        <td style={{ padding: '4px', color: 'var(--color-text)' }}>{ev.signal}: {ev.value}</td>
                        <td style={{ textAlign: 'right', padding: '4px', color: 'var(--color-accent)' }}>{ev.contribution}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel-field">
                <div className="panel-label">Hypothesis</div>
                <div style={{
                  backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  {rootCauseAnalysis.hypothesis}
                </div>
              </div>

              <div className="panel-field">
                <div className="panel-label">Suggested Next Step</div>
                <div style={{
                  backgroundColor: 'rgba(255, 152, 0, 0.08)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginTop: '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {rootCauseAnalysis.suggested_next_step}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="panel-divider" />

        {/* Triage Action */}
        <div className="panel-section">
          <div className="panel-section-title">Triage Action</div>
          <div
            style={{
              backgroundColor: 'rgba(0, 217, 255, 0.08)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {get_recommended_action()}
          </div>
        </div>
      </div>
    </div>
  );
}
