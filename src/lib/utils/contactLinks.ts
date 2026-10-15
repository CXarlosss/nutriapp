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
  welcomeWithIntake: (clientName: string, intakeUrl: string, planName?: string) => {
    const firstName = clientName.trim().split(/\s+/)[0] || 'Hola';
    const planText = planName ? ` de ${planName}` : '';
    return {
      whatsapp: `¡Hola ${firstName}! 👋 Te doy una cálida bienvenida a la consulta de nutrición.\n\nPara poder diseñar tu plan${planText} 100% personalizado y adaptado a tus gustos, horarios, hábitos digestivos y posibles intolerancias, por favor completa este breve cuestionario digital previo (te llevará apenas 3 minutos):\n\n📋👉 ${intakeUrl}\n\nEn cuanto lo envíes, lo reviso con detalle para preparar tu pauta. ¡Muchas gracias y encantada de acompañarte en tus objetivos! 🥗✨`,
      emailSubject: `Bienvenida a tu Consulta de Nutrición - Cuestionario inicial | ${clientName}`,
      emailBody: `Hola ${firstName},\n\n¡Te doy una cálida bienvenida a nuestra consulta de nutrición!\n\nPara poder preparar tu primera sesión y diseñar tu pauta nutricional${planText} con la máxima precisión clínica —teniendo en cuenta tus horarios habituales, alimentos favoritos, sensaciones digestivas y posibles intolerancias—, he preparado para ti tu cuestionario digital previo:\n\n👉 Acceder al cuestionario pre-consulta:\n${intakeUrl}\n\nCompletarlo te llevará tan solo unos 3 minutos y nos permitirá aprovechar al máximo el tiempo de tu consulta para centrarnos directamente en tu estrategia y en tus menús.\n\nSi te surge cualquier duda o necesitas ayuda para agendar, puedes responder directamente a este correo o escribirme por WhatsApp.\n\n¡Muchas gracias por tu compromiso y nos vemos muy pronto!\n\nAtentamente,\nTu Nutricionista Clínica`,
    };
  },

  quinceDaysReviewReminder: (
    clientName: string,
    daysElapsed: number = 12,
    planName?: string,
    bookingUrl?: string
  ) => {
    const firstName = clientName.trim().split(/\s+/)[0] || 'Hola';
    const planText = planName ? ` de ${planName}` : 'nutricional';
    const url = bookingUrl || 'https://nutriapp-cyan.vercel.app/appointments';
    return {
      whatsapp: `¡Hola ${firstName}! 👋 ¿Cómo vas con tu pauta estos días?\n\nYa llevas ${daysElapsed} días con tu plan ${planText} y estamos llegando al final de tus primeras dos semanas. ¡Es el momento perfecto para agendar tu próxima consulta de revisión! 🗓️✨\n\nEn esta sesión mediremos tu evolución (peso, medidas corporales, sensaciones digestivas y energía) y ajustaremos tus platos y calorías para la siguiente fase.\n\n👉 Puedes elegir el hueco que mejor te venga aquí:\n${url}\n\nO si lo prefieres, dime qué día y hora te va mejor y te la anoto yo misma. ¡A seguir sumando! 💪🥗`,
      emailSubject: `Hora de agendar tu próxima revisión de nutrición (Día ${daysElapsed} de tu plan) - ${clientName}`,
      emailBody: `Hola ${firstName},\n\nEspero que estés teniendo una excelente semana.\n\nLlevas ya ${daysElapsed} días siguiendo tu plan nutricional ${planText} y nos acercamos al cierre de tu ciclo de dos semanas. Este es un punto clave para consolidar tus resultados y asegurar tu progreso.\n\nEn la próxima sesión de revisión:\n1. Evaluaremos tus cambios corporales y métricas de composición.\n2. Revisaremos tus niveles de saciedad, digestión y energía diaria.\n3. Ajustaremos tus recetas, porciones y menús para la siguiente etapa.\n\nTe recomiendo reservar tu hueco en la agenda para estos próximos días:\n👉 Agendar mi cita de revisión: ${url}\n\nSi prefieres coordinarlo directamente, solo responde a este correo o escríbeme por WhatsApp con tu disponibilidad y lo fijamos.\n\n¡Mucho ánimo con estos días y seguimos avanzando!\n\nUn saludo cordial,\nTu Nutricionista Clínica`,
    };
  },

  quickFollowUp: (clientName: string, planName?: string, nextAppointment?: string) => {
    const firstName = clientName.trim().split(/\s+/)[0] || 'Hola';
    const planText = planName ? ` de ${planName}` : 'nutricional';
    const reminderLine =
      nextAppointment && nextAppointment !== 'Sin agendar'
        ? `\n\n📅 Recuerda que tenemos agendada nuestra próxima revisión el: ${nextAppointment}.`
        : '';
    return {
      whatsapp: `¡Hola ${firstName}! 👋 Te escribo de la consulta de nutrición para hacer seguimiento de tu plan ${planText}.\n\n¿Cómo te estás encontrando estos días con las comidas, tus niveles de energía y tus digestiones? Si te ha surgido alguna duda con los menús o necesitas que adaptemos cualquier plato, cuéntame y lo revisamos juntos/as. ¡Mucho ánimo con la semana! 💪🥗`,
      emailSubject: `Seguimiento de tu Plan Nutricional - ${clientName}`,
      emailBody: `Hola ${firstName},\n\nEspero que estés teniendo una excelente semana.\n\nMe pongo en contacto contigo para saber cómo estás progresando con tu plan ${planText} y comprobar cómo te estás adaptando a las pautas.\n\n¿Cómo sientes la saciedad, tus niveles de energía y tus digestiones? Recuerda que si algún plato o ingrediente no termina de encajar en tu rutina diaria, podemos realizar adaptaciones sin problema.${reminderLine}\n\nCualquier duda o comentario que tengas, puedes responder directamente a este correo o escribirme por WhatsApp.\n\n¡Un cordial saludo y seguimos avanzando juntos/as!\n\nTu Nutricionista Clínica`,
    };
  },

  dietDelivery: (clientName: string, portalUrl?: string, planName?: string) => {
    const firstName = clientName.trim().split(/\s+/)[0] || 'Hola';
    const url = portalUrl || 'https://nutriapp-cyan.vercel.app/mi-dieta';
    const planText = planName ? ` (${planName})` : '';
    return {
      whatsapp: `¡Hola ${firstName}! 🥗 Ya tienes lista y disponible tu nueva pauta nutricional${planText} en tu espacio personal:\n\n👉 ${url}\n\nIncluye tus menús detallados, lista de la compra orientativa y recomendaciones prácticas. Échale un vistazo con calma y cualquier duda estoy a tu disposición. ¡A por todas! 🚀💪`,
      emailSubject: `Tu pauta nutricional personalizada ya está lista - ${clientName}`,
      emailBody: `Hola ${firstName},\n\nMe alegra comunicarte que ya tienes disponible tu pauta nutricional personalizada${planText}.\n\nPuedes consultarla y descargarla directamente desde tu portal de paciente:\n👉 ${url}\n\nEn tu plan encontrarás:\n- La distribución diaria de tomas adaptada a tus horarios.\n- Recetas explicadas paso a paso con ingredientes y gramajes.\n- Pautas de hidratación y descanso.\n\nRevisa las propuestas tranquilamente y no dudes en consultarme cualquier ajuste que precises.\n\n¡Mucho ánimo y a por tus metas!\n\nUn cordial saludo,\nTu Nutricionista Clínica`,
    };
  },

  appointmentReminder: (clientName: string, dateStr: string, timeStr: string) => {
    const firstName = clientName.trim().split(/\s+/)[0] || 'Hola';
    return {
      whatsapp: `¡Hola ${firstName}! 🗓️ Te recuerdo que tenemos agendada nuestra consulta de nutrición el próximo ${dateStr} a las ${timeStr}h. Si necesitas modificarla o tienes dudas previas, avísame con antelación. ¡Nos vemos pronto! ✨`,
      emailSubject: `Recordatorio de cita de nutrición - ${dateStr} a las ${timeStr}h`,
      emailBody: `Hola ${firstName},\n\nTe confirmo los detalles de nuestra próxima consulta de nutrición:\n\n📅 Fecha: ${dateStr}\n⏰ Hora: ${timeStr}h\n\nPor favor, ten a mano cualquier duda o registro de comidas que quieras revisar en la sesión.\n\n¡Nos vemos pronto!\n\nUn saludo cordial,\nTu Nutricionista Clínica`,
    };
  },

  paymentLink: (clientName: string, amount: string, paymentUrl: string) => {
    const firstName = clientName.trim().split(/\s+/)[0] || 'Hola';
    return {
      whatsapp: `¡Hola ${firstName}! Te comparto el enlace seguro para formalizar el abono de tu consulta de nutrición (${amount}):\n\n👉 ${paymentUrl}\n\nCualquier duda estoy a tu disposición. ¡Muchas gracias por tu confianza! ✨`,
      emailSubject: `Enlace de pago seguro - Consulta de Nutrición (${amount})`,
      emailBody: `Hola ${firstName},\n\nTe envío el enlace seguro para completar el pago de tu consulta de nutrición (${amount}):\n\n👉 ${paymentUrl}\n\nMuchas gracias por tu compromiso y confianza.\n\nUn cordial saludo,\nTu Nutricionista Clínica`,
    };
  },

  // Alias para retrocompatibilidad
  preConsultation: (clientName: string, intakeUrl: string) => {
    return contactTemplates.welcomeWithIntake(clientName, intakeUrl);
  },
};

