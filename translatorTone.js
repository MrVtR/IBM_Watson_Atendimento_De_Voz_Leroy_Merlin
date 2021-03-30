const translatorTone = async (message) => {
  let text, tone;

  //Translator para retornar string pt-BR em En
  const languageTranslator = new LanguageTranslatorV3({
    version: '2018-05-01',
    authenticator: new IamAuthenticator({
      apikey: process.env.API_KEY_TRANSLATOR,
    }),
    serviceUrl: process.env.URL_TRANSLATOR,
  });

  const translateParams = {
    text: message,
    modelId: 'pt-en',
  };

  kloeResponse = await languageTranslator
    .translate(translateParams)
    .then(async (translationResult) => {
      text = translationResult.result.translations[0].translation;

      //Tone analyzer usando o Translator
      const toneAnalyzer = new ToneAnalyzerV3({
        version: '2017-09-21',
        authenticator: new IamAuthenticator({
          apikey: process.env.API_KEY_TONE,
        }),
        serviceUrl: process.env.URL_TONE,
      });

      const toneParams = {
        toneInput: { text: text },
        contentType: 'application/json',
        acceptLanguage: 'pt-br',
      };

      tone = await toneAnalyzer
        .tone(toneParams)
        .then(async (toneAnalysis) => {
          const max = toneAnalysis.result.document_tone.tones.reduce(function (
            prev,
            current,
          ) {
            return prev.score > current.score ? prev : current;
          });
          if (max.score > 0.7) {
            return {
              sentimento: max.tone_name,
            };
          }
        })
        .catch((err) => {
          return { err: err.message };
        });
    })
    .catch((err) => {
      return { err: err.message };
    });

  console.log(tone);
  return tone;
};
