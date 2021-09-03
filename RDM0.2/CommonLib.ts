let NodeAttrs = ["f", "itemas", "if", "show", "title", "value"];

export function IsNodeAttr(key: string) {
  key = key.replace(/[0-9]|_/gi, "");
  return NodeAttrs.find((m) => m == key);
}

export function GetGuid() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  );
}

export function markRDM(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  descriptor.value["mark"] = target.constructor.name;
}

export function GetPropByItem(keys, Item: object) {
  let v = Item;
  let m;
  let k = keys;
  keys.split(".").forEach((s) => {
    if (!v) return;
    m = v;
    v = v[s];
    k = s;
  });
  return {
    m,
    v,
    k,
  };
}
