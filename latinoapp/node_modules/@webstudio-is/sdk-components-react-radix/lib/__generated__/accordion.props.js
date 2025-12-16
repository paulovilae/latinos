const e = {
  collapsible: {
    description: "Whether an accordion item can be collapsed after it has been opened.",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !1
  },
  defaultValue: {
    description: "The value of the item whose content is expanded when the accordion is initially rendered. Use\n`defaultValue` if you do not need to control the state of an accordion.",
    required: !1,
    control: "text",
    type: "string"
  },
  dir: {
    description: "The language read direction.",
    required: !1,
    control: "radio",
    type: "string",
    options: ["ltr", "rtl"]
  },
  disabled: {
    description: `Whether or not an accordion is disabled from user interaction.
@defaultValue false`,
    required: !1,
    control: "boolean",
    type: "boolean"
  },
  orientation: {
    description: "The layout in which the Accordion operates.",
    required: !1,
    control: "radio",
    type: "string",
    defaultValue: "vertical",
    options: ["horizontal", "vertical"]
  },
  value: {
    description: "The controlled stateful value of the accordion item whose content is expanded.",
    required: !1,
    control: "text",
    type: "string"
  }
}, o = {
  disabled: {
    description: `Whether or not an accordion item is disabled from user interaction.
@defaultValue false`,
    required: !1,
    control: "boolean",
    type: "boolean"
  },
  value: {
    required: !1,
    control: "text",
    type: "string",
    description: "Current value of the element"
  }
}, t = {}, r = {}, n = {};
export {
  e as propsAccordion,
  n as propsAccordionContent,
  t as propsAccordionHeader,
  o as propsAccordionItem,
  r as propsAccordionTrigger
};
