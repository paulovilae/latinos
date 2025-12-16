const e = {
  defaultValue: { required: !1, control: "text", type: "string" },
  delayDuration: {
    description: `The duration from when the pointer enters the trigger until the tooltip gets opened.
@defaultValue 200`,
    required: !1,
    control: "number",
    type: "number"
  },
  dir: {
    required: !1,
    control: "radio",
    type: "string",
    options: ["ltr", "rtl"],
    description: "The text directionality of the element"
  },
  skipDelayDuration: {
    description: `How much time a user has to enter another trigger without incurring a delay again.
@defaultValue 300`,
    required: !1,
    control: "number",
    type: "number"
  },
  value: {
    required: !1,
    control: "text",
    type: "string",
    description: "Current value of the element"
  }
}, t = {}, r = {}, n = {}, o = {
  value: {
    required: !1,
    control: "text",
    type: "string",
    description: "Current value of the element"
  }
}, i = {
  active: { required: !1, control: "boolean", type: "boolean" }
}, a = {};
export {
  e as propsNavigationMenu,
  n as propsNavigationMenuContent,
  o as propsNavigationMenuItem,
  i as propsNavigationMenuLink,
  t as propsNavigationMenuList,
  a as propsNavigationMenuTrigger,
  r as propsNavigationMenuViewport
};
