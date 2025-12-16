import { ul as e, ol as r } from "@webstudio-is/sdk/normalize.css";
import { props as p } from "./__generated__/list.props.js";
const t = {
  ol: [
    ...r,
    {
      property: "margin-top",
      value: { type: "keyword", value: "0" }
    },
    {
      property: "margin-bottom",
      value: { type: "keyword", value: "10px" }
    },
    {
      property: "padding-left",
      value: { type: "keyword", value: "40px" }
    }
  ],
  ul: [
    ...e,
    {
      property: "margin-top",
      value: { type: "keyword", value: "0" }
    },
    {
      property: "margin-bottom",
      value: { type: "keyword", value: "10px" }
    },
    {
      property: "padding-left",
      value: { type: "keyword", value: "40px" }
    }
  ]
}, l = {
  presetStyle: t,
  initialProps: ["id", "class", "ordered", "start", "reversed"],
  props: p
};
export {
  l as meta
};
