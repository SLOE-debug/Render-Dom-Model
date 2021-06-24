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
    }, 0);
  }

  AopFunc(ArrFunc: Function): any {
    let _self = this;
    let ArrModifyLog = [];
    return function () {
      let FuncArgs = Array.from(arguments);
      ArrFunc.apply(this, FuncArgs);
      if (FuncArgs.filter((a) => a["$_a0$bW$7$"]).length != 0) return;
      ArrModifyLog.push({
        ActionType: ArrFunc.name,
        params: FuncArgs,
        Monitor: _self.Monitor.bind(_self),
        $_a0$bW$7$: true,
      });
      if (_self.LazyUpdate) {
        clearTimeout(_self.LazyUpdate);
      }
      _self.LazyUpdate = setTimeout(() => {
        ArrModifyLog.forEach((a) => {
          _self.RootNodes.forEach((n) => n.DiffLoopNode(a));
        });
        ArrModifyLog = [];
      }, 1);
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
    for (const key in this.HTMLStruct) {
      let RootNode = new VirtualNode(key, this.ModuleInstance)
        .SetNodeStruct(this.HTMLStruct[key])
        .Builder();
      this.RootNodes.push(RootNode);
      document.body.appendChild(RootNode.FakeNodeDom || RootNode.NodeDom);
    }
  }
}
