import { SENDER_ADDRESS, mailTransporter } from '@config/mail.config.js';
import hbs from 'nodemailer-express-handlebars';
import { TemplateMailOptions } from 'src/typesModule.js';

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

function sendVerifyEmailNewAccount(email: string, verificationUrl: string) {
  const mailData: TemplateMailOptions = {
    from: SENDER_ADDRESS,
    to: email,
    subject: 'Verify your Beluga email address',
    template: 'verification-email-new',
    context: { verificationUrl },
  };

  return mailTransporter.sendMail(mailData);
}

function sendExistingEmailRegisterAttempt(
  email: string,
  resetPasswordUrl: string,
  userTrackingInfo: {
    ipAddress: string;
    location: string;
    browserInfo: string;
  },
) {
  const mailData: TemplateMailOptions = {
    from: SENDER_ADDRESS,
    to: email,
    subject: 'Beluga account creation attempt',
    template: 'verification-email-existing',
    context: {
      resetPasswordUrl,
      ...userTrackingInfo,
    },
  };

  return mailTransporter.sendMail(mailData);
}

export { sendVerifyEmailNewAccount, sendExistingEmailRegisterAttempt };
