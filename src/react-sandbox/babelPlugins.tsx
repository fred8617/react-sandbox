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
        
          throw new Error('超出最大循环限制')
        }
      `);
    const blocks: any[] = path.node.body.body;
    blocks.unshift(uuidJudge);
    blocks.unshift(uuidIncresment);
    const insertUUID = template.ast(`let ${uuid}=0`);
    //此处还需要考虑到switch case不一定存在block
    const parentBody = path.parent.body || path.parent.consequent;
    if (parentBody) {
      for (let i = 0; i < parentBody.length; i++) {
        const node = parentBody[i];
        if (node === path.node) {
          parentBody.splice(i, 0, insertUUID);
          break;
        }
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
