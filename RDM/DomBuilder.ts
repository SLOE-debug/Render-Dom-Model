import { GetValueByPropStr, IsForTagModel, IsTagModel } from "./PublicLib";
import RDM from "./RDM";

export default class DomBuilder {
  HtmlElementKey: string = "";
  AttrModel: object = null;
  ParentDom: HTMLElement = null;
  DomModels: Array<DomBuilder> = [];
  Item: object = null;
  ModelProp: Array<string> = [];
  Module: { [x: string]: any; Render: Function } = null;
  Dom: HTMLElement = null;
  IsLoad = false;
  Index = 0;
  ForLocation: { Action: string; BrotherNodes: Array<DomBuilder> } = {
    Action: "",
    BrotherNodes: [],
  };
  constructor(
    _DomModels: Array<DomBuilder>,
    _Module: { [x: string]: any; Render: Function }
  ) {
    this.DomModels = _DomModels;
    this.Module = _Module;
    (this.ChildDomArr as any).RDMProp = true;
  }

  public setLoadState(_isLoad: boolean) {
    this.IsLoad = _isLoad;
    return this;
  }

  public setHtmlModelProp(_Props: Array<string>) {
    this.ModelProp = _Props;
    return this;
  }

  public setHtmlElementKey(_key: string) {
    this.HtmlElementKey = _key;
    return this;
  }

  public setAttrModel(Attrs: object) {
    this.AttrModel = Attrs;
    return this;
  }

  public setForItem(_item) {
    this.Item = _item;
    return this;
  }

  public setForIndex(_index) {
    this.Index = _index;
    return this;
  }

  public setParentDom(PDom) {
    this.ParentDom = PDom;
    return this;
  }

  public setContinuetoCycle(_Continue) {
    this.ContinuetoCycle = _Continue;
    return this;
  }

