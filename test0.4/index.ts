import { VNodeTuple, def, render } from "../RDM0.4/render";

const data = def({
  value: "test",
  /// 是否渲染
  cond: true,
});

let nodes: VNodeTuple = [
  (cond) => data.cond,
  "button",
  {
    onclick: () => {
      data.value = Math.random().toString();
    },
    textContent: "按钮",
  },
  [],
  "span",
  {
    textContent: data.value,
  },
  [],
];

render(nodes);
