/**
 * 代理data
 */
export function Def<T>(data: T, parentPath: string = ""): T {
  // key2node Map
  let key2node = new Map<string, { key: string; element: HTMLElement }[]>();
  // key2IdentifierFunction Map
  let key2IdentifierFunction = new Map<string, Function[]>();

  for (const key in data) {
    // 如果是数组，则遍历数组，递归代理
    if (Array.isArray(data[key])) {
      data[key] = Def(data[key], parentPath + key + ".");
    }

    let type = typeof data[key];
    if (type == "function") continue;

    let value = data[key];
    delete data[key];
    Object.defineProperty(data, key, {
      get() {
        if (!isHandlingIdentifierFunction) {
          let node = GetCurrentNode?.();
          if (node) {
            let { element, isUnmount } = node;
            let nodes = key2node.get(key) || [];
            if (isUnmount) nodes = nodes.filter((node) => node.element != element);
            else nodes.push(node);
            key2node.set(key, nodes);
          }
        } else {
          // 获取最新的标记函数
          const identifierFunction = identifierFunctions.last();
          // 获取当前标记函数的标记
          const identifier = identifierFunction.GetIdentifier();
          switch (identifier) {
            case IdentifierEnum.i:
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
let GetCurrentNode: () => { key: string; element: HTMLElement; isUnmount: boolean } | null = null;

/**
 * render渲染器
 */
export function Render(nodes: VNodeTuple, parent: HTMLElement = document.body, isUnmount = false) {
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
    RenderVNode(node, parent, isUnmount);
  }
}

/**
 * 渲染VNode
 * @param node VNode
 * @param parent 父节点
 */
function RenderVNode(node: VNodeTuple, parent: HTMLElement, isUnmount = false, item: Function = null) {
  const tag = node[0] as string;
  const props = node[1] as Record<string, any>;
  const children = node[2] as VNodeTuple;

  let identifierFunction = identifierFunctions.last();

  // 原el
  let el = identifierFunction?.el;

  // 如果在此处isUnmount 就是true，说明其父节点已被卸载，直接卸载当前节点
  if (isUnmount) {
    if (identifierFunction) {
      identifierFunction.el = null;
    }
  }

  if (identifierFunction) {
    // 如果当前 identifierFunction 不存在 node，则绑定 node
    identifierFunction.node = identifierFunction.node || node;

    // 获取当前标记函数的标记
    let identifier = identifierFunction.GetIdentifier();
    let result = identifierFunction();
    switch (identifier) {
      case IdentifierEnum.i:
        if (result == false) {
          // 插入注释节点
          let comment = document.createComment("if");
          // 如果当前的 el 不是注释节点，则替换当前el
          if (el && el.nodeType !== Node.COMMENT_NODE) {
            // 替换当前el
            el ? parent.replaceChild(comment, el) : parent.appendChild(comment);
            identifierFunction.el = comment;
          }
          isUnmount = true;
        }
        break;
      case IdentifierEnum.f:
        identifierFunctions = [];
        for (let i = 0; i < result.length; i++) {
          let m = () => result[i];
          RenderVNode([...node], parent, isUnmount, m);
        }
        return;
    }
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
        element: isUnmount ? (el as HTMLElement) : element,
        isUnmount,
      });
      element[key] = props[key](item?.());
    } else {
      // 如果是事件
      if (isEvent) {
        element[isUnmount ? "removeEventListener" : "addEventListener"](key.slice(2).toLowerCase(), props[key]);
      } else {
        element[key] = props[key];
      }
    }
  }
  GetCurrentNode = null;
  if (!isUnmount) {
    // 如果存在el（即注释节点），则替换el，否则直接插入
    el ? parent.replaceChild(element, el) : parent.appendChild(element);

    identifierFunction && (identifierFunction.el = element);
  }
  identifierFunctions = [];
  Render(children, element, isUnmount);
}

// 标记枚举
export enum IdentifierEnum {
  // i标记（i的缩写），表示该节点依据该标记的值来渲染
  i = "i",
  // f标记（for的缩写），表示该节点依据该标记的值来循环渲染
  f = "f",
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
    identifierFunction();
  }
  isHandlingIdentifierFunction = false;
}
