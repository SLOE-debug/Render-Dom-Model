import { RDMModule } from "../RDM0.2/AllBasicTypes";
import "../static/css/style.css";

export default class example extends RDMModule {
  val = "name";
  arr = [];
  overturn = false;
  option = "";
  ShowType = "c";

  constructor() {
    super();
    for (let i = 0; i < 1000; i++) {
      let num = Math.random();
      this.arr.push({ value: num, if: true });
    }
  }
  Render(): object {
    return {
      div1: {
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
        div: {
          title: "数组长度：{arr.length}",
        },
        className: "block",
        button: {
          title: "添加",
          click: () => {
            let num = Math.random();
            this.arr.push({
              value: num,
              if: true,
            });
          },
        },
        button1: {
          title: "删除100个",
          click: () => {
            for (let i = 0; i < 100; i++) {
              this.arr.pop();
            }
          },
        },
        button2: {
          title: "筛选",
          click: () => {
            this.arr.forEach((m) => {
              m.if =
                this.ShowType == "c"
                  ? true
                  : this.ShowType == "b"
                  ? m.value > 0.5
                  : m.value < 0.5;
            });
          },
        },
        div4: {
          input: {
            type: "radio",
            name: "ShowType",
            data_value: "a",
            value: "{ShowType}",
          },
          title: "小于0.5的显示",
          input1: {
            type: "radio",
            name: "ShowType",
            data_value: "b",
            value: "{ShowType}",
          },
          title1: "大于0.5的显示",
          input2: {
            type: "radio",
            name: "ShowType",
            data_value: "c",
            value: "{ShowType}",
          },
          title2: "全部显示",
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
              className: "r_input",
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
