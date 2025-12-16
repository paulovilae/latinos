import { VimeoIcon as o } from "@webstudio-is/icons/svg";
import { div as e } from "@webstudio-is/sdk/normalize.css";
import { props as t } from "./__generated__/vimeo.props.js";
const i = [
  "id",
  "className",
  "url",
  "title",
  "quality",
  "loading",
  "showPreview",
  "autoplay",
  "doNotTrack",
  "loop",
  "muted",
  "showPortrait",
  "showByline",
  "showTitle",
  "showControls",
  "controlsColor",
  "playsinline"
], s = {
  icon: o,
  contentModel: {
    category: "instance",
    children: ["instance"],
    descendants: ["VimeoSpinner", "VimeoPlayButton", "VimeoPreviewImage"]
  },
  presetStyle: { div: e },
  initialProps: i,
  props: t
};
export {
  s as meta
};
