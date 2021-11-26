"use strict";
exports.__esModule = true;
function handleObjectStructure(node) {
    var dom = document.createElement(node.t);
    if (dom.nodeName == "INPUT") {
        dom.addEventListener("input", function () {
            if ("value" in node.data)
                node.data.value = dom.value;
        });
    }
    for (var key in node) {
        var attrType = typeof node[key];
        switch (attrType) {
            case "function":
                dom.addEventListener(key, node[key]);
                break;
            case "object":
                if (key == "data")
                    break;
                var propDes = Object.getOwnPropertyDescriptor(node[key], key);
                var v = void 0;
                try {
                    v = propDes["get"](dom);
                }
                catch (_a) {
                    v = node[key][key];
                }
                if (key in dom) {
                    dom[key] = v;
                }
                break;
            default:
                if (key in dom) {
                    dom[key] = node[key];
                }
                break;
        }
    }
    return dom;
}
function r($exp) {
    return { $exp: $exp };
}
function def(data) {
    var _loop_1 = function (key) {
        var doms = [];
        var temp = data[key];
        Object.defineProperty(data, key, {
            get: function (n) {
                if (n)
                    doms.push(n);
                if (Object.prototype.hasOwnProperty.call(temp, "$exp")) {
                    var tempExp_1 = temp.$exp;
                    tempExp_1.match(/(?<=<).*?(?=>)/gi).forEach(function (m) {
                        tempExp_1 = tempExp_1.replace(new RegExp("<" + m + ">"), data[m]);
                    });
                    return tempExp_1;
                }
                return temp;
            },
            set: function (v) {
                temp = v;
                doms.forEach(function (n) {
                    if (key in n) {
                        n[key] = v;
                    }
                });
            }
        });
    };
    for (var key in data) {
        _loop_1(key);
    }
    return data;
}
function render(nodeStructures, parent) {
    nodeStructures.forEach(function (m) {
        if (m) {
            var type = typeof m;
            var dom = void 0;
            switch (type) {
                case "string":
                    dom = document.createElement(m.toString());
                    break;
                case "object":
                    if (Array.isArray(m)) {
                        render(m, parent);
                    }
                    else {
                        dom = handleObjectStructure(m);
                    }
                    break;
                default:
                    break;
            }
            if (dom)
                (parent ? parent : document.body).appendChild(dom);
        }
    });
}
function div(props) {
    var divData = def({
        style: r("background-color:<color>;display: inline;cursor: pointer;"),
        color: "#00ADAD",
        textContent: "<<\u7B2C" + props.i + "div>>"
    });
    return {
        t: "div",
        style: divData,
        textContent: divData,
        mouseenter: function () {
            divData.color = "#CC5C1E";
        },
        mouseleave: function () {
            divData.color = "#00ADAD";
        }
    };
}
var data = def({
    value: "点击改变为随机值",
    className: r("<pre>-<content>"),
    pre: "pre",
    content: "m",
    textContent: "按钮"
});
function input() {
    return [
        {
            t: "input",
            value: data,
            className: data,
            click: function () {
                setInterval(function () {
                    data.value = Math.random().toFixed(2);
                    data.textContent = Math.random().toFixed(2);
                }, 100);
            },
            input: function () {
                console.log(data.value);
            }
        },
        {
            t: "button",
            textContent: data,
            click: function () {
                data.textContent = "测试";
                data.value = "mmmm";
            }
        },
    ];
}
var nodes = [];
for (var i = 0; i <= 200; i++) {
    nodes.push(i >= 100 ? div({ i: i }) : input());
}
render([
    {
        t: "h1",
        textContent: "这里有一百个div和一百个input"
    },
    nodes,
]);
