import { def, r, render } from "../RDM0.3/render";
import { NodeStructure } from "../RDM0.3/types";

function div(props: any): NodeStructure {
  let divData = def({
    style: r("background-color:<color>;display: inline;cursor: pointer;"),
    color: "#00ADAD",
    textContent: r(`第${props.i}个div，颜色<color>`),
  });
  return {
    t: "div",
    style: divData,
    textContent: divData,
    mouseenter() {
      divData.color = "#CC5C1E";
    },
    mouseleave() {
      divData.color = "#00ADAD";
    },
  };
}

let data = def({
  value: "点击改变为随机值",
  className: r("<pre>-<content>"),
  pre: "pre",
  content: "m",
  textContent: "按钮",
});
function input(): NodeStructure {
  return [
    {
      t: "input",
      value: data,
      className: data,
      click() {
        setInterval(() => {
          data.content = Math.random().toFixed(2);
          data.value = Math.random().toFixed(2);
          data.textContent = Math.random().toFixed(2);
        }, 100);
      },
      input() {
        console.log(data.value);
      },
    },
    {
      t: "button",
      textContent: data,
      click() {
        data.textContent = "测试";
        data.value = "mmmm";
      },
    },
  ];
}

let nodes = [];
for (let i = 0; i <= 200; i++) {
  nodes.push(i >= 100 ? div({ i }) : input());
}

render([
  {
    t: "h1",
    textContent: "这里有一百个div和一百个input",
  },
  nodes,
]);