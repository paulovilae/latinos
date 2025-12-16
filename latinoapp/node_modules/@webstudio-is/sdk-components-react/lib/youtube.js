import { jsx as u, jsxs as E, Fragment as O } from "react/jsx-runtime";
import { forwardRef as x, useState as p, useContext as S, useRef as T, useEffect as y } from "react";
import { ReactSdkContext as A } from "@webstudio-is/react-sdk/runtime";
import { VideoContext as N, requestFullscreen as P } from "./shared/video.js";
const U = "https://www.youtube-nocookie.com", V = "https://www.youtube.com", j = "https://img.youtube.com", L = (e) => {
  if (e)
    try {
      const t = new URL(e);
      return t.pathname === "/embed" ? void 0 : t.hostname === "youtu.be" ? t.pathname.slice(1) : t.searchParams.get("v") || t.pathname.split("/").pop();
    } catch {
      return e;
    }
}, D = (e, t) => {
  var o, n;
  const s = L(e.url), r = new URL(t);
  if (s)
    r.pathname = `/embed/${s}`;
  else if (e.url)
    try {
      const c = new URL(e.url);
      r.pathname = c.pathname, r.search = c.search;
    } catch {
    }
  const i = Object.keys(e), a = {};
  a.autoplay = "1";
  for (const c of i)
    if (e[c] !== void 0)
      switch (c) {
        case "autoplay":
          e.autoplay && e.muted === void 0 && (a.mute = "1");
          break;
        case "muted":
          a.mute = e.muted ? "1" : "0";
          break;
        case "showControls":
          a.controls = e.showControls ? "1" : "0";
          break;
        case "showRelatedVideos":
          a.rel = e.showRelatedVideos ? "1" : "0";
          break;
        case "keyboard":
          a.keyboard = e.keyboard ? "1" : "0";
          break;
        case "loop":
          a.loop = e.loop ? "1" : "0", e.loop && (e.playlist ?? "").trim() === "" && (a.playlist = s);
          break;
        case "inline":
          a.playsinline = e.inline ? "1" : "0";
          break;
        case "allowFullscreen":
          a.fs = e.allowFullscreen ? "1" : "0";
          break;
        case "captionLanguage":
          a.cc_lang_pref = e.captionLanguage;
          break;
        case "showCaptions":
          a.cc_load_policy = e.showCaptions ? "1" : "0";
          break;
        case "showAnnotations":
          a.iv_load_policy = e.showAnnotations ? "1" : "3";
          break;
        case "startTime":
          a.start = (o = e.startTime) == null ? void 0 : o.toString();
          break;
        case "endTime":
          a.end = (n = e.endTime) == null ? void 0 : n.toString();
          break;
        case "disableKeyboard":
          a.disablekb = e.disableKeyboard ? "1" : "0";
          break;
        case "language":
          a.hl = e.language;
          break;
        case "listId":
          a.list = e.listId;
          break;
        case "listType":
          a.listType = e.listType;
          break;
        case "color":
          a.color = e.color;
          break;
        case "origin":
          a.origin = e.origin;
          break;
        case "referrer":
          a.widget_referrer = e.referrer;
          break;
        case "playlist":
          a.playlist = e.playlist;
          break;
        case "enablejsapi":
          a.enablejsapi = e.enablejsapi ? "1" : "0";
          break;
      }
  return Object.entries(a).forEach(([c, l]) => {
    l !== void 0 && r.searchParams.append(c, l.toString());
  }), r.toString();
}, R = (e) => {
  const t = document.createElement("link");
  t.rel = "preconnect", t.href = e, t.crossOrigin = "true", document.head.appendChild(t);
};
let _ = !1;
const F = (e) => {
  if (!(_ || window.matchMedia("(hover: none)").matches)) {
    try {
      const t = new URL(e);
      R(t.origin);
    } catch {
    }
    R(j), _ = !0;
  }
}, Y = (e) => new URL(`${j}/vi/${e}/maxresdefault.jpg`), K = () => /* @__PURE__ */ u("div", { className: "flex w-full h-full items-center justify-center text-lg", children: 'Open the "Settings" panel and paste a video URL, e.g. https://youtube.com/watch?v=dQw4w9WgXcQ' }), M = ({
  title: e,
  status: t,
  loading: s,
  videoUrl: r,
  previewImageUrl: i,
  autoplay: a,
  inline: o,
  renderer: n,
  showPreview: c,
  onStatusChange: l,
  onPreviewImageUrlChange: d
}) => {
  const [h, m] = p(0), b = T(null);
  return y(() => {
    a && n !== "canvas" && t === "initial" && l("loading");
  }, [a, t, n, l]), y(() => {
    n !== "canvas" && F(r);
  }, [n, r]), y(() => {
    const f = L(r);
    if (!f || !c) {
      d(void 0);
      return;
    }
    i || d(Y(f));
  }, [d, c, r, i]), n === "canvas" || t === "initial" ? null : /* @__PURE__ */ u(
    "iframe",
    {
      ref: b,
      title: e,
      src: r,
      loading: s,
      allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
      allowFullScreen: !0,
      style: {
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity: h,
        transition: "opacity 1s",
        border: "none"
      },
      onLoad: () => {
        l("ready"), m(1), !o && !a && b.current && P(b.current);
      }
    }
  );
}, $ = x(
  ({
    url: e,
    loading: t = "lazy",
    autoplay: s,
    showPreview: r,
    showAnnotations: i,
    showCaptions: a,
    showControls: o,
    allowFullscreen: n,
    keyboard: c,
    children: l,
    privacyEnhancedMode: d,
    inline: h = !1,
    ...m
  }, b) => {
    const [f, g] = p("initial"), [w, C] = p(), { renderer: k } = S(A), I = d ?? !0 ? U : V, v = D(
      {
        ...m,
        inline: h,
        url: e,
        keyboard: c,
        showAnnotations: i,
        showCaptions: a,
        allowFullscreen: n,
        showControls: o,
        autoplay: s,
        enablejsapi: !1
      },
      I
    );
    return /* @__PURE__ */ u(
      N.Provider,
      {
        value: {
          status: f,
          previewImageUrl: w,
          onInitPlayer() {
            k !== "canvas" && g("loading");
          }
        },
        children: /* @__PURE__ */ u("div", { ...m, ref: b, children: v ? /* @__PURE__ */ E(O, { children: [
          l,
          /* @__PURE__ */ u(
            M,
            {
              title: m.title,
              autoplay: s,
              videoUrl: v,
              previewImageUrl: w,
              loading: t,
              inline: h,
              showPreview: r,
              renderer: k,
              status: f,
              onStatusChange: g,
              onPreviewImageUrlChange: C
            }
          )
        ] }) : /* @__PURE__ */ u(K, {}) })
      }
    );
  }
);
$.displayName = "YouTube";
export {
  $ as YouTube
};
