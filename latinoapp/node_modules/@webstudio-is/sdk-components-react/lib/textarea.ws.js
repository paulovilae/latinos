import { textarea as e } from "@webstudio-is/sdk/normalize.css";
import { props as r } from "./__generated__/textarea.props.js";
const t = {
  textarea: [
    ...e,
    // resize doesn't work well while on canvas
    { property: "resize", value: { type: "keyword", value: "none" } },
    {
      property: "display",
      value: { type: "keyword", value: "block" }
    }
  ]
}, l = {
  label: "Text Area",
  presetStyle: t,
  contentModel: {
    category: "instance",
    children: []
  },
  initialProps: [
    "id",
    "class",
    "name",
    "value",
    "placeholder",
    "required",
    "autofocus"
  ],
  props: r
};
export {
  l as meta
};
