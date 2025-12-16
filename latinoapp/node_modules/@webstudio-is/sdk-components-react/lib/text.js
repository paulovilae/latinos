import { forwardRef as a, createElement as m } from "react";
import { getTagFromProps as f } from "@webstudio-is/sdk/runtime";
const g = "div", n = a(
  ({ tag: e, ...t }, r) => {
    const o = f(t) ?? e ?? g;
    return m(o, { ...t, ref: r });
  }
);
n.displayName = "Text";
export {
  n as Text
};
