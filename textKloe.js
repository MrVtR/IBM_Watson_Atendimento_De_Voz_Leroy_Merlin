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
