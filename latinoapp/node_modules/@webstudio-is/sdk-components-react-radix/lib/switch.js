import { jsx as f } from "react/jsx-runtime";
import { forwardRef as m, useState as n, useEffect as s } from "react";
import { Thumb as d, Root as u } from "@radix-ui/react-switch";
const C = m(({ defaultChecked: o, ...t }, r) => {
  const e = t.checked ?? o ?? !1, [h, c] = n(e);
  return s(() => c(e), [e]), /* @__PURE__ */ f(u, { ...t, ref: r, checked: h, onCheckedChange: c });
}), w = d;
export {
  C as Switch,
  w as SwitchThumb
};
