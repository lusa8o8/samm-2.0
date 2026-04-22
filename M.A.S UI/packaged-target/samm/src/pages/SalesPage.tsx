import { useState, useEffect } from 'react';
import { TrendingUp, Package, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { StatusChip } from '../components/shared/StatusChip';
import { useInspector } from '../components/shell/WorkspaceShell';
import { getSalesSequences, getOfferDecisions } from '../services/mockService';
import type { SalesSequence, OfferDecision } from '../types';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'sequences', label: 'Sequences', icon: TrendingUp },
  { id: 'offers', label: 'Offers', icon: Package },
];

function SequenceCard({ sequence, onInspect }: { sequence: SalesSequence; onInspect: (s: SalesSequence) => void }) {
  const completionPct = (sequence.currentStep / sequence.totalSteps) * 100;

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 space-y-3 cursor-pointer hover:shadow-sm transition-all"
      onClick={() => onInspect(sequence)}
      data-testid={`sequence-${sequence.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{sequence.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Target: {sequence.targetSegment}</p>
        </div>
        <StatusChip status={sequence.status as never} showDot />
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${completionPct}%` }} />
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">Step {sequence.currentStep}/{sequence.totalSteps}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Enrolled', value: sequence.enrolled, color: 'text-blue-600' },
          { label: 'Converted', value: sequence.converted, color: 'text-emerald-600' },
          { label: 'Stopped', value: sequence.stopped, color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-muted/40 rounded-lg p-2.5 text-center">
            <p className={cn('text-base font-bold', stat.color)}>{stat.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">Conversion rate</span>
        <span className={cn('font-bold', sequence.conversionRate >= 15 ? 'text-emerald-600' : 'text-foreground')}>
          {sequence.conversionRate}%
        </span>
      </div>

      {sequence.offerAssociation && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Package size={11} />
          {sequence.offerAssociation}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">Last activity: {format(new Date(sequence.lastActivity), 'MMM d, HH:mm')}</p>
    </div>
  );
}

function OfferCard({ offer }: { offer: OfferDecision }) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-border last:border-0" data-testid={`offer-${offer.id}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{offer.contactName}</p>
          <StatusChip status={offer.decision as never} />
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5">{offer.offerName}</p>
        {offer.discountApplied && (
          <p className="text-[11px] text-emerald-600 font-medium mt-1">{offer.discountApplied}% discount applied</p>
        )}
        {offer.reason && (
          <p className="text-[11px] text-muted-foreground mt-1 italic">{offer.reason}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(offer.decidedAt), 'MMM d, HH:mm')}</p>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sequences, setSequences] = useState<SalesSequence[]>([]);
  const [offers, setOffers] = useState<OfferDecision[]>([]);
  const [activeTab, setActiveTab] = useState('sequences');
  const { openInspector } = useInspector();

  useEffect(() => {
    getSalesSequences().then(setSequences);
    getOfferDecisions().then(setOffers);
  }, []);

  const handleInspectSequence = (seq: SalesSequence) => {
    openInspector(seq.name, {
      type: 'sequence_status_panel',
      title: seq.name,
      data: [seq],
    });
  };

  const totalEnrolled = sequences.reduce((s, q) => s + q.enrolled, 0);
  const totalConverted = sequences.reduce((s, q) => s + q.converted, 0);
  const avgConversion = sequences.length > 0
    ? (sequences.reduce((s, q) => s + q.conversionRate, 0) / sequences.length).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Sales</h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">NEW</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Sequences, offers, and conversion tracking</p>

        <div className="flex gap-1 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              data-testid={`sales-tab-${tab.id}`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'sequences' && (
        <>
          {/* Summary bar */}
          <div className="px-6 py-3 border-b border-border bg-muted/20 flex items-center gap-6">
            {[
              { label: 'Total enrolled', value: totalEnrolled },
              { label: 'Total converted', value: totalConverted },
              { label: 'Avg conversion rate', value: `${avgConversion}%` },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {sequences.map(seq => (
                <SequenceCard key={seq.id} sequence={seq} onInspect={handleInspectSequence} />
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'offers' && (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {offers.map(offer => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
