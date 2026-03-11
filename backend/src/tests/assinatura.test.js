import { gerarUrlAutorizacao, decodificarState } from '../services/assinaturaGovBr.js';

describe('Serviço de Assinatura GOV.BR', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      GOVBR_CLIENT_ID: 'test_client_id',
      GOVBR_CLIENT_SECRET: 'test_secret',
      GOVBR_REDIRECT_URI: 'http://localhost:3000/assinatura/callback',
      GOVBR_OAUTH_URL: 'https://cas.staging.iti.br',
      GOVBR_API_URL: 'https://assinatura-api.staging.iti.br',
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('gerarUrlAutorizacao deve retornar URL com os parâmetros corretos', () => {
    const url = gerarUrlAutorizacao('atestado', 'doc-123', 'medico-456');
    expect(url).toContain('cas.staging.iti.br');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=sign');
    expect(url).toContain('client_id=test_client_id');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('state=');
  });

  test('decodificarState deve retornar o objeto original', () => {
    const url = gerarUrlAutorizacao('laudo', 'doc-789', 'medico-001');
    const urlObj = new URL(url);
    const state = urlObj.searchParams.get('state');
    const decoded = decodificarState(state);
    expect(decoded.tipoDocumento).toBe('laudo');
    expect(decoded.documentoId).toBe('doc-789');
    expect(decoded.medicoId).toBe('medico-001');
  });

  test('gerarUrlAutorizacao deve incluir state com dados codificados', () => {
    const url = gerarUrlAutorizacao('receita_simples', 'doc-999', 'medico-002');
    const urlObj = new URL(url);
    const state = urlObj.searchParams.get('state');
    expect(state).toBeTruthy();
    const decoded = decodificarState(state);
    expect(decoded).toHaveProperty('tipoDocumento');
    expect(decoded).toHaveProperty('documentoId');
    expect(decoded).toHaveProperty('medicoId');
  });
});

describe('Controller de Assinatura', () => {
  test('iniciarAssinatura deve retornar 400 se tipoDocumento estiver ausente', async () => {
    const { iniciarAssinatura } = await import('../controllers/assinaturaController.js');
    const req = { body: { documentoId: 'doc-123' }, usuario: { id: 'medico-001' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await iniciarAssinatura(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('iniciarAssinatura deve retornar 400 se tipo for inválido', async () => {
    const { iniciarAssinatura } = await import('../controllers/assinaturaController.js');
    const req = { body: { tipoDocumento: 'tipo_invalido', documentoId: 'doc-123' }, usuario: { id: 'medico-001' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await iniciarAssinatura(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
