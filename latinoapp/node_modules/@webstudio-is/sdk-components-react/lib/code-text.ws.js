import { BracesIcon as e } from "@webstudio-is/icons/svg";
import { code as r } from "@webstudio-is/sdk/normalize.css";
import { props as t } from "./__generated__/code-text.props.js";
const o = {
  code: [
    ...r,
    {
      property: "display",
      value: { type: "keyword", value: "block" }
    },
    {
      property: "white-space-collapse",
      value: { type: "keyword", value: "preserve" }
    },
    {
      property: "text-wrap-mode",
      value: { type: "keyword", value: "wrap" }
    },
    {
      property: "padding-left",
      value: { type: "unit", value: 0.2, unit: "em" }
    },
    {
      property: "padding-right",
      value: { type: "unit", value: 0.2, unit: "em" }
    },
    {
      property: "background-color",
      value: { type: "rgb", r: 238, g: 238, b: 238, alpha: 1 }
    }
  ]
}, c = {
  icon: e,
  contentModel: {
    category: "instance",
    children: []
  },
  presetStyle: o,
  initialProps: ["id", "class", "lang", "code"],
  props: {
    ...t,
    code: {
      required: !0,
      control: "codetext",
      type: "string"
    }
  }
};
export {
  c as meta
};
