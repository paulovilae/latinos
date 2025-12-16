import { jsxs as r, jsx as e } from "react/jsx-runtime";
import { MenuIcon as s, LargeXIcon as b } from "@webstudio-is/icons/svg";
import { $ as o, PlaceholderValue as n, css as i } from "@webstudio-is/template";
import { radix as t } from "./shared/proxy.js";
import { fontSize as d, lineHeight as p, letterSpacing as u, fontSizeLineHeight as w, colors as a, spacing as l, borderRadius as f, opacity as c, height as g, boxShadow as h, width as x, zIndex as m, borderWidth as $, maxWidth as y, blur as S } from "./shared/theme.js";
import { getButtonStyle as D } from "./shared/styles.js";
const B = {
  category: "radix",
  icon: s,
  description: "Displays content in a menu that slides out from the side of the screen, triggered by a button. Use this component for a typical mobile hamburger menu.",
  order: 1,
  template: /* @__PURE__ */ r(t.Dialog, { "ws:label": "Sheet", children: [
    /* @__PURE__ */ e(t.DialogTrigger, { "ws:label": "Sheet Trigger", children: /* @__PURE__ */ e(o.Button, { "ws:style": D("ghost", "icon"), children: /* @__PURE__ */ e(o.HtmlEmbed, { "ws:label": "Hamburger Menu Svg", code: s }) }) }),
    /* @__PURE__ */ e(
      t.DialogOverlay,
      {
        "ws:label": "Sheet Overlay",
        "ws:style": i`
          position: fixed;
          inset: 0;
          z-index: ${m[50]};
          background-color: rgb(255 255 255 / 0.8);
          backdrop-filter: ${S.sm};
          /* To allow positioning Content */
          display: flex;
          flex-direction: column;
          overflow: auto;
        `,
        children: /* @__PURE__ */ r(
          t.DialogContent,
          {
            "ws:label": "Sheet Content",
            "ws:style": i`
            width: ${x.full};
            z-index: ${m[50]};
            display: flex;
            flex-direction: column;
            gap: ${l[4]};
            border: ${$.DEFAULT} solid ${a.border};
            background-color: ${a.background};
            padding: ${l[6]};
            box-shadow: ${h.lg};
            position: relative;
            /* side=left */
            margin-right: auto;
            max-width: ${y.sm};
            flex-grow: 1;
          `,
            children: [
              /* @__PURE__ */ r(o.Box, { "ws:label": "Navigation", "ws:tag": "nav", children: [
                /* @__PURE__ */ r(
                  o.Box,
                  {
                    "ws:label": "Sheet Header",
                    "ws:style": i`
                display: flex;
                flex-direction: column;
                gap: ${l[2]};
              `,
                    children: [
                      /* @__PURE__ */ e(
                        t.DialogTitle,
                        {
                          "ws:label": "Sheet Title",
                          "ws:style": i`
                  font-size: ${d.lg};
                  line-height: ${p.none};
                  letter-spacing: ${u.tight};
                  margin: 0;
                `,
                          children: new n("Sheet Title")
                        }
                      ),
                      /* @__PURE__ */ e(
                        t.DialogDescription,
                        {
                          "ws:label": "Sheet Description",
                          "ws:style": i`
                  font-size: ${d.sm};
                  line-height: ${w.sm};
                  color: ${a.mutedForeground};
                  margin: 0;
                `,
                          children: new n("Sheet description text you can edit")
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ e(o.Text, { children: new n("The text you can edit") })
              ] }),
              /* @__PURE__ */ e(
                t.DialogClose,
                {
                  "ws:label": "Close Button",
                  "ws:style": i`
              position: absolute;
              right: ${l[4]};
              top: ${l[4]};
              border-radius: ${f.sm};
              opacity: ${c[70]};
              display: flex;
              align-items: center;
              justify-content: center;
              height: ${g[4]};
              width: ${g[4]};
              border: 0;
              background-color: transparent;
              outline: none;
              &:hover {
                opacity: ${c[100]};
              }
              &:focus-visible {
                box-shadow: ${h.ring};
              }
            `,
                  children: /* @__PURE__ */ e(o.HtmlEmbed, { "ws:label": "Close Icon", code: b })
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
  B as meta
};
