import re,json
import translate_locales as tr
out={}
for locale in ['ja','ko','ru','zh-TW']:
 path=tr.CACHE/(locale+'.json')
 if not path.exists():continue
 results=[]
 for source,value in tr.read(path).items():
  plain=tr.PROTECT.sub('',value)
  matches=re.findall(r'[A-Za-z]{2,}(?:[ ,]+[A-Za-z]{2,}){3,}',plain)
  if matches:results.append({'source':source,'value':value,'fragments':matches})
 out[locale]=results
tr.write(tr.ROOT/'tools/mixed-sentences.json',out)
print(json.dumps({k:{'count':len(v),'samples':v[:8]} for k,v in out.items()},ensure_ascii=True,indent=2))
