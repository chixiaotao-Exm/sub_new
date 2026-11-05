"""Keep protocol examples byte-for-byte; translate only surrounding prose."""
import re
import translate_locales as tr
pattern=re.compile(r'\bsk-[A-Za-z0-9.*_-]+')
for locale in tr.LOCALES:
 path=tr.CACHE/(locale+'.json')
 if not path.exists():continue
 cache=tr.read(path);changes=0
 for source,value in list(cache.items()):
  originals=pattern.findall(source);translated=pattern.findall(value)
  if originals and len(originals)==len(translated) and originals!=translated:
   iterator=iter(originals);cache[source]=pattern.sub(lambda _:next(iterator),value);changes+=1
 if changes:tr.write(path,cache)
 print(locale,changes)
