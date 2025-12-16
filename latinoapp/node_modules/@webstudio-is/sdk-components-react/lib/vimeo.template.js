import { jsxs as o, jsx as e } from "react/jsx-runtime";
import { SpinnerIcon as r, PlayIcon as n } from "@webstudio-is/icons/svg";
import { $ as t, css as i, ws as a } from "@webstudio-is/template";
const d = {
  category: "media",
  order: 1,
  description: "Add a video to your page that is hosted on Vimeo. Paste a Vimeo URL and configure the video in the Settings tab.",
  template: /* @__PURE__ */ o(
    t.Vimeo,
    {
      "ws:style": i`
        position: relative;
        aspect-ratio: 640/360;
        width: 100%;
      `,
      children: [
        /* @__PURE__ */ e(
          t.VimeoPreviewImage,
          {
            "ws:style": i`
          position: absolute;
          object-fit: cover;
          object-position: center;
          width: 100%;
          height: 100%;
          border-radius: 20px;
        `,
            alt: "Vimeo video preview image",
            sizes: "100vw",
            optimize: !0
          }
        ),
        /* @__PURE__ */ e(
          t.VimeoSpinner,
          {
            "ws:label": "Spinner",
            "ws:style": i`
          position: absolute;
          top: 50%;
          left: 50%;
          width: 70px;
          height: 70px;
          margin-top: -35px;
          margin-left: -35px;
        `,
            children: /* @__PURE__ */ e(t.HtmlEmbed, { "ws:label": "Spinner SVG", code: r })
          }
        ),
        /* @__PURE__ */ e(
          t.VimeoPlayButton,
          {
            "ws:style": i`
          position: absolute;
          width: 140px;
          height: 80px;
          top: 50%;
          left: 50%;
          margin-top: -40px;
          margin-left: -70px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-style: none;
          border-radius: 5px;
          cursor: pointer;
          background-color: rgb(18, 18, 18);
          color: rgb(255, 255, 255);
          &:hover {
            background-color: rgb(0, 173, 239);
          }
        `,
            "aria-label": "Play button",
            children: /* @__PURE__ */ e(
              a.element,
              {
                "ws:tag": "div",
                "ws:label": "Play Icon",
                "ws:style": i`
            width: 60px;
            height: 60px;
          `,
                "aria-hidden": !0,
                children: /* @__PURE__ */ e(t.HtmlEmbed, { "ws:label": "Play SVG", code: n })
              }
            )
          }
        )
      ]
    }
  )
};
export {
  d as meta
};
