import { jsxs as o, jsx as t } from "react/jsx-runtime";
import { $ as r, ActionValue as i, ws as e, PlaceholderValue as a, css as n, Variable as w, expression as l } from "@webstudio-is/template";
const s = new w("formState", "initial"), d = {
  category: "data",
  order: 1,
  description: "Collect user data and send it to any webhook.",
  template: /* @__PURE__ */ o(
    r.Form,
    {
      state: l`${s}`,
      onStateChange: new i(["state"], l`${s} = state`),
      children: [
        /* @__PURE__ */ o(
          e.element,
          {
            "ws:tag": "div",
            "ws:label": "Form Content",
            "ws:show": l`${s} === 'initial' || ${s} === 'error'`,
            children: [
              /* @__PURE__ */ t(
                e.element,
                {
                  "ws:tag": "label",
                  "ws:style": n`
            display: block;
          `,
                  children: new a("Name")
                }
              ),
              /* @__PURE__ */ t(
                e.element,
                {
                  "ws:tag": "input",
                  "ws:style": n`
            display: block;
          `,
                  name: "name"
                }
              ),
              /* @__PURE__ */ t(
                e.element,
                {
                  "ws:tag": "label",
                  "ws:style": n`
            display: block;
          `,
                  children: new a("Email")
                }
              ),
              /* @__PURE__ */ t(
                e.element,
                {
                  "ws:tag": "input",
                  "ws:style": n`
            display: block;
          `,
                  name: "email"
                }
              ),
              /* @__PURE__ */ t(e.element, { "ws:tag": "button", children: new a("Submit") })
            ]
          }
        ),
        /* @__PURE__ */ t(
          e.element,
          {
            "ws:tag": "div",
            "ws:label": "Success Message",
            "ws:show": l`${s} === 'success'`,
            children: new a("Thank you for getting in touch!")
          }
        ),
        /* @__PURE__ */ t(
          e.element,
          {
            "ws:tag": "div",
            "ws:label": "Error Message",
            "ws:show": l`${s} === 'error'`,
            children: new a("Sorry, something went wrong.")
          }
        )
      ]
    }
  )
};
export {
  d as meta
};
