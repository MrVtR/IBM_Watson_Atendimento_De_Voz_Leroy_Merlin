require('dotenv/config');
const axios = require('axios');
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const { IamAuthenticator } = require('ibm-watson/auth');
const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
const main = async ({ url, agent, message, resp, conversationID, base64 }) => {
  //Arrumar parâmetros?
  switch (agent) {
    case 0:
      console.time('Todos os métodos: ');
      const r = await textKloe(url);
      const r2 = await translatorTone(r.transcript);
      const r3 = await textToSpeechKloe(r.message);
      const r4 = await kloeAudio(process.env.NUM_CELULAR, r3.base64);
      console.timeEnd('Todos os métodos: ');
      return;
    case 1:
      return await translatorTone(message);
    case 2:
      return await textToSpeechKloe(resp);
    case 3:
      return await kloeAudio(conversationID, base64);
    default:
      console.log('Opção inválida');
      return {
        err: 'Opção inválida',
      };
  }
};

const textKloe = async (url) => {
  const data = await axios
    .get(url, {
      responseType: 'arraybuffer',
    })
    .then((res) => res.data);

  const payloadS2T = {
    method: 'POST',
    url: process.env.URL_SPEECH,
    headers: {
      'Content-Type': 'audio/ogg',
      'Transfer-Encoding': 'chunked',
      Authorization: `Basic ${Buffer.from(process.env.API_KEY_SPEECH).toString(
        'base64',
      )}`,
    },
    data: Buffer.from(data, 'binary'),
  };
  const message = await axios(payloadS2T)
    .then(async (result) => {
      const { data } = result;
      if (
        data &&
        data.results &&
        data.results.length > 0 &&
        data.results[0].alternatives.length > 0
      ) {
        resp = await kloeResp(data.results[0].alternatives[0].transcript);
        return {
          transcript: data.results[0].alternatives[0].transcript,
          message: resp,
        };
      }
    })
    .catch((err) => {
      return { err: err.message };
    });
  if (!message.transcript) {
    return { transcript: 'AUDIO NOT TRANSCRIPTED' };
  }
  console.log(message.transcript);
  return message;
};

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

async function kloeResp(text) {
  const payloadS3T = {
    method: 'POST',
    url: process.env.URL_KLOE_RESP,
    headers: {
      'Content-Type': 'aplication/json',
      'x-api-key': process.env.API_KEY_KLOE_RESP,
    },
    data: {
      text: text,
    },
  };
  const response = await axios(payloadS3T)
    .then((result) => {
      const { data } = result;
      return data.message.join(',');
    })
    .catch((err) => {
      return { err: err.message };
    });

  return response;
}

async function kloeAudio(conversationID, data) {
  console.time('Kloe');
  const payloadS3T = {
    method: 'POST',
    url: process.env.URL_KLOE_AUDIO,
    headers: {
      'Content-Type': 'aplication/json',
      'x-api-key': process.env.API_KEY_KLOE_AUDIO,
    },
    data: {
      conversationId: conversationID,
      file: {
        data: data,
        contentType: 'audio/mpeg',
      },
    },
  };
  const response = await axios(payloadS3T)
    .then((result) => {
      const { data } = result;
      console.log(data);
      console.timeEnd('Kloe');
    })
    .catch((err) => {
      console.log(err.message);
      return { err: err.message };
    });

  return response;
}

// Speech-to-Text + Kloe API text

main({
  url: 'https://kloe-proa.s3.amazonaws.com/uploads/1616767412695.ogg',
  agent: 0,
});

//  Translator + Tone Analyzer

// main({
//   agent: 1,
//   message: 'Bom dia',
// });

// Text-to-Speech + Kloe API Voz

// main({
//   agent: 2,
//   resp: 'Olá, tudo bem?',
//   conversationID: '5511947170707',
// });

//Opção inválida de teste do Default

// main({
//   url: 'https://kloe-proa.s3.amazonaws.com/uploads/1616767412695.ogg',
//   agent: 3,
// });
