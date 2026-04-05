const messagesCreate = jest.fn()
const client = jest.fn(() => ({ messages: { create: messagesCreate } }))

jest.mock('form-data', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('mailgun.js', () => ({
  __esModule: true,
  default: jest.fn(() => ({ client })),
}))

describe('mailgun.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.MAILGUN_API_KEY = 'test-key'
    process.env.MAILGUN_DOMAIN = 'example.com'
    process.env.MAILGUN_FROM_EMAIL = 'Teapot <noreply@example.com>'
    process.env.MAILGUN_REPLY_TO = 'Support <support@example.com>'
    process.env.MAILGUN_URL = 'https://api.mailgun.test'
    process.env.MAILGUN_2FA_TEMPLATE = '2fa-template'
    process.env.MAILGUN_INVOICE_TEMPLATE = 'invoice-template'
    process.env.MAILGUN_PASSWORD_RESET_TEMPLATE = 'reset-template'
    process.env.MAILGUN_HELP_LINK = 'https://help.example.com'
    process.env.MAILGUN_PRIVACY_LINK = 'https://privacy.example.com'
    process.env.MAILGUN_SECURITY_LINK = 'https://security.example.com'
  })

  it('sends 2fa emails with the expected payload', async () => {
    messagesCreate.mockResolvedValue(undefined)
    const { sendTwoFactorCode } = await import('../../../../src/utils/mailgun.service')

    await sendTwoFactorCode('user@example.com', '123456', 'Jamie')

    expect(client).toHaveBeenCalledWith(expect.objectContaining({ username: 'api', key: 'test-key', url: 'https://api.mailgun.test' }))
    expect(messagesCreate).toHaveBeenCalledWith(
      'example.com',
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Your Teapot Invoicing 2FA Code, Jamie',
        template: '2fa-template',
      }),
    )
  })

  it('sends invoice emails with attachments', async () => {
    messagesCreate.mockResolvedValue(undefined)
    const { sendInvoiceReadyEmail } = await import('../../../../src/utils/mailgun.service')

    await sendInvoiceReadyEmail(
      'billing@example.com',
      { amount: 'AUD $236.50', dueDate: '2026-01-01', invoiceNumber: 'INV-123' },
      [{ data: Buffer.from('pdf'), filename: 'INV-123.pdf' }],
    )

    expect(messagesCreate).toHaveBeenCalledWith(
      'example.com',
      expect.objectContaining({
        to: 'billing@example.com',
        subject: 'Your Invoice is Ready!',
        template: 'invoice-template',
        attachment: expect.any(Array),
      }),
    )
  })

  it('sends password reset emails with variables', async () => {
    messagesCreate.mockResolvedValue(undefined)
    const { sendPasswordResetEmail } = await import('../../../../src/utils/mailgun.service')

    await sendPasswordResetEmail('user@example.com', {
      firstName: 'Jamie',
      resetLink: 'https://example.com/reset',
      expiresInMinutes: 60,
    })

    expect(messagesCreate).toHaveBeenCalledWith(
      'example.com',
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Reset your Teapot Invoicing password',
        template: 'reset-template',
      }),
    )
  })

  it('wraps mailgun errors with a message and cause', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    messagesCreate.mockRejectedValue(new Error('boom'))
    const { sendTwoFactorCode } = await import('../../../../src/utils/mailgun.service')

    await expect(sendTwoFactorCode('user@example.com', '123456', 'Jamie')).rejects.toThrow('boom')
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('fails fast when the api key is missing', async () => {
    delete process.env.MAILGUN_API_KEY
    delete process.env.API_KEY
    const { sendTwoFactorCode } = await import('../../../../src/utils/mailgun.service')

    await expect(sendTwoFactorCode('user@example.com', '123456', 'Jamie')).rejects.toThrow('Missing Mailgun API key')
  })
})
