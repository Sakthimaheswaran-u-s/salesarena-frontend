import { ArrowDownRight, ArrowUpRight, Crown, Minus, Search, X } from 'lucide-react';
import { fmtNum, fmtSigned, initials } from '../../utils/format';

/* ---------- Layout primitives ---------- */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function SectionLabel({ children, aside }) {
  return (
    <div className="section-label">
      <h2>{children}</h2>
      {aside}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = '', flush = false, footer, style }) {
  return (
    <section className={`card ${className}`} style={style}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`card-body${flush ? ' flush' : ''}`}>{children}</div>
      {footer && <div className="card-foot">{footer}</div>}
    </section>
  );
}

/* ---------- Stat tile ---------- */
export function StatTile({ label, value, sub, icon: Icon, tone = 'primary', delta, deltaSuffix = 'vs yesterday', invert = false, points }) {
  return (
    <div className="tile">
      <div style={{ minWidth: 0 }}>
        <div className="tile-label">{label}</div>
        <div className="tile-value">{value}</div>
        {(delta !== undefined || sub || points !== undefined) && (
          <div className="tile-sub">
            {points !== undefined && <PointsChip value={points} />}
            {delta !== undefined && <DeltaChip delta={delta} invert={invert} suffix={deltaSuffix} />}
            {sub && <span>{sub}</span>}
          </div>
        )}
      </div>
      {Icon && (
        <div className={`tile-icon ${tone}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}

/** Delta chip. `invert` = a decrease is good (e.g. dropped leads). */
export function DeltaChip({ delta, invert = false, suffix }) {
  if (delta === null || delta === undefined) return null;
  const positive = delta > 0;
  const flat = delta === 0;
  const good = flat ? null : invert ? !positive : positive;
  const cls = flat ? 'chip-neutral' : good ? 'chip-good' : 'chip-bad';
  const Icon = flat ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`chip ${cls}`} title={suffix}>
      <Icon size={12} />
      {flat ? '0' : fmtSigned(delta)}
      {suffix && <span style={{ fontWeight: 500, opacity: 0.8 }}> {suffix}</span>}
    </span>
  );
}

/** Points chip with clear +/− polarity. */
export function PointsChip({ value, size = '' }) {
  const cls = value > 0 ? 'chip-good' : value < 0 ? 'chip-bad' : 'chip-neutral';
  return (
    <span className={`chip ${cls} ${size}`}>
      {value > 0 ? '+' : value < 0 ? '−' : ''}
      {fmtNum(Math.abs(value))} pts
    </span>
  );
}

export function TrendPill({ change }) {
  if (change === null || change === undefined) return <span className="trend flat">—</span>;
  if (change === 0)
    return (
      <span className="trend flat">
        <Minus size={12} /> 0
      </span>
    );
  const up = change > 0;
  return (
    <span className={`trend ${up ? 'up' : 'down'}`}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(change)}
    </span>
  );
}

/* ---------- Identity ---------- */
const AVATAR_HUES = ['#2a78d6', '#1baf7a', '#4a3aa7', '#eb6834', '#e87ba4', '#0f8f8f', '#c2782f', '#6b5bd6'];
function hueFor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}

export function Avatar({ name, id, size = 36, ring = false }) {
  return (
    <span
      className={`avatar${ring ? ' avatar-ring' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), background: hueFor(id || name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Person({ name, id, meta, size = 36, isMe = false }) {
  return (
    <div className="person">
      <Avatar name={name} id={id} size={size} ring={isMe} />
      <div style={{ minWidth: 0 }}>
        <div className="person-name">
          {name}
          {isMe && <span className="you-tag">YOU</span>}
        </div>
        {meta && <div className="person-meta">{meta}</div>}
      </div>
    </div>
  );
}

export function RankBadge({ rank, isMe = false }) {
  const cls = rank <= 3 ? ` rank-${rank}` : '';
  return (
    <span className={`rank${cls}${isMe ? ' rank-me' : ''}`} title={`Rank ${rank}`}>
      {rank === 1 ? <Crown size={15} /> : rank}
    </span>
  );
}

/* ---------- Controls ---------- */
export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.key}
          role="tab"
          aria-selected={value === o.key}
          className={value === o.key ? 'active' : ''}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search', autoFocus = false, style }) {
  return (
    <div className="input-wrap" style={style}>
      <Search size={16} />
      <input
        className="input"
        type="search"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {value && (
        <button className="clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function ProgressBar({ value, max, onHero = false }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`progress${onHero ? ' on-hero' : ''}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="empty">
      {Icon && <Icon size={28} />}
      <strong>{title}</strong>
      {hint && <span className="small">{hint}</span>}
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%', style }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} />;
}
