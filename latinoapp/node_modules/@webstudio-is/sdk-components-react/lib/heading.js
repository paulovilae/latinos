import { forwardRef as o, createElement as g } from "react";
import { getTagFromProps as m } from "@webstudio-is/sdk/runtime";
const n = "h1", d = o(
  ({ tag: e, ...t }, a) => {
    const r = m(t) ?? e ?? n;
    return g(r, { ...t, ref: a });
  }
);
d.displayName = "Heading";
export {
  d as Heading
};
