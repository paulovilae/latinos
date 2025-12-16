import { jsx as e } from "react/jsx-runtime";
import { forwardRef as r, useContext as i } from "react";
import { VideoContext as n } from "./shared/video.js";
const m = r(
  (o, t) => {
    if (i(n).status === "loading")
      return /* @__PURE__ */ e("div", { ...o, ref: t });
  }
);
m.displayName = "VimeoSpinner";
export {
  m as VimeoSpinner
};
