const e = {
  activationMode: {
    description: `Whether a tab is activated automatically or manually.
@defaultValue automatic`,
    required: !1,
    control: "radio",
    type: "string",
    options: ["automatic", "manual"]
  },
  defaultValue: {
    description: "The value of the tab to select by default, if uncontrolled",
    required: !1,
    control: "text",
    type: "string"
  },
  dir: {
    description: "The direction of navigation between toolbar items.",
    required: !1,
    control: "radio",
    type: "string",
    options: ["ltr", "rtl"]
  },
  orientation: {
    description: `The orientation the tabs are layed out.
Mainly so arrow navigation is done accordingly (left & right vs. up & down)
@defaultValue horizontal`,
    required: !1,
    control: "radio",
    type: "string",
    options: ["horizontal", "vertical"]
  },
  value: {
    description: "The value for the selected tab, if controlled",
    required: !1,
    control: "text",
    type: "string"
  }
}, t = {
  loop: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Whether to loop the media resource"
  }
}, o = {
  value: {
    required: !1,
    control: "text",
    type: "string",
    description: "Current value of the element"
  }
}, r = {
  value: {
    required: !1,
    control: "text",
    type: "string",
    description: "Current value of the element"
  }
};
export {
  e as propsTabs,
  r as propsTabsContent,
  t as propsTabsList,
  o as propsTabsTrigger
};
