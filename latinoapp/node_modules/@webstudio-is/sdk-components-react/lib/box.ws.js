import { section as e, nav as r, main as t, header as i, footer as a, figure as o, aside as s, article as d, address as n, div as p } from "@webstudio-is/sdk/normalize.css";
import { props as c } from "./__generated__/box.props.js";
const g = {
  presetStyle: {
    div: p,
    address: n,
    article: d,
    aside: s,
    figure: o,
    footer: a,
    header: i,
    main: t,
    nav: r,
    section: e
  },
  initialProps: ["tag", "id", "class"],
  props: {
    ...c,
    tag: {
      required: !0,
      control: "tag",
      type: "string",
      options: [
        "div",
        "header",
        "footer",
        "nav",
        "main",
        "section",
        "article",
        "aside",
        "address",
        "figure",
        "span"
      ]
    }
  }
};
export {
  g as meta
};
