import { jsx as e } from "react/jsx-runtime";
import { forwardRef as r, useContext as a, useCallback as m } from "react";
import s from "await-interaction-response";
import { Button as l } from "./button.js";
import { VideoContext as c } from "./shared/video.js";
const f = r(
  (o, i) => {
    const t = a(c), n = m(async () => {
      await s(), t.onInitPlayer();
    }, [t]);
    if (t.status === "initial")
      return /* @__PURE__ */ e(l, { ...o, onClick: n, ref: i });
  }
);
f.displayName = "VimeoPlayButton";
export {
  f as VimeoPlayButton
};
