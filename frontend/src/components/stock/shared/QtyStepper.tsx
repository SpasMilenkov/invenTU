interface QtyStepperProps {
  value: string;
  onChange: (next: string) => void;
  unit?: string;
  max?: number;
  hasError?: boolean;
  id?: string;
}

export default function QtyStepper({
  value,
  onChange,
  unit,
  max,
  hasError,
  id,
}: QtyStepperProps) {
  const v = parseInt(value, 10);
  const current = Number.isNaN(v) ? 0 : v;

  function bump(delta: number) {
    const next = Math.max(0, current + delta);
    onChange(String(next));
  }

  return (
    <div className={`qty-stepper${hasError ? " is-error" : ""}`}>
      <button
        type="button"
        className="qty-btn"
        onClick={() => bump(-10)}
        disabled={current === 0}
        aria-label="Decrease by ten"
      >
        −10
      </button>
      <button
        type="button"
        className="qty-btn"
        onClick={() => bump(-1)}
        disabled={current === 0}
        aria-label="Decrease by one"
      >
        −1
      </button>
      <input
        id={id}
        className="qty-input"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      />
      {unit && <span className="qty-unit">{unit}</span>}
      <button type="button" className="qty-btn" onClick={() => bump(1)} aria-label="Increase by one">
        +1
      </button>
      <button type="button" className="qty-btn" onClick={() => bump(10)} aria-label="Increase by ten">
        +10
      </button>
      {typeof max === "number" && max > 0 && (
        <button
          type="button"
          className="qty-btn qty-max"
          onClick={() => onChange(String(max))}
          aria-label={`Set to maximum, ${max}`}
        >
          MAX {max}
        </button>
      )}
    </div>
  );
}
