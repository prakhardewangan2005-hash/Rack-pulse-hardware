import { TimelineEvent } from '@/app/types';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  const get_icon = (type: string): string => {
    switch (type) {
      case 'TELEMETRY_REGEN':
        return '⟳';
      case 'VALIDATION_RUN':
        return '✓';
      case 'FLEET_TRANSITION':
        return '→';
      default:
        return '•';
    }
  };

  const sorted_events = [...events].reverse();

  return (
    <div className="timeline-container">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Event Timeline
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          System events and status changes ({events.length} events)
        </p>
      </div>

      {sorted_events.length > 0 ? (
        sorted_events.map((event) => (
          <div key={event.id} className="timeline-item">
            <div className={`timeline-marker ${event.type === 'VALIDATION_RUN' ? 'validation' : event.type === 'FLEET_TRANSITION' ? 'transition' : ''}`}>
              {get_icon(event.type)}
            </div>
            <div className="timeline-content">
              <div className="timeline-type">{event.type.replace(/_/g, ' ')}</div>
              <div className="timeline-description">{event.description}</div>
              <div className="timeline-time">{new Date(event.timestamp).toISOString().split('.')[0]}</div>
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            padding: '40px 16px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          No events recorded yet
        </div>
      )}
    </div>
  );
}
