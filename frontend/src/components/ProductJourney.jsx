import React from 'react';
import { Factory, Truck, Store, User } from 'lucide-react';

const STAGES = [
  { id: 0, label: 'Manufacturer', icon: Factory },
  { id: 1, label: 'Distributor', icon: Truck },
  { id: 2, label: 'Retailer', icon: Store },
  { id: 3, label: 'Consumer', icon: User },
];

const ProductJourney = ({ currentStage = 0, checkpoints = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div style={{ background: 'rgba(30,30,32,0.92)', border: '1px solid #2E2E2A', borderRadius: '10px', padding: '16px', backdropFilter: 'blur(4px)', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts) return 'Unknown date';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ background: 'rgba(30,30,32,0.92)', border: '1px solid #2E2E2A', borderRadius: '10px', padding: '16px', backdropFilter: 'blur(4px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#EDEADE' }}>Product journey</div>
        <div style={{ background: '#1A2820', color: '#5A9A70', border: '1px solid #28402E', borderRadius: '20px', fontSize: '10px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '5px', height: '5px', background: '#5A9A70', borderRadius: '50%' }} />
          On-chain verified
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', marginBottom: '32px' }}>
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentStage;
          const isCurrent = index === currentStage;
          const Icon = stage.icon;

          return (
            <div key={stage.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* Connector line */}
              {index < STAGES.length - 1 && (
                <div style={{ position: 'absolute', top: '20px', left: '60%', width: '80%', height: '1px', background: isCompleted ? '#3A6A5A' : '#2E2E2A', zIndex: 0 }} />
              )}
              
              {/* Icon Box */}
              <div style={{ position: 'relative', zIndex: 1, width: '40px', height: '40px', borderRadius: '10px', background: (isCompleted || isCurrent) ? '#2A3A32' : '#222225', border: `1px solid ${(isCompleted || isCurrent) ? '#3A6A5A' : '#2E2E2A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                <Icon size={18} color={(isCompleted || isCurrent) ? '#5A9A72' : '#4A4A40'} />
                
                {/* Checkmark overlay */}
                {isCompleted && (
                  <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', borderRadius: '50%', background: '#5A9A70', border: '2px solid #18181A' }} />
                )}
              </div>

              <div style={{ fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', color: (isCompleted || isCurrent) ? '#5A9A70' : '#5A5A50', marginBottom: '6px', textAlign: 'center' }}>
                {stage.label}
              </div>

              <div style={{ 
                background: isCompleted ? '#1A2820' : '#222225', 
                color: isCompleted ? '#5A9A70' : '#5A5A50', 
                border: `1px solid ${isCompleted ? '#28402E' : '#2E2E2A'}`, 
                fontSize: '9px', padding: '2px 7px', borderRadius: '3px' 
              }}>
                {isCompleted ? 'Verified' : (isCurrent ? 'Current' : 'Pending')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div>
        <div style={{ fontSize: '11px', color: '#4A4A40', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '14px 0 10px' }}>
          Chain events
        </div>

        <div>
          {checkpoints && checkpoints.length > 0 ? checkpoints.map((cp, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', background: '#4A8A6A', borderRadius: '50%', flexShrink: 0, marginTop: '8px' }} />
                {idx !== checkpoints.length - 1 && (
                  <div style={{ width: '1px', background: '#252525', flex: 1, margin: '4px 0' }} />
                )}
              </div>

              <div style={{ flex: 1, background: '#1E1E20', border: '1px solid #252525', borderRadius: '7px', padding: '9px 12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#EDEADE' }}>{cp.stage || cp.rawStage || 'Event Recorded'}</div>
                  <div style={{ background: '#1A2820', color: '#5A9A70', border: '1px solid #28402E', fontSize: '9px', padding: '2px 7px', borderRadius: '3px' }}>Verified</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#7A7A6A' }}>
                    {cp.handlerName || cp.actorName || truncateAddress(cp.handler)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#5A5A50' }}>
                    {formatTime(cp.timestamp)}
                  </div>
                  {cp.transactionHash && (
                    <div style={{ fontFamily: 'monospace', color: '#5A8A7A', fontSize: '10px', marginTop: '4px' }}>
                      tx: {cp.transactionHash}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ fontSize: '12px', color: '#5A5A50', fontStyle: 'italic' }}>No on-chain events recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

function truncateAddress(address) {
  if (!address) return 'Unknown Actor';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default ProductJourney;
