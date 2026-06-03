const statusConfig = {
  'Inbound Received': {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  'QC Approved': {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  'Processed/Melted': {
    bg: 'bg-accent-amber/20',
    text: 'text-accent-amber',
    border: 'border-accent-amber/30',
  },
  'Flagged - Pending Approval': {
    bg: 'bg-danger/20',
    text: 'text-danger',
    border: 'border-danger/30',
  },
  'Cleared for Settlement': {
    bg: 'bg-success/20',
    text: 'text-success',
    border: 'border-success/30',
  },
  'Merged into Remelt': {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} whitespace-nowrap`}
    >
      {status}
    </span>
  );
}
