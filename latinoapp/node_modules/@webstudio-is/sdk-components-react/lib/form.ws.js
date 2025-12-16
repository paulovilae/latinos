import { form as t } from "@webstudio-is/sdk/normalize.css";
import { props as o } from "./__generated__/form.props.js";
const r = {
  form: [
    ...t,
    { property: "min-height", value: { type: "unit", unit: "px", value: 20 } }
  ]
}, p = {
  label: "Form",
  presetStyle: r,
  initialProps: ["id", "class", "action"],
  props: o
};
export {
  p as meta
};
