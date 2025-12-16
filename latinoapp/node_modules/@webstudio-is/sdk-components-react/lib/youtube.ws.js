import { YoutubeIcon as e } from "@webstudio-is/icons/svg";
import { div as o } from "@webstudio-is/sdk/normalize.css";
import { props as i } from "./__generated__/youtube.props.js";
const n = [
  "id",
  "className",
  "url",
  "privacyEnhancedMode",
  "title",
  "loading",
  "showPreview",
  "autoplay",
  "showControls",
  "showRelatedVideos",
  "keyboard",
  "loop",
  "inline",
  "allowFullscreen",
  "showCaptions",
  "showAnnotations",
  "startTime",
  "endTime",
  "disableKeyboard",
  "referrer",
  "listType",
  "listId",
  "origin",
  "captionLanguage",
  "language",
  "color",
  "playlist"
], s = {
  icon: e,
  contentModel: {
    category: "instance",
    children: ["instance"],
    descendants: ["VimeoSpinner", "VimeoPlayButton", "VimeoPreviewImage"]
  },
  presetStyle: { div: o },
  initialProps: n,
  props: i
};
export {
  s as meta
};
