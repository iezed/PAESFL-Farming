import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@metacaprine.com';
const APP_URL = process.env.APP_URL || (process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000');

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('⚠️  SENDGRID_API_KEY not set. Email verification will not work.');
}

/**
 * Send email verification email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} verificationToken - Verification token
 * @returns {Promise<boolean>} Success status
 */
export async function sendVerificationEmail(email, name, verificationToken) {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

  const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  const msg = {
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: 'MetaCaprine Intelligence'
    },
    subject: 'Verifica tu correo electrónico - MetaCaprine',
    text: `
Hola ${name || 'Usuario'},

Gracias por registrarte en MetaCaprine Intelligence.

Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:

${verificationUrl}

Este enlace expirará en 24 horas.

Si no creaste esta cuenta, puedes ignorar este correo.

Saludos,
El equipo de MetaCaprine
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu correo - MetaCaprine</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🐐 MetaCaprine Intelligence</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">¡Bienvenido, ${name || 'Usuario'}!</h2>
    
    <p style="color: #4b5563; font-size: 16px;">
      Gracias por registrarte en MetaCaprine Intelligence, la plataforma más avanzada para análisis de rentabilidad y producción en operaciones caprinas lecheras.
    </p>
    
    <p style="color: #4b5563; font-size: 16px;">
      Para completar tu registro y acceder a todas las funcionalidades, por favor verifica tu correo electrónico haciendo clic en el botón siguiente:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Verificar Correo Electrónico
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      O copia y pega este enlace en tu navegador:<br>
      <a href="${verificationUrl}" style="color: #16a34a; word-break: break-all;">${verificationUrl}</a>
    </p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⚠️ Importante:</strong> Este enlace expirará en 24 horas. Si no verificas tu correo en ese tiempo, deberás solicitar un nuevo enlace de verificación.
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      © ${new Date().getFullYear()} MetaCaprine Intelligence. Todos los derechos reservados.
    </p>
  </div>
</body>
</html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return false;
  }
}

/**
 * Send password reset email (for future use)
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} resetToken - Reset token
 * @returns {Promise<boolean>} Success status
 */
export async function sendPasswordResetEmail(email, name, resetToken) {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  const msg = {
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: 'MetaCaprine Intelligence'
    },
    subject: 'Restablecer contraseña - MetaCaprine',
    text: `
Hola ${name || 'Usuario'},

Has solicitado restablecer tu contraseña en MetaCaprine Intelligence.

Haz clic en el siguiente enlace para crear una nueva contraseña:

${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este correo de forma segura.

Saludos,
El equipo de MetaCaprine
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña - MetaCaprine</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Restablecer Contraseña</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">Hola, ${name || 'Usuario'}</h2>
    
    <p style="color: #4b5563; font-size: 16px;">
      Has solicitado restablecer tu contraseña en MetaCaprine Intelligence.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Restablecer Contraseña
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      O copia y pega este enlace en tu navegador:<br>
      <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a>
    </p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora.
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña no será modificada.
    </p>
  </div>
</body>
</html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
}
