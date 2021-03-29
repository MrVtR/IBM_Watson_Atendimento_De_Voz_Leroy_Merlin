# IBM_Watson_Atendimento_De_Voz_Leroy_Merlin
Código feito para fazer a configuração de atendimento ao cliente para a Leroy Merlin, utilizando dos recursos da IBM Cloud e da Kloe API para a PROA.AI

## Primeira função: IBM Speech-to-Text + Kloe API - Texto
Essa função permite receber um áudio no canal dde atendimento do whatsapp da empresa Leroy Merlin, após isso, o áudio é enviado para o servidor S3 da AWS e decodificado para texto com o serviço Speech-to-Text da IBM. 
No final, o programa envia o áudio decodificado em formato json para a Kloe API que enviar o texto no serviço Watson Assistant para tratar as intenções do cliente e ser possível dar continuidade ao atendimento

## Segunda função: IBM LanguageTranslator + IBM Tone Analyzer
Essa função permite que seja recebido o texto decodificado da primeira função, com isso, o texto é traduzido para Inglês pra depois aplicar o Tone Analyzer e verificar qual o sentimento que o cliente possui neste momento (Alegria, raiva, tristeza,etc), para saber se o atendimento será continuado pelo bot ou se será transferido para um atendimento Humano.

## Terceira Função: IBM Text-To-Speech
Essa função recebe a resposta do assistente virtual que foi obtido na primeira função e converte em áudio com o serviço Text-To-Speech, retornando um base64 que representa os bytes do arquivo de áudio gerado pelo serviço

## Quarta Função: Kloe API - Voz:
Nesta função final, é recebido o base64, que representa o áudio de resposta do assistente virtual, gerado na função anterior para então poder utilizar das funções da Kloe API e mandar este base64 em formato de arquivo de áudio para o Whatsapp do Cliente

