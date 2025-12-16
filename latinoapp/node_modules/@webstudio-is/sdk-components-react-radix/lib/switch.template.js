import { jsx as o } from "react/jsx-runtime";
import { css as r } from "@webstudio-is/template";
import { radix as e } from "./shared/proxy.js";
import { height as d, width as s, borderRadius as a, colors as t, boxShadow as i, transition as n, borderWidth as c, opacity as l } from "./shared/theme.js";
const m = {
  category: "radix",
  description: "A control that allows the user to toggle between checked and not checked.",
  order: 11,
  template: /* @__PURE__ */ o(
    e.Switch,
    {
      "ws:style": r`
        display: inline-flex;
        height: 24px;
        width: 44px;
        flex-shrink: 0;
        cursor: pointer;
        align-items: center;
        border-radius: ${a.full};
        border: ${c[2]} solid transparent;
        transition: ${n.all};
        &:focus-visible {
          outline: none;
          box-shadow: ${i.ring};
        }
        &:disabled {
          cursor: not-allowed;
          opacity: ${l[50]};
        }
        &[data-state="checked"] {
          background-color: ${t.primary};
        }
        &[data-state="unchecked"] {
          background-color: ${t.input};
        }
      `,
      children: /* @__PURE__ */ o(
        e.SwitchThumb,
        {
          "ws:style": r`
          pointer-events: none;
          display: block;
          height: ${d[5]};
          width: ${s[5]};
          border-radius: ${a.full};
          background-color: ${t.background};
          box-shadow: ${i.lg};
          transition: ${n.transform};
          &[data-state="checked"] {
            transform: translateX(20px);
          }
          &[data-state="unchecked"] {
            transform: translateX(0px);
          }
        `
        }
      )
    }
  )
};
export {
  m as meta
};
