import { generateUUID } from "./useUUID";
import template from "@babel/template";
import generate from "@babel/generator";
import { parseExpression, parse } from "@babel/parser";
import * as Babel from "@babel/standalone";
Babel.registerPlugin("maxium-count", () => {
  const DeadCycle = (path) => {
    const uuid = generateUUID();
    const uuidIncresment = template.ast(`${uuid}++`);
    const uuidJudge = template.ast(`
        if(${uuid}>999){
          document.body.innerHTML=\`<pre id="root" style="color:red;font-weight:bold" >
  ${generate(path.node).code}
  超出最大循环限制(max:999)
          </pre>\`;
          console.error(\`${generate(path.node).code}
超出最大循环限制(max:999)\`)
          throw new Error('超出最大循环限制')
        }
      `);
    const blocks: any[] = path.node.body.body;
    blocks.unshift(uuidJudge);
    blocks.unshift(uuidIncresment);
    // const clearUUID = template.ast(`${uuid}=0`);
    const insertUUID = template.ast(`let ${uuid}=0`);
    const parentBody = path.parent.body;
    for (let i = 0; i < parentBody.length; i++) {
      const node = parentBody[i];
      if (node === path.node) {
        // parentBody.splice(i + 1, 0, clearUUID);
        parentBody.splice(i, 0, insertUUID);
        break;
      }
    }
  };
  return {
    visitor: {
      WhileStatement: DeadCycle,
      DoWhileStatement: DeadCycle,
      ForInStatement: DeadCycle,
      ForOfStatement: DeadCycle,
      ForStatement: DeadCycle,
    },
  };
});
//@deprecated
//不完善还需要优化
// Babel.registerPlugin("catch-error", () => {
//   // console.log(functionMap,'functionMap')
//   const CatchError = (path) => {
//     //匿名函数不存在递归问题
//     if (path.type !== "FunctionDeclaration" && !path.parent.id) {
//       return;
//     }
//     const uuid = generateUUID();
//     const uuidIncresment = template.ast(`${uuid}++`);
//     const uuidJudge = template.ast(`
//     if(${uuid}>999){
//         document.body.innerHTML=\`<pre id="root" style="color:red;font-weight:bold" >
//         ${generate(path.node).code}
//         超出最大递归限制(max:999)
//         </pre>\`;
//         console.error(\`${generate(path.node).code}
//         超出最大循环限制(max:999)\`)
//         throw new Error('超出最大递归限制')
//     }
//     `);
//     //统一函数格式
//     //箭头函数的情况
//     if (path.type === "ArrowFunctionExpression") {
//       //hash表记录uuid,此处需要想办法完善
//       //   if( path.parent.id){
//       //     // .uuid = uuid;
//       //   }

//       //如果直接返回值需要包装成block形式
//       if (path.node.body.type !== "BlockStatement") {
//         if (path.node.body.type === "CallExpression") {
//           //callExpersion需要提出来，然后负责清空变量uuid
//           const uuid = generateUUID();
//           path.node.body = template.ast(`
//             {
//                 const ${uuid}=${generate(path.node.body).code}
//                 return ${uuid}
//             }
//         `);
//         } else {
//           path.node.body = template.ast(`
//             {
//                 return ${generate(path.node.body).code}
//             }
//         `);
//         }
//       }
//     } else {
//       //function情况
//       //   path.node.id.uuid = uuid;
//     }
//     const clearUUID = template.ast(`${uuid}=0`);
//     const insertUUID = template.ast(`var ${uuid}=0`);
//     const blocks: any[] = path.node.body.body;
//     const node =
//       path.type === "ArrowFunctionExpression"
//         ? path.parentPath?.parentPath?.node
//         : path.node;
//     blocks.unshift(uuidJudge);
//     blocks.unshift(uuidIncresment);
//     const parentBody =
//       path.type === "ArrowFunctionExpression"
//         ? path.parentPath?.parentPath?.parentPath?.node.body
//         : path.parent.body;
//     if (parentBody) {
//       for (let i = 0; i < parentBody.length; i++) {
//         const n = parentBody[i];
//         if (n === node) {
//           parentBody.splice(i + 1, 0, clearUUID);
//           parentBody.splice(i, 0, insertUUID);
//           break;
//         }
//       }
//     }
//   };
//   return {
//     visitor: {
//       FunctionExpression: CatchError,
//       ArrowFunctionExpression: CatchError,
//       FunctionDeclaration: CatchError,
//     },
//   };
// });
