import { Bind } from "../RDM/PublicLib";
import "../static/css/style.css";

export default class example {
  val = "name";
  focus = false;
  arr = [{ value: "" }];
  option = "";
  tirgger_focus() {
    this.focus = !this.focus;
  }
  Render(): object {
    return {
      div1: {
        h3: {
          className: "demo-title",
          title: "Demo",
        },
        className: "block",
        title: this.option,
        select: {
          value: Bind("option"),
          option: {
            f: this.arr,
            itemas: "m",
            title: "<m.value>",
            value: "<m.value>",
          },
        },
      },
      div: {
        className: "block",
        button: {
          title: "添加",
          click: () => {
            this.arr.push({ value: "" });
          },
        },
        button1: {
          title: "删除",
          click: () => {
            this.arr.pop();
          },
        },
        div: {
          input: { type: "radio" },
          title: "小于0.5的显示",
          input1: { type: "radio" },
          title1: "大于0.5的显示",
          input2: { type: "radio" },
          title2: "全部显示",
        },
        div2: {
          f: this.arr,
          itemas: "m",
          className: "demo-block",
          div: {
            className: "demo-content",
            div: {
              title: "<m.value>",
            },
            input: {
              placeholder: "请输入内容",
              value: Bind("<m.value>"),
              focus: this.tirgger_focus,
              blur: this.tirgger_focus,
            },
          },
        },
      },
    };
  }
}
