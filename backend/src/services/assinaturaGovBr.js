import axios from 'axios';
import qs from 'qs';
import crypto from 'crypto';

const GOVBR_OAUTH_URL = process.env.GOVBR_OAUTH_URL || 'https://cas.staging.iti.br';
const GOVBR_API_URL = process.env.GOVBR_API_URL || 'https://assinatura-api.staging.iti.br';
const CLIENT_ID = process.env.GOVBR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOVBR_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOVBR_REDIRECT_URI;

/**
 * Gera a URL de autorização OAuth 2.0 para redirecionar o médico ao GOV.BR
 */
export function gerarUrlAutorizacao(tipoDocumento, documentoId, medicoId) {
  const state = Buffer.from(JSON.stringify({ tipoDocumento, documentoId, medicoId })).toString('base64url');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'sign',
    redirect_uri: REDIRECT_URI,
    state,
  });
  return `${GOVBR_OAUTH_URL}/oauth2.0/authorize?${params.toString()}`;
}

/**
 * Troca o authorization code pelo access token
 */
export async function obterAccessToken(code) {
  const { data } = await axios.post(
    `${GOVBR_OAUTH_URL}/oauth2.0/token`,
    qs.stringify({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data.access_token;
}

/**
 * Assina um documento PDF enviando o hash SHA-256 à API GOV.BR
 * Retorna o pacote PKCS#7 (.p7s) como Buffer
 */
export async function assinarDocumento(pdfBuffer, accessToken) {
  const hashBase64 = crypto.createHash('sha256').update(pdfBuffer).digest('base64');

  const { data } = await axios.post(
    `${GOVBR_API_URL}/externo/v2/assinarHash`,
    { hashBase64 },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    }
  );

  return { pacoteP7s: Buffer.from(data), hashBase64 };
}

/**
 * Decodifica o state OAuth de volta para o objeto original
 */
export function decodificarState(state) {
  return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
}
