import { createContext as o } from "react";
const s = (t) => {
  const e = "ontouchstart" in window;
  (window.matchMedia("(max-width: 1024px)").matches || e) && t.requestFullscreen();
}, c = o({
  onInitPlayer: () => {
  },
  status: "initial"
});
export {
  c as VideoContext,
  s as requestFullscreen
};
