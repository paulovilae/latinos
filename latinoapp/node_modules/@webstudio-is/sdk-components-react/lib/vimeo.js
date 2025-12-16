import { jsx as i, jsxs as B, Fragment as D } from "react/jsx-runtime";
import { colord as q } from "colord";
import { forwardRef as z, useState as y, useContext as T, useRef as G, useEffect as v } from "react";
import { ReactSdkContext as H } from "@webstudio-is/react-sdk/runtime";
import { VideoContext as Y, requestFullscreen as J } from "./shared/video.js";
const K = (t) => {
  if (t.url === void 0)
    return;
  let e;
  try {
    const o = new URL(t.url);
    e = new URL(S), e.pathname = `/video${o.pathname}`;
  } catch {
  }
  if (e === void 0)
    return;
  const a = {
    showPortrait: "portrait",
    showByline: "byline",
    showTitle: "title",
    controlsColor: "color",
    showControls: "controls",
    interactiveParams: "interactive_params",
    backgroundMode: "background",
    doNotTrack: "dnt"
  };
  let r;
  for (r in t) {
    const o = t[r];
    if (r === "url" || o === void 0)
      continue;
    const s = a[r] ?? r;
    e.searchParams.append(s, o.toString());
  }
  if (e.searchParams.set("autoplay", "true"), typeof t.controlsColor == "string") {
    const o = q(t.controlsColor).toHex().replace("#", "");
    e.searchParams.set("color", o);
  }
  return t.showPortrait && e.searchParams.set("title", "true"), t.showByline && (e.searchParams.set("portrait", "true"), e.searchParams.set("title", "true")), e.toString();
}, w = (t) => {
  const e = document.createElement("link");
  e.rel = "preconnect", e.href = t, e.crossOrigin = "true", document.head.appendChild(e);
};
let U = !1;
const Q = "https://f.vimeocdn.com", S = "https://player.vimeo.com", L = "https://i.vimeocdn.com", W = () => {
  U || window.matchMedia("(hover: none)").matches || (w(Q), w(S), w(L), U = !0);
}, X = (t) => {
  try {
    const a = new URL(t).pathname.split("/")[2];
    return a === "" || a == null ? void 0 : a;
  } catch {
  }
}, Z = async (t) => {
  const a = `https://vimeo.com/api/v2/video/${X(t)}.json`, o = (await (await fetch(a)).json())[0].thumbnail_large, s = o.substr(o.lastIndexOf("/") + 1).split("_")[0], n = new URL(L);
  return n.pathname = `/video/${s}.webp`, n.searchParams.append("mw", "1100"), n.searchParams.append("mh", "619"), n.searchParams.append("q", "70"), n;
}, ee = () => /* @__PURE__ */ i(
  "div",
  {
    style: {
      display: "flex",
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.2em"
    },
    children: 'Open the "Settings" panel and paste a video URL, e.g. https://vimeo.com/831343124.'
  }
), te = ({
  title: t,
  status: e,
  loading: a,
  videoUrl: r,
  previewImageUrl: o,
  autoplay: s,
  renderer: n,
  showPreview: m,
  playsinline: f,
  onStatusChange: c,
  onPreviewImageUrlChange: l
}) => {
  const [u, h] = y(0), d = G(null);
  if (v(() => {
    s && n !== "canvas" && e === "initial" && c("loading");
  }, [s, e, n, c]), v(() => {
    n !== "canvas" && W();
  }, [n]), v(() => {
    if (r !== void 0) {
      if (m === !1) {
        l(void 0);
        return;
      }
      o === void 0 && Z(r).then(l).catch(() => {
        console.error(`Could not load preview image for ${r}`);
      });
    }
  }, [l, m, r, o]), !(n === "canvas" || e === "initial"))
    return /* @__PURE__ */ i(
      "iframe",
      {
        ref: d,
        title: t,
        src: r,
        loading: a,
        allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture;",
        allowFullScreen: !0,
        style: {
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: u,
          transition: "opacity 1s",
          border: "none"
        },
        onLoad: () => {
          c("ready"), h(1), d.current && !f && !s && J(d.current);
        }
      }
    );
}, re = z(
  ({
    url: t,
    loading: e = "lazy",
    autoplay: a = !1,
    autopause: r = !0,
    showByline: o = !1,
    showControls: s = !0,
    doNotTrack: n = !1,
    keyboard: m = !0,
    loop: f = !1,
    muted: c = !1,
    pip: l = !1,
    playsinline: u = !1,
    showPortrait: h = !0,
    quality: d = "auto",
    responsive: k = !0,
    speed: E = !1,
    showTitle: _ = !1,
    transparent: j = !0,
    showPreview: M = !1,
    autopip: N,
    controlsColor: O,
    interactiveParams: V,
    texttrack: F,
    children: $,
    ...g
  }, p) => {
    const [P, C] = y("initial"), [I, A] = y(), { renderer: R } = T(H), b = K({
      url: t,
      autoplay: a,
      autopause: r,
      showControls: s,
      controlsColor: O,
      doNotTrack: n,
      interactiveParams: V,
      keyboard: m,
      loop: f,
      muted: c,
      pip: l,
      playsinline: u,
      quality: d,
      responsive: k,
      speed: E,
      texttrack: F,
      showTitle: _,
      transparent: j,
      showPortrait: h,
      autopip: N
    });
    return /* @__PURE__ */ i(
      Y.Provider,
      {
        value: {
          status: P,
          previewImageUrl: I,
          onInitPlayer() {
            R !== "canvas" && C("loading");
          }
        },
        children: /* @__PURE__ */ i(
          "div",
          {
            ...g,
            ref: (x) => {
              p !== null && (typeof p == "function" ? p(x) : p.current = x);
            },
            children: b === void 0 ? /* @__PURE__ */ i(ee, {}) : /* @__PURE__ */ B(D, { children: [
              $,
              /* @__PURE__ */ i(
                te,
                {
                  title: g.title,
                  autoplay: a,
                  playsinline: u,
                  videoUrl: b,
                  previewImageUrl: I,
                  loading: e,
                  showPreview: M,
                  renderer: R,
                  status: P,
                  onStatusChange: C,
                  onPreviewImageUrlChange: A
                }
              )
            ] })
          }
        )
      }
    );
  }
);
re.displayName = "Vimeo";
export {
  re as Vimeo
};
