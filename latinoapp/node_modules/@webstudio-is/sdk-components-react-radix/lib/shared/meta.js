const r = (t) => new Proxy(
  {},
  {
    get(o, e) {
      return `${t}${e}`;
    }
  }
), n = r(
  "@webstudio-is/sdk-components-react-radix:"
);
export {
  n as radix
};
