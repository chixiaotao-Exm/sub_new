"""Sequential cached generation avoids concurrent public endpoint load."""
import translate_locales
for locale in translate_locales.LOCALES:
 translate_locales.run(locale)
