'use client';

import { ServerNode } from '@/app/types';

interface FleetTableProps {
  fleet: ServerNode[];
  selectedNode: ServerNode | null;
  onSelectNode: (node: ServerNode) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  failureFilter: string;
  onFailureChange: (failure: string) => void;
  datacenterFilter: string;
  onDatacenterChange: (dc: string) => void;
  datacenterOptions: string[];
}

export default function FleetTable({
  fleet,
  selectedNode,
  onSelectNode,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  failureFilter,
  onFailureChange,
  datacenterFilter,
  onDatacenterChange,
  datacenterOptions,
}: FleetTableProps) {
  return (
    <div className="table-container">
      {/* Controls */}
      <div className="table-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search by node ID, rack, SKU..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ minWidth: '300px', flex: 1 }}
        />

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="HEALTHY">Healthy</option>
          <option value="DEGRADED">Degraded</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <select
          className="filter-select"
          value={failureFilter}
          onChange={(e) => onFailureChange(e.target.value)}
        >
          <option value="all">All Failure Classes</option>
          <option value="THERMAL">Thermal</option>
          <option value="POWER">Power</option>
          <option value="MEMORY">Memory</option>
          <option value="NETWORK">Network</option>
          <option value="FIRMWARE">Firmware</option>
          <option value="NONE">None</option>
        </select>

        <select
          className="filter-select"
          value={datacenterFilter}
          onChange={(e) => onDatacenterChange(e.target.value)}
        >
          <option value="all">All Datacenters</option>
          {datacenterOptions.map((dc) => (
            <option key={dc} value={dc}>
              {dc}
            </option>
          ))}
        </select>

        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {fleet.length} nodes
        </div>
      </div>

      {/* Table */}
      {fleet.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Rack</th>
              <th>SKU</th>
              <th>CPU Temp</th>
              <th>Power</th>
              <th>Health</th>
              <th>Status</th>
              <th>Failure Class</th>
            </tr>
          </thead>
          <tbody>
            {fleet.map((node) => (
              <tr
                key={node.node_id}
                className={node.status === 'CRITICAL' ? 'critical' : node.status === 'DEGRADED' ? 'degraded' : ''}
                onClick={() => onSelectNode(node)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <code style={{ fontSize: '12px', fontFamily: 'monospace' }}>{node.node_id}</code>
                </td>
                <td>{node.rack}</td>
                <td>{node.server_sku}</td>
                <td>
                  <span style={{ color: node.cpu_temp_c > 85 ? 'var(--color-warning)' : 'inherit' }}>
                    {node.cpu_temp_c.toFixed(1)}°C
                  </span>
                </td>
                <td>{node.power_w.toFixed(0)}W</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '60px',
                        height: '4px',
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${node.health_score}%`,
                          height: '100%',
                          backgroundColor:
                            node.health_score >= 80
                              ? 'var(--color-success)'
                              : node.health_score >= 50
                                ? 'var(--color-warning)'
                                : 'var(--color-critical)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {node.health_score.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${node.status.toLowerCase()}`}>{node.status}</span>
                </td>
                <td>
                  <span className={`failure-badge ${node.failure_class.toLowerCase()}`}>{node.failure_class}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          style={{
            padding: '40px 16px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          No nodes match your filters
        </div>
      )}
    </div>
  );
}
