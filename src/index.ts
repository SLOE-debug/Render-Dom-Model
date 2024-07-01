import { VNodeTuple, Def, Render } from "./render";

const data = Def({
  value: "test",
  // 是否显示（显示/隐藏 input）
  show: true,
  // 是否渲染 input
  renderInput: true,
  // 数组
  arr: [1, 2, 3],
});

let nodes: VNodeTuple = [
  "button",
  {
    onClick: () => {
      data.show = !data.show;
    },
    textContent: "显示/隐藏（显示/隐藏 input）",
  },
  [],
  (i) => data.show,
  "div",
  {
    onClick: () => {
      data.renderInput = !data.renderInput;
    },
    textContent: "显示/隐藏 input",
  },
  [],
  (f) => data.arr,
  "div",
  {
    textContent: (m) => m,
  },
  [],
  "input",
  {
    value: () => data.arr[0],
    onInput: (e) => {
      data.arr[0] = e.target.value;
    },
  },
  [],
];

// for (let i = 0; i < 2; i++) {
//   (nodes[6] as VNodeTuple).push(
//     ...[
//       (i) => data.renderInput,
//       "input",
//       {
//         value: () => data.value,
//         onInput: (e) => {
//           data.value = e.target.value;
//         },
//       },
//       [],
//     ]
//   );
// }

Render(nodes);
