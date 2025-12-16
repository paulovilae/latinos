import { jsx as i } from "react/jsx-runtime";
import { forwardRef as m, useContext as t } from "react";
import { Image as a } from "./image.js";
import { VideoContext as g } from "./shared/video.js";
const n = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkOAMAANIAzr59FiYAAAAASUVORK5CYII=", s = m(({ src: A, ...e }, o) => {
  const r = t(g);
  return /* @__PURE__ */ i(
    a,
    {
      ...e,
      src: String(r.previewImageUrl ?? A ?? n),
      ref: o
    }
  );
});
s.displayName = "VimeoPreviewImage";
export {
  s as VimeoPreviewImage
};
