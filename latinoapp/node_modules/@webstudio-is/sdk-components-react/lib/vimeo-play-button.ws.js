import { ButtonElementIcon as t } from "@webstudio-is/icons/svg";
import { button as o } from "@webstudio-is/sdk/normalize.css";
import { props as e } from "./__generated__/vimeo-play-button.props.js";
const c = {
  category: "hidden",
  label: "Play Button",
  icon: t,
  contentModel: {
    category: "none",
    children: ["instance"]
  },
  presetStyle: { button: o },
  initialProps: ["id", "class"],
  props: e
};
export {
  c as meta
};
