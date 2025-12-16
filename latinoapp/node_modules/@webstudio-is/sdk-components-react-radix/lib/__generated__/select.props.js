const e = {
  autoComplete: {
    required: !1,
    control: "text",
    type: "string",
    description: "Hint for form autofill feature"
  },
  defaultValue: { required: !1, control: "text", type: "string" },
  dir: {
    required: !1,
    control: "radio",
    type: "string",
    options: ["ltr", "rtl"],
    description: "The text directionality of the element"
  },
  disabled: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether the form control is disabled"
  },
  form: {
    required: !1,
    control: "text",
    type: "string",
    description: "Associates the element with a form element"
  },
  name: {
    required: !1,
    control: "text",
    type: "string",
    description: "Name of the element to use for form submission and in the form.elements API"
  },
  open: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether the dialog box is showing"
  },
  required: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether the control is required for form submission"
  },
  value: {
    required: !1,
    control: "text",
    type: "string",
    description: "Current value of the element"
  }
}, t = {}, o = {
  placeholder: {
    required: !1,
    control: "text",
    type: "string",
    description: "User-visible label to be placed within the form control"
  }
}, r = {
  align: {
    required: !1,
    control: "radio",
    type: "string",
    options: ["center", "start", "end"]
  },
  alignOffset: { required: !1, control: "number", type: "number" },
  arrowPadding: { required: !1, control: "number", type: "number" },
  avoidCollisions: { required: !1, control: "boolean", type: "boolean" },
  hideWhenDetached: { required: !1, control: "boolean", type: "boolean" },
  sideOffset: { required: !1, control: "number", type: "number" },
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
}, n = {
  nonce: {
    required: !1,
    control: "text",
    type: "string",
    description: "Cryptographic nonce used in Content Security Policy checks [CSP]"
  }
}, i = {
  disabled: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether the form control is disabled"
  },
  textValue: { required: !1, control: "text", type: "string" },
  value: {
    required: !0,
    control: "text",
    type: "string",
    description: "Current value of the element"
  }
}, l = {}, s = {};
export {
  e as propsSelect,
  r as propsSelectContent,
  i as propsSelectItem,
  l as propsSelectItemIndicator,
  s as propsSelectItemText,
  t as propsSelectTrigger,
  o as propsSelectValue,
  n as propsSelectViewport
};
