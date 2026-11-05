"""Build static UI translations from public upstream messages only.

Network requests never contain credentials, live settings, or user data.
Requests are cached and resumable. ICU placeholders, code, URLs and markup
are replaced with checked tokens before translation and restored afterwards.
"""
from __future__ import annotations
import argparse, collections, hashlib, json, pathlib, re, sys, time, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'tools' / 'translation-cache'
SOURCE = ROOT / 'tools' / 'locale-source'
LOCALES = {'zh-TW':'zh-TW', 'ja':'ja', 'ko':'ko', 'es':'es', 'ru':'ru', 'fr':'fr', 'de':'de', 'pt':'pt'}
BRANDS = r'\b(?:Sub2API|OpenAI|Anthropic|Claude|Codex|Gemini|Google|GitHub|GitLab|Microsoft|Apple|Linux|Docker|OAuth|HTTP|HTTPS|TCP|UDP|IP|RPM|TPM|QPS|JSON|XML|YAML|CSV|JWT|TLS|SSL|SDK|CLI|MCP|SSE|WebSocket|WebAuthn|Turnstile|Cloudflare|Stripe|PayPal|Airwallex|WeChat|Alipay|API|URL|URI|ID|USD|CNY|EUR|GPT(?:-[\w.]+)?)\b'
PROTECT = re.compile(r'```[\s\S]*?```|`[^`\n]+`|\{[^{}]*\}|@:[\w.]+|https?://[^\s<>\)]+|</?[a-zA-Z][^>]*>|\b[\w]+_[\w_]+\b|' + BRANDS)
MARKER = re.compile(r'__MSG_([0-9]{4})__')
TOKEN = re.compile(r'__PH([0-9]+)__')

def read(path): return json.loads(path.read_text(encoding='utf-8'))
def write(path,value):
 path.parent.mkdir(parents=True,exist_ok=True)
 temp=path.with_suffix(path.suffix+'.tmp')
 temp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 temp.replace(path)
def protect(value):
 tokens=[]
 def replace(m):
  tokens.append(m.group());return f'__PH{len(tokens)-1}__'
 return PROTECT.sub(replace,value),tokens
def restore(value,tokens):
 # The service occasionally inserts spaces around underscores; this is safe
 # only when the token number still identifies an exact protected literal.
 value=re.sub(r'_\s*_\s*PH\s*([0-9]+)\s*_\s*_',lambda m:f'__PH{m[1]}__',value,flags=re.I)
 found=collections.Counter(TOKEN.findall(value))
 expected=collections.Counter(str(i) for i in range(len(tokens)))
 if found!=expected: raise ValueError(f'placeholder mismatch: {found} != {expected}')
 value=TOKEN.sub(lambda m:tokens[int(m[1])],value)
 return value.strip()
def request(text,target,source='en'):
 query=urllib.parse.urlencode({'client':'gtx','sl':source,'tl':target,'dt':'t','q':text})
 req=urllib.request.Request('https://translate.googleapis.com/translate_a/single?'+query,headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(req,timeout=45) as r: data=json.load(r)
 return ''.join(x[0] or '' for x in data[0] if x)
def batches(items,limit=2600):
 batch=[];size=0
 for item in items:
  n=len(item[1])+30
  if batch and size+n>limit: yield batch;batch=[];size=0
  batch.append(item);size+=n
 if batch:yield batch
def translate_batch(batch,target,source):
 content='\n\n'.join(f'__MSG_{i:04d}__\n{text}' for i,(_,text,_) in enumerate(batch))
 translated=request(content,target,source)
 markers=list(MARKER.finditer(translated))
 if len(markers)!=len(batch) or [int(m[1]) for m in markers]!=list(range(len(batch))):raise ValueError('message boundary mismatch')
 results=[]
 for i,m in enumerate(markers):
  end=markers[i+1].start() if i+1<len(markers) else len(translated)
  results.append(restore(translated[m.end():end],batch[i][2]))
 return results
def nest(flat):
 result={}
 for key,value in flat.items():
  target=result;parts=key.split('.')
  for part in parts[:-1]:target=target.setdefault(part,{})
  target[parts[-1]]=value
 return result
def run(locale,max_batches=None):
 source_lang='zh-CN' if locale=='zh-TW' else 'en'
 messages=read(SOURCE/('zh.json' if locale=='zh-TW' else 'en.json'))
 cache_path=CACHE/(locale+'.json');cache=read(cache_path) if cache_path.exists() else {}
 items=[];html_messages={}
 pending=[]
 for value in dict.fromkeys(messages.values()):
  if value in cache:continue
  if re.search(r'</?[a-zA-Z][^>]*>',value):
   parts=re.split(r'(</?[a-zA-Z][^>]*>)',value)
   html_messages[value]=parts
   pending.extend(part.strip() for i,part in enumerate(parts) if i%2==0 and part.strip())
  else:pending.append(value)
 for value in dict.fromkeys(pending):
  if value in cache:continue
  text,tokens=protect(value)
  if not re.search(r'[A-Za-z\u3400-\u9fff]',TOKEN.sub('',text)):
   cache[value]=value;continue
  items.append((value,text,tokens))
 groups=list(batches(items))
 print(json.dumps({'locale':locale,'cached':len(cache),'remaining_unique':len(items),'batches':len(groups)}),flush=True)
 errors=[]
 for idx,batch in enumerate(groups):
  if max_batches is not None and idx>=max_batches:break
  for attempt in range(4):
   try:
    result=translate_batch(batch,LOCALES[locale],source_lang)
    for (value,_,_),translated in zip(batch,result):cache[value]=translated
    break
   except Exception as exc:
    print(json.dumps({'locale':locale,'batch':idx+1,'attempt':attempt+1,'error':str(exc)}),flush=True)
    if attempt<3:time.sleep(2*(attempt+1));continue
    # Structural failures are retried individually, never filled with English.
    for value,text,tokens in batch:
     try:cache[value]=restore(request(text,LOCALES[locale],source_lang),tokens)
     except Exception as sub:errors.append({'source':value,'error':str(sub)})
     time.sleep(.7)
  write(cache_path,cache)
  if idx%10==0 or idx+1==len(groups):print(json.dumps({'locale':locale,'batch':idx+1,'total_batches':len(groups),'cached':len(cache),'errors':len(errors)}),flush=True)
  time.sleep(.85)
 for original,parts in html_messages.items():
  if all(i%2 or not part.strip() or part.strip() in cache for i,part in enumerate(parts)):
   cache[original]=''.join(part if i%2 or not part.strip() else part[:len(part)-len(part.lstrip())]+cache[part.strip()]+part[len(part.rstrip()):] for i,part in enumerate(parts))
 write(cache_path,cache)
 missing=[key for key,value in messages.items() if value not in cache]
 report={'locale':locale,'source_keys':len(messages),'cached_unique':len(cache),'missing':missing,'errors':errors,'complete':not missing}
 write(CACHE/(locale+'-report.json'),report)
 if not missing:
  flat={k:cache[v] for k,v in messages.items()}
  override_path=ROOT/'tools/translation-key-overrides.json'
  if override_path.exists():flat.update(read(override_path).get(locale,{}))
  write(ROOT/'src/i18n/locales'/f'{locale}.json',nest(flat))
 print(json.dumps({'locale':locale,'complete':not missing,'missing':len(missing),'errors':len(errors)}),flush=True)
 return not missing
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--locale',choices=LOCALES,required=True);parser.add_argument('--max-batches',type=int);args=parser.parse_args()
 run(args.locale,args.max_batches)
