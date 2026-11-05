"""Second bounded worker; separate locale cache files from the main worker."""
import translate_locales
for locale in ['pt', 'de', 'fr']:
 translate_locales.run(locale)
