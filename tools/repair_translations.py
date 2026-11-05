"""Repair flagged structural or untranslated strings after a worker finishes."""
import argparse,json,pathlib,re,time
import translate_locales as tr

parser=argparse.ArgumentParser();parser.add_argument('--locale',required=True,choices=tr.LOCALES);args=parser.parse_args();locale=args.locale
path=tr.CACHE/(locale+'.json');cache=tr.read(path) if path.exists() else {}
source=tr.read(tr.SOURCE/('zh.json' if locale=='zh-TW' else 'en.json'))
source_lang='zh-CN' if locale=='zh-TW' else 'en'
flagged=[]
for value in dict.fromkeys(source.values()):
 result=cache.get(value)
 if not result:continue
 plain=tr.PROTECT.sub('',value)
 if locale!='zh-TW' and result==value and len(re.findall(r'[A-Za-z]{2,}',plain))>=4 and not re.match(r'^sk-|^[\w-]+=\.\.\.',value):flagged.append(value)
print(json.dumps({'locale':locale,'untranslated':len(flagged)}),flush=True)
for idx,value in enumerate(flagged):
 text,tokens=tr.protect(value)
 try:
  translated=tr.restore(tr.request(text,tr.LOCALES[locale],source_lang),tokens)
  if translated!=value:cache[value]=translated
  else:print(json.dumps({'still_untranslated':value}),flush=True)
 except Exception as exc:print(json.dumps({'error':str(exc),'source':value}),flush=True)
 time.sleep(.8)
tr.write(path,cache)
tr.run(locale)
