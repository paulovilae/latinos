import { EmbedIcon as t } from "@webstudio-is/icons/svg";
import { descendantComponent as n } from "@webstudio-is/sdk";
import { props as e } from "./__generated__/html-embed.props.js";
const a = {
  category: "general",
  label: "HTML Embed",
  description: "Used to add HTML code to the page, such as an SVG or script.",
  icon: t,
  order: 3,
  contentModel: {
    category: "instance",
    children: [n]
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
  initialProps: ["class", "clientOnly", "executeScriptOnCanvas"],
  props: {
    ...e,
    clientOnly: {
      ...e.clientOnly,
      description: "Activate it for any scripts that can mutate the DOM or introduce interactivity. This only affects the published site."
    },
    executeScriptOnCanvas: {
      ...e.executeScriptOnCanvas,
      label: "Run scripts on canvas",
      description: "Dangerously allow script execution on canvas without switching to preview mode. This only affects build mode, but may result in unwanted side effects inside builder!"
    },
    code: {
      required: !0,
      control: "code",
      language: "html",
      type: "string"
    }
  }
};
export {
  a as meta
};
