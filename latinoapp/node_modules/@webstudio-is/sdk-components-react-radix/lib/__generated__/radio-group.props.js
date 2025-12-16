const e = {
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
  loop: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether to loop the media resource"
  },
  name: {
    required: !1,
    control: "text",
    type: "string",
    description: "Name of the element to use for form submission and in the form.elements API"
  },
  orientation: {
    required: !1,
    control: "radio",
    type: "string",
    options: ["horizontal", "vertical"]
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
}, o = {
  checked: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether the control is checked"
  },
  required: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether the control is required for form submission"
  },
  value: {
    required: !0,
    control: "text",
    type: "string",
    description: "Current value of the element"
  }
}, r = {};
export {
  e as propsRadioGroup,
  r as propsRadioGroupIndicator,
  o as propsRadioGroupItem
};