  public setForLocation(_location: {
    Action: string;
    BrotherNodes: Array<DomBuilder>;
  }) {
    this.ForLocation = _location;
    return this;
  }
  public setHtmlModel(_htmlmodel) {
    this.HtmlModel = _htmlmodel;
    return this;
  }
  HtmlModel;
  public DiffAttrModel(IsonlyBind = false) {
    let NewAttrModel = Object.assign(
      {},
      GetValueByPropStr(this.ModelProp.join("."), this.HtmlModel)
    );
    let DiffAttrModel = {};
    for (const key in this.AttrModel) {
      if (Array.isArray(NewAttrModel[key]))
        this.Item[this.AttrModel["itemas"]] = this.AttrModel[key][this.Index];
      if (
        typeof NewAttrModel[key] === "function" ||
        (typeof NewAttrModel[key] === "object" &&
          !NewAttrModel[key].hasOwnProperty("Bind") &&
          key !== "style")
      )
        continue;
      if (IsonlyBind && !NewAttrModel[key].hasOwnProperty("Bind")) {
        continue;
      }
      if (key === "style" && typeof this.AttrModel[key] === "object") {
        let IsContinue = true;
        for (const Attrkey in this.AttrModel[key]) {
          if (!IsContinue) continue;
          if (
            NewAttrModel[key][Attrkey].toString() !==
            this.AttrModel[key][Attrkey].toString()
          ) {
            DiffAttrModel[key] = NewAttrModel[key];
            this.AttrModel[key] = Object.assign({}, NewAttrModel[key]);
            IsContinue = false;
          }
        }
      } else {
        this.AnalysisSpecificAttr(key, NewAttrModel);
        if (NewAttrModel[key].hasOwnProperty("Prop")) {
          if (
            NewAttrModel[key]["BindStr"] !== this.AttrModel[key]["BindStr"] ||
            NewAttrModel[key]["model"] !== this.AttrModel[key]["model"] ||
            this.Dom[key] !== NewAttrModel[key]["model"]
          ) {
            DiffAttrModel[key] = NewAttrModel[key];
            this.AttrModel[key] = NewAttrModel[key];
          }
        } else {
          if (NewAttrModel[key].toString() !== this.AttrModel[key].toString()) {
            DiffAttrModel[key] = NewAttrModel[key];
            this.AttrModel[key] = NewAttrModel[key];
          }
        }
      }
    }
    if (Object.keys(DiffAttrModel).length !== 0) {
      let OldAttrModel = this.AttrModel;
      this.setAttrModel(DiffAttrModel);
      this.DecorateDomAttr();
      this.setAttrModel(OldAttrModel);
    }
  }
  FakeDom;
  private RenderIf() {
    this.AnalysisSpecificAttr("if", this.AttrModel);
    if (this.AttrModel["if"].toString() === "false") {
      if (this.FakeDom) return;
      this.FakeDom = document.createComment("") as any;
      if (this.IsLoad) {
        this.ParentDom.replaceChild(this.FakeDom, this.Dom);
      }
    } else if (this.AttrModel["if"].toString() === "true") {
      if (!this.FakeDom) return;
      if (this.IsLoad) {
        this.ParentDom.replaceChild(this.Dom, this.FakeDom);
      }
      this.FakeDom = null;
    }
  }
  FuncHandler;
  private RenderFunc(key: string) {
    this.Dom.removeEventListener(key, this.FuncHandler);
    if (this.Item) {
      let _self = this;
      this.AttrModel[key] = ((func: Function) => {
        return function (e) {
          func.apply(this, [_self.Item, _self.Index, e]);
        };
      })(this.AttrModel[key]);
    }
    this.FuncHandler = this.AttrModel[key].bind(this.Module);
    this.Dom.addEventListener(key, this.FuncHandler);
  }
  BindHandler;
  private RenderBind(key) {
    if (this.Dom[key] !== this.AttrModel[key].model)
      this.Dom[key] = this.AttrModel[key].model;
    let EventType = "input";
    if (this.Dom.nodeName === "SELECT") {
      EventType = "change";
      if (!this.Dom[key]) (this.Dom as HTMLSelectElement).selectedIndex = -1;
    }
    this.Dom.removeEventListener(EventType, this.BindHandler);
    this.BindHandler = () => {
      this.AttrModel[key].Prop.Item[this.AttrModel[key].Prop.key] = (
        this.Dom as any
      ).value;
    };
    this.Dom.addEventListener(EventType, this.BindHandler);
  }
  private AnalysisSpecificAttr(Attrkey: string, _AttrModel) {
    if (_AttrModel[Attrkey].hasOwnProperty("Bind")) {
      let PropModel: any = this.Module;
      if (_AttrModel[Attrkey]["Bind"].match(/\<.*?\>/)) {
        PropModel = this.Item;
      }
      _AttrModel[Attrkey] = GetValueByPropStr(
        _AttrModel[Attrkey]["Bind"],
        PropModel,
        true
      );
    }
    if (typeof _AttrModel[Attrkey] === "string") {
      let ForItemas = _AttrModel[Attrkey].match(/\<.*?\>/gi);
      if (ForItemas) {
        for (let i = 0; i < ForItemas.length; i++) {
          _AttrModel[Attrkey] = _AttrModel[Attrkey].replace(
            ForItemas[i],
            GetValueByPropStr(
              ForItemas[i].substring(1, ForItemas[i].length - 1),
              this.Item
            )
          );
        }
      }
    }
  }

