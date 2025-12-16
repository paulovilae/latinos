import { hr as e } from "@webstudio-is/sdk/normalize.css";
import { props as r } from "./__generated__/separator.props.js";
const o = {
  hr: [
    ...e,
    {
      property: "height",
      value: { type: "keyword", value: "1px" }
    },
    {
      property: "background-color",
      value: { type: "keyword", value: "gray" }
    },
    {
      property: "border-top-style",
      value: { type: "keyword", value: "none" }
    },
    {
      property: "border-right-style",
      value: { type: "keyword", value: "none" }
    },
    {
      property: "border-left-style",
      value: { type: "keyword", value: "none" }
    },
    {
      property: "border-bottom-style",
      value: { type: "keyword", value: "none" }
    }
  ]
}, y = {
  presetStyle: o,
  initialProps: ["id", "class"],
  props: r
};
export {
  y as meta
};
