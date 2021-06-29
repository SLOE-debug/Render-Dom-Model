let NodeAttrs = ["f", "itemas", "if", "show", "title", "value"];

export function IsNodeAttr(key: string) {
  key = key.replace(/[0-9]|_/gi, "");
  return NodeAttrs.find((m) => m == key);
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
