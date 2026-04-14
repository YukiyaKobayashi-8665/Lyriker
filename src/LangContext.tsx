import { createContext, useContext, useState, type FC, type ReactNode } from 'react';
import { translations, type Lang, type T } from './i18n';

type LangContextValue = {
  lang: Lang;
  t: T;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  t: translations.en,
  toggleLang: () => {},
});

export const LangProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('en');
  const toggleLang = () => setLang(l => (l === 'en' ? 'zh' : 'en'));
  return (
    <LangContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
