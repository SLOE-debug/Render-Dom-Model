let DataTypes = ["object", "symbol", "undefined"];
let NodeAttrs = ["f", "itemas", "if", "show", "title", "value"];

export function IsValueType(item): boolean {
  let DataType = typeof item;
  return !DataTypes.includes(DataType);
}

export function IsNodeAttr(key) {
  return NodeAttrs.includes(key);
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
