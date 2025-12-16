import { jsxs as r, jsx as t, Fragment as u } from "react/jsx-runtime";
import { ReactSdkContext as g, xmlNodeTagSuffix as x } from "@webstudio-is/react-sdk/runtime";
import { forwardRef as b, useContext as C, createElement as N, Children as F } from "react";
const j = b(
  ({ tag: c = "", children: l, ...i }, d) => {
    const { renderer: p } = C(g), o = Object.entries(i).filter(
      ([e]) => e.startsWith("data-") === !1 && e.startsWith("aria-") === !1
    ).filter(([e]) => e.toLowerCase() !== "tabindex").filter(([, e]) => typeof e != "function"), s = c.replace(/^[^\p{L}_]+/u, "").replaceAll(/[^\p{L}\p{N}\-._:]+/gu, "").trim();
    if (p === void 0) {
      const e = Object.fromEntries(o);
      return N(
        `${s}${x}`,
        e,
        l
      );
    }
    const n = F.toArray(l), a = n.length > 0 && n.every((e) => typeof e == "string"), m = (e) => e.map(([f, h], y) => /* @__PURE__ */ r("span", { children: [
      " ",
      /* @__PURE__ */ t("span", { style: { color: "#FF0000" }, children: f }),
      /* @__PURE__ */ t("span", { style: { color: "#000000" }, children: "=" }),
      /* @__PURE__ */ r("span", { style: { color: "#0000FF" }, children: [
        '"',
        h,
        '"'
      ] })
    ] }, y));
    return /* @__PURE__ */ r("div", { ...i, style: { backgroundColor: "rgba(255,255,255,1)" }, children: [
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ r("span", { style: { color: "#800000" }, children: [
          "<",
          s
        ] }),
        o.length > 0 && m(o),
        n.length === 0 ? /* @__PURE__ */ t("span", { style: { color: "#800000" }, children: "/>" }) : /* @__PURE__ */ t("span", { style: { color: "#800000" }, children: ">" })
      ] }),
      n.length > 0 && /* @__PURE__ */ r(u, { children: [
        /* @__PURE__ */ t(
          "div",
          {
            ref: d,
            style: {
              display: a ? "inline" : "block",
              marginLeft: a ? 0 : "1rem",
              color: "#000000"
            },
            children: l
          }
        ),
        /* @__PURE__ */ r("span", { style: { color: "#800000" }, children: [
          "</",
          s,
          ">"
        ] })
      ] })
    ] });
  }
);
j.displayName = "XmlNode";
export {
  j as XmlNode
};
