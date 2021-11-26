import { NodeStructure, ObjectStructure } from "./typeLib";

function handleObjectStructure(node: ObjectStructure): HTMLElement {
  let dom = document.createElement(node.t);
  if (dom.nodeName == "INPUT" && "value" in node) {
    dom.addEventListener("input", () => {
      node.value = (dom as HTMLInputElement).value;
    });
  }
  for (const key in node) {
    let attrType = typeof node[key];
    switch (attrType) {
      case "function":
        dom.addEventListener(key, node[key]);
        break;
      case "object":
        if (key == "data") break;
        let propDes = Object.getOwnPropertyDescriptor(node[key], key);
        let v;
        try {
          v = (propDes["get"] as any)(dom);
        } catch {
          v = node[key][key];
        }
        if (key in dom) {
          dom[key] = v;
        }
        break;
      default:
        if (key in dom) {
          dom[key] = node[key];
        }
        break;
    }
  }
  return dom;
}

export function r($exp): any {
  return { $exp };
}

export function def<T>(data: T) {
  let rel: { [x: string]: { [x: string]: string } } = {};
  for (const key in data) {
    let doms = [];
    let temp = data[key] as any;
    Object.defineProperty(data, key, {
      get(n) {
        if (n && n != 1) doms.push(n);
        if (Object.prototype.hasOwnProperty.call(temp, "$exp")) {
          let tempExp = temp.$exp as string;
          tempExp.match(/(?<=<).*?(?=>)/gi).forEach((m) => {
            tempExp = tempExp.replace(new RegExp(`<${m}>`), data[m]);
            if (rel[m]) rel[m][key] = key;
            else rel[m] = { [key]: key };
          });
          if (n == 1) {
            doms.forEach((n) => {
              if (key in n) {
                n[key] = tempExp;
              }
            });
          }
          return tempExp;
        }
        return temp;
      },
      set(v) {
        temp = v;
        doms.forEach((n) => {
          if (key in n) {
            n[key] = v;
          }
        });
        if (rel[key]) {
          for (const k in rel[key]) {
            let propDes = Object.getOwnPropertyDescriptor(data, k);
            (propDes as any).get(1);
          }
        }
      },
    } as any);
  }
  return data;
}

export function render(
  nodeStructures: Array<NodeStructure>,
  parent?: HTMLElement
) {
  nodeStructures.forEach((m) => {
    if (m) {
      let type = typeof m;
      let dom;
      switch (type) {
        case "string":
          dom = document.createElement(m.toString());
          break;
        case "object":
          if (Array.isArray(m)) {
            render(m, parent);
          } else {
            dom = handleObjectStructure(m as ObjectStructure);
          }
          break;
        default:
          break;
      }
      if (dom) (parent ? parent : document.body).appendChild(dom);
    }
  });
}
