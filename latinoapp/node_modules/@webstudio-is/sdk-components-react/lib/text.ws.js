import { TextIcon as t } from "@webstudio-is/icons/svg";
import { div as i } from "@webstudio-is/sdk/normalize.css";
import { props as o } from "./__generated__/text.props.js";
const n = {
  icon: t,
  presetStyle: {
    div: [
      ...i,
      {
        property: "min-height",
        value: { type: "unit", unit: "em", value: 1 }
      }
    ]
  },
  initialProps: ["tag", "id", "class"],
  props: {
    ...o,
    tag: {
      required: !0,
      control: "tag",
      type: "string",
      options: ["div", "cite", "figcaption", "span"]
    }
  }
};
export {
  n as meta
};
