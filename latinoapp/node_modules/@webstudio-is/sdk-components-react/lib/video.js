import { jsx as p } from "react/jsx-runtime";
import { forwardRef as y, useId as V, useContext as N, useEffect as x } from "react";
import { ReactSdkContext as I } from "@webstudio-is/react-sdk/runtime";
const c = "data-ws-video-id", S = {
  HAVE_METADATA: 1
}, _ = y(
  ({
    $progress: r,
    $visible: n,
    $timeline: d,
    $webstudio$canvasOnly$assetId: w,
    children: l,
    src: o,
    ...b
  }, m) => {
    const u = V(), A = {
      [c]: u
    }, { videoLoader: f } = N(I), T = o && f ? f({ src: o }) : o;
    return x(() => {
      if (r === void 0 || n === void 0)
        return;
      const e = document.querySelector(`[${c}="${u}"]`);
      if (e === null || !(e instanceof HTMLVideoElement))
        return;
      if (e.play().catch(() => {
      }), e.pause(), d)
        return r.subscribe((t) => {
          if (e.readyState < S.HAVE_METADATA || (e.paused || e.pause(), e.seeking))
            return;
          let s = e.duration;
          Number.isNaN(s) || (Number.isFinite(s) || (s = 60), e.currentTime = (t ?? 0) * s);
        });
      let i = !1, a = !1;
      const v = n.subscribe((t) => {
        a = t, a === !1 && i === !1 && !e.loop && (e.currentTime = 0);
      }), E = r.subscribe((t) => {
        if (i && (t === void 0 || t === 0 || t === 1)) {
          i = !1, e.pause(), a === !1 && i === !1 && !e.loop && (e.currentTime = 0);
          return;
        }
        i || (i = !0, e.ended || e.play().catch(() => {
        }));
      });
      return () => {
        E(), v();
      };
    }, [r, d, n, u]), /* @__PURE__ */ p("video", { src: T, ...b, ...A, ref: m, children: l });
  }
);
_.displayName = "Video";
export {
  _ as Video
};
