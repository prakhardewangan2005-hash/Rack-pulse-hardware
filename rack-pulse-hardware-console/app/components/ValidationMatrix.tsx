'use client';

import { ValidationCheck } from '@/app/types';

interface ValidationMatrixProps {
  checks: ValidationCheck[];
}

export default function ValidationMatrix({ checks }: ValidationMatrixProps) {
  return (
    <div className="table-container">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Hardware Validation Matrix</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
          Explicit hardware test plans with lifecycle-aware thresholds. Validation standards vary by lifecycle phase 
          (BRING_UP, BURN_IN, PRODUCTION) to account for hardware burn-in and stabilization requirements.
        </p>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Test Plan</th>
            <th>Status</th>
            <th>Threshold</th>
            <th>Failed Nodes</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check, idx) => (
            <tr key={idx}>
              <td>
                <div style={{ fontWeight: 500 }}>{check.check_name}</div>
              </td>
              <td>
                <span className={`status-badge ${check.result === 'PASS' ? 'healthy' : 'critical'}`}>
                  {check.result}
                </span>
              </td>
              <td>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {check.threshold}
                </div>
              </td>
              <td>
                <div style={{
                  fontWeight: 500,
                  color: check.failed_nodes > 0 ? 'var(--color-critical)' : 'var(--color-text-secondary)'
                }}>
                  {check.failed_nodes}
                </div>
              </td>
              <td>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {check.description}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: 'rgba(0, 217, 255, 0.08)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.6
      }}>
        <strong>Lifecycle Phase Thresholds:</strong>
        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
          <li><strong>BRING_UP:</strong> Relaxed thresholds for initial hardware qualification and stress testing</li>
          <li><strong>BURN_IN:</strong> Moderate thresholds during extended thermal cycling and stability testing</li>
          <li><strong>PRODUCTION:</strong> Strict thresholds for production deployment requiring maximum stability</li>
        </ul>
      </div>
    </div>
  );
}
