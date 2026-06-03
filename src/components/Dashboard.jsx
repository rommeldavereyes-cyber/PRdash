import { useState, useMemo } from 'react';
import { useLots } from '../context/LotsContext';
import { calcFineMetal, calcFineTroyOz, formatWeight, formatPurity, formatTroyOz } from '../utils/calculations';
import StatusBadge from './ui/StatusBadge';
import SuccessToast from './ui/SuccessToast';
import RemeltModal from './RemeltModal';

const ALL_STATUSES = [
  'All',
  'Inbound Received',
  'QC Approved',
  'Processed/Melted',
  'Flagged - Pending Approval',
  'Cleared for Settlement',
  'Merged into Remelt',
];

const statusBorderColors = {
  'Inbound Received': 'border-l-blue-500',
  'QC Approved': 'border-l-purple-500',
  'Processed/Melted': 'border-l-accent-amber',
  'Flagged - Pending Approval': 'border-l-danger',
  'Cleared for Settlement': 'border-l-success',
  'Merged into Remelt': 'border-l-slate-500',
};

export default function Dashboard() {
  const { lots, suppliers, loading, fetchLots } = useLots();
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState({ show: false, message: '' });
  const [showRemelt, setShowRemelt] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const getSupplierName = (id) => {
    const s = suppliers.find((s) => s.id === id);
    return s ? s.name : 'Unknown';
  };

  const filteredLots = useMemo(() => {
    if (filter === 'All') return lots;
    return lots.filter((lot) => lot.status === filter);
  }, [lots, filter]);

  const statusCounts = useMemo(() => {
    const counts = {};
    ALL_STATUSES.forEach((s) => {
      if (s === 'All') {
        counts[s] = lots.length;
      } else {
        counts[s] = lots.filter((l) => l.status === s).length;
      }
    });
    return counts;
  }, [lots]);

  const handleAction = async (lotId, updates, successMessage) => {
    setActionLoading(lotId);
    try {
      const res = await fetch(`/api/lots/${lotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update lot');
      setToast({ show: true, message: successMessage });
      fetchLots();
    } catch (err) {
      console.error('Action error:', err);
      alert('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { label: 'Total Lots', value: statusCounts['All'], color: 'from-accent-gold/10 to-transparent', accent: 'text-accent-gold' },
    { label: 'Inbound', value: statusCounts['Inbound Received'], color: 'from-blue-500/10 to-transparent', accent: 'text-blue-400' },
    { label: 'QC Approved', value: statusCounts['QC Approved'], color: 'from-purple-500/10 to-transparent', accent: 'text-purple-400' },
    { label: 'Processed', value: statusCounts['Processed/Melted'], color: 'from-amber-500/10 to-transparent', accent: 'text-accent-amber' },
    { label: 'Flagged', value: statusCounts['Flagged - Pending Approval'], color: 'from-red-500/10 to-transparent', accent: 'text-danger' },
    { label: 'Cleared', value: statusCounts['Cleared for Settlement'], color: 'from-green-500/10 to-transparent', accent: 'text-success' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <SuccessToast
        message={toast.message}
        show={toast.show}
        onClose={() => setToast({ show: false, message: '' })}
      />

      {showRemelt && (
        <RemeltModal
          onClose={() => setShowRemelt(false)}
          onSuccess={(msg) => {
            setToast({ show: true, message: msg });
            fetchLots();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">QC & Settlement Dashboard</h1>
          <p className="text-text-secondary mt-1">Monitor and manage all refinery lots</p>
        </div>
        <button
          onClick={() => setShowRemelt(true)}
          className="hidden md:flex items-center gap-2 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold hover:bg-accent-gold/20 px-5 py-3 rounded-xl font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
          </svg>
          Create Remelt Batch
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} bg-bg-surface border border-border rounded-xl p-4`}
          >
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${card.accent}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Mobile Remelt Button */}
      <button
        onClick={() => setShowRemelt(true)}
        className="md:hidden w-full mb-4 flex items-center justify-center gap-2 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold hover:bg-accent-gold/20 px-5 py-3 rounded-xl font-semibold transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        </svg>
        Create Remelt Batch
      </button>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'
                : 'bg-bg-surface text-text-secondary border border-border hover:border-bg-hover'
            }`}
          >
            {status === 'All' ? 'All' : status}
            <span className="ml-2 text-xs opacity-70">({statusCounts[status]})</span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/50">
                <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Lot ID</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Supplier</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Type</th>
                <th className="text-right px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Initial Wt.</th>
                <th className="text-right px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Post-Melt Wt.</th>
                <th className="text-right px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Purity</th>
                <th className="text-right px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Fine Metal</th>
                <th className="text-right px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Troy Oz</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-text-muted">
                    <svg className="animate-spin w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading lots…
                  </td>
                </tr>
              ) : filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-text-muted">
                    No lots found.
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => {
                  const fineMetal = calcFineMetal(lot);
                  const troyOz = calcFineTroyOz(fineMetal);
                  const purityDrop =
                    lot.actual_purity && lot.expected_purity
                      ? lot.expected_purity - lot.actual_purity
                      : 0;
                  const isWarning = lot.status === 'Processed/Melted' && purityDrop > 5;
                  const borderColor = statusBorderColors[lot.status] || 'border-l-slate-500';

                  return (
                    <tr
                      key={lot.id}
                      className={`border-b border-border/50 hover:bg-bg-hover/50 transition-colors border-l-4 ${borderColor} ${
                        isWarning ? 'bg-warning/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-text-primary">{lot.lot_id}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lot.status} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{lot.supplier_name || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{lot.material_type}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">{formatWeight(lot.initial_weight)}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">{formatWeight(lot.post_melt_weight)}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">
                        <span>{formatPurity(lot.expected_purity)}</span>
                        {lot.actual_purity && (
                          <>
                            <span className="text-text-muted mx-1">→</span>
                            <span className={isWarning ? 'text-warning font-semibold' : 'text-text-primary'}>
                              {formatPurity(lot.actual_purity)}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-accent-gold font-semibold">
                        {formatWeight(fineMetal)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatTroyOz(troyOz)}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                        {lot.created_at ? new Date(lot.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {lot.status === 'Inbound Received' && (
                            <button
                              onClick={() => handleAction(lot.id, { status: 'QC Approved' }, `${lot.lot_id} approved for QC!`)}
                              disabled={actionLoading === lot.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25 transition-colors disabled:opacity-50"
                            >
                              Approve QC
                            </button>
                          )}
                          {lot.status === 'Processed/Melted' && (
                            <>
                              <button
                                onClick={() => handleAction(lot.id, { status: 'Cleared for Settlement' }, `${lot.lot_id} cleared for settlement!`)}
                                disabled={actionLoading === lot.id}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-success/15 text-success border border-success/30 hover:bg-success/25 transition-colors disabled:opacity-50"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => handleAction(lot.id, { status: 'Flagged - Pending Approval' }, `${lot.lot_id} flagged for review.`)}
                                disabled={actionLoading === lot.id}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 transition-colors disabled:opacity-50"
                              >
                                Flag
                              </button>
                            </>
                          )}
                          {lot.status === 'Flagged - Pending Approval' && (
                            <>
                              <button
                                onClick={() => handleAction(lot.id, { status: 'Cleared for Settlement' }, `${lot.lot_id} cleared!`)}
                                disabled={actionLoading === lot.id}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-success/15 text-success border border-success/30 hover:bg-success/25 transition-colors disabled:opacity-50"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => handleAction(lot.id, { status: 'Inbound Received' }, `${lot.lot_id} rejected, sent back to inbound.`)}
                                disabled={actionLoading === lot.id}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-500/15 text-slate-400 border border-slate-500/30 hover:bg-slate-500/25 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}
