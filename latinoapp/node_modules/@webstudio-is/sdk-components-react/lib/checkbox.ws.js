import { CheckboxCheckedIcon as e } from "@webstudio-is/icons/svg";
import { checkbox as o } from "@webstudio-is/sdk/normalize.css";
import { props as r } from "./__generated__/checkbox.props.js";
const t = {
  input: [
    ...o,
    {
      property: "margin-right",
      value: { type: "unit", unit: "em", value: 0.5 }
    }
  ]
}, m = {
  icon: e,
  presetStyle: t,
  initialProps: ["id", "class", "name", "value", "required", "checked"],
  props: r
};
export {
  m as meta
};
