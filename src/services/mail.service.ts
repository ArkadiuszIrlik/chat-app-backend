import { SENDER_ADDRESS, mailTransporter } from '@config/mail.config.js';
import Mail from 'nodemailer/lib/mailer/index.js';
import hbs from 'nodemailer-express-handlebars';
import { TemplateMailOptions } from 'src/typesModule.js';

async function sendVerificationMail(
  to: Mail.Options['to'],
  isExistingMail: false,
  templateContext: { verificationUrl: string },
): Promise<any>;
async function sendVerificationMail(
  to: Mail.Options['to'],
  isExistingMail: true,
  templateContext: {
    resetPasswordUrl: string;
    ipAddress: string;
    location: string;
    browserInfo: string;
  },
): Promise<any>;
async function sendVerificationMail(
  to: Mail.Options['to'],
  isExistingMail: boolean,
  templateContext: object,
) {
  const verificationEmailNew: TemplateMailOptions = {
    from: SENDER_ADDRESS,
    to: undefined,
    subject: 'Verify your Beluga email address',
    template: 'verification-email-new',
    context: {},
  };

  const verificationEmailExisting: TemplateMailOptions = {
    from: SENDER_ADDRESS,
    to: undefined,
    subject: 'Beluga account creation attempt',
    template: 'verification-email-existing',
    context: {},
  };

  const mailData = isExistingMail
    ? verificationEmailExisting
    : verificationEmailNew;
  mailData.to = to;
  mailData.context = { ...templateContext };

  mailTransporter.use(
    'compile',
    hbs({
      viewEngine: {
        extname: '.hbs',
        partialsDir: './src/views/mail',
        layoutsDir: './src/views/mail',
        defaultLayout: 'index',
      },
      extName: '.hbs',
      viewPath: './src/views/mail',
    }),
  );

  return mailTransporter.sendMail(mailData);
}

export { sendVerificationMail };
