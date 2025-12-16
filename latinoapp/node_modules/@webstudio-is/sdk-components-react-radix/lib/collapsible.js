import { jsx as l } from "react/jsx-runtime";
import { forwardRef as a, useState as c, useEffect as p, Children as f } from "react";
import { Content as C, Root as m, Trigger as b } from "@radix-ui/react-collapsible";
import { getClosestInstance as r } from "@webstudio-is/react-sdk/runtime";
const P = a((n, t) => {
  const o = n.open ?? !1, [e, i] = c(o);
  return p(() => i(o), [o]), /* @__PURE__ */ l(m, { ...n, ref: t, open: e, onOpenChange: i });
}), $ = a(({ children: n, ...t }, o) => {
  const e = f.toArray(n)[0];
  return /* @__PURE__ */ l(b, { asChild: !0, ref: o, ...t, children: e ?? /* @__PURE__ */ l("button", { children: "Add button" }) });
}), x = C, s = "@webstudio-is/sdk-components-react-radix", y = {
  onNavigatorSelect: (n, t) => {
    for (const o of t.instancePath)
      if (o.component === `${s}:CollapsibleContent`) {
        const e = r(
          t.instancePath,
          o,
          `${s}:Collapsible`
        );
        e && n.setMemoryProp(e, "open", !0);
      }
  },
  onNavigatorUnselect: (n, t) => {
    for (const o of t.instancePath)
      if (o.component === `${s}:CollapsibleContent`) {
        const e = r(
          t.instancePath,
          o,
          `${s}:Collapsible`
        );
        e && n.setMemoryProp(e, "open", void 0);
      }
  }
};
export {
  P as Collapsible,
  x as CollapsibleContent,
  $ as CollapsibleTrigger,
  y as hooksCollapsible
};
