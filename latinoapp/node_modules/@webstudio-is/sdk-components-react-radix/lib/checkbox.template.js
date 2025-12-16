import { jsxs as c, jsx as e } from "react/jsx-runtime";
import { CheckMarkIcon as a } from "@webstudio-is/icons/svg";
import { $ as t, css as o, PlaceholderValue as l } from "@webstudio-is/template";
import { radix as r } from "./shared/proxy.js";
import { height as s, width as d, borderRadius as n, borderWidth as h, colors as i, boxShadow as b, opacity as m, spacing as p } from "./shared/theme.js";
const y = {
  category: "radix",
  description: "Use within a form to allow your users to toggle between checked and not checked. Group checkboxes by matching their “Name” properties. Unlike radios, any number of checkboxes in a group can be checked.",
  order: 101,
  template: /* @__PURE__ */ c(
    r.Label,
    {
      "ws:label": "Checkbox Field",
      "ws:style": o`
        display: flex;
        gap: ${p[2]};
        align-items: center;
      `,
      children: [
        /* @__PURE__ */ e(
          r.Checkbox,
          {
            "ws:style": o`
          height: ${s[4]};
          width: ${d[4]};
          flex-shrink: 0;
          border-radius: ${n.sm};
          border: ${h.DEFAULT} solid ${i.primary};
          &:focus-visible {
            outline: none;
            box-shadow: ${b.ring};
          }
          &:disabled {
            cursor: not-allowed;
            opacity: ${m[50]};
          }
          &[data-state="checked"] {
            background-color: ${i.primary};
            color: ${i.primaryForeground};
          }
        `,
            children: /* @__PURE__ */ e(
              r.CheckboxIndicator,
              {
                "ws:style": o`
            display: flex;
            align-items: center;
            justify-content: center;
            color: currentColor;
          `,
                children: /* @__PURE__ */ e(t.HtmlEmbed, { "ws:label": "Indicator Icon", code: a })
              }
            )
          }
        ),
        /* @__PURE__ */ e(t.Text, { "ws:label": "Checkbox Label", "ws:tag": "span", children: new l("Checkbox") })
      ]
    }
  )
};
export {
  y as meta
};
