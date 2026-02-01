'use client';

import { useState, useMemo, useCallback } from 'react';
import { FleetSimulator } from '@/app/lib/fleet-simulator';
import { export_fleet_csv, export_validation_report, download_file } from '@/app/lib/export-utils';
import { ServerNode, ValidationRun, TimelineEvent } from '@/app/types';
import Analytics from './Analytics';
import FleetTable from './FleetTable';
import NodePanel from './NodePanel';
import ValidationResults from './ValidationResults';
import ValidationMatrix from './ValidationMatrix';
import Timeline from './Timeline';
import OperationalControls from './OperationalControls';
import FleetDiff from './FleetDiff';
import '../rackpulse.css';

type TabType = 'dashboard' | 'fleet' | 'validation' | 'matrix' | 'analytics' | 'operations' | 'diff' | 'timeline';

export default function RackPulse() {
  const [simulator] = useState(() => new FleetSimulator(2000));
  const [fleet, setFleet] = useState<ServerNode[]>(simulator.get_fleet());
  const [selectedNode, setSelectedNode] = useState<ServerNode | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [validationRun, setValidationRun] = useState<ValidationRun | null>(null);
  const [filteredFleet, setFilteredFleet] = useState<ServerNode[]>(fleet);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [failureFilter, setFailureFilter] = useState<string>('all');
  const [datacenterFilter, setDatacenterFilter] = useState<string>('all');
  const [quarantineList, setQuarantineList] = useState(simulator.get_quarantine_list());
  const [firmwareFreezes, setFirmwareFreezes] = useState(simulator.get_firmware_freezes());
  const [snapshots, setSnapshots] = useState([simulator.create_snapshot(null)]);

  const analytics = useMemo(() => simulator.get_analytics(), [fleet, simulator]);

  // Apply filters
  useMemo(() => {
    let filtered = fleet;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.node_id.toLowerCase().includes(term) ||
          n.rack.toLowerCase().includes(term) ||
          n.server_sku.toLowerCase().includes(term) ||
          n.datacenter.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((n) => n.status === statusFilter);
    }

    if (failureFilter !== 'all') {
      filtered = filtered.filter((n) => n.failure_class === failureFilter);
    }

    if (datacenterFilter !== 'all') {
      filtered = filtered.filter((n) => n.datacenter === datacenterFilter);
    }

    setFilteredFleet(filtered);
  }, [fleet, searchTerm, statusFilter, failureFilter, datacenterFilter]);

  const refresh_telemetry = useCallback(() => {
    simulator.refresh_telemetry();
    setFleet([...simulator.get_fleet()]);
  }, [simulator]);

  const run_validation = useCallback(() => {
    const result = simulator.run_validation_suite();
    setValidationRun(result);
    // Auto-create snapshot after validation
    const snapshot = simulator.create_snapshot(result);
    setSnapshots([...snapshots, snapshot]);
    setActiveTab('validation');
  }, [simulator, snapshots]);

  const handle_add_quarantine = useCallback((node_id: string, reason: string) => {
    simulator.add_to_quarantine(node_id, reason);
    setQuarantineList([...simulator.get_quarantine_list()]);
  }, [simulator]);

  const handle_remove_quarantine = useCallback((quarantine_id: string) => {
    simulator.remove_from_quarantine(quarantine_id);
    setQuarantineList([...simulator.get_quarantine_list()]);
  }, [simulator]);

  const handle_freeze_firmware = useCallback((datacenter: string, zone: string | null, reason: string) => {
    simulator.freeze_firmware(datacenter, zone, reason);
    setFirmwareFreezes([...simulator.get_firmware_freezes()]);
  }, [simulator]);

  const handle_unfreeze_firmware = useCallback((freeze_id: string) => {
    simulator.unfreeze_firmware(freeze_id);
    setFirmwareFreezes([...simulator.get_firmware_freezes()]);
  }, [simulator]);

  const handle_compute_diff = useCallback((prev_idx: number, curr_idx: number) => {
    try {
      return simulator.compute_fleet_diff(prev_idx, curr_idx);
    } catch (e) {
      console.error('Error computing diff:', e);
      return null;
    }
  }, [simulator]);

  const export_csv = useCallback(() => {
    const csv = export_fleet_csv(filteredFleet);
    download_file(csv, `rackpulse-fleet-${Date.now()}.csv`, 'text/csv');
  }, [filteredFleet]);

  const export_report = useCallback(() => {
    if (validationRun) {
      const report = export_validation_report(validationRun, fleet.length);
      download_file(report, `validation-report-${validationRun.run_id}.md`, 'text/markdown');
    }
  }, [validationRun, fleet.length]);

  const timeline = simulator.get_timeline();
  const datacenterOptions = Array.from(new Set(fleet.map((n) => n.datacenter))).sort();

  return (
    <div className="rackpulse-container">
      {/* Header */}
      <div className="rackpulse-header">
        <div className="rackpulse-title">
          <span className="rackpulse-title-icon">⚡</span>
          <span>RackPulse</span>
        </div>
        <div className="rackpulse-controls">
          <button className="btn btn-primary" onClick={run_validation}>
            Run Validation Suite
          </button>
          <button className="btn btn-secondary btn-sm" onClick={refresh_telemetry}>
            Refresh Telemetry
          </button>
          <button className="btn btn-secondary btn-sm" onClick={export_csv} disabled={filteredFleet.length === 0}>
            Export CSV
          </button>
          {validationRun && (
            <button className="btn btn-secondary btn-sm" onClick={export_report}>
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="rackpulse-tabs">
        {(['dashboard', 'fleet', 'analytics', 'matrix', 'validation', 'operations', 'diff', 'timeline'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'matrix' ? 'Validation Matrix' : tab === 'diff' ? 'Fleet Diff' : tab === 'operations' ? 'Ops Controls' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="rackpulse-content">
        <div className="rackpulse-main">
          {activeTab === 'dashboard' && (
            <div>
              <Analytics analytics={analytics} fleet={fleet} />
            </div>
          )}

          {activeTab === 'fleet' && (
            <FleetTable
              fleet={filteredFleet}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              failureFilter={failureFilter}
              onFailureChange={setFailureFilter}
              datacenterFilter={datacenterFilter}
              onDatacenterChange={setDatacenterFilter}
              datacenterOptions={datacenterOptions}
            />
          )}

          {activeTab === 'analytics' && (
            <div className="table-container">
              <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>Problematic Racks Analysis</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Rack ID</th>
                    <th>Datacenter</th>
                    <th>Nodes</th>
                    <th>Critical</th>
                    <th>Failure Class</th>
                    <th>Avg Health</th>
                  </tr>
                </thead>
                <tbody>
                  {simulator.get_problematic_racks().map((rack) => (
                    <tr key={rack.rack_id}>
                      <td>{rack.rack_id}</td>
                      <td>{rack.datacenter}</td>
                      <td>{rack.node_count}</td>
                      <td>
                        <span className="status-badge critical">{rack.critical_count}</span>
                      </td>
                      <td>
                        <span className={`failure-badge ${rack.dominant_failure_class.toLowerCase()}`}>
                          {rack.dominant_failure_class}
                        </span>
                      </td>
                      <td>{rack.avg_health_score.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'matrix' && (
            validationRun ? (
              <ValidationMatrix checks={validationRun.checks} />
            ) : (
              <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '12px' }}>No validation run available</div>
                <div style={{ fontSize: '13px' }}>Click "Run Validation Suite" to generate the hardware validation matrix with lifecycle-aware thresholds.</div>
              </div>
            )
          )}

          {activeTab === 'validation' && (
            validationRun ? (
              <ValidationResults validationRun={validationRun} />
            ) : (
              <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '12px' }}>No validation run available</div>
                <div style={{ fontSize: '13px' }}>Click "Run Validation Suite" to execute hardware validation checks.</div>
              </div>
            )
          )}

          {activeTab === 'operations' && (
            <OperationalControls
              quarantine_list={quarantineList}
              firmware_freezes={firmwareFreezes}
              datacenters={Array.from(new Set(fleet.map((n) => n.datacenter))).sort()}
              zones={Array.from(new Set(fleet.map((n) => n.zone))).sort()}
              onAddQuarantine={handle_add_quarantine}
              onRemoveQuarantine={handle_remove_quarantine}
              onFreezeFireware={handle_freeze_firmware}
              onUnfreezeFirmware={handle_unfreeze_firmware}
            />
          )}

          {activeTab === 'diff' && (
            <FleetDiff
              snapshots={snapshots}
              onComputeDiff={handle_compute_diff}
            />
          )}

          {activeTab === 'timeline' && <Timeline events={timeline} />}
        </div>

        {/* Side Panel */}
        {selectedNode && (
          <NodePanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            simulator={simulator}
          />
        )}
      </div>
    </div>
  );
}
