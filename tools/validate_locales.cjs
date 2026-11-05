const fs=require('node:fs');
const path=require('node:path');
const ts=require('../node_modules/typescript');
const {baseCompile}=require('../node_modules/@intlify/message-compiler');
const root=path.resolve(__dirname,'..');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);
function flatten(obj,prefix='',out={}) {for(const [k,v] of Object.entries(obj)){const key=prefix?prefix+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,key,out);else out[key]=v}return out}
const originalEn=flatten(require(root+'/src/i18n/locales/en/index.ts').default);
const originalZh=flatten(require(root+'/src/i18n/locales/zh/index.ts').default);
const locales=['zh-TW','ja','ko','es','ru','fr','de','pt'];
const report={checkedAt:new Date().toISOString(),sourceKeys:Object.keys(originalEn).length,locales:{},complete:true};
const extracted=(text,pattern)=>(text.match(pattern)||[]).sort();
const readable=(text)=>text.replace(/https?:\/\/[^\s]+|`[^`]*`|\{[^{}]*\}|<[^>]*>|\b[\w]+_[\w_]+\b|\b(?:API|URL|URI|ID|JSON|XML|YAML|CSV|OAuth|HTTP|HTTPS|TCP|UDP|RPM|TPM|QPS|SSE|SDK|CLI|MCP|TLS|SSL|JWT|TTFT|Sub2API|OpenAI|Claude|Codex|Google|Gemini|Stripe)\b/g,'').trim();
const literalExample=(key,text)=>/^https?:\/\//.test(text)||/^sk-/.test(text)||/^[\w-]+=\.\.\./.test(text)||/^\/[\w/:-]+$/.test(text)||(/placeholder|example|command/i.test(key)&&/[=;{}]|^\w+:\/\//.test(text));
for(const locale of locales){
 const file=root+`/src/i18n/locales/${locale}.json`;
 const dict=fs.existsSync(file)?flatten(JSON.parse(fs.readFileSync(file,'utf8'))):{};
 const original=locale==='zh-TW'?originalZh:originalEn;
 const entry={keys:Object.keys(dict).length,missing:[],empty:[],extra:[],placeholderErrors:[],compileErrors:[],markupErrors:[],identicalEnglishSentences:[],untranslatedLatinSentences:[]};
 for(const [key,source] of Object.entries(original)){
  const value=dict[key];
  if(value===undefined){entry.missing.push(key);continue}
  if(typeof value!=='string'||!value.trim()){entry.empty.push(key);continue}
  if(JSON.stringify(extracted(source,/\{[^{}]*\}/g))!==JSON.stringify(extracted(value,/\{[^{}]*\}/g)))entry.placeholderErrors.push(key);
  if(JSON.stringify(extracted(source,/<\/?[a-zA-Z][^>]*>/g))!==JSON.stringify(extracted(value,/<\/?[a-zA-Z][^>]*>/g)))entry.markupErrors.push(key);
  baseCompile(value,{onError:e=>entry.compileErrors.push({key,error:e.message})});
  if(locale!=='zh-TW'&&!literalExample(key,value)&&value===source&&(readable(value).match(/[a-zA-Z]{2,}/g)||[]).length>=4)entry.identicalEnglishSentences.push({key,value});
  if(['ja','ko','ru'].includes(locale)&&!literalExample(key,value)&&!(value.match(locale==='ja'?/[\u3040-\u30ff\u3400-\u9fff]/:locale==='ko'?/[\uac00-\ud7af]/:/[\u0400-\u04ff]/))&&(readable(value).match(/[a-zA-Z]{2,}/g)||[]).length>=4)entry.untranslatedLatinSentences.push({key,value});
 }
 entry.extra=Object.keys(dict).filter(k=>original[k]===undefined);
 entry.complete=!entry.missing.length&&!entry.empty.length&&!entry.extra.length&&!entry.placeholderErrors.length&&!entry.compileErrors.length&&!entry.markupErrors.length&&!entry.identicalEnglishSentences.length&&!entry.untranslatedLatinSentences.length;
 if(!entry.complete)report.complete=false;
 report.locales[locale]=entry;
}
fs.writeFileSync(root+'/tools/translation-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceKeys:report.sourceKeys,complete:report.complete,locales:Object.fromEntries(Object.entries(report.locales).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([a,b])=>[a,Array.isArray(b)?b.length:b]))]))},null,2));
process.exitCode=report.complete?0:1;
