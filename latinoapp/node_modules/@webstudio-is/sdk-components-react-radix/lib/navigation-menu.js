import { jsx as r } from "react/jsx-runtime";
import { forwardRef as c, useContext as v, Children as g } from "react";
import * as a from "@radix-ui/react-navigation-menu";
import { getIndexWithinAncestorFromProps as l } from "@webstudio-is/sdk/runtime";
import { ReactSdkContext as f, getClosestInstance as d } from "@webstudio-is/react-sdk/runtime";
const C = c(({ value: o, ...n }, e) => {
  const { renderer: t } = v(f);
  let i = o;
  return t === "canvas" && (i = i === "" ? "-1" : i), /* @__PURE__ */ r(a.Root, { ref: e, value: i, ...n });
}), P = a.List, k = a.Viewport, x = a.Content, A = c(({ value: o, ...n }, e) => {
  const t = l(n);
  return /* @__PURE__ */ r(a.Item, { ref: e, value: o ?? t, ...n });
}), I = c(({ children: o, ...n }, e) => {
  const t = g.toArray(o)[0];
  return /* @__PURE__ */ r(a.Link, { asChild: !0, ref: e, ...n, children: t ?? /* @__PURE__ */ r("a", { children: "Add link component" }) });
}), $ = c(({ children: o, ...n }, e) => {
  const t = g.toArray(o)[0];
  return /* @__PURE__ */ r(a.Trigger, { asChild: !0, ref: e, ...n, children: t ?? /* @__PURE__ */ r("button", { children: "Add button or link" }) });
}), s = "@webstudio-is/sdk-components-react-radix", w = {
  onNavigatorUnselect: (o, n) => {
    for (const e of n.instancePath)
      if (e.component === `${s}:NavigationMenuContent`) {
        const t = d(
          n.instancePath,
          e,
          `${s}:NavigationMenu`
        );
        t && o.setMemoryProp(t, "value", void 0);
      }
  },
  onNavigatorSelect: (o, n) => {
    var e;
    for (const t of n.instancePath)
      if (t.component === `${s}:NavigationMenuContent`) {
        const i = d(
          n.instancePath,
          t,
          `${s}:NavigationMenu`
        ), u = d(
          n.instancePath,
          t,
          `${s}:NavigationMenuItem`
        );
        if (u === void 0 || i === void 0)
          return;
        const m = o.getPropValue(u, "value") ?? ((e = o.indexesWithinAncestors.get(u.id)) == null ? void 0 : e.toString());
        m && o.setMemoryProp(i, "value", m);
      }
  }
};
export {
  C as NavigationMenu,
  x as NavigationMenuContent,
  A as NavigationMenuItem,
  I as NavigationMenuLink,
  P as NavigationMenuList,
  $ as NavigationMenuTrigger,
  k as NavigationMenuViewport,
  w as hooksNavigationMenu
};