/**
 * Generador inteligente de mensajes según el estado actual del paciente
 */
export function getSmartClientContact(
  client: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    plan?: string;
    lastAppointment?: string;
    nextAppointment?: string;
    hasDiet?: boolean;
    daysInPlan?: number;
    createdAt?: string;
  },
  origin?: string
) {
  const appBaseUrl =
    origin || (typeof window !== 'undefined' ? window.location.origin : 'https://nutriapp-cyan.vercel.app');
  const token = `token_${(client.id || 'client').replace(/[^a-zA-Z0-9_]/g, '')}`;
  const intakeUrl = `${appBaseUrl}/pre-consulta/${token}`;
  const dietUrl = `${appBaseUrl}/mi-dieta`;
  const bookingUrl = `${appBaseUrl}/appointments`;

  const isNewOrNoAppointments =
    (!client.lastAppointment || client.lastAppointment === 'Sin citas') &&
    (!client.nextAppointment || client.nextAppointment === 'Sin agendar');

  // Días transcurridos en el ciclo quincenal (por defecto 12 si está activo)
  const daysElapsed = client.daysInPlan || 12;

  // 1. Paciente nuevo sin citas ni dieta: Bienvenida + Cuestionario digital previo
  if (isNewOrNoAppointments && !client.hasDiet) {
    return {
      type: 'welcome' as const,
      tooltip: 'Enviar bienvenida y cuestionario pre-consulta',
      intakeUrl,
      daysElapsed,
      ...contactTemplates.welcomeWithIntake(client.name, intakeUrl, client.plan),
    };
  }

  // 2. Paciente en seguimiento sin próxima cita agendada (ej. día 10-15 del plan): Recordatorio de cita quincenal
  if (!client.nextAppointment || client.nextAppointment === 'Sin agendar') {
    return {
      type: 'rebook_reminder' as const,
      tooltip: `Recordatorio de agendar cita de revisión (Día ${daysElapsed} de 15)`,
      bookingUrl,
      daysElapsed,
      ...contactTemplates.quinceDaysReviewReminder(client.name, daysElapsed, client.plan, bookingUrl),
    };
  }

  // 3. Paciente con dieta activa: Entrega de pauta nutricional
  if (client.hasDiet) {
    return {
      type: 'diet' as const,
      tooltip: 'Enviar enlace a su pauta nutricional',
      dietUrl,
      daysElapsed,
      ...contactTemplates.dietDelivery(client.name, dietUrl, client.plan),
    };
  }

  // 4. Seguimiento regular
  return {
    type: 'followup' as const,
    tooltip: 'Enviar mensaje de seguimiento clínico',
    daysElapsed,
    ...contactTemplates.quickFollowUp(client.name, client.plan, client.nextAppointment),
  };
}
