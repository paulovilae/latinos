const e = {
  open: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Show or hide the content of this component on the canvas. This will not affect the initial state of the component."
  }
}, o = {}, t = {
  align: {
    required: !1,
    control: "radio",
    type: "string",
    defaultValue: "center",
    options: ["center", "start", "end"]
  },
  alignOffset: {
    required: !1,
    control: "number",
    type: "number",
    description: "The offset in pixels from the “start“ or “end“ alignment options."
  },
  arrowPadding: { required: !1, control: "number", type: "number" },
  avoidCollisions: { required: !1, control: "boolean", type: "boolean" },
  hideWhenDetached: {
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !0
  },
  side: {
    required: !1,
    control: "select",
    type: "string",
    options: ["top", "right", "bottom", "left"],
    description: "The preferred alignment against the Trigger. May change when collisions occur."
  },
  sideOffset: {
    required: !1,
    control: "number",
    type: "number",
    defaultValue: 4,
    description: "The distance in pixels between the Content and the Trigger."
  },
  sticky: {
    required: !1,
    control: "radio",
    type: "string",
    options: ["partial", "always"]
  },
  updatePositionStrategy: {
    required: !1,
    control: "radio",
    type: "string",
    options: ["always", "optimized"]
  }
}, r = {};
export {
  e as propsPopover,
  r as propsPopoverClose,
  t as propsPopoverContent,
  o as propsPopoverTrigger
};
