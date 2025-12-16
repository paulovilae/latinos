import { input as e } from "@webstudio-is/sdk/normalize.css";
import { props as t } from "./__generated__/input.props.js";
const p = {
  input: [
    ...e,
    {
      property: "display",
      value: { type: "keyword", value: "block" }
    }
  ]
}, l = {
  label: "Text Input",
  presetStyle: p,
  initialProps: [
    "id",
    "class",
    "name",
    "value",
    "type",
    "placeholder",
    "required",
    "autofocus"
  ],
  props: t
};
export {
  l as meta
};
