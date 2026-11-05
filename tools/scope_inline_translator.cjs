const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../src');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.isFile()&&e.name.endsWith('.vue')?[path.join(dir,e.name)]:[])}
for(const file of files(root)){
 let source=fs.readFileSync(file,'utf8');
 if(!source.includes('import { translateInline }'))continue;
 source=source.replace('import { translateInline }','import { createInlineTranslator }');
 const pattern=/const\s*\{\s*t\s*(?:,\s*locale\s*)?\}\s*=\s*useI18n\(\);?/;
 if(!pattern.test(source))throw Error('Missing component i18n scope: '+file);
 source=source.replace(pattern,m=>m+'\nconst translateInline = createInlineTranslator(t)');
 fs.writeFileSync(file,source);
}
