import { jsxs as n, jsx as e } from "react/jsx-runtime";
import { LargeXIcon as p } from "@webstudio-is/icons/svg";
import { $ as l, PlaceholderValue as r, css as i } from "@webstudio-is/template";
import { radix as o } from "./shared/proxy.js";
import { fontSize as d, lineHeight as m, letterSpacing as u, fontSizeLineHeight as w, colors as a, spacing as t, borderRadius as $, opacity as s, height as c, boxShadow as g, width as y, zIndex as h, maxWidth as b, borderWidth as x, blur as f } from "./shared/theme.js";
import { getButtonStyle as D } from "./shared/styles.js";
const S = {
  category: "radix",
  description: "Displays content with an overlay that covers the window, triggered by a button. Clicking the overlay will close the dialog.",
  order: 4,
  template: /* @__PURE__ */ n(o.Dialog, { children: [
    /* @__PURE__ */ e(o.DialogTrigger, { children: /* @__PURE__ */ e(l.Button, { "ws:style": D("outline"), children: new r("Button") }) }),
    /* @__PURE__ */ e(
      o.DialogOverlay,
      {
        "ws:style": i`
          position: fixed;
          inset: 0;
          z-index: ${h[50]};
          background-color: rgb(255 255 255 / 0.8);
          backdrop-filter: ${f.sm};
          /* To allow positioning Content */
          display: flex;
          overflow: auto;
        `,
        children: /* @__PURE__ */ n(
          o.DialogContent,
          {
            "ws:style": i`
            width: ${y.full};
            z-index: ${h[50]};
            display: flex;
            flex-direction: column;
            gap: ${t[4]};
            margin: auto;
            max-width: ${b.lg};
            border: ${x.DEFAULT} solid ${a.border};
            background-color: ${a.background};
            padding: ${t[6]};
            box-shadow: ${g.lg};
            position: relative;
          `,
            children: [
              /* @__PURE__ */ n(
                l.Box,
                {
                  "ws:label": "Dialog Header",
                  "ws:style": i`
              display: flex;
              flex-direction: column;
              gap: ${t[2]};
            `,
                  children: [
                    /* @__PURE__ */ e(
                      o.DialogTitle,
                      {
                        "ws:style": i`
                font-size: ${d.lg};
                line-height: ${m.none};
                letter-spacing: ${u.tight};
                margin: 0;
              `,
                        children: new r("Dialog Title you can edit")
                      }
                    ),
                    /* @__PURE__ */ e(
                      o.DialogDescription,
                      {
                        "ws:style": i`
                font-size: ${d.sm};
                line-height: ${w.sm};
                color: ${a.mutedForeground};
                margin: 0;
              `,
                        children: new r("Dialog description text you can edit")
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ e(l.Text, { children: new r("The text you can edit") }),
              /* @__PURE__ */ e(
                o.DialogClose,
                {
                  "ws:label": "Close Button",
                  "ws:style": i`
              position: absolute;
              right: ${t[4]};
              top: ${t[4]};
              border-radius: ${$.sm};
              opacity: ${s[70]};
              display: flex;
              align-items: center;
              justify-content: center;
              height: ${c[4]};
              width: ${c[4]};
              border: 0;
              background-color: transparent;
              outline: none;
              &:hover {
                opacity: ${s[100]};
              }
              &:focus-visible {
                box-shadow: ${g.ring};
              }
            `,
                  children: /* @__PURE__ */ e(l.HtmlEmbed, { "ws:label": "Close Icon", code: p })
                }
              )
            ]
          }
        )
      }
    )
  ] })
};
export {
  S as meta
};
