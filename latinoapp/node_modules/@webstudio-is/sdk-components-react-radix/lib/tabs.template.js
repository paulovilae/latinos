import { jsxs as s, jsx as t } from "react/jsx-runtime";
import { PlaceholderValue as o, css as a } from "@webstudio-is/template";
import { radix as e } from "./shared/proxy.js";
import { height as g, borderRadius as l, colors as n, spacing as i, fontSize as h, fontSizeLineHeight as b, weights as p, transition as u, boxShadow as r, opacity as m } from "./shared/theme.js";
const d = a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: ${l.md};
  padding: ${i[1.5]} ${i[3]};
  font-size: ${h.sm};
  line-height: ${b.sm};
  font-weight: ${p.medium};
  transition: ${u.all};
  &:focus-visible {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: ${r.ring};
  }
  &:disabled {
    pointer-events: none;
    opacity: ${m[50]};
  }
  &[data-state="active"] {
    background-color: ${n.background};
    color: ${n.foreground};
    box-shadow: ${r.sm};
  }
`, c = a`
  margin-top: ${i[2]};
  &:focus-visible {
    outline: none;
    box-shadow: ${r.ring};
  }
`, x = {
  category: "radix",
  description: "A set of panels with content that are displayed one at a time. Duplicate both a tab trigger and tab content to add more tabs. Triggers and content are connected according to their order in the Navigator.",
  order: 2,
  template: /* @__PURE__ */ s(e.Tabs, { value: "0", children: [
    /* @__PURE__ */ s(
      e.TabsList,
      {
        "ws:style": a`
          display: inline-flex;
          height: ${g[10]};
          align-items: center;
          justify-content: center;
          border-radius: ${l.md};
          background-color: ${n.muted};
          padding: ${i[1]};
          color: ${n.mutedForeground};
        `,
        children: [
          /* @__PURE__ */ t(e.TabsTrigger, { "ws:style": d, children: new o("Account") }),
          /* @__PURE__ */ t(e.TabsTrigger, { "ws:style": d, children: new o("Password") })
        ]
      }
    ),
    /* @__PURE__ */ t(e.TabsContent, { "ws:style": c, children: new o("Make changes to your account here.") }),
    /* @__PURE__ */ t(e.TabsContent, { "ws:style": c, children: new o("Change your password here.") })
  ] })
};
export {
  x as meta
};
