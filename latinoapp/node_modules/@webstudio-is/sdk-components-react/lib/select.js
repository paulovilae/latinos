import { forwardRef as r, useContext as s, createElement as i } from "react";
import { ReactSdkContext as l } from "@webstudio-is/react-sdk/runtime";
const p = r(
  ({ value: o, defaultValue: n, ...e }, t) => {
    const { renderer: c } = s(l), a = c === "canvas" ? String(o ?? n) : void 0;
    return /* @__PURE__ */ i(
      "select",
      {
        ...e,
        key: a,
        defaultValue: o ?? n,
        ref: t
      }
    );
  }
);
p.displayName = "Select";
const S = {
  onNavigatorUnselect: (o, n) => {
    for (const e of n.instancePath)
      (e.component === "Select" || e.tag === "select") && o.setMemoryProp(e, "value", void 0);
  },
  onNavigatorSelect: (o, n) => {
    let e;
    for (const t of n.instancePath)
      (t.component === "Option" || t.tag === "option") && (e = o.getPropValue(t, "value")), (t.component === "Select" || t.tag === "select") && o.setMemoryProp(t, "value", e);
  }
};
export {
  p as Select,
  S as hooksSelect
};
