import { VideoIcon as e } from "@webstudio-is/icons/svg";
import { props as o } from "./__generated__/video.props.js";
const i = {
  icon: e,
  contentModel: {
    category: "instance",
    children: []
  },
  presetStyle: {
    video: [
      {
        property: "max-width",
        value: { type: "unit", unit: "%", value: 100 }
      }
    ]
  },
  initialProps: [
    "id",
    "class",
    "width",
    "height",
    "src",
    "autoPlay",
    "controls",
    "loop",
    "muted",
    "preload",
    "playsInline"
  ],
  props: {
    ...o,
    // Automatically generated props don't have the right control.
    src: {
      type: "string",
      control: "file",
      label: "Source",
      required: !1,
      accept: ".mp4,.webm,.mpg,.mpeg,.mov"
    }
  }
};
export {
  i as meta
};
