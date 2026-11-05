import json,re
import translate_locales as tr
out={}
source_values=list(dict.fromkeys(tr.read(tr.SOURCE/'en.json').values()))
for locale in ['ja','ko','es','ru','fr','de','pt']:
 path=tr.CACHE/(locale+'.json')
 if not path.exists():continue
 cache=tr.read(path);findings=[]
 for source in source_values:
  value=cache.get(source)
  if not value:continue
  for sentence in re.split(r'(?<=[.!?])\s+',source):
   fragment=sentence.strip(' .!?\n')
   plain=tr.PROTECT.sub('',fragment)
   if len(re.findall(r'[A-Za-z]{2,}',plain))>=4 and fragment in value:
    findings.append({'source':source,'value':value,'fragment':fragment})
 out[locale]=findings
tr.write(tr.ROOT/'tools/english-fragments.json',out)
print(json.dumps({k:{'count':len(v),'samples':v[:4]} for k,v in out.items()},ensure_ascii=True,indent=2))
