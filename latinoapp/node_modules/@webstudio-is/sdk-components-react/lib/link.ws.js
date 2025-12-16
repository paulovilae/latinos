import { a as e } from "@webstudio-is/sdk/normalize.css";
import { props as r } from "./__generated__/link.props.js";
const t = {
  a: [
    ...e,
    {
      property: "display",
      value: { type: "keyword", value: "inline-block" }
    }
  ]
}, p = {
  presetStyle: t,
  states: [{ label: "Current page", selector: "[aria-current=page]" }],
  initialProps: ["id", "class", "href", "target", "prefetch", "download"],
  props: {
    ...r,
    href: {
      type: "string",
      control: "url",
      required: !1
    }
  }
};
export {
  p as meta
};
