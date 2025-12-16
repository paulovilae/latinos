import { meta as e } from "./image.ws.js";
import { props as r } from "./__generated__/vimeo-preview-image.props.js";
const i = {
  ...e,
  category: "hidden",
  label: "Preview Image",
  contentModel: {
    category: "none",
    children: []
  },
  initialProps: e.initialProps,
  props: {
    ...r,
    // Automatically generated props don't have the right control.
    src: {
      type: "string",
      control: "file",
      label: "Source",
      required: !1
    }
  }
};
export {
  i as meta
};
