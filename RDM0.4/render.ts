/**
 * 代理data
 */
export function Def<T>(data: T): T {
  // key2node Map
  let key2node = new Map<string, { key: string; element: HTMLElement }[]>();
  // key2IdentifierFunction Map
  let key2IdentifierFunction = new Map<string, Function[]>();

  for (const key in data) {
    let value = data[key];
    delete data[key];
    Object.defineProperty(data, key, {
      get() {
        if (!isHandlingIdentifierFunction) {
          let node = GetCurrentNode();
          if (node) {
            let nodes = key2node.get(key) || [];
            nodes.push(node);
            key2node.set(key, nodes);
          }
        } else {
          // 获取最新的标记函数
          const identifierFunction = identifierFunctions.last();
          // 获取当前标记函数的标记
          const identifier = identifierFunction.GetIdentifier();
          switch (identifier) {
            case IdentifierEnum.cond:
              let funcs = key2IdentifierFunction.get(key) || [];
              funcs.push(identifierFunction);
              key2IdentifierFunction.set(key, funcs);
              break;
          }
        }
        return value;
      },
      set(newValue) {
        value = newValue;
        // 获取与当前key相关的标记函数，并执行
        const funcs = key2IdentifierFunction.get(key);
        if (funcs) {
          for (const func of funcs) {
            identifierFunctions.push(func);
            RenderVNode(func.node, func.el.parentElement || document.body);
          }
        }

        let nodes = (key2node.get(key) || []) as any[];
        for (const { key, element } of nodes) {
          element[key] = newValue;
        }
      },
    });
  }
  return data;
}

export type VNodeTuple = (Function | string | Record<string, any> | VNodeTuple)[];

// 当前正在使用代理 data 的Element节点
let GetCurrentNode = function (): { key: string; element: HTMLElement } | null {
  return null;
};

/**
 * render渲染器
 */
export function Render(nodes: VNodeTuple, parent: HTMLElement = document.body) {
  if (nodes.length === 0) return;

  // 副本 nodes
  let duplicate = [...nodes];

  // 获取前3个元素
  while (duplicate.length > 0) {
    let node = duplicate.splice(0, 3) as VNodeTuple;
    // 处理标记函数
    identifierFunctionHandler(node);
    // 如果处理完标记函数后，node的长度小于3，则补全至3个
    if (node.length !== 3) {
      let lackCount = 3 - node.length;
      let lackNodes = duplicate.splice(0, lackCount);
      node.push(...lackNodes);
    }
    RenderVNode(node, parent);
  }
}

/**
 * 渲染VNode
 * @param node VNode
 * @param parent 父节点
 * @param isUnmount 是否卸载当前节点
 */
function RenderVNode(node: VNodeTuple, parent: HTMLElement, isUnmount = false) {
  const tag = node[0] as string;
  const props = node[1] as Record<string, any>;
  const children = node[2] as VNodeTuple;

  let identifierFunction = identifierFunctions.last();
  // 原el
  let el = identifierFunction?.el;
  // 如果 el 已经脱离文档了
  if (el && !parent.contains(el)) {
    el.remove();
    el = null;
  }

  if (identifierFunction) {
    // 如果当前 identifierFunction 不存在 node，则绑定 node
    identifierFunction.node = identifierFunction.node || node;

    // 获取当前标记函数的标记
    let identifier = identifierFunction.GetIdentifier();
    let result = identifierFunction.result !== undefined ? identifierFunction.result : identifierFunction();
    delete identifierFunction.result;
    switch (identifier) {
      case IdentifierEnum.cond:
        if (result == false) {
          // 插入注释节点
          let comment = document.createComment("cond");
          // 替换当前el
          el ? parent.replaceChild(comment, el) : parent.appendChild(comment);
          identifierFunction.el = comment;
          isUnmount = true;
        }
    }
  }

  if (isUnmount) {
    // 应卸载当前节点和子节点
    return;
  }

  const element = document.createElement(tag);
  for (const key in props) {
    // 是否是事件
    let isEvent = key.startsWith("on");
    // 是否是获取器且key不是事件
    let isGetter = typeof props[key] === "function" && !isEvent;
    if (isGetter) {
      GetCurrentNode = () => ({
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
  GetCurrentNode = () => null;
  // 如果存在el（即注释节点），则替换el，否则直接插入
  el ? parent.replaceChild(element, el) : parent.appendChild(element);

  identifierFunction && (identifierFunction.el = element);
  identifierFunctions = [];
  Render(children, element);
}

// 标记枚举
export enum IdentifierEnum {
  // cond标记，表示该节点依据该标记的值来渲染
  cond = "cond",
}

/**
 * 当前的标记函数数组
 */
let identifierFunctions: Function[] = [];

/**
 * 是否正在处理标记函数
 */
let isHandlingIdentifierFunction = false;

/**
 * 处理标记函数
 */
export function identifierFunctionHandler(node: VNodeTuple) {
  isHandlingIdentifierFunction = true;
  // 处理当前数组靠前的标记函数，直到遇到非函数为止
  while (typeof node[0] === "function") {
    let identifierFunction = node.shift() as Function;

    identifierFunctions.push(identifierFunction);
    // 执行标记函数
    let result = identifierFunction();
    // 缓存标记函数的结果
    identifierFunction.result = result;
  }
  isHandlingIdentifierFunction = false;
}
