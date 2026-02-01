import { FleetAnalytics, ServerNode } from '@/app/types';

interface AnalyticsProps {
  analytics: FleetAnalytics;
  fleet: ServerNode[];
}

export default function Analytics({ analytics, fleet }: AnalyticsProps) {
  const get_health_color = (score: number): string => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'critical';
  };

  const max_failures = Math.max(
    analytics.failure_distribution.THERMAL,
    analytics.failure_distribution.POWER,
    analytics.failure_distribution.MEMORY,
    analytics.failure_distribution.NETWORK,
    analytics.failure_distribution.FIRMWARE,
    1
  );

  return (
    <div className="table-container">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Fleet Size</div>
          <div className="kpi-value">{analytics.fleet_size.toLocaleString()}</div>
          <div className="kpi-subtext">Total nodes in fleet</div>
        </div>

        <div className={`kpi-card ${analytics.critical_nodes > 0 ? 'critical' : ''}`}>
          <div className="kpi-label">Critical Nodes</div>
          <div className="kpi-value">{analytics.critical_nodes}</div>
          <div className="kpi-subtext">
            {((analytics.critical_nodes / analytics.fleet_size) * 100).toFixed(2)}% of fleet
          </div>
        </div>

        <div className={`kpi-card ${analytics.degraded_nodes > 0 ? 'warning' : ''}`}>
          <div className="kpi-label">Degraded Nodes</div>
          <div className="kpi-value">{analytics.degraded_nodes}</div>
          <div className="kpi-subtext">
            {((analytics.degraded_nodes / analytics.fleet_size) * 100).toFixed(2)}% of fleet
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-label">Healthy Nodes</div>
          <div className="kpi-value">{analytics.healthy_nodes}</div>
          <div className="kpi-subtext">
            {((analytics.healthy_nodes / analytics.fleet_size) * 100).toFixed(2)}% of fleet
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">P95 CPU Temp</div>
          <div className="kpi-value">{analytics.p95_cpu_temp.toFixed(1)}°C</div>
          <div className="kpi-subtext">95th percentile</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">P95 Power Draw</div>
          <div className="kpi-value">{analytics.p95_power_draw.toFixed(0)}W</div>
          <div className="kpi-subtext">95th percentile</div>
        </div>

        <div className={`kpi-card ${get_health_color(analytics.avg_health_score)}`}>
          <div className="kpi-label">Avg Health Score</div>
          <div className="kpi-value">{analytics.avg_health_score.toFixed(0)}%</div>
          <div className="kpi-subtext">Fleet-wide average</div>
        </div>
      </div>

      {/* Failure Distribution */}
      <div className="failure-dist-container">
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Failure Class Distribution
          </h3>
        </div>
        <div className="failure-dist-grid">
          {[
            { key: 'THERMAL', label: 'Thermal', color: 'var(--color-warning)' },
            { key: 'POWER', label: 'Power', color: '#fca5a5' },
            { key: 'MEMORY', label: 'Memory', color: '#d8b4fe' },
            { key: 'NETWORK', label: 'Network', color: '#86efac' },
            { key: 'FIRMWARE', label: 'Firmware', color: '#93c5fd' },
            { key: 'NONE', label: 'None', color: 'var(--color-accent-primary)' },
          ].map(({ key, label, color }) => (
            <div key={key} className="failure-bar">
              <div className="failure-bar-title">{label}</div>
              <div className="failure-bar-chart">
                <div
                  style={{
                    flex: 1,
                    backgroundColor: color,
                    borderRadius: '4px',
                    opacity: 0.8,
                    height: `${((analytics.failure_distribution[key as keyof typeof analytics.failure_distribution] || 0) / max_failures) * 100}%`,
                    minHeight: '4px',
                  }}
                />
              </div>
              <div className="failure-bar-count">
                {analytics.failure_distribution[key as keyof typeof analytics.failure_distribution] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Status Summary */}
      <div style={{ padding: '16px 16px 40px 16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
          Fleet Status Summary
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              AVAILABLE CAPACITY
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                fontFamily: 'monospace',
              }}
            >
              {analytics.healthy_nodes + analytics.degraded_nodes}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              {(((analytics.healthy_nodes + analytics.degraded_nodes) / analytics.fleet_size) * 100).toFixed(1)}%
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              UNAVAILABLE CAPACITY
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--color-critical)',
                fontFamily: 'monospace',
              }}
            >
              {analytics.critical_nodes}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              {((analytics.critical_nodes / analytics.fleet_size) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
