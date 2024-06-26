/**
 * 代理data
 */
export function def<T>(data: T): T {
  // key2node Map
  let key2node = new Map<string, { key: string; element: HTMLElement }[]>();

  for (const key in data) {
    let value = data[key];
    delete data[key];
    Object.defineProperty(data, key, {
      get() {
        if (currentFlag === FlagEnum.none) {
          let node = getCurrentNode();
          if (node) {
            let nodes = key2node.get(key) || [];
            nodes.push(node);
            key2node.set(key, nodes);
          }
        } else {
          flagFunctionGetter();
        }
        return value;
      },
      set(newValue) {
        let nodes = (key2node.get(key) || []) as any[];
        for (const { key, element } of nodes) {
          element[key] = newValue;
        }
        value = newValue;
      },
    });
  }
  return data;
}

// 条件渲染标记Map
// let condMap = new Map<string, boolean>();

/**
 * 处理是标记函数时的getter
 */
// export function flagFunctionGetter(key: string) {
//   switch (currentFlag) {
//     case FlagEnum.cond:
//       break;
//   }
// }

export type VNodeTuple = (Function | string | Record<string, any> | VNodeTuple)[];

// 当前绑定属性的节点
let getCurrentNode = function (): { key: string; element: HTMLElement } | null {
  return null;
};

/**
 * render渲染器
 */
export function render(nodes: VNodeTuple, parent: HTMLElement = document.body) {
  if (nodes.length === 0) return;

  for (let i = 0; i < nodes.length; i += 3) {
    renderVNode(nodes.slice(i, i + 3) as VNodeTuple, parent);
  }
}

/**
 * 渲染VNode
 */
function renderVNode(node: VNodeTuple, parent: HTMLElement) {
  flagFunctionHandler(node);
  const tag = node[0] as string;
  const props = node[1] as Record<string, any>;
  const children = node[2] as VNodeTuple;

  const element = document.createElement(tag);
  for (const key in props) {
    // 是否是事件
    let isEvent = key.startsWith("on");
    // 是否是获取器且key不是事件
    let isGetter = typeof props[key] === "function" && !isEvent;
    if (isGetter) {
      getCurrentNode = () => ({
        key,
        element,
      });
      element[key] = props[key]();
    } else {
      // 如果是事件
      if (isEvent) {
        element.addEventListener(key.slice(2).toLowerCase(), props[key]);
      } else {
        element[key] = props[key];
      }
    }
  }
  parent.appendChild(element);
  currentFlag = FlagEnum.none;
  render(children, element);
}

// 标记枚举
enum FlagEnum {
  // 无标记
  none = "none",
  // cond标记，表示该节点依据该标记的值来渲染
  cond = "cond",
}

// 当前的标记类型
let currentFlag: FlagEnum;

/**
 * 处理标记函数
 */
export function flagFunctionHandler(node: VNodeTuple) {
  // 处理当前数组靠前的标记函数，直到遇到非函数为止
  while (typeof node[0] === "function") {
    // 取出标记函数
    const flagFunction = node.shift() as Function;
    // 获取当前函数的形参
    const args = flagFunction.toString().match(/\(([^)]*)\)/)?.[1];
    // 如果有形参
    if (args) {
      // 将形参转换为数组，只取第一个
      const [arg] = args.split(",").map((arg) => arg.trim());
      currentFlag = arg as FlagEnum;
    }
    // 执行标记函数
    flagFunction();
    currentFlag = FlagEnum.none;
  }
}
