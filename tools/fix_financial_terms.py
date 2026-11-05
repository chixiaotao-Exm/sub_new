"""Reviewed financial glossary; updates caches and exact per-key overrides."""
import re,json
import translate_locales as tr
terms=['Balance','Available balance','Frozen balance','Total balance','Current Balance','New Balance','Account Balance','Wallet Balance','User Balance','Default Balance','Credited Balance','Cost','Total Cost','Today Cost','Quota','Quota Limit','Total Quota','Remaining Quota','Used Quota','Rate Multiplier','Rate Multipliers','Group Rate Multipliers','Billing Rate','Billing Rate Multiplier','Account rate','Refund','Refund Amount','Refund Reason']
rows={
 'zh-TW':['餘額','可用餘額','凍結餘額','總餘額','目前餘額','新餘額','帳戶餘額','錢包餘額','使用者餘額','預設餘額','入帳餘額','費用','總費用','今日費用','額度','額度上限','總額度','剩餘額度','已用額度','計費倍率','計費倍率','分組計費倍率','計費倍率','計費倍率','帳戶計費倍率','退款','退款金額','退款原因'],
 'ja':['残高','利用可能残高','凍結残高','合計残高','現在の残高','更新後の残高','アカウント残高','ウォレット残高','ユーザー残高','初期残高','入金済み残高','費用','合計費用','今日の費用','利用枠','利用上限','合計利用枠','残りの利用枠','使用済み利用枠','料金倍率','料金倍率','グループ料金倍率','料金倍率','料金倍率','アカウント料金倍率','返金','返金額','返金理由'],
 'ko':['잔액','사용 가능 잔액','동결 잔액','총 잔액','현재 잔액','변경 후 잔액','계정 잔액','지갑 잔액','사용자 잔액','기본 잔액','충전된 잔액','비용','총비용','오늘 비용','사용 한도','사용 한도 상한','총 사용 한도','남은 사용 한도','사용한 한도','요금 배율','요금 배율','그룹 요금 배율','요금 배율','요금 배율','계정 요금 배율','환불','환불 금액','환불 사유'],
 'es':['Saldo','Saldo disponible','Saldo retenido','Saldo total','Saldo actual','Nuevo saldo','Saldo de la cuenta','Saldo de la billetera','Saldo del usuario','Saldo inicial','Saldo abonado','Costo','Costo total','Costo de hoy','Cuota de uso','Límite de uso','Cuota total','Cuota restante','Cuota utilizada','Multiplicador de facturación','Multiplicadores de facturación','Multiplicadores de facturación del grupo','Multiplicador de facturación','Multiplicador de facturación','Multiplicador de la cuenta','Reembolso','Importe del reembolso','Motivo del reembolso'],
 'ru':['Баланс','Доступный баланс','Замороженный баланс','Общий баланс','Текущий баланс','Новый баланс','Баланс аккаунта','Баланс кошелька','Баланс пользователя','Начальный баланс','Зачисленная сумма','Стоимость','Общая стоимость','Стоимость за сегодня','Квота','Лимит использования','Общая квота','Оставшаяся квота','Использованная квота','Множитель стоимости','Множители стоимости','Множители стоимости группы','Множитель стоимости','Множитель стоимости','Множитель стоимости аккаунта','Возврат средств','Сумма возврата','Причина возврата'],
 'fr':['Solde','Solde disponible','Solde bloqué','Solde total','Solde actuel','Nouveau solde','Solde du compte','Solde du portefeuille','Solde utilisateur','Solde initial','Solde crédité','Coût','Coût total','Coût du jour','Quota','Limite de quota','Quota total','Quota restant','Quota utilisé','Multiplicateur de facturation','Multiplicateurs de facturation','Multiplicateurs du groupe','Multiplicateur de facturation','Multiplicateur de facturation','Multiplicateur du compte','Remboursement','Montant du remboursement','Motif du remboursement'],
 'de':['Guthaben','Verfügbares Guthaben','Gesperrtes Guthaben','Gesamtguthaben','Aktuelles Guthaben','Neues Guthaben','Kontoguthaben','Wallet-Guthaben','Benutzerguthaben','Anfangsguthaben','Gutgeschriebener Betrag','Kosten','Gesamtkosten','Heutige Kosten','Kontingent','Nutzungslimit','Gesamtkontingent','Verbleibendes Kontingent','Verbrauchtes Kontingent','Abrechnungsfaktor','Abrechnungsfaktoren','Abrechnungsfaktoren der Gruppe','Abrechnungsfaktor','Abrechnungsfaktor','Kontofaktor','Rückerstattung','Erstattungsbetrag','Erstattungsgrund'],
 'pt':['Saldo','Saldo disponível','Saldo bloqueado','Saldo total','Saldo atual','Novo saldo','Saldo da conta','Saldo da carteira','Saldo do usuário','Saldo inicial','Saldo creditado','Custo','Custo total','Custo de hoje','Cota de uso','Limite de uso','Cota total','Cota restante','Cota utilizada','Multiplicador de cobrança','Multiplicadores de cobrança','Multiplicadores de cobrança do grupo','Multiplicador de cobrança','Multiplicador de cobrança','Multiplicador da conta','Reembolso','Valor do reembolso','Motivo do reembolso'],
}
per_key={
 'zh-TW':['實際扣費','標準費用','已付款','計費倍率'],
 'ja':['実際の請求額','標準費用','支払い済み','料金倍率'],
 'ko':['실제 청구 비용','표준 비용','결제 완료','요금 배율'],
 'es':['Costo cobrado','Costo estándar','Pagado','Multiplicador de facturación'],
 'ru':['Фактически списано','Стандартная стоимость','Оплачено','Множитель стоимости'],
 'fr':['Coût facturé','Coût standard','Payé','Multiplicateur de facturation'],
 'de':['Tatsächlich berechnet','Standardkosten','Bezahlt','Abrechnungsfaktor'],
 'pt':['Custo cobrado','Custo padrão','Pago','Multiplicador de cobrança'],
}
source=tr.read(tr.SOURCE/'en.json');zh_source=tr.read(tr.SOURCE/'zh.json');report={};all_overrides={}
for locale,values in rows.items():
 assert len(values)==len(terms)
 path=tr.CACHE/(locale+'.json');cache=tr.read(path);glossary=dict(zip(terms,values));changes=[]
 for key,en in source.items():
  original=zh_source[key] if locale=='zh-TW' else en
  if en in glossary:
   new=glossary[en]
   if cache.get(original)!=new:changes.append({'key':key,'before':cache.get(original),'after':new})
   cache[original]=new
  elif locale in ['ja','de','ko','pt'] and 'balance' in en.lower() and 'load balanc' not in en.lower():
   old=cache.get(original,'');new=old
   substitutions={'ja':[(r'バランス','残高')],'ko':[(r'균형','잔액')],'de':[(r'Gleichgewichts','Guthabens'),(r'Gleichgewicht','Guthaben')],'pt':[(r'Equilíbrio','Saldo'),(r'equilíbrio','saldo')]}
   for pattern,replacement in substitutions[locale]:new=re.sub(pattern,replacement,new)
   if new!=old:cache[original]=new;changes.append({'key':key,'before':old,'after':new})
 tr.write(path,cache);tr.run(locale)
 output=tr.ROOT/'src/i18n/locales'/f'{locale}.json';dictionary=tr.read(output)
 labels=per_key[locale]
 overrides={'usage.actualCost':labels[0],'usage.standardCost':labels[1],'payment.status.paid':labels[2],'payment.admin.rateMultiplierLabel':labels[3],'admin.groups.rateLabel':labels[3],'modelPlaza.filters.rateLabel':labels[3]}
 all_overrides[locale]=overrides
 for key,value in overrides.items():
  target=dictionary;parts=key.split('.')
  for part in parts[:-1]:target=target[part]
  if target[parts[-1]]!=value:changes.append({'key':key,'before':target[parts[-1]],'after':value})
  target[parts[-1]]=value
 tr.write(output,dictionary);report[locale]=changes
tr.write(tr.ROOT/'tools/financial-term-review.json',report)
tr.write(tr.ROOT/'tools/translation-key-overrides.json',all_overrides)
print(json.dumps({locale:len(changes) for locale,changes in report.items()}))
