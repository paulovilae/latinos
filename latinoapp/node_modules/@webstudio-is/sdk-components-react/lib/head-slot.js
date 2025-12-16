import { jsx as n } from "react/jsx-runtime";
import { ReactSdkContext as s, getClosestInstance as r } from "@webstudio-is/react-sdk/runtime";
import { forwardRef as d, useContext as i } from "react";
import { XmlNode as c } from "./xml-node.js";
const f = "head", p = d(({ children: a, ...t }, o) => {
  const { renderer: e } = i(s);
  return e === void 0 ? a : t["data-ws-expand"] !== !0 ? null : /* @__PURE__ */ n(
    "div",
    {
      ref: o,
      style: {
        padding: "8px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1e3
      },
      ...t,
      children: /* @__PURE__ */ n(c, { tag: f, children: a })
    }
  );
});
p.displayName = "HeadSlot";
const u = {
  onNavigatorUnselect: (a, t) => {
    for (const o of t.instancePath)
      if (o.component === "HeadSlot") {
        const e = r(
          t.instancePath,
          o,
          "HeadSlot"
        );
        e && a.setMemoryProp(e, "data-ws-expand", void 0);
      }
  },
  onNavigatorSelect: (a, t) => {
    for (const o of t.instancePath)
      if (o.component === "HeadSlot") {
        const e = r(
          t.instancePath,
          o,
          "HeadSlot"
        );
        e && a.setMemoryProp(e, "data-ws-expand", !0);
      }
  }
};
export {
  p as HeadSlot,
  f as defaultTag,
  u as hooksHeadSlot
};