  ChildDom: { [x: string]: DomBuilder } | Array<DomBuilder> = {};
  private DecorateDomAttr() {
    let BindFuncArr = [];
    (BindFuncArr as any).RDMProp = true;
    if (this.AttrModel.hasOwnProperty("if")) {
      this.RenderIf();
    }
    for (const key in this.AttrModel) {
      if (key === "if") continue;
      if (
        IsTagModel(this.AttrModel[key]) &&
        !this.ChildDom.hasOwnProperty(key) &&
        key !== "style"
      ) {
        this.ChildDom[key] = new DomBuilder(this.DomModels, this.Module)
          .setHtmlModelProp(this.ModelProp.concat(key))
          .setHtmlElementKey(key)
          .setAttrModel({ ...this.AttrModel[key] })
          .setForItem(this.Item)
          .setParentDom(this.Dom)
          .builder();
        continue;
      }
      if (!Array.isArray(this.AttrModel[key]) && key !== "itemas") {
        this.AnalysisSpecificAttr(key, this.AttrModel);
        switch (key) {
          case "show":
            this.Dom.style.display =
              this.AttrModel[key].toString() === "false" ? "none" : "";
            break;
          case "style":
            if (typeof this.AttrModel[key] === "object") {
              let StyleStr = "";
              for (const Attrkey in this.AttrModel[key]) {
                StyleStr += `${Attrkey.replace(/([A-Z])/g, ($1) => {
                  return "-" + $1.toLowerCase();
                })}:${this.AttrModel[key][Attrkey]};`;
              }
              this.AttrModel[key] = Object.assign({}, this.AttrModel[key]);
              this.Dom.setAttribute("style", StyleStr);
            } else {
              this.Dom.setAttribute("style", this.AttrModel[key]);
            }
            break;
          case "title":
            let TextDom = Array.from(this.Dom.childNodes).find(
              (m) => m.nodeName === "#text"
            );
            if (TextDom) {
              TextDom.textContent = this.AttrModel[key];
            } else {
              this.Dom.appendChild(
                document.createTextNode(this.AttrModel[key])
              );
            }
            break;
          default:
            if (typeof this.AttrModel[key] === "function") {
              this.RenderFunc(key);
            } else {
              if (this.AttrModel[key].hasOwnProperty("Prop")) {
                BindFuncArr.push(() => {
                  this.RenderBind(key);
                });
              } else {
                if (key !== "f") this.Dom[key] = this.AttrModel[key];
              }
            }
            break;
        }
      }
    }
    for (let i = 0; i < BindFuncArr.length; i++) {
      BindFuncArr[i]();
    }
  }
  private DeleteDomModelByModel(delDomModel) {
    let popIndex = this.DomModels.findIndex((m) => m == delDomModel);
    this.DomModels.splice(popIndex, 1);
  }

