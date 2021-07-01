import { RDMModule } from "./AllBasicTypes";
import { GetPropByItem, IsNodeAttr } from "./CommonLib";

export class VirtualNode {
  Childrens: Array<VirtualNode> = [];
  LoopNodeChildrens: Array<VirtualNode> = [];
  NodeStruct: object = {};
  NodeDomContents: Array<Text> = [];
  Parent: VirtualNode;
  NodeDom: HTMLElement;
  ModuleInstance: RDMModule;
  FakeNodeDom: Comment;
  NodeLocation: string;
  LoopInfo: {
    arr: Array<any>;
    index: number;
    Item: object;
    ItemAs: string;
    arrlen: number;
    BeforeDom: VirtualNode;
  } = {
    arr: [],
    index: -1,
    Item: {},
    ItemAs: "",
    arrlen: -1,
    BeforeDom: null,
  };
  LoopTemplate: object;
  IsLoopTemplate: boolean = false;
  BindProp: { k: string; m: object };

  constructor(_nodeName: string, _moduleInstance: RDMModule) {
    this.ModuleInstance = _moduleInstance;
    this.NodeLocation = _nodeName;
    _nodeName = _nodeName.replace(/_/g, "");
    if (_nodeName.search(/h[0-9]/gi) < 0)
      _nodeName = _nodeName.replace(/[0-9]/g, "");
    this.NodeDom = document.createElement(_nodeName);
  }

  public SetParentNode(_parent: VirtualNode): VirtualNode {
    this.Parent = _parent;
    return this;
  }

  public SetLoopInfoForCurrentNode(
    _index: number,
    _arr: Array<any>,
    _beforeDom: VirtualNode
  ) {
    this.LoopInfo.arr = _arr;
    this.LoopInfo.index = _index;
    this.LoopInfo.arrlen = _arr.length;
    this.LoopInfo.BeforeDom = _beforeDom;
    return this;
  }

  public SetLoopItem(_item: object) {
    this.LoopInfo.Item = _item;
    return this;
  }

  public LoopNode_push(_params: Array<any>) {
    _params.forEach(() => {
      let Brother =
        this.Parent.LoopNodeChildrens[this.Parent.LoopNodeChildrens.length - 1];
      let ChildrenNode = new VirtualNode(this.NodeLocation, this.ModuleInstance)
        .SetParentNode(this.Parent)
        .SetLoopInfoForCurrentNode(
          this.LoopInfo.arr.length - 1,
          this.LoopInfo.arr,
          Brother || this.LoopInfo.BeforeDom
        )
        .SetNodeStruct(this.LoopTemplate)
        .Builder();
      this.Parent.Childrens.push(ChildrenNode);
      this.Parent.LoopNodeChildrens.push(ChildrenNode);
    });
  }

  public LoopNode_pop() {
    if (this.Parent.LoopNodeChildrens.length <= 0) return;
    let PopNode =
      this.Parent.LoopNodeChildrens[this.Parent.LoopNodeChildrens.length - 1];
    PopNode.NodeDom.remove();
    PopNode.FakeNodeDom?.remove();
    this.Parent.Childrens.splice(
      this.Parent.Childrens.findIndex((v) => v == PopNode),
      1
    );
    this.Parent.LoopNodeChildrens.pop();
  }

  public DiffLoopNode(_modifyInfo: { ActionType: string; params: Array<any> }) {
    this.Childrens.forEach((c) => c.DiffLoopNode(_modifyInfo));
    if (this.IsLoopTemplate) {
      if (this.LoopInfo.arrlen != this.LoopInfo.arr.length) {
        let value;
        if (this.Parent) value = (this.Parent.NodeDom as any)["value"];
        this.LoopInfo.arrlen = this.LoopInfo.arr.length;
        this["LoopNode_" + _modifyInfo.ActionType](_modifyInfo.params);
        (this.Parent.NodeDom as any)["value"] = value;
      }
    }
  }

  LoadComplete: boolean = false;
  public DiffNodeStruct(_newNodeStruct: object) {
    if (this.IsLoopTemplate) return;
    this.LoadComplete = true;
    this.Childrens.forEach((m) =>
      m.DiffNodeStruct({ ..._newNodeStruct[m.NodeLocation] })
    );
    let DiffNode;
    for (const key in this.NodeStruct) {
      this.InlineValueResolver(key, _newNodeStruct);
      if (this.NodeStruct[key] != _newNodeStruct[key]) {
        if (!DiffNode) DiffNode = {};
        DiffNode[key] = _newNodeStruct[key];
        this.NodeStruct[key] = _newNodeStruct[key];
      }
    }
    this.SetNodeStruct(DiffNode);
    DiffNode = null;
  }

  private DecorateNode_f(_) {
    this.IsLoopTemplate = true;
    let arr = this.LoopTemplate["f"];
    this.LoopInfo.arr = arr;
    this.LoopInfo.arrlen = arr.length;
    delete this.LoopTemplate["f"];
    this.LoopInfo.BeforeDom =
      this.Parent.Childrens[this.Parent.Childrens.length - 1];
    this.Parent.Childrens.push(this);
    for (let i = 0; i < arr.length; i++) {
      let ChildrenNode = new VirtualNode(this.NodeLocation, this.ModuleInstance)
        .SetParentNode(this.Parent)
        .SetLoopInfoForCurrentNode(i, arr, null)
        .SetNodeStruct(this.LoopTemplate)
        .Builder();
      this.Parent.Childrens.push(ChildrenNode);
      this.Parent.LoopNodeChildrens.push(ChildrenNode);
    }
  }

