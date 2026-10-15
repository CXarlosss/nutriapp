/**
 * Utilidades para generación de enlaces directos a WhatsApp y Correo Electrónico
 * Permite enviar mensajes personalizados con 1 clic sin necesidad de servidores externos.
 */

export function cleanPhoneNumber(phone: string): string {
  // Elimina espacios, guiones, paréntesis y signos
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Si empieza por '+', remover el '+' para wa.me
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('34') && cleaned.length === 9) {
    // Si es un número español de 9 dígitos sin prefijo, añadir el 34
    cleaned = `34${cleaned}`;
  }
  
  return cleaned;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encodedText}`;
}

export function generateMailtoLink(email: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Plantillas predefinidas de mensajes clínicos y de consulta
 */
export const contactTemplates = {
  preConsultation: (clientName: string, intakeUrl: string) => ({
    whatsapp: `¡Hola ${clientName}! 👋 Te escribo de la consulta de nutrición. Para preparar tu plan de forma totalmente personalizada, ¿podrías completar este breve cuestionario antes de nuestra cita? 🥗📋\n\n👉 ${intakeUrl}\n\n¡Muchas gracias y nos vemos pronto!`,
    emailSubject: `Cuestionario inicial de nutrición - ${clientName}`,
    emailBody: `Hola ${clientName},\n\nEspero que estés muy bien. Para preparar nuestra próxima sesión y conocer a fondo tus hábitos, gustos y posibles intolerancias, te comparto el cuestionario digital previo:\n\n${intakeUrl}\n\nTe llevará solo unos minutos. ¡Muchas gracias por tu compromiso!\n\nUn saludo cordial,\nTu Nutricionista`,
  }),

  appointmentReminder: (clientName: string, dateStr: string, timeStr: string) => ({
    whatsapp: `¡Hola ${clientName}! 🗓️ Te recuerdo que tenemos agendada nuestra consulta de nutrición el próximo ${dateStr} a las ${timeStr}h. Si necesitas modificarla, avísame con antelación. ¡Nos vemos pronto! ✨`,
    emailSubject: `Recordatorio de cita de nutrición - ${dateStr} a las ${timeStr}`,
    emailBody: `Hola ${clientName},\n\nTe confirmo los detalles de nuestra próxima consulta:\n\n📅 Fecha: ${dateStr}\n⏰ Hora: ${timeStr}h\n\nPor favor, ten a mano cualquier duda o registro que quieras revisar conmigo.\n\n¡Un saludo!`,
  }),

  dietDelivery: (clientName: string, portalUrl?: string) => ({
    whatsapp: `¡Hola ${clientName}! 🥗 Ya tienes lista y actualizada tu pauta nutricional en tu portal de paciente: ${portalUrl || 'https://nutriapp.vercel.app/mi-dieta'}.\n\nCualquier duda con los menús o equivalencias, escríbeme por aquí. ¡A por todas esta semana! 💪`,
    emailSubject: `Tu nueva pauta nutricional ya está disponible - ${clientName}`,
    emailBody: `Hola ${clientName},\n\nMe alegra comunicarte que tu plan nutricional personalizado ya está disponible.\n\nPuedes consultarlo en tu portal de paciente:\n${portalUrl || 'https://nutriapp.vercel.app/mi-dieta'}\n\nRevisa las recetas y las pautas de hidratación y descanso. Estaré atenta a tu progreso.\n\n¡Mucho ánimo!`,
  }),

  paymentLink: (clientName: string, amount: string, paymentUrl: string) => ({
    whatsapp: `¡Hola ${clientName}! Te comparto el enlace seguro para formalizar el abono de tu consulta de nutrición (${amount}):\n\n👉 ${paymentUrl}\n\nCualquier duda estoy a tu disposición. ¡Muchas gracias!`,
    emailSubject: `Enlace de pago - Consulta de Nutrición (${amount})`,
    emailBody: `Hola ${clientName},\n\nTe envío el enlace para completar el pago de tu consulta de nutrición (${amount}):\n\n${paymentUrl}\n\nMuchas gracias por tu confianza.\n\nUn cordial saludo,`,
  }),
};
