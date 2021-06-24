import DomBuilder from "./DomBuilder";
import { RDMModule } from "./Type";

export default class RDM {
  /**模块对象 */
  $Module: { Render: Function; [x: string]: any };

  /**Dom对象实体的集合 */
  $DomModels: Array<DomBuilder> = [];

  /**根节点碎片 */
  $Document: any = document.createDocumentFragment();

  /**循环节点模板数组 也就是所有带 f属性 的节点 */
  static $DomForTempLate: Array<{
    key: string; //循环节点模板 处于的 层级位置 例：div.a.p
    AttrModel: object; //循环节点模板 的所有属性节点
    arr: Array<any>; //循环节点模板 的循环数组
    len: number; //循环节点模板 的循环数组长度
    action: Function; //增删改操作触发的方法
  }> = [];
  /**监听属性 触发的方法列表 */
  static $WatchFuncList: Array<{ key: string; func: Function }> = [];

  /**
   * RDM构造函数
   * @param Module 模块类
   */
  constructor(Module: RDMModule) {
    this.$Module = new Module(); //初始化模块类
    for (const key in this.$Module) {
      // 循环保存旧的属性值
      this.$BackModule[key] = this.$Module[key];
    }
    // 通过HtmlModel渲染页面
    this.RenderHTMLModel(this.$Module.Render(), this.$Document);
    setTimeout(() => {
      //监听当前模块类中的属性
      this.Monitor(this.$Module);
      //为数组的一些方法添加AOP
      this.RewritingArrayFunc();
    }, 0);
    // 向文档中追加当前渲染完的节点
    document.body.appendChild(this.$Document);
  }
  /**稍后更新页面(for循环操作数组时 多个diff合为一个diff) */
  LazyUpdate: any = 0;
  /**
   * AOP方法
   * @param Func 原数组方法
   */
  AopFunc(Func: Function): any {
    let _self = this;
    return function () {
      Func.apply(this, arguments);
      //在原数组方法后执行
      //如果不是模块类中的数组 那么 跳出, 因 RDM 中的数组并不需要做刷新页面操作 所以 RDM 中的数组会标记 RDMProp 属性为True
      if (this.RDMProp) return;
      //判断是不是 reverse sort splice 操作 因为这些操作并不会改变数组的长度 所以标记特殊标记
      if (
        Func.name === "reverse" ||
        Func.name === "sort" ||
        Func.name === "splice"
      )
        this["$__" + Func.name] = true;
      _self.Monitor(_self.$Module); // 重新监听模块类中的属性
      //循环所有的for循环模板节点 看是哪个节点有变化
      for (let i = 0; i < RDM.$DomForTempLate.length; i++) {
        if (
          RDM.$DomForTempLate[i].arr.length !== RDM.$DomForTempLate[i].len ||
          (RDM.$DomForTempLate[i].arr as any)["$__" + Func.name]
        ) {
          //因为引用类型机制 如果当前的for循环模板中的数组长度 跟上一次标记的长度不一样 或者 for循环模板类中的数组有标记 那么触发方法
          RDM.$DomForTempLate[i].action({ name: Func.name, args: arguments });
        }
      }
      // 如果数组有标记，那么删除数组标记
      if (
        Func.name === "reverse" ||
        Func.name === "sort" ||
        Func.name === "splice"
      )
        delete this["$__" + Func.name];
      if (_self.LazyUpdate) {
        //稍后更新页面延迟器存在的话，那么取消延迟器执行
        clearTimeout(_self.LazyUpdate);
      }
      // 添加延迟器
      _self.LazyUpdate = setTimeout(() => {
        let HtmlModel = _self.$Module.Render();
        // 通过 Render 方法获取新的 HtmlModel对象
        for (let i = 0; i < _self.$DomModels.length; i++) {
          // 每个节点对象都diff
          _self.$DomModels[i]
            .setHtmlModel(HtmlModel)
            .setLoadState(true)
            .DiffAttrModel(true);
        }
      }, 1);
    };
  }
  /**
   * 重写数组方法
   */
  RewritingArrayFunc() {
    (this.$DomModels as any).RDMProp = true; //先将DomModels数组加上标记
    let FuncName = ["push", "pop", "shift", "unshift", "sort", "reverse"];
    for (let i = 0; i < FuncName.length; i++) {
      // 为数组原型添加AOP方法
      Array.prototype[FuncName[i]] = this.AopFunc(Array.prototype[FuncName[i]]);
    }
  }
  /**稍后更新 */
  LaterUpadte: any = 0;

