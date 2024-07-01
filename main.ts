import { IdentifierEnum, VNodeTuple } from "./src/render";

// 扩展Function
declare global {
  interface Function {
    /**
     * 当前标记函数绑定的VNodeTuple
     */
    node: VNodeTuple;
    /**
     * 当前标记函数绑定的Element节点
     */
    el: HTMLElement | Comment;
    /**
     * 获取当前标记函数的标记
     */
    GetIdentifier(): IdentifierEnum;
    /**
     * 当前标记函数的标记缓存
     */
    identifier: IdentifierEnum;
  }
  interface Array<T> {
    /**
     * 获取最后一个元素
     */
    last(): T;
  }
}

Array.prototype.last = function () {
  return this[this.length - 1];
};

Function.prototype.GetIdentifier = function () {
  // 如果已经获取过了，直接返回
  if (this.identifier) {
    return this.identifier;
  }

  // 函数字符串
  let str = this.toString();
  // 获取函数的第一个参数
  let variableName = "";
  const match = str.match(/\((.*?)\)/);
  if (match) {
    const params = match[1].split(",");
    variableName = params[0].trim();
  }
  const identifier = variableName.trim() as IdentifierEnum;
  this.identifier = identifier;
  return identifier;
};

import "./src/index";
