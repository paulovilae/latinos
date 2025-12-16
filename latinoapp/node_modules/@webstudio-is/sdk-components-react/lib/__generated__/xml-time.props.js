const e = {
  dateStyle: {
    required: !1,
    control: "radio",
    type: "string",
    defaultValue: "short",
    options: ["long", "short"]
  },
  datetime: {
    required: !1,
    control: "text",
    type: "string",
    defaultValue: "dateTime attribute is not set",
    description: "Machine-readable value"
  }
};
export {
  e as props
};
