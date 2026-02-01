import { ValidationRun } from '@/app/types';

interface ValidationResultsProps {
  validationRun: ValidationRun;
}

export default function ValidationResults({ validationRun }: ValidationResultsProps) {
  return (
    <div className="validation-results">
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            VALIDATION RUN ID
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
            {validationRun.run_id}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            OVERALL STATUS
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: validationRun.overall_status === 'PASS' ? 'var(--color-success)' : 'var(--color-critical)',
            }}
          >
            {validationRun.overall_status}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            TIMESTAMP
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
            {new Date(validationRun.timestamp).toISOString().split('.')[0]}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>CHECKS PASSED</div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--color-success)',
              fontFamily: 'monospace',
            }}
          >
            {validationRun.passed_checks}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>CHECKS FAILED</div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: validationRun.failed_checks > 0 ? 'var(--color-critical)' : 'var(--color-text-secondary)',
              fontFamily: 'monospace',
            }}
          >
            {validationRun.failed_checks}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>FLEET SIZE</div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              fontFamily: 'monospace',
            }}
          >
            {validationRun.fleet_size.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>CRITICAL NODES</div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: validationRun.critical_nodes > 0 ? 'var(--color-critical)' : 'var(--color-success)',
              fontFamily: 'monospace',
            }}
          >
            {validationRun.critical_nodes}
          </div>
        </div>
      </div>

      {/* Validation Checks */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
          Validation Checks
        </h3>

        {validationRun.checks.map((check, index) => (
          <div
            key={index}
            className={`check-result ${check.result.toLowerCase()}`}
            style={{ marginBottom: '12px' }}
          >
            <div className="check-info">
              <div className="check-name">{check.check_name}</div>
              <div className="check-description">{check.description}</div>
            </div>
            <div className={`check-status ${check.result.toLowerCase()}`}>
              {check.result}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '20px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
          Recommendations
        </div>

        {validationRun.failed_checks === 0 ? (
          <div style={{ color: 'var(--color-text-secondary)' }}>
            ✓ All validation checks passed. Fleet is operating within expected parameters. Continue monitoring telemetry and schedule routine maintenance as planned.
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <div style={{ marginBottom: '8px' }}>
              {validationRun.failed_checks} validation check(s) failed. Immediate action required:
            </div>
            <ul style={{ marginLeft: '20px', color: 'var(--color-text-secondary)' }}>
              {validationRun.checks
                .filter((c) => c.result === 'FAIL')
                .map((check, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    <strong>{check.check_name}:</strong> {check.failed_nodes} nodes affected. {check.description}
                  </li>
                ))}
            </ul>
            <div style={{ marginTop: '12px', fontStyle: 'italic' }}>
              Review affected nodes in the Fleet view, execute triage procedures, and re-run validation after remediation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
