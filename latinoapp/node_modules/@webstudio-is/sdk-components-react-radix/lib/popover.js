import { jsx as r } from "react/jsx-runtime";
import { forwardRef as p, useState as f, useEffect as P, Children as l } from "react";
import * as s from "@radix-ui/react-popover";
import { getClosestInstance as a } from "@webstudio-is/react-sdk/runtime";
const h = p((t, n) => {
  const o = t.open ?? !1, [e, i] = f(o);
  return P(() => i(o), [o]), /* @__PURE__ */ r(s.Root, { ...t, open: e, onOpenChange: i });
}), u = p(({ children: t, ...n }, o) => {
  const e = l.toArray(t)[0];
  return /* @__PURE__ */ r(s.Trigger, { asChild: !0, ref: o, ...n, children: e ?? /* @__PURE__ */ r("button", { children: "Add button or link" }) });
}), C = p(
  ({ sideOffset: t = 4, align: n = "center", hideWhenDetached: o = !0, ...e }, i) => /* @__PURE__ */ r(s.Portal, { children: /* @__PURE__ */ r(
    s.Content,
    {
      ref: i,
      align: "center",
      sideOffset: t,
      hideWhenDetached: o,
      ...e
    }
  ) })
), g = s.Close, c = "@webstudio-is/sdk-components-react-radix", $ = {
  onNavigatorUnselect: (t, n) => {
    for (const o of n.instancePath)
      if (o.component === `${c}:PopoverContent`) {
        const e = a(
          n.instancePath,
          o,
          `${c}:Popover`
        );
        e && t.setMemoryProp(e, "open", void 0);
      }
  },
  onNavigatorSelect: (t, n) => {
    for (const o of n.instancePath)
      if (o.component === `${c}:PopoverContent`) {
        const e = a(
          n.instancePath,
          o,
          `${c}:Popover`
        );
        e && t.setMemoryProp(e, "open", !0);
      }
  }
};
export {
  h as Popover,
  g as PopoverClose,
  C as PopoverContent,
  u as PopoverTrigger,
  $ as hooksPopover
};
