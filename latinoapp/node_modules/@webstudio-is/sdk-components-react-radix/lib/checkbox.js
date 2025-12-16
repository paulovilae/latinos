import { jsx as f } from "react/jsx-runtime";
import { forwardRef as h, useState as s, useEffect as k } from "react";
import { Indicator as a, Root as m } from "@radix-ui/react-checkbox";
const x = h(({ defaultChecked: c, ...o }, r) => {
  const e = o.checked ?? c ?? !1, [n, t] = s(e);
  return k(() => t(e), [e]), /* @__PURE__ */ f(
    m,
    {
      ...o,
      ref: r,
      checked: n,
      onCheckedChange: (d) => t(d === !0)
    }
  );
}), b = a;
export {
  x as Checkbox,
  b as CheckboxIndicator
};
