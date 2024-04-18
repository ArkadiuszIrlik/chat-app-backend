import Mail from 'nodemailer/lib/mailer/index.js';

interface TemplateMailOptions extends Mail.Options {
  context?: Record<string, any>;
  template?: string;
  text_template?: string;
}

export { TemplateMailOptions };
