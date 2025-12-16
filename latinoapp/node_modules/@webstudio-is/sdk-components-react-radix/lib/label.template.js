import { jsx as e } from "react/jsx-runtime";
import { PlaceholderValue as t, css as o } from "@webstudio-is/template";
import { radix as i } from "./shared/proxy.js";
import { fontSize as r, lineHeight as n, weights as h } from "./shared/theme.js";
const p = {
  category: "radix",
  description: "An accessible label to describe the purpose of an input. Match the “For” property on the label with the “ID” of the input to connect them.",
  order: 102,
  template: /* @__PURE__ */ e(
    i.Label,
    {
      "ws:style": o`
        font-size: ${r.sm};
        line-height: ${n.none};
        font-weight: ${h.medium};
      `,
      children: new t("Form Label")
    }
  )
};
export {
  p as meta
};