  /**旧的属性值 */
  $BackModule = {};
  /**
   * 监听模块类中的属性
   * @param Model 属性对象
   * @param ParentKey 当前属性对象的层级 例：['redA','color'] ==> redA = { color: "red", textAlign: "right" };
   */
  Monitor(Model: object, ParentKey: Array<string> = []) {
    let MonitorModel = (key) => {
      //如果当前属性是函数 那么跳出
      if (typeof Model[key] === "function") return;
      //存储临时的属性值
      let TempValue = Model[key];
      //定义属性监听方法
      Object.defineProperty(Model, key, {
        get: () => {
          // 返回临时值
          return TempValue;
        },
        set: (v) => {
          //获取当前的key
          let FuncK = key;
          // 如果当前 ParentKey.leng !== 0 那么也就是不再第一层 那么把Funck 赋值为 ParentKey数组里的第一个
          if (ParentKey.length !== 0) FuncK = ParentKey[0];
          // 对于当前的key是否存在 Watch 函数
          let WatchFunc = RDM.$WatchFuncList.find((f) => f.key === FuncK);
          //临时的值等于新的值
          TempValue = v;
          //WatchFunc 不为空 那么执行
          WatchFunc &&
            WatchFunc.func.apply(this, [
              this.$Module[FuncK],
              this.$BackModule[FuncK],
              FuncK,
            ]);
          //如果有延迟函数
          if (this.LaterUpadte) {
            //清空延迟函数
            clearTimeout(this.LaterUpadte);
          }
          // 添加延迟函数
          this.LaterUpadte = setTimeout(() => {
            let HtmlModel = this.$Module.Render();
            // 通过 Render 方法获取新的 HtmlModel对象
            for (let i = 0; i < this.$DomModels.length; i++) {
              // 每个节点对象都diff
              this.$DomModels[i]
                .setHtmlModel(HtmlModel)
                .setLoadState(true)
                .DiffAttrModel();
            }
          }, 1);
        },
      });
      //如果当前属性key是对象那么递归监听
      if (typeof Model[key] === "object") {
        this.Monitor(Model[key], ParentKey.concat(key));
      }
    };
    //如果是数组
    if (Array.isArray(Model)) {
      for (let i = 0; i < Model.length; i++) {
        //如果是对象递归监听对象，反之直接监听值
        if (typeof Model[i] === "object") {
          this.Monitor(Model[i], ParentKey.concat(i.toString()));
        } else {
          MonitorModel(i);
        }
      }
      return;
    }
    //循环当前的Model属性键以便监听
    for (const key in Model) {
      MonitorModel(key);
    }
  }
  /**
   * 渲染页面
   * @param HTMLModel Model对象
   * @param ParentDom 父级Html对象
   */
  RenderHTMLModel(HTMLModel: object, ParentDom: HTMLElement) {
    //循环对象中的键来创建 节点建造者对象 来渲染节点
    for (const key in HTMLModel) {
      if (
        typeof HTMLModel[key] == "function" &&
        HTMLModel[key].prototype.hasOwnProperty("Render")
      ) {
        setTimeout(() => {
          new RDM(HTMLModel[key]);
        }, 0);
        continue;
      }

      new DomBuilder(this.$DomModels, this.$Module)
        .setHtmlModelProp([key]) //设置节点的层级位置 ['div']
        .setHtmlElementKey(key) //设置当前节点的 tagName
        .setAttrModel(HTMLModel[key]) //设置当前节点的 HtmlModel 模板对象
        .setParentDom(ParentDom) //设置父级的Html对象
        .builder(); //开始构建
    }
  }
}
//标记当前的静态属性为 RDM 数组，不进行数组增删改的对比
(RDM.$DomForTempLate as any).RDMProp = true;
(RDM.$WatchFuncList as any).RDMProp = true;
