import { RDMModule } from "./AllBasicTypes";
import { VirtualNode } from "./VirtualNode";

export default class RDM {
  HTMLStruct: object = null;
  ModuleInstance: RDMModule = null;
  RootNodes: Array<VirtualNode> = [];
  LazyUpdate: any;

  constructor(Module: new () => RDMModule) {
    this.ModuleInstance = new Module();
    this.HTMLStruct = this.ModuleInstance.Render();
    this.RenderHTML();
    setTimeout(() => {
      this.Monitor(this.ModuleInstance);
      let FuncName = ["push", "pop", "shift", "unshift", "sort", "reverse"];
      for (let i = 0; i < FuncName.length; i++) {
        Array.prototype[FuncName[i]] = this.AopFunc(
          Array.prototype[FuncName[i]]
        );
      }
    });
  }

  AopFunc(ArrFunc: Function): any {
    let _self = this;
    return function () {
      let FuncArgs = Array.from(arguments);
      ArrFunc.apply(this, FuncArgs);
      _self.RootNodes.forEach((n) => {
        n.DiffLoopNode({
          ActionType: ArrFunc.name,
          params: FuncArgs,
        });
      });
      if (_self.LazyUpdate) clearTimeout(_self.LazyUpdate);
      _self.LazyUpdate = setTimeout(() => {
        let NewNodeStruct = _self.ModuleInstance.Render();
        _self.RootNodes.forEach((m) =>
          m.DiffNodeStruct({ ...NewNodeStruct[m.NodeLocation] })
        );
        _self.Monitor.bind(_self, [this])();
        _self.LazyUpdate = null;
      });
    };
  }

  Monitor(Item) {
    for (const key in Item) {
      let OldValue = Item[key];
      Object.defineProperty(Item, key, {
        get() {
          return OldValue;
        },
        set: (v) => {
          OldValue = v;
          if (this.LazyUpdate) clearTimeout(this.LazyUpdate);
          this.LazyUpdate = setTimeout(() => {
            let NewNodeStruct = this.ModuleInstance.Render();
            this.RootNodes.forEach((m) =>
              m.DiffNodeStruct({ ...NewNodeStruct[m.NodeLocation] })
            );
            this.LazyUpdate = null;
          }, 1);
        },
      });
      if (Array.isArray(OldValue)) {
        for (let i = 0; i < OldValue.length; i++) {
          this.Monitor(OldValue[i]);
        }
      }
      if (typeof OldValue == "object") this.Monitor(OldValue);
    }
  }

  RenderHTML() {
    window.onload = () => {
      for (const key in this.HTMLStruct) {
        let RootNode = new VirtualNode(key, this.ModuleInstance)
          .SetNodeStruct(this.HTMLStruct[key])
          .Builder();
        this.RootNodes.push(RootNode);
        document.body.appendChild(RootNode.FakeNodeDom || RootNode.NodeDom);
      }
    };
  }
}
