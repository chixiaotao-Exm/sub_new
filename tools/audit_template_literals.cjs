const fs=require('node:fs'),path=require('node:path');
const vueRequire=require('node:module').createRequire(require.resolve('../node_modules/vue'));
const {parse}=vueRequire('@vue/compiler-sfc');
const {baseParse}=vueRequire('@vue/compiler-dom');
const root=path.resolve(__dirname,'../src');
const findings=[];
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&e.name!=='__tests__'?files(path.join(dir,e.name)):e.isFile()&&e.name.endsWith('.vue')?[path.join(dir,e.name)]:[])}
for(const file of files(root)){
 const {descriptor}=parse(fs.readFileSync(file,'utf8'));
 if(!descriptor.template)continue;
 let ast;try{ast=baseParse(descriptor.template.content)}catch{continue}
 function walk(node,ancestors=[]){
  if(node.type===2&&!ancestors.some(t=>['pre','code','script','style'].includes(t))&&/[\p{L}]{2}/u.test(node.content.trim()))findings.push({file:path.relative(root,file),line:descriptor.template.loc.start.line+node.loc.start.line-1,type:'text',value:node.content.trim().replace(/\s+/g,' ')});
  for(const prop of node.props||[])if(prop.type===6&&['title','placeholder','aria-label','alt'].includes(prop.name)&&prop.value&&/[\p{L}]{2}/u.test(prop.value.content.trim()))findings.push({file:path.relative(root,file),line:descriptor.template.loc.start.line+prop.loc.start.line-1,type:prop.name,value:prop.value.content});
  for(const child of node.children||[])walk(child,[...ancestors,node.tag]);
 }
 walk(ast);
}
fs.writeFileSync(path.join(__dirname,'template-literal-audit.json'),JSON.stringify(findings,null,2)+'\n');
const counts={};for(const f of findings)counts[f.file]=(counts[f.file]||0)+1;
console.log(JSON.stringify({count:findings.length,files:Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,15),samples:findings.filter(f=>f.value.split(' ').length>=3).slice(0,20)},null,2));
