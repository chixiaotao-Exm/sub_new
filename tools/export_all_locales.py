"""Export only from complete caches; fails if any network work is still needed."""
import translate_locales as tr
for locale in tr.LOCALES:
 source=tr.read(tr.SOURCE/('zh.json' if locale=='zh-TW' else 'en.json'))
 cache=tr.read(tr.CACHE/(locale+'.json'))
 missing=[key for key,value in source.items() if value not in cache]
 if missing:raise RuntimeError(f'{locale}: {len(missing)} untranslated entries; run generator first')
 tr.run(locale)
