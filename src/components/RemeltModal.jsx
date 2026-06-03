import { useState, useMemo } from 'react';
import { useLots } from '../context/LotsContext';
import { calcFineMetal, formatWeight } from '../utils/calculations';

export default function RemeltModal({ onClose, onSuccess }) {
  const { clearedLots, suppliers } = useLots();
  const [targetPurity, setTargetPurity] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  const getSupplierName = (id) => {
    const s = suppliers.find((s) => s.id === id);
    return s ? s.name : 'Unknown';
  };

  const toggleLot = (lotId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lotId)) {
        next.delete(lotId);
      } else {
        next.add(lotId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === clearedLots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clearedLots.map((l) => l.lot_id)));
    }
  };

  const summary = useMemo(() => {
    const selected = clearedLots.filter((l) => selectedIds.has(l.lot_id));
    const totalWeight = selected.reduce((sum, l) => sum + (l.post_melt_weight || l.initial_weight), 0);
    const totalFineMetal = selected.reduce((sum, l) => sum + calcFineMetal(l), 0);
    return { count: selected.length, totalWeight, totalFineMetal };
  }, [clearedLots, selectedIds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.size === 0 || !targetPurity) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/lots/remelt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_purity: parseFloat(targetPurity),
          lot_ids: Array.from(selectedIds),
        }),
      });

      if (!res.ok) throw new Error('Failed to create remelt batch');
      onSuccess(`Remelt batch created with ${summary.count} lots!`);
      onClose();
    } catch (err) {
      console.error('Remelt error:', err);
      alert('Failed to create remelt batch. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-elevated border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              </svg>
              Create Remelt Batch
            </h2>
            <p className="text-text-muted text-sm mt-1">Combine cleared lots for remelting</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
            {/* Target Purity */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Target Purity (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={targetPurity}
                onChange={(e) => setTargetPurity(e.target.value)}
                placeholder="e.g. 99.9"
                className="w-full min-h-[44px] text-lg font-mono bg-bg-surface border border-border rounded-xl px-4 py-2 text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus"
                required
              />
            </div>

            {/* Lot Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-text-primary">
                  Select Lots ({clearedLots.length} available)
                </label>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-accent-gold hover:text-accent-gold-light font-medium"
                >
                  {selectedIds.size === clearedLots.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {clearedLots.length === 0 ? (
                <div className="bg-bg-surface border border-border rounded-xl p-6 text-center text-text-muted">
                  No lots cleared for settlement.
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {clearedLots.map((lot) => {
                    const fineMetal = calcFineMetal(lot);
                    const isSelected = selectedIds.has(lot.lot_id);
                    return (
                      <label
                        key={lot.id}
                        className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-accent-gold/10 border-accent-gold/30'
                            : 'bg-bg-surface border-border hover:border-bg-hover'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLot(lot.lot_id)}
                          className="w-5 h-5 rounded accent-accent-gold"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-text-primary">{lot.lot_id}</span>
                            <span className="text-text-muted text-sm">·</span>
                            <span className="text-text-secondary text-sm truncate">{getSupplierName(lot.supplier_id)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-text-muted mt-0.5">
                            <span className="font-mono">{formatWeight(lot.post_melt_weight || lot.initial_weight)}g</span>
                            <span>Fine: <span className="text-accent-gold font-mono">{formatWeight(fineMetal)}g</span></span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Summary */}
          <div className="px-6 py-4 border-t border-border bg-bg-surface/50">
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center gap-4">
                <span className="text-text-muted">
                  Selected: <span className="text-text-primary font-semibold">{summary.count}</span>
                </span>
                <span className="text-text-muted">
                  Weight: <span className="font-mono text-text-primary font-semibold">{formatWeight(summary.totalWeight)}g</span>
                </span>
                <span className="text-text-muted">
                  Fine Metal: <span className="font-mono text-accent-gold font-semibold">{formatWeight(summary.totalFineMetal)}g</span>
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-semibold hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedIds.size === 0 || !targetPurity}
                className="flex-1 py-3 rounded-xl bg-accent-gold text-bg-primary font-bold hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating…' : `Create Remelt Batch (${summary.count})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
