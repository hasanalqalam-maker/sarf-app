interface Props {
  pct: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function CircularProgress({ pct, size = 88, strokeWidth = 6, label }: Props) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size} height={size}
          style={{ transform: 'rotate(-90deg)' }}
          className="absolute inset-0"
        >
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-parchment-darker" />
          <circle
            cx={cx} cy={cx} r={r}
            fill="none" stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-teal transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-ink" style={{ fontSize: size * 0.22 }}>{pct}%</span>
        </div>
      </div>
      {label && <p className="text-xs font-sans text-ink-muted text-center">{label}</p>}
    </div>
  );
}
