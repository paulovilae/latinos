import { forwardRef as c, useContext as m, createElement as s } from "react";
import { ReactSdkContext as x } from "@webstudio-is/react-sdk/runtime";
const d = c(({ value: e, defaultValue: t, ...r }, a) => {
  const { renderer: o } = m(x), n = o === "canvas" ? String(e ?? t) : void 0;
  return /* @__PURE__ */ s(
    "textarea",
    {
      ...r,
      key: n,
      defaultValue: e ?? t,
      ref: a
    }
  );
});
d.displayName = "Textarea";
export {
  d as Textarea
};
