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
