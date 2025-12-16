import { jsx as r } from "react/jsx-runtime";
import * as i from "@radix-ui/react-tooltip";
import { getClosestInstance as p } from "@webstudio-is/react-sdk/runtime";
import { forwardRef as c, useState as l, useEffect as f, Children as d } from "react";
const T = c((n, e) => {
  const o = n.open ?? !1, [t, a] = l(o);
  return f(() => a(o), [o]), /* @__PURE__ */ r(i.Provider, { children: /* @__PURE__ */ r(i.Root, { ...n, open: t, onOpenChange: a }) });
}), C = c(({ children: n, ...e }, o) => {
  const t = d.toArray(n)[0];
  return /* @__PURE__ */ r(i.Trigger, { asChild: !0, ref: o, ...e, children: t ?? /* @__PURE__ */ r("button", { children: "Add button or link" }) });
}), P = c(({ sideOffset: n = 4, hideWhenDetached: e = !0, ...o }, t) => /* @__PURE__ */ r(i.Portal, { children: /* @__PURE__ */ r(
  i.Content,
  {
    ref: t,
    hideWhenDetached: e,
    sideOffset: n,
    ...o
  }
) })), s = "@webstudio-is/sdk-components-react-radix", g = {
  onNavigatorUnselect: (n, e) => {
    for (const o of e.instancePath)
      if (o.component === `${s}:TooltipContent`) {
        const t = p(
          e.instancePath,
          o,
          `${s}:Tooltip`
        );
        t && n.setMemoryProp(t, "open", void 0);
      }
  },
  onNavigatorSelect: (n, e) => {
    for (const o of e.instancePath)
      if (o.component === `${s}:TooltipContent`) {
        const t = p(
          e.instancePath,
          o,
          `${s}:Tooltip`
        );
        t && n.setMemoryProp(t, "open", !0);
      }
  }
};
export {
  T as Tooltip,
  P as TooltipContent,
  C as TooltipTrigger,
  g as hooksTooltip
};