  InputEvent: EventListenerOrEventListenerObject;
  private DecorateNode_value(key) {
    if ((this.NodeDom as HTMLInputElement).type == "radio") {
      key = "data_value";
      if (this.BindProp.m)
        if (this.BindProp.m[this.BindProp.k] == this.NodeStruct[key])
          (this.NodeDom as HTMLInputElement).checked = true;
    }
    this.NodeDom["value"] = this.NodeStruct[key] || "";
    if (this.InputEvent) return;
    let EventType = this.NodeDom.nodeName == "INPUT" ? "input" : "change";
    if (this.InputEvent)
      this.NodeDom.removeEventListener(EventType, this.InputEvent);
    this.InputEvent = (e: InputEvent) => {
      this.BindProp.m[this.BindProp.k] = (e.target as HTMLInputElement).value;
    };
    this.NodeDom.addEventListener(EventType, this.InputEvent);
  }

  private DecorateNode_title(key: string) {
    if (!this.LoadComplete) {
      let TextNode = document.createTextNode(this.NodeStruct[key]);
      this.NodeDomContents.push(TextNode);
      this.NodeDom.appendChild(TextNode);
    }
    let idx = key.match(/[0-9]/gi);
    this.NodeDomContents[idx ? idx[0] : 0].textContent = this.NodeStruct[key];
  }

  private DecorateNode_itemas(key) {
    this.LoopInfo.ItemAs = this.NodeStruct[key];
    this.LoopInfo.Item[this.LoopInfo.ItemAs] =
      this.LoopInfo.arr[this.LoopInfo.index];
  }

  private DecorateNode_show(key) {
    this.NodeDom.style.display = this.NodeStruct[key] ? "" : "none";
  }

  private DecorateNode_if(key) {
    let Oldif = this.NodeStruct[key].toString();
    this.NodeStruct[key] = this.NodeStruct[key].toString() == "true";
    if (!this.NodeStruct[key] && !this.FakeNodeDom)
      this.FakeNodeDom = document.createComment("");
    if (this.LoadComplete) {
      let ParentDom = this.Parent ? this.Parent.NodeDom : document.body;
      ParentDom.replaceChild(
        !this.NodeStruct[key] ? this.FakeNodeDom : this.NodeDom,
        !this.NodeStruct[key] ? this.NodeDom : this.FakeNodeDom
      );
    }
    if (this.NodeStruct[key]) this.FakeNodeDom = null;
    this.NodeStruct[key] = Oldif;
  }

  EventEntity: object = {};
  private DecorateNode_function(key) {
    this.NodeDom.removeEventListener(key, this.EventEntity[key]);
    this.EventEntity[key] = this.NodeStruct[key].bind(this.ModuleInstance);
    delete this.NodeStruct[key];
    this.NodeDom.addEventListener(key, this.EventEntity[key]);
  }

  public SetNodeStruct(_nodeStruct: object): VirtualNode {
    if (!_nodeStruct) return;
    let value;
    if (this.Parent) value = (this.Parent.NodeDom as any).value;
    for (let key in _nodeStruct) {
      this.NodeStruct[key] = _nodeStruct[key];
      this.InlineValueResolver(key, this.NodeStruct);
      if (key == "f") this.LoopTemplate = _nodeStruct;
      let KeyType: string = IsNodeAttr(key);
      let DataType: string = typeof _nodeStruct[key];

      if (DataType == "object" && !KeyType) {
        let ChildrenNode = new VirtualNode(key, this.ModuleInstance)
          .SetParentNode(this)
          .SetLoopItem(this.LoopInfo.Item)
          .SetNodeStruct(_nodeStruct[key])
          .Builder();
        if (ChildrenNode) this.Childrens.push(ChildrenNode);
        delete this.NodeStruct[key];
        continue;
      }
      if (DataType != "function" && !KeyType) DataType = "default";
      this["DecorateNode_" + (KeyType || DataType)](key);
    }
    if (value != undefined) (this.Parent.NodeDom as any).value = value;
    return this;
  }

  private InlineValueResolver(key, Item: object) {
    if (typeof Item[key] != "string") return;
    if (Item[key].indexOf("{") < 0) return;
    let InlinePlaceholders = Item[key].match(/(?<={).*.?(?=})/gi);
    InlinePlaceholders?.forEach((m) => {
      try {
        let PropValue = GetPropByItem(m, this.ModuleInstance);
        if (PropValue.v == undefined)
          PropValue = GetPropByItem(m, this.LoopInfo.Item);
        if (key == "value") this.BindProp = { k: PropValue.k, m: PropValue.m };
        Item[key] = Item[key].replace(`{${m}}`, PropValue.v);
      } catch (error) {}
    });
  }

  private DecorateNode_default(key) {
    if (key == "data_value") return;
    this.NodeDom[key] = this.NodeStruct[key];
  }

  public Builder(): VirtualNode {
    if (this.IsLoopTemplate) return;
    if (!this.LoopInfo.BeforeDom) {
      if (this.Parent)
        this.Parent.NodeDom.appendChild(this.FakeNodeDom || this.NodeDom);
    } else {
      let PreNode =
        this.LoopInfo.BeforeDom.FakeNodeDom || this.LoopInfo.BeforeDom.NodeDom;
      PreNode.after(this.FakeNodeDom || this.NodeDom);
    }
    return this;
  }
}
