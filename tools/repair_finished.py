import translate_locales as tr
patches={
 'ko':{
  'On the R2 page, click "Manage R2 API Tokens" in the top right':'R2 페이지 오른쪽 위에서 "Manage R2 API Tokens"를 클릭하세요.',
  'This site has not completed WeChat MP/JSAPI payment setup, so in-app WeChat payment is unavailable right now.':'이 사이트는 WeChat MP/JSAPI 결제 설정을 완료하지 않았으므로 현재 WeChat 앱 내 결제를 사용할 수 없습니다.',
 },
 'pt':{'WebAuthn relying party configuration is valid.':'A configuração da parte confiável do WebAuthn é válida.'},
 'es':{
  'Enable Web Search Emulation':'Activar emulación de búsqueda web',
  'Quota limit must be greater than 0':'El límite de cuota debe ser mayor que 0',
  'Quota resets monthly from this date; leave empty to disable auto-reset':'La cuota se restablece mensualmente a partir de esta fecha; déjalo vacío para desactivar el restablecimiento automático',
  'Reset usage counter for this provider?':'¿Restablecer el contador de uso de este proveedor?',
  'Major world events this year':'Principales acontecimientos mundiales de este año',
  'Displayed in emails and page titles':'Se muestra en los correos electrónicos y en los títulos de las páginas',
 },
 'fr':{
  'Initial Grok support is OAuth subscription-backed Responses API text and reasoning traffic only.':'La prise en charge initiale de Grok se limite au trafic textuel et de raisonnement de l’API Responses, couvert par un abonnement OAuth.',
 },
 'de':{
  'Round Robin':'Round-Robin-Verfahren',
  'Mobile orders call alipay.trade.wap.pay first and jump to Alipay checkout.':'Bei mobilen Bestellungen wird zuerst alipay.trade.wap.pay aufgerufen und anschließend zur Alipay-Kasse weitergeleitet.',
  'Pay-as-you-go':'Nutzungsabhängige Abrechnung',
  'Google AI Pay-as-you-go':'Google AI mit nutzungsabhängiger Abrechnung',
  'AWS Secret Access Key':'Geheimer AWS-Zugriffsschlüssel',
  'Codex OAuth auth.json / AT Import':'Import von Codex OAuth auth.json / AT',
 },
}
for locale,overrides in patches.items():
 path=tr.CACHE/(locale+'.json');cache=tr.read(path);cache.update(overrides);tr.write(path,cache)
 tr.run(locale)
