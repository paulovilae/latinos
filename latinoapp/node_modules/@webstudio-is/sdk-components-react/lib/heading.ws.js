import { h6 as t, h5 as r, h4 as o, h3 as h, h2 as p, h1 as e } from "@webstudio-is/sdk/normalize.css";
import { props as i } from "./__generated__/heading.props.js";
const m = {
  presetStyle: {
    h1: e,
    h2: p,
    h3: h,
    h4: o,
    h5: r,
    h6: t
  },
  initialProps: ["tag", "id", "class"],
  props: {
    ...i,
    tag: {
      required: !0,
      control: "tag",
      type: "string",
      options: ["h1", "h2", "h3", "h4", "h5", "h6"]
    }
  }
};
export {
  m as meta
};
