import { forwardRef as m, useContext as s, createElement as c } from "react";
import { ReactSdkContext as d } from "@webstudio-is/react-sdk/runtime";
const f = m(
  ({ value: t, defaultValue: r, checked: n, defaultChecked: e, ...o }, i) => {
    const { renderer: p } = s(d), a = p === "canvas" ? String(t ?? r) + String(n ?? e) : void 0;
    return /* @__PURE__ */ c(
      "input",
      {
        ...o,
        key: a,
        defaultValue: t ?? r,
        defaultChecked: n ?? e,
        ref: i
      }
    );
  }
);
f.displayName = "Input";
export {
  f as Input
};
