const textToSpeechKloe = async (resp, conversationID) => {
  //Text to speech
  console.time('Text');
  const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');

  const textToSpeech = new TextToSpeechV1({
    authenticator: new IamAuthenticator({
      apikey: process.env.API_KEY_TEXT,
    }),
    serviceUrl: process.env.URL_TEXT,
  });

  const synthesizeParams = {
    text: resp,
    accept: 'audio/mp3',
    voice: 'pt-BR_IsabelaV3Voice',
  };

  const audio = await textToSpeech
    .synthesize(synthesizeParams)
    .then((response) => {
      return textToSpeech.repairWavHeaderStream(response.result);
    })

    .then(async (buffer) => {
      const base = Buffer.from(buffer, 'binary').toString('base64');
      return { base64: base };
      //   await kloeAudio(
      //     conversationID,
      //     Buffer.from(buffer, 'binary').toString('base64'),
      //   );
      console.timeEnd('Text');
      console.log('Processado.', conversationID);
    })
    .catch((err) => {
      console.log('error:', err);
    });
  //Fim do text to speech
  return audio;
};
