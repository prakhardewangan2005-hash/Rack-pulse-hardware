'use client';

import React, { useState } from 'react';
import { QuarantineEntry, FirmwareFreeze } from '@/app/types';

interface OperationalControlsProps {
  quarantine_list: QuarantineEntry[];
  firmware_freezes: FirmwareFreeze[];
  datacenters: string[];
  zones: string[];
  onAddQuarantine: (node_id: string, reason: string) => void;
  onRemoveQuarantine: (quarantine_id: string) => void;
  onFreezeFireware: (datacenter: string, zone: string | null, reason: string) => void;
  onUnfreezeFirmware: (freeze_id: string) => void;
}

export default function OperationalControls({
  quarantine_list,
  firmware_freezes,
  datacenters,
  zones,
  onAddQuarantine,
  onRemoveQuarantine,
  onFreezeFireware,
  onUnfreezeFirmware,
}: OperationalControlsProps) {
  const [quarantine_node_id, set_quarantine_node_id] = useState('');
  const [quarantine_reason, set_quarantine_reason] = useState('');
  const [freeze_dc, set_freeze_dc] = useState(datacenters[0] || '');
  const [freeze_zone, set_freeze_zone] = useState('');
  const [freeze_reason, set_freeze_reason] = useState('');

  const handle_add_quarantine = () => {
    if (quarantine_node_id.trim() && quarantine_reason.trim()) {
      onAddQuarantine(quarantine_node_id, quarantine_reason);
      set_quarantine_node_id('');
      set_quarantine_reason('');
    }
  };

  const handle_freeze_fw = () => {
    if (freeze_dc && freeze_reason.trim()) {
      onFreezeFireware(freeze_dc, freeze_zone || null, freeze_reason);
      set_freeze_reason('');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {/* Quarantine Controls */}
      <div
        style={{
          flex: 1,
          minWidth: '300px',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
          Quarantine Node
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
            Node ID
          </label>
          <input
            type="text"
            placeholder="node-00042"
            value={quarantine_node_id}
            onChange={(e) => set_quarantine_node_id(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text)',
              fontSize: '12px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
            Reason
          </label>
          <textarea
            placeholder="e.g., Thermal runaway detected, pending investigation..."
            value={quarantine_reason}
            onChange={(e) => set_quarantine_reason(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text)',
              fontSize: '12px',
              boxSizing: 'border-box',
              minHeight: '60px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          onClick={handle_add_quarantine}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Add to Quarantine
        </button>

        {/* Quarantine List */}
        {quarantine_list.length > 0 && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
              Quarantined Nodes ({quarantine_list.length})
            </div>
            {quarantine_list.map((entry) => (
              <div
                key={entry.quarantine_id}
                style={{
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '8px',
                  fontSize: '11px',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{entry.node_id}</div>
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{entry.reason}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px', marginTop: '2px' }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <button
                  onClick={() => onRemoveQuarantine(entry.quarantine_id)}
                  style={{
                    marginTop: '6px',
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(244, 67, 54, 0.5)',
                    borderRadius: '3px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Firmware Freeze Controls */}
      <div
        style={{
          flex: 1,
          minWidth: '300px',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
          Firmware Rollout Freeze
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
            Datacenter
          </label>
          <select
            value={freeze_dc}
            onChange={(e) => set_freeze_dc(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text)',
              fontSize: '12px',
              boxSizing: 'border-box',
            }}
          >
            {datacenters.map((dc) => (
              <option key={dc} value={dc}>
                {dc}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
            Zone (optional)
          </label>
          <select
            value={freeze_zone}
            onChange={(e) => set_freeze_zone(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text)',
              fontSize: '12px',
              boxSizing: 'border-box',
            }}
          >
            <option value="">-- Entire Datacenter --</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
            Reason
          </label>
          <textarea
            placeholder="e.g., Regression in FW v1.4.0, awaiting hotfix..."
            value={freeze_reason}
            onChange={(e) => set_freeze_reason(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text)',
              fontSize: '12px',
              boxSizing: 'border-box',
              minHeight: '60px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          onClick={handle_freeze_fw}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'var(--color-warning)',
            color: 'var(--color-bg)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Freeze Firmware Rollout
        </button>

        {/* Firmware Freezes List */}
        {firmware_freezes.length > 0 && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
              Active Freezes ({firmware_freezes.length})
            </div>
            {firmware_freezes.map((freeze) => (
              <div
                key={freeze.freeze_id}
                style={{
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '8px',
                  fontSize: '11px',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                  {freeze.datacenter} {freeze.zone ? `/ ${freeze.zone}` : '(all zones)'}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Version {freeze.frozen_version}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{freeze.reason}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px', marginTop: '2px' }}>
                  {new Date(freeze.timestamp).toLocaleString()}
                </div>
                <button
                  onClick={() => onUnfreezeFirmware(freeze.freeze_id)}
                  style={{
                    marginTop: '6px',
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 193, 7, 0.5)',
                    borderRadius: '3px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Lift Freeze
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
