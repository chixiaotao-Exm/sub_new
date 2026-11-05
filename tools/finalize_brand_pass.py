import translate_locales as tr
source='Initial Grok support is OAuth subscription-backed Responses API text and reasoning traffic only.'
translated='La prise en charge initiale de Grok se limite au trafic texte et de raisonnement de Responses API, couvert par un abonnement OAuth.'
for filename in ['fr.json','fr-brands.json']:
 path=tr.CACHE/filename;data=tr.read(path);data[source]=translated;tr.write(path,data)
tr.run('fr')
for filename in ['de.json','de-brands.json']:
 path=tr.CACHE/filename;data=tr.read(path);data['Responses / Chat Completions (Auto)']='Responses / Chat Completions (Automatisch)';tr.write(path,data)
tr.run('de')
