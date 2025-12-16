const o = {
  open: {
    required: !1,
    control: "boolean",
    type: "boolean",
    description: "Show or hide the content of this component on the canvas. This will not affect the initial state of the component."
  }
}, t = {}, e = {}, n = {}, s = {}, i = {
  tag: {
    required: !1,
    control: "select",
    type: "string",
    options: ["h2", "h3", "h1", "h4", "h5", "h6"]
  }
}, p = {};
export {
  o as propsDialog,
  s as propsDialogClose,
  n as propsDialogContent,
  p as propsDialogDescription,
  e as propsDialogOverlay,
  i as propsDialogTitle,
  t as propsDialogTrigger
};
