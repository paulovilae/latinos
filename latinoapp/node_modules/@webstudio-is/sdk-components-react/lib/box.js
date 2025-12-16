import { forwardRef as a, createElement as m } from "react";
import { getTagFromProps as f } from "@webstudio-is/sdk/runtime";
const g = "div", n = a(
  ({ tag: o, ...t }, r) => {
    const e = f(t) ?? o ?? g;
    return m(e, { ...t, ref: r });
  }
);
n.displayName = "Box";
export {
  n as Box
};
