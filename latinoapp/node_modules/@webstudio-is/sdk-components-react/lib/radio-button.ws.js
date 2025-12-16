import { RadioCheckedIcon as e } from "@webstudio-is/icons/svg";
import { radio as i } from "@webstudio-is/sdk/normalize.css";
import { props as o } from "./__generated__/radio-button.props.js";
const r = {
  input: [
    ...i,
    {
      property: "margin-right",
      value: { type: "unit", unit: "em", value: 0.5 }
    }
  ]
}, m = {
  label: "Radio",
  icon: e,
  presetStyle: r,
  initialProps: ["id", "class", "name", "value", "required", "checked"],
  props: o
};
export {
  m as meta
};
