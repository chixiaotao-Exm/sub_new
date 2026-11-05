import json,sys
import translate_locales as tr
sys.path.insert(0,str(tr.ROOT/'tools/translation-vendor'))
from opencc import OpenCC

converter=OpenCC('s2twp')
path=tr.CACHE/'zh-TW.json'; cache=tr.read(path)
for source,value in list(cache.items()):
 protected,tokens=tr.protect(value)
 cache[source]=tr.restore(converter.convert(protected),tokens)
tr.write(path,cache)
tr.run('zh-TW')

path=tr.CACHE/'ja.json';cache=tr.read(path)
cache['Get a single API key to call all connected AI models. No separate applications needed.']='1 つの API キーで、接続されているすべての AI モデルを呼び出せます。個別の申請は不要です。'
cache['When enabled, models outside the allowlist are rejected with 404 model_not_found, and model listing endpoints only show allowlisted models. Entries support exact model IDs and * wildcards anywhere (e.g., gpt-*-codex). Note: Claude Code probes with haiku-family models for titles/summaries and /messages/count_tokens is also allowlist-controlled, so make sure the small models you need are selected too.']='有効にすると、許可リストにないモデルは 404 model_not_found で拒否され、モデル一覧のエンドポイントには許可されたモデルのみが表示されます。モデル ID の完全一致と、任意の位置の * ワイルドカード（例: gpt-*-codex）を使用できます。注意: Claude Code はタイトルや要約に haiku 系のモデルを使用し、/messages/count_tokens にも許可リストが適用されます。必要な小型モデルも選択してください。'
cache['This is a separate auth mode. It does not save refresh_token or write an OAuth access_token expiration.']='これは独立した認証モードです。refresh_token は保存せず、OAuth access_token の有効期限も記録しません。'
tr.write(path,cache)
tr.run('ja')
