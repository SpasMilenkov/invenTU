import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'grid'
  | 'box'
  | 'warehouse'
  | 'truck'
  | 'bell'
  | 'cart'
  | 'chart'
  | 'user'
  | 'users'
  | 'search'
  | 'plus'
  | 'arrow'
  | 'arrow_down'
  | 'arrow_up'
  | 'filter'
  | 'x'
  | 'chev'
  | 'chev_down'
  | 'cube'
  | 'settings'
  | 'list'
  | 'inbox'
  | 'layers'
  | 'scan'
  | 'file'
  | 'check'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'logout'
  | 'edit'
  | 'trash'
  | 'sliders';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

const PATHS: Record<IconName, ReactElement> = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" />
      <rect x="13.5" y="3.5" width="7" height="7" />
      <rect x="3.5" y="13.5" width="7" height="7" />
      <rect x="13.5" y="13.5" width="7" height="7" />
    </>
  ),
  box: (
    <>
      <path d="M4 7.5 L12 4 L20 7.5 V16.5 L12 20 L4 16.5 Z" />
      <path d="M4 7.5 L12 11 L20 7.5" />
      <path d="M12 11 V20" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3 21 V9 L12 4 L21 9 V21" />
      <path d="M3 21 H21" />
      <rect x="8" y="13" width="8" height="8" />
      <path d="M12 13 V21" />
      <path d="M8 17 H16" />
    </>
  ),
  truck: (
    <>
      <rect x="2" y="7" width="11" height="9" />
      <path d="M13 10 H18 L21 13.5 V16 H13 Z" />
      <circle cx="6.5" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16 V11 a6 6 0 0 1 12 0 V16 L19.5 18 H4.5 Z" />
      <path d="M10 21 H14" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4 H6 L8 16 H19 L21 8 H7" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21 H21" />
      <path d="M5 17 V11" />
      <path d="M10 17 V7" />
      <path d="M15 17 V13" />
      <path d="M20 17 V9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 c1-5 5-7 8-7 s7 2 8 7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M2.5 20 c1-4 4-5.5 6.5-5.5 s5.5 1.5 6.5 5.5" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M15 20 c0-3 2-4.5 4-4.5 s2.5 1 2.5 1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16 L21 21" />
    </>
  ),
  plus: <path d="M12 5 V19 M5 12 H19" />,
  arrow: <path d="M5 12 H19 M14 7 L19 12 L14 17" />,
  arrow_down: <path d="M12 5 V19 M7 14 L12 19 L17 14" />,
  arrow_up: <path d="M12 19 V5 M7 10 L12 5 L17 10" />,
  filter: <path d="M3 5 H21 L14 13 V20 L10 18 V13 L3 5 Z" />,
  x: <path d="M6 6 L18 18 M18 6 L6 18" />,
  chev: <path d="M9 6 L15 12 L9 18" />,
  chev_down: <path d="M6 9 L12 15 L18 9" />,
  cube: (
    <>
      <path d="M12 3 L21 8 V16 L12 21 L3 16 V8 Z" />
      <path d="M3 8 L12 13 L21 8 M12 13 V21" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.5 5.5 L7.5 7.5 M16.5 16.5 L18.5 18.5 M5.5 18.5 L7.5 16.5 M16.5 7.5 L18.5 5.5" />
    </>
  ),
  list: <path d="M3 6 H21 M3 12 H21 M3 18 H21" />,
  inbox: (
    <>
      <path d="M3 13 H8 L9 16 H15 L16 13 H21" />
      <path d="M3 13 V20 H21 V13 L17 4 H7 Z" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 L21 8 L12 13 L3 8 Z" />
      <path d="M3 12 L12 17 L21 12" />
      <path d="M3 16 L12 21 L21 16" />
    </>
  ),
  scan: (
    <>
      <path d="M3 7 V4 H7 M17 4 H21 V7 M21 17 V20 H17 M7 20 H3 V17" />
      <path d="M7 9 V15 M10 9 V15 M13 9 V15 M16 9 V15" />
    </>
  ),
  file: (
    <>
      <path d="M6 3 H14 L19 8 V21 H6 Z" />
      <path d="M14 3 V8 H19" />
      <path d="M9 13 H16 M9 16 H16 M9 10 H12" />
    </>
  ),
  check: <path d="M5 12 L10 17 L20 7" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3 V5 M12 19 V21 M3 12 H5 M19 12 H21 M5.6 5.6 L7 7 M17 17 L18.4 18.4 M5.6 18.4 L7 17 M17 7 L18.4 5.6" />
    </>
  ),
  moon: <path d="M20.5 14.5 A8 8 0 1 1 9.5 3.5 a6 6 0 0 0 11 11 z" />,
  menu: <path d="M4 6 H20 M4 12 H20 M4 18 H20" />,
  logout: (
    <>
      <path d="M9 4 H5 V20 H9" />
      <path d="M14 8 L18 12 L14 16" />
      <path d="M18 12 H9" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20 H8 L20 8 L16 4 L4 16 V20 Z" />
      <path d="M14 6 L18 10" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7 H20" />
      <path d="M9 7 V4 H15 V7" />
      <path d="M6 7 L7 20 H17 L18 7" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7 H20" />
      <path d="M4 12 H20" />
      <path d="M4 17 H20" />
      <rect x="7" y="5" width="4" height="4" />
      <rect x="13" y="10" width="4" height="4" />
      <rect x="9" y="15" width="4" height="4" />
    </>
  ),
};

export function Icon({ name, size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      strokeLinejoin="miter"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

export default Icon;
