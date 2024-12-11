import Mail from 'nodemailer/lib/mailer/index.js';

interface TemplateMailOptions extends Mail.Options {
  context?: Record<string, any>;
  template?: string;
  text_template?: string;
}

enum UserOnlineStatus {
  Online = 'ONLINE',
  Away = 'AWAY',
  DoNotDisturb = 'DO NOT DISTURB',
  Offline = 'OFFLINE',
}

type ImageObject = string;

export { TemplateMailOptions, UserOnlineStatus, ImageObject };
