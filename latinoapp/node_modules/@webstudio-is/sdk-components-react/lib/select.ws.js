import { select as e } from "@webstudio-is/sdk/normalize.css";
import { props as t } from "./__generated__/select.props.js";
const o = {
  select: [
    ...e,
    {
      property: "display",
      value: { type: "keyword", value: "block" }
    }
  ]
}, p = {
  presetStyle: o,
  initialProps: [
    "id",
    "class",
    "name",
    "value",
    "multiple",
    "required",
    "autofocus"
  ],
  props: t
};
export {
  p as meta
};
