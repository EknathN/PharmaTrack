type Status = string;

const CONFIGS: Record<string, { label: string; classes: string }> = {
  in_stock:           { label: 'In Stock',            classes: 'bg-blue-50 text-blue-700 border-blue-100' },
  in_transit:         { label: 'In Transit',          classes: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  awaiting_proof:     { label: 'Awaiting Proof',      classes: 'bg-amber-50 text-amber-700 border-amber-100' },
  received:           { label: 'Received',            classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  near_expiry:        { label: 'Near Expiry ⚠️',      classes: 'bg-red-50 text-red-700 border-red-100' },
  return_in_transit:  { label: 'Return In Transit',   classes: 'bg-purple-50 text-purple-700 border-purple-100' },
  disposal_in_transit:{ label: 'Disposal In Transit', classes: 'bg-orange-50 text-orange-700 border-orange-100' },
  fully_disposed:     { label: 'Fully Disposed ✓',    classes: 'bg-slate-50 text-slate-600 border-slate-200' },
  partially_in_transit:{ label: 'Partially In Transit',classes: 'bg-sky-50 text-sky-700 border-sky-100' },
  pending:            { label: 'Pending',             classes: 'bg-amber-50 text-amber-700 border-amber-100' },
  completed:          { label: 'Completed ✓',         classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  reserved_for_return:{ label: 'Reserved for Return', classes: 'bg-rose-50 text-rose-700 border-rose-100' },
  forward:            { label: 'Forward',             classes: 'bg-blue-50 text-blue-700 border-blue-100' },
  return:             { label: 'Return',              classes: 'bg-amber-50 text-amber-700 border-amber-100' },
  disposal:           { label: 'Disposal',            classes: 'bg-red-50 text-red-700 border-red-100' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = CONFIGS[status] || { label: status, classes: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  );
}
