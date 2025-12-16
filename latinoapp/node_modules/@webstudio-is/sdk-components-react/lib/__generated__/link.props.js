const e = {
  download: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether to download the resource instead of navigating to it, and its filename if so"
  },
  prefetch: {
    required: !1,
    control: "select",
    type: "string",
    options: ["none", "intent", "render", "viewport"]
  },
  preventScrollReset: { required: !1, control: "boolean", type: "boolean" },
  reloadDocument: { required: !1, control: "boolean", type: "boolean" },
  replace: { required: !1, control: "boolean", type: "boolean" },
  target: {
    required: !1,
    control: "select",
    type: "string",
    options: ["_self", "_blank", "_parent", "_top"],
    description: "Navigable for form submission"
  }
};
export {
  e as props
};
