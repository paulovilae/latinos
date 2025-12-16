const n = {
  sm: "0.875rem",
  lg: "1.125rem"
}, t = {
  sm: "1.25rem"
}, g = {
  none: "1",
  snug: "1.375"
}, s = {
  medium: "500"
}, c = {
  tight: "-0.025em"
}, m = {
  0: "0px",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
  px: "1px",
  "0.5": "0.125rem",
  "1.5": "0.375rem",
  "2.5": "0.625rem",
  "3.5": "0.875rem"
}, p = {
  ...m,
  full: "100%"
}, i = {
  ...m
}, b = {
  sm: "24rem",
  lg: "32rem"
}, x = {
  2: "2px",
  DEFAULT: "1px"
}, d = {
  sm: "0.125rem",
  md: "0.375rem",
  full: "9999px"
}, r = {
  popover: "rgb(255, 255, 255)",
  popoverForeground: "rgb(2, 8, 23)",
  border: "rgb(226, 232, 240)",
  background: "rgb(255, 255, 255)",
  foreground: "hsl(222.2 84% 4.9%)",
  ring: "rgb(148, 163, 184)",
  mutedForeground: "rgb(100, 116, 139)",
  muted: "hsl(210 40% 96.1%)",
  primary: "rgb(15, 23, 42)",
  primaryForeground: "hsl(210 40% 98%)",
  accent: "rgb(241, 245, 249)",
  accentForeground: "rgb(15, 23, 42)",
  input: "rgb(226, 232, 240)"
}, l = {
  all: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  transform: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)"
}, u = {
  50: "0.5",
  70: "0.7",
  100: "1"
}, o = {
  2: "2px"
}, e = {
  2: "2px"
}, a = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  // 0 0 0 ringOffsetWidth ringOffsetColor
  // 0 0 0 ringWidth + ringOffsetWidth ringColor
  ring: `0 0 0 ${e[2]} ${r.background}, 0 0 0 calc(${o[2]} + ${e[2]}) ${r.ring}`
}, h = {
  50: "50"
}, f = {
  sm: "blur(0 1px 2px 0 rgb(0 0 0 / 0.05))"
};
export {
  f as blur,
  d as borderRadius,
  x as borderWidth,
  a as boxShadow,
  r as colors,
  n as fontSize,
  t as fontSizeLineHeight,
  i as height,
  c as letterSpacing,
  g as lineHeight,
  b as maxWidth,
  u as opacity,
  m as spacing,
  l as transition,
  s as weights,
  p as width,
  h as zIndex
};
