const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const files = ['./Entity.js', './Game.js'];
const classMap = {};
const baseEntityClasses = [];

// 各ファイルを読み込みパース
for (const file of files) {
    const code = fs.readFileSync(file, 'utf-8');
    const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });

    walk.simple(ast, {
        ClassDeclaration(node) {
            const className = node.id.name;
            const superClassName = node.superClass ? node.superClass.name : null;

            classMap[className] = {
                name: className,
                superClass: superClassName,
                methods: node.body.body
                    .filter(n => n.type === 'MethodDefinition')
                    .map(n => n.key.name)
            };
        }
    });
}

// 再帰的にBaseEntityの子孫クラスを探索
function collectDerivedClasses(baseName) {
    const result = [];

    for (const [name, info] of Object.entries(classMap)) {
        if (info.superClass === baseName) {
            result.push({
                name: info.name,
                superClass: info.superClass,
                methods: info.methods,
                children: collectDerivedClasses(info.name)
            });
        }
    }

    return result;
}

const baseTree = collectDerivedClasses('BaseEntity');

// JSONに出力
const output = JSON.stringify(baseTree, null, 2);
console.log(output);

fs.writeFileSync(path.resolve(__dirname, "classes.json"), output);