const e = {
  delayDuration: {
    description: "The delay before the Tooltip shows after the Trigger is hovered, in milliseconds. If no value is specified, the default is 700ms",
    required: !1,
    control: "number",
    type: "number"
  },
  disableHoverableContent: {
    description: "When toggled, prevents the Tooltip content from showing when the Trigger is hovered.",
    required: !1,
    control: "boolean",
    type: "boolean"
  },
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
    options: ["center", "start", "end"]
  },
  alignOffset: {
    required: !1,
    control: "number",
    type: "number",
    description: "The offset in pixels from the “start“ or “end“ alignment options."
  },
  "aria-label": {
    description: "A more descriptive label for accessibility purpose",
    required: !1,
    control: "text",
    type: "string"
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
};
export {
  e as propsTooltip,
  t as propsTooltipContent,
  o as propsTooltipTrigger
};
