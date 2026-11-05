const fs = require('node:fs');
const path = require('node:path');
const ts = require('../node_modules/typescript');
const crypto = require('node:crypto');
const root=path.resolve(__dirname,'../src');
const files=['views/admin/SettingsView.vue','views/admin/settings/EmailTemplateEditor.vue','components/auth/WechatOAuthSection.vue','views/NotFoundView.vue','views/admin/ops/components/OpsDashboardHeader.vue','components/account/CreateAccountModal.vue','components/account/EditAccountModal.vue','components/keys/UseKeyModal.vue','features/prompt-audit/components/EndpointPool.vue','features/prompt-audit/components/FilterDeleteDialog.vue','views/user/BatchImageGuideView.vue'];
const pairs={};
function key(en){return 'inline.'+crypto.createHash('sha256').update(en).digest('hex').slice(0,14)}
for(const file of files){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 for(const m of source.matchAll(/\b(localText|localizeWeChatHint|translateInline)\s*\(/g)){
  const fragment=source.slice(m.index,m.index+5000);
  const ast=ts.createSourceFile('inline.ts',fragment,ts.ScriptTarget.Latest,true);
  const expr=ast.statements[0]?.expression;
  if(!expr||!ts.isCallExpression(expr))continue;
  const [zh,en]=expr.arguments;
  if(!zh||!en||!ts.isStringLiteralLike(zh)||!ts.isStringLiteralLike(en))continue;
  pairs[key(en.text)]={zh:zh.text,en:en.text};
 }
 const block=source.match(/const eventDisplayMeta(?:En)?:[^=]+=(\s*\{[\s\S]+?\n\};)/g);
 if(block?.length===2){
  function values(text){const ast=ts.createSourceFile('inline.ts',text,ts.ScriptTarget.Latest,true);const res={};function walk(n,prefix=''){if(ts.isPropertyAssignment(n)){const name=n.name.text;if(ts.isStringLiteralLike(n.initializer))res[prefix+name]=n.initializer.text;else if(ts.isObjectLiteralExpression(n.initializer))for(const p of n.initializer.properties)walk(p,prefix+name+'.');}else ts.forEachChild(n,c=>walk(c,prefix));}walk(ast);return res;}
  const zh=values(block[0]);const en=values(block[1]);
  for(const [name,value] of Object.entries(en))if(zh[name])pairs[key(value)]={zh:zh[name],en:value};
 }
}
// Shared explicit labels currently selected using zh/en branches.
for(const [zh,en] of [['日','Day'],['周','Week'],['月','Month'],['认证安全','Auth'],['订阅','Subscription'],['计费','Billing'],['管理告警','Admin'],['风控','Risk Control'],['运维','Ops'],['开通引导：GitHub Settings → Developer settings →','Setup guide: GitHub Settings → Developer settings →'],['→ New OAuth App；Homepage URL 填站点域名，Authorization callback URL 填下面的后端回调地址。','→ New OAuth App. Use your site origin as Homepage URL and the backend callback URL below as Authorization callback URL.']])pairs[key(en)]={zh,en};
const english=Object.fromEntries(Object.entries(pairs).map(([k,v])=>[k,v.en]));
const chinese=Object.fromEntries(Object.entries(pairs).map(([k,v])=>[k,v.zh]));
const lookup=Object.fromEntries(Object.entries(pairs).map(([k,v])=>[v.en,k]));
fs.writeFileSync(path.join(root,'i18n/inline-lookup.json'),JSON.stringify(lookup,null,2)+'\n');
for(const [locale,messages] of [['en',english],['zh',chinese]]){
 fs.writeFileSync(path.join(root,`i18n/locales/${locale}/inline.json`),JSON.stringify({inline:Object.fromEntries(Object.entries(messages).map(([k,v])=>[k.slice(7),v]))},null,2)+'\n');
 const sourceFile=path.join(__dirname,`locale-source/${locale}.json`);
 const source=JSON.parse(fs.readFileSync(sourceFile,'utf8'));
 Object.assign(source,messages);
 fs.writeFileSync(sourceFile,JSON.stringify(source,null,2)+'\n');
}
console.log(`Extracted ${Object.keys(pairs).length} bilingual inline messages`);
