import translate_locales as tr
terms=['Dashboard','My Orders','Orders','Collapse','Proxies','Accounts','API Keys','API Endpoints']
translations={
 'zh-TW':['儀表板','我的訂單','訂單','收合','代理伺服器','帳號','API 金鑰','API 端點'],
 'ja':['ダッシュボード','自分の注文','注文','折りたたむ','プロキシ','アカウント','API キー','API エンドポイント'],
 'ko':['대시보드','내 주문','주문','접기','프록시','계정','API 키','API 엔드포인트'],
 'es':['Panel de control','Mis pedidos','Pedidos','Contraer','Proxies','Cuentas','Claves API','Endpoints de API'],
 'ru':['Обзор','Мои заказы','Заказы','Свернуть','Прокси','Аккаунты','Ключи API','Конечные точки API'],
 'fr':['Tableau de bord','Mes commandes','Commandes','Replier','Proxys','Comptes','Clés API','Points de terminaison API'],
 'de':['Übersicht','Meine Bestellungen','Bestellungen','Einklappen','Proxys','Konten','API-Schlüssel','API-Endpunkte'],
 'pt':['Painel','Meus pedidos','Pedidos','Recolher','Proxies','Contas','Chaves de API','Endpoints de API'],
}
en=tr.read(tr.SOURCE/'en.json');zh=tr.read(tr.SOURCE/'zh.json');report={}
for locale,values in translations.items():
 path=tr.CACHE/(locale+'.json');cache=tr.read(path);lookup=dict(zip(terms,values));changed=[]
 for key,source in en.items():
  if source not in lookup:continue
  original=zh[key] if locale=='zh-TW' else source
  if cache.get(original)!=lookup[source]:changed.append({'key':key,'before':cache.get(original),'after':lookup[source]})
  cache[original]=lookup[source]
 tr.write(path,cache);tr.run(locale);report[locale]=changed
tr.write(tr.ROOT/'tools/navigation-term-review.json',report)
print({locale:len(items) for locale,items in report.items()})
