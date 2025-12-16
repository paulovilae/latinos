import { jsxs as n, jsx as o } from "react/jsx-runtime";
import { LargeXIcon as p } from "@webstudio-is/icons/svg";
import { $ as r, PlaceholderValue as d, css as l } from "@webstudio-is/template";
import { radix as e } from "./shared/proxy.js";
import { getButtonStyle as h } from "./shared/styles.js";
import { spacing as t, borderRadius as s, height as a, opacity as m, boxShadow as c, zIndex as b, width as u, borderWidth as g, colors as i } from "./shared/theme.js";
const P = {
  category: "radix",
  description: "Displays rich content in a portal, triggered by a button.",
  order: 6,
  template: /* @__PURE__ */ n(e.Popover, { children: [
    /* @__PURE__ */ o(e.PopoverTrigger, { children: /* @__PURE__ */ o(r.Button, { "ws:style": h("outline"), children: new d("Button") }) }),
    /* @__PURE__ */ n(
      e.PopoverContent,
      {
        "ws:style": l`
          z-index: ${b[50]};
          width: ${u[72]};
          border-radius: ${s.md};
          border: ${g.DEFAULT} solid ${i.border};
          background-color: ${i.popover};
          padding: ${t[4]};
          color: ${i.popoverForeground};
          box-shadow: ${c.md};
          outline: none;
        `,
        children: [
          /* @__PURE__ */ o(r.Text, { children: new d("The text you can edit") }),
          /* @__PURE__ */ o(
            e.PopoverClose,
            {
              "ws:label": "Close Button",
              "ws:style": l`
            position: absolute;
            right: ${t[4]};
            top: ${t[4]};
            border-radius: ${s.sm};
            display: flex;
            align-items: center;
            justify-content: center;
            height: ${a[4]};
            width: ${a[4]};
            border: 0;
            background-color: transparent;
            outline: none;
            &:hover {
              opacity: ${m[100]};
            }
            &:focus-visible {
              box-shadow: ${c.ring};
            }
          `,
              children: /* @__PURE__ */ o(r.HtmlEmbed, { "ws:label": "Close Icon", code: p })
            }
          )
        ]
      }
    )
  ] })
};
export {
  P as meta
};