  ContinuetoCycle = true;
  ChildDomArr: Array<DomBuilder> = [];
  public builder() {
    let res = IsForTagModel(this.AttrModel);
    if (res && this.ContinuetoCycle) {
      if (!this.AttrModel["itemas"]) {
        throw new Error(
          "在 " + this.ModelProp.join(".") + " 下未找到相应的 itemas 的别名"
        );
      }
      let DomForTempLateIndex = RDM.$DomForTempLate.length;
      RDM.$DomForTempLate.push({
        key: this.ModelProp.join("."),
        AttrModel: this.AttrModel,
        arr: this.AttrModel["f"],
        len: this.AttrModel["f"].length,
        action: (Type: { name: string; args: Array<any> }) => {
          switch (Type.name) {
            case "unshift":
            case "push":
              if (Type.name === "unshift") {
                Type.args = Array.from(Type.args);
                (Type.args as any).RDMProp = true;
                Type.args.reverse();
                delete (Type.args as any).RDMProp;
              }
              for (let i = 0; i < Type.args.length; i++) {
                this.ChildDomArr[Type.name](
                  new DomBuilder(this.DomModels, this.Module)
                    .setHtmlModelProp(this.ModelProp)
                    .setHtmlElementKey(this.HtmlElementKey)
                    .setAttrModel({ ...this.AttrModel })
                    .setContinuetoCycle(false)
                    .setForItem(
                      this.Item
                        ? {
                            ...this.Item,
                            [this.AttrModel["itemas"]]: Type.args[i],
                          }
                        : {
                            [this.AttrModel["itemas"]]: Type.args[i],
                          }
                    )
                    .setForIndex(
                      this.AttrModel["f"].length - (Type.args.length - i)
                    )
                    .setForLocation({
                      Action: Type.name,
                      BrotherNodes: this.ChildDomArr,
                    })
                    .setParentDom(this.ParentDom)
                    .builder()
                );
              }
              break;
            case "pop":
              if (this.ChildDomArr.length !== 0) {
                this.ChildDomArr[
                  this.ChildDomArr.length - 1
                ].Dom.parentElement.removeChild(
                  this.ChildDomArr[this.ChildDomArr.length - 1].Dom
                );
                this.DeleteDomModelByModel(
                  this.ChildDomArr[this.ChildDomArr.length - 1]
                );
                this.ChildDomArr.pop();
              }
              break;
            case "shift":
              if (this.ChildDomArr.length !== 0) {
                this.ChildDomArr[0].Dom.parentElement.removeChild(
                  this.ChildDomArr[0].Dom
                );
                this.DeleteDomModelByModel(this.ChildDomArr[0]);
                this.ChildDomArr.shift();
              }
              break;
            case "reverse":
            case "sort":
              let HtmlModel = this.Module.Render();
              for (let i = 0; i < this.ChildDomArr.length; i++) {
                this.ChildDomArr[i].Item[this.AttrModel["itemas"]] =
                  this.AttrModel["f"][i];
                this.ChildDomArr[i]
                  .setHtmlModel(HtmlModel)
                  .setLoadState(true)
                  .DiffAttrModel();
              }
              break;
          }
          // if (
          //   this.ParentDom.nodeName.toLowerCase() === "select" &&
          //   (this.ParentDom as HTMLSelectElement).selectedIndex != -1 &&
          //   (this.ParentDom as HTMLSelectElement).value == ''
          // )
          //   (this.ParentDom as HTMLSelectElement).selectedIndex = -1;
          for (let i = 0; i < this.ChildDomArr.length; i++) {
            this.ChildDomArr[i].Index = i;
          }
          RDM.$DomForTempLate[DomForTempLateIndex].len =
            this.AttrModel["f"].length;
        },
      });
      for (let i = 0; i < this.AttrModel["f"].length; i++) {
        this.ChildDomArr.push(
          new DomBuilder(this.DomModels, this.Module)
            .setHtmlModelProp(this.ModelProp)
            .setHtmlElementKey(this.HtmlElementKey)
            .setAttrModel({ ...this.AttrModel })
            .setContinuetoCycle(false)
            .setForItem(
              this.Item
                ? {
                    ...this.Item,
                    [this.AttrModel["itemas"]]: this.AttrModel["f"][i],
                  }
                : {
                    [this.AttrModel["itemas"]]: this.AttrModel["f"][i],
                  }
            )
            .setForIndex(i)
            .setParentDom(this.ParentDom)
            .builder()
        );
      }
      return this.ChildDomArr as any;
    }
    this.Dom = document.createElement(
      this.HtmlElementKey.search(/h[0-9]/gi) >= 0
        ? this.HtmlElementKey.replace(/_/g, "")
        : this.HtmlElementKey.replace(/_/g, "").replace(/[0-9]/g, "")
    );
    this.DecorateDomAttr();
    let InteriorDom = this.FakeDom ? this.FakeDom : this.Dom;
    switch (this.ForLocation.Action) {
      case "unshift":
        if (this.ForLocation.BrotherNodes.length != 0) {
          this.ForLocation.BrotherNodes[0].Dom.before(InteriorDom);
        } else {
          if (this.ParentDom.children.length === 0) {
            this.ParentDom.appendChild(InteriorDom);
          } else {
            this.ParentDom.insertBefore(
              InteriorDom,
              this.ParentDom.children[0]
            );
          }
        }
        break;
      case "push":
      default:
        if (this.ForLocation.BrotherNodes.length != 0)
          this.ForLocation.BrotherNodes[
            this.ForLocation.BrotherNodes.length - 1
          ].Dom.after(InteriorDom);
        else this.ParentDom.appendChild(InteriorDom);
        break;
    }
    this.ForLocation.Action = "";
    this.DomModels.push(this);
    return this;
  }
}
