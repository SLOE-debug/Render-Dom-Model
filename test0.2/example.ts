import { RDMModule } from "../RDM0.2/AllBasicTypes";
import "../static/css/style.css";

export default class example extends RDMModule {
  val = "name";
  arr = [];
  overturn = false;
  option = "";
  constructor() {
    super();
    for (let i = 0; i < 1000; i++) {
      let num = Math.random();
      this.arr.push({ value: num, if: num > 0.5 });
    }
  }
  Render(): object {
    return {
      div1: {
        input: {
          value: "{val}",
        },
        h3: {
          className: "demo-title",
          title: "Demo",
        },
        className: "block",
        title: "{option}",
        select: {
          value: "{option}",
          option: {
            f: this.arr,
            itemas: "m",
            title: "{m.value}",
            value: "{m.value}",
          },
        },
      },
      div: {
        className: "block",
        button: {
          title: "添加",
          click: () => {
            this.arr.push({ value: Math.random().toString(), if: true });
          },
        },
        button1: {
          title: "删除100个",
          click() {
            for (let i = 0; i < 100; i++) {
              this.arr.pop();
            }
          },
        },
        button2: {
          title: this.overturn ? "大于0.5的显示" : "小于0.5的显示",
          click: () => {
            this.arr.forEach((m) => (m.if = !m.if));
            this.overturn = !this.overturn;
          },
        },
        div2: {
          f: this.arr,
          itemas: "m",
          className: "demo-block",
          if: "{m.if}",
          div: {
            className: "demo-content",
            div: {
              title: "{m.value}",
            },
            input: {
              placeholder: "请输入内容",
              value: "{m.value}",
            },
          },
        },
        div3: {
          title: "装模作样",
        },
      },
    };
  }
}
