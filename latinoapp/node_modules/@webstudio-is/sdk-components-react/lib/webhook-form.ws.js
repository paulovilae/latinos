import { WebhookFormIcon as o } from "@webstudio-is/icons/svg";
import { form as e } from "@webstudio-is/sdk/normalize.css";
import { props as r } from "./__generated__/webhook-form.props.js";
const c = {
  label: "Webhook Form",
  icon: o,
  presetStyle: {
    form: e
  },
  states: [
    { selector: "[data-state=error]", label: "Error" },
    { selector: "[data-state=success]", label: "Success" }
  ],
  initialProps: ["id", "class", "state", "action"],
  props: {
    ...r,
    action: {
      type: "resource",
      control: "resource",
      description: "The URI of a program that processes the information submitted via the form.",
      required: !1
    }
  }
};
export {
  c as meta
};
