// serializer.js
// 汎用シリアライザ／デシリアライザ
// グローバルクラス登録用インターフェース

(function(window) {
    // --- decycle: 循環参照を {$ref: path} に置き換え、関数を文字列化 ---
    function decycle(root) {
        const seen = new WeakMap();
        return (function derez(value, path) {
            // 関数は文字列化してマーカー付きオブジェクトに
            if (typeof value === 'function') {
                return { __fn__: value.toString() };
            }
            if (value && typeof value === 'object') {
                if (seen.has(value)) {
                    return { $ref: seen.get(value) };
                }
                seen.set(value, path);
                if (Array.isArray(value)) {
                    return value.map((el, i) => derez(el, path + '[' + i + ']'));
                }
                const out = {};
                const ctorName = value.constructor && value.constructor.name;
                if (ctorName && ctorName !== 'Object') {
                    out.__type__ = ctorName;
                }
                Object.keys(value).forEach(key => {
                    const v = value[key];
                    if (typeof v === 'function') {
                        /////console.log(value)
                        /////console.log(v.toString())
                        out[key] = { __fn__: v.toString() };
                    } else {
                        out[key] = derez(v, path + '[' + JSON.stringify(key) + ']');
                    }
                });
                return out;
            }
            return value;
        })(root, '$');
    }

    // --- retrocycle: Crockford’s eval版で $ref を元に戻す ---
    function retrocycle(obj) {
        const $ = obj;
        const px = /^\$(?:\[(?:\d+|"(?:[^"\\]|\\.)*")\])*$/;
        (function rez(value) {
            if (value && typeof value === 'object') {
                Object.keys(value).forEach(name => {
                    const item = value[name];
                    if (item && typeof item === 'object' && typeof item.$ref === 'string' && px.test(item.$ref)) {
                        value[name] = eval(item.$ref);
                    } else {
                        rez(item);
                    }
                });
            }
        })(obj);
        return obj;
    }

    // --- deepRevive: __fn__ で関数を復元, __type__ でプロトタイプを復元 ---
    function deepRevive(obj, seen) {
        seen = seen || new WeakMap();
        // 関数マーカーを先に処理
        if (obj && typeof obj === 'object' && obj.__fn__) {
            //console.log(obj)
            //console.log(eval('(' + obj.__fn__ + ')'))
            return eval('(' + obj.__fn__ + ')');
        }
        if (obj && typeof obj === 'object') {
            if (seen.has(obj)) return seen.get(obj);
            let inst = obj;
            if (obj.__type__) {
                const Ctor = eval(obj.__type__);
                /////console.log(Ctor)
                if (Ctor) {
                    inst = Object.create(Ctor.prototype);
                    Object.keys(obj).forEach(key => {
                        if (key !== '__type__' && key !== '__fn__') {
                            inst[key] = obj[key];
                        }
                    });
                }
            }
            seen.set(obj, inst);
            Object.keys(inst).forEach(key => {
                inst[key] = deepRevive(inst[key], seen);
            });
            return inst;
        }
        return obj;
    }

    // --- Serializer API ---
    window.Serializer = {
        serialize(obj) {
            return JSON.stringify(decycle(obj));
        },
        deserialize(str) {
            const data = JSON.parse(str);
            retrocycle(data);
            return deepRevive(data);
        }
    };

})(window);