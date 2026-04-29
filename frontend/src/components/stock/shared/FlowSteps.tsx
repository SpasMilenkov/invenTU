interface FlowStepsProps {
  steps: string[];
  current: number;
}

export default function FlowSteps({ steps, current }: FlowStepsProps) {
  return (
    <ol className="flow-steps">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={label} data-state={state}>
            <span className="flow-step-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="flow-step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
