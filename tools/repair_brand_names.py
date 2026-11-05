"""Preserve complete product names and named API protocols in technical prose."""
import re,json,time
import translate_locales as tr
names=re.compile(r'Claude Code|Chat Completions|Messages API|Responses API|\bResponses\b|\bImagine\b|System One')
original=tr.PROTECT
tr.PROTECT=re.compile(names.pattern+'|'+original.pattern)
source=tr.read(tr.SOURCE/'en.json')
selected=list(dict.fromkeys(v for v in source.values() if names.search(v)))
for locale in ['ja','ko','es','ru','fr','de','pt']:
 path=tr.CACHE/(locale+'.json');cache=tr.read(path)
 # Separate checkpoint allows safe retries without retranslating this pass.
 done_path=tr.CACHE/(locale+'-brands.json');done=tr.read(done_path) if done_path.exists() else {}
 items=[(value,*tr.protect(value)) for value in selected if value not in done]
 for batch in tr.batches(items,2300):
  try:
   result=tr.translate_batch(batch,tr.LOCALES[locale],'en')
   for (value,_,_),text in zip(batch,result):done[value]=text
  except Exception:
   for value,text,tokens in batch:
    try:done[value]=tr.restore(tr.request(text,tr.LOCALES[locale]),tokens)
    except Exception as exc:print(json.dumps({'locale':locale,'source':value,'error':str(exc)}),flush=True)
    time.sleep(.6)
  tr.write(done_path,done);time.sleep(.8)
 cache.update(done);tr.write(path,cache)
 print(json.dumps({'locale':locale,'terms_fixed':len(done),'expected':len(selected)}),flush=True)
 tr.run(locale)
