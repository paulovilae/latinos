import { jsxs as r, jsx as e } from "react/jsx-runtime";
import { $ as o, PlaceholderValue as s, css as t } from "@webstudio-is/template";
import { radix as i } from "./shared/proxy.js";
import { height as h, width as m, transition as a, spacing as c, weights as g, fontSize as f, fontSizeLineHeight as p, borderWidth as w, colors as y } from "./shared/theme.js";
import { ChevronDownIcon as b } from "@webstudio-is/icons/svg";
const n = (d, l) => /* @__PURE__ */ r(
  i.AccordionItem,
  {
    "ws:style": t`
        border-bottom: ${w.DEFAULT} solid ${y.border};
      `,
    children: [
      /* @__PURE__ */ e(
        i.AccordionHeader,
        {
          "ws:style": t`
          display: flex;
        `,
          children: /* @__PURE__ */ r(
            i.AccordionTrigger,
            {
              "ws:style": t`
            display: flex;
            flex: 1 1 0;
            align-items: center;
            justify-content: between;
            padding: ${c[4]} 0;
            font-weight: ${g.medium};
            --accordion-trigger-icon-transform: 0deg;
            &:hover {
              text-decoration-line: underline;
            }
            &[data-state="open"] {
              --accordion-trigger-icon-transform: 180deg;
            }
          `,
              children: [
                /* @__PURE__ */ e(o.Text, { children: new s(d) }),
                /* @__PURE__ */ e(
                  o.Box,
                  {
                    "ws:label": "Icon Container",
                    "ws:style": t`
              rotate: var(--accordion-trigger-icon-transform);
              height: ${h[4]};
              width: ${m[4]};
              flex-shrink: 0;
              transition: ${a.all};
              transition-duration: 200ms;
            `,
                    children: /* @__PURE__ */ e(o.HtmlEmbed, { "ws:label": "Chevron Icon", code: b })
                  }
                )
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ e(
        i.AccordionContent,
        {
          "ws:style": t`
          overflow: hidden;
          font-size: ${f.sm};
          line-height: ${p.sm};
          transition: ${a.all};
          padding-bottom: ${c[4]};
        `,
          children: new s(l)
        }
      )
    ]
  }
), v = {
  category: "radix",
  description: "A vertically stacked set of interactive headings that each reveal an associated section of content. Clicking on the heading will open the item and close other items.",
  order: 3,
  template: /* @__PURE__ */ r(i.Accordion, { collapsible: !0, value: "0", children: [
    n(
      "Is it accessible?",
      "Yes. It adheres to the WAI-ARIA design pattern."
    ),
    n(
      "Is it styled?",
      "Yes. It comes with default styles that matches the other components' aesthetic."
    ),
    n(
      "Is it animated?",
      "Yes. It's animated by default, but you can disable it if you prefer."
    )
  ] })
};
export {
  v as meta
};
