import { VNodeTuple, Def, Render } from "../RDM0.4/render";

const data = Def({
  value: "test",
  // 是否显示（显示/隐藏 input）
  show: true,
  // 是否渲染 input
  renderInput: true,
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
  (cond) => data.show,
  "div",
  {
    onClick: () => {
      data.renderInput = !data.renderInput;
    },
    textContent: "显示/隐藏 input",
  },
  [],
];

for (let i = 0; i < 2500; i++) {
  (nodes[6] as VNodeTuple).push(
    ...[
      (cond) => data.renderInput,
      "input",
      {
        value: () => data.value,
        onInput: (e) => {
          data.value = e.target.value;
        },
      },
      [],
    ]
  );
}

Render(nodes);
