export function calcFineMetal(lot) {
  if (lot.post_melt_weight && lot.actual_purity) {
    return (lot.post_melt_weight * lot.actual_purity) / 100;
  }
  return (lot.initial_weight * lot.expected_purity) / 100;
}

export function calcFineTroyOz(fineMetal) {
  return fineMetal / 31.1034768;
}

export function formatWeight(grams) {
  return grams ? grams.toFixed(2) : '—';
}

export function formatPurity(pct) {
  return pct ? pct.toFixed(2) + '%' : '—';
}

export function formatTroyOz(oz) {
  return oz ? oz.toFixed(4) : '—';
}
