import type { ReactNode } from "react";

type StockSub = "hub" | "receive" | "issue" | "transfer" | "adjustments";

interface Item {
  id: StockSub;
  href: string;
  label: string;
  desc: string;
  icon: ReactNode;
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d={d} />
    </svg>
  );
}

const ITEMS: Item[] = [
  {
    id: "hub",
    href: "/stock",
    label: "Hub",
    desc: "Overview",
    icon: <Icon d="M3 3 H10 V10 H3 Z M14 3 H21 V10 H14 Z M3 14 H10 V21 H3 Z M14 14 H21 V21 H14 Z" />,
  },
  {
    id: "receive",
    href: "/stock/receive",
    label: "Receive",
    desc: "Inbound goods",
    icon: <Icon d="M3 13 H8 L9 16 H15 L16 13 H21 M3 13 V20 H21 V13 L17 4 H7 Z" />,
  },
  {
    id: "issue",
    href: "/stock/issue",
    label: "Issue / Pick",
    desc: "Outbound for orders",
    icon: <Icon d="M5 12 H19 M14 7 L19 12 L14 17" />,
  },
  {
    id: "transfer",
    href: "/stock/transfer",
    label: "Transfer",
    desc: "Move between bins",
    icon: <Icon d="M12 3 L21 8 L12 13 L3 8 Z M3 12 L12 17 L21 12 M3 16 L12 21 L21 16" />,
  },
  {
    id: "adjustments",
    href: "/stock/adjustments",
    label: "Adjust",
    desc: "Cycle-count fix",
    icon: <Icon d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.5 5.5 L7.5 7.5 M16.5 16.5 L18.5 18.5 M5.5 18.5 L7.5 16.5 M16.5 7.5 L18.5 5.5" />,
  },
];

export default function StockSubNav({ active }: { active: StockSub }) {
  return (
    <nav className="stock-subnav" aria-label="Stock operations">
      {ITEMS.map((it) => (
        <a
          key={it.id}
          href={it.href}
          className="stock-subnav-item"
          data-active={active === it.id}
          aria-current={active === it.id ? "page" : undefined}
        >
          {it.icon}
          <span className="stock-subnav-label">{it.label}</span>
          <span className="stock-subnav-desc">{it.desc}</span>
        </a>
      ))}
    </nav>
  );
}
