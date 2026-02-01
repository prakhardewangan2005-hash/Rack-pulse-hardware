'use client';

import React, { useState } from 'react';
import { FleetSnapshot, FleetDiff as FleetDiffType } from '@/app/types';

interface FleetDiffProps {
  snapshots: FleetSnapshot[];
  onComputeDiff: (prev_idx: number, curr_idx: number) => FleetDiffType | null;
}

export default function FleetDiff({ snapshots, onComputeDiff }: FleetDiffProps) {
  const [prev_idx, set_prev_idx] = useState(0);
  const [curr_idx, set_curr_idx] = useState(Math.max(0, snapshots.length - 1));
  const [diff, set_diff] = useState<FleetDiffType | null>(null);

  const handle_compute = () => {
    if (prev_idx < curr_idx) {
      const result = onComputeDiff(prev_idx, curr_idx);
      set_diff(result);
    }
  };

  if (snapshots.length < 2) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          Need at least 2 snapshots to compare
        </div>
        <div style={{ fontSize: '12px' }}>
          Current snapshots: {snapshots.length}. Create multiple snapshots to use Diff Mode.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Snapshot Selector */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
            Previous Snapshot
          </label>
          <select
            value={prev_idx}
            onChange={(e) => set_prev_idx(parseInt(e.target.value))}
            style={{
              padding: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text)',
              fontSize: '12px',
            }}
          >
            {snapshots.map((s, idx) => (
              <option key={idx} value={idx}>
                {new Date(s.timestamp).toLocaleTimeString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
            Current Snapshot
          </label>
          <select
            value={curr_idx}
            onChange={(e) => set_curr_idx(parseInt(e.target.value))}
            style={{
              padding: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text)',
              fontSize: '12px',
            }}
          >
            {snapshots.map((s, idx) => (
              <option key={idx} value={idx}>
                {new Date(s.timestamp).toLocaleTimeString()}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handle_compute}
          disabled={prev_idx >= curr_idx}
          style={{
            padding: '8px 16px',
            backgroundColor: prev_idx < curr_idx ? 'var(--color-accent)' : 'var(--color-bg)',
            color: prev_idx < curr_idx ? 'var(--color-bg)' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: prev_idx < curr_idx ? 'pointer' : 'not-allowed',
          }}
        >
          Compute Diff
        </button>
      </div>

      {/* Diff Results */}
      {diff && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {/* New Critical */}
          <div
            style={{
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
              New Critical Nodes
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F44336', marginBottom: '8px' }}>
              {diff.new_critical.length}
            </div>
            {diff.new_critical.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {diff.new_critical.slice(0, 3).join(', ')}
                {diff.new_critical.length > 3 && ` (+${diff.new_critical.length - 3} more)`}
              </div>
            )}
          </div>

          {/* Resolved Critical */}
          <div
            style={{
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
              Resolved Critical Nodes
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4CAF50', marginBottom: '8px' }}>
              {diff.resolved_critical.length}
            </div>
            {diff.resolved_critical.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {diff.resolved_critical.slice(0, 3).join(', ')}
                {diff.resolved_critical.length > 3 && ` (+${diff.resolved_critical.length - 3} more)`}
              </div>
            )}
          </div>

          {/* Fleet Size */}
          <div
            style={{
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
              Fleet Size Change
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '4px' }}>
              {diff.nodes_total_then} → {diff.nodes_total_now}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: diff.nodes_total_now > diff.nodes_total_then ? '#F44336' : '#4CAF50',
              }}
            >
              {diff.nodes_total_now > diff.nodes_total_then ? '+' : ''}
              {diff.nodes_total_now - diff.nodes_total_then} nodes
            </div>
          </div>

          {/* Class Changes */}
          <div
            style={{
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
              Failure Class Changes
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFC107', marginBottom: '8px' }}>
              {Object.keys(diff.class_changes).length}
            </div>
            {Object.keys(diff.class_changes).length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {Object.entries(diff.class_changes)
                  .slice(0, 2)
                  .map(([id, cls]) => `${id} → ${cls}`)
                  .join(', ')}
                {Object.keys(diff.class_changes).length > 2 && ` (+${Object.keys(diff.class_changes).length - 2} more)`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details Table */}
      {diff && Object.keys(diff.class_changes).length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
            Failure Class Transitions
          </div>
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Node ID
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    New Failure Class
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(diff.class_changes)
                  .slice(0, 10)
                  .map(([node_id, failure_class]) => (
                    <tr key={node_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px', color: 'var(--color-text)' }}>{node_id}</td>
                      <td
                        style={{
                          padding: '10px',
                          color: 'var(--color-text)',
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            backgroundColor:
                              failure_class === 'THERMAL'
                                ? 'rgba(244, 67, 54, 0.2)'
                                : failure_class === 'POWER'
                                  ? 'rgba(255, 193, 7, 0.2)'
                                  : failure_class === 'MEMORY'
                                    ? 'rgba(156, 39, 176, 0.2)'
                                    : failure_class === 'NETWORK'
                                      ? 'rgba(33, 150, 243, 0.2)'
                                      : failure_class === 'FIRMWARE'
                                        ? 'rgba(255, 152, 0, 0.2)'
                                        : 'rgba(76, 175, 80, 0.2)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {failure_class}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {Object.keys(diff.class_changes).length > 10 && (
              <div style={{ padding: '10px', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                Showing 10 of {Object.keys(diff.class_changes).length} changes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
