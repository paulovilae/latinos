import { MarkdownEmbedIcon as e } from "@webstudio-is/icons/svg";
import { descendantComponent as o } from "@webstudio-is/sdk";
import { props as r } from "./__generated__/markdown-embed.props.js";
const a = {
  icon: e,
  contentModel: {
    category: "instance",
    children: [o]
  },
  presetStyle: {
    div: [
      {
        property: "display",
        value: { type: "keyword", value: "contents" }
      },
      {
        property: "white-space-collapse",
        value: { type: "keyword", value: "collapse" }
      }
    ]
  },
  initialProps: ["class"],
  props: {
    ...r,
    code: {
      required: !0,
      control: "code",
      language: "markdown",
      type: "string"
    }
  }
};
export {
  a as meta
};
