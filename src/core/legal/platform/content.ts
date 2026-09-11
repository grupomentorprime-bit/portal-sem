import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import {
  PLATFORM_OPERATOR_NAME,
  PLATFORM_SUPPORT_EMAIL,
} from "@/core/legal/platform/constants";
import type { PlatformLegalDocument } from "@/core/legal/platform/types";

const PRODUCT = PLATFORM_DISPLAY_NAME;
const OPERATOR = PLATFORM_OPERATOR_NAME;
const SUPPORT = PLATFORM_SUPPORT_EMAIL;

export const PLATFORM_PRIVACY_POLICY: PlatformLegalDocument = {
  slug: "privacidad",
  title: "Política de privacidad",
  description: `Cómo ${PRODUCT} trata información personal al operar la plataforma.`,
  intro: [
    `${PRODUCT} es una plataforma de software operada por ${OPERATOR}. Permite a organizaciones (nuestros “clientes”) gestionar Espacios, contenidos, formularios, comunicación y canales conectados.`,
    `Esta política describe el tratamiento de información en el ámbito de la plataforma ${PRODUCT}. No sustituye las políticas de privacidad que cada organización cliente publique para su propio sitio o Espacio.`,
  ],
  showToc: true,
  sections: [
    {
      id: "que-es",
      title: "Qué es Growth OS",
      paragraphs: [
        `${PRODUCT} es un producto/plataforma multi-espacio. Cada cliente opera uno o más Espacios con su propia configuración, usuarios autorizados y contenidos.`,
        `${OPERATOR} provee y opera la plataforma. La organización cliente decide qué datos incorpora a su Espacio y cómo usa las funciones disponibles.`,
      ],
    },
    {
      id: "ambito",
      title: "Ámbito de esta política",
      paragraphs: [
        `Esta política aplica a la información que ${PRODUCT} trata para operar el servicio de plataforma (cuentas, soporte, seguridad, facturación operativa cuando corresponda, y registros técnicos del servicio).`,
        `Los datos que una organización cliente incorpora, publica o gestiona dentro de su Espacio (por ejemplo, contenidos del sitio, formularios, contactos o conversaciones de su operación) pueden tener a esa organización como responsable frente a las personas afectadas. En ese caso, esta política de plataforma no reemplaza las obligaciones ni los avisos del cliente.`,
      ],
    },
    {
      id: "informacion",
      title: "Qué información puede tratarse",
      paragraphs: [
        `Según cómo uses ${PRODUCT}, podemos tratar categorías como las siguientes:`,
      ],
      bullets: [
        "Datos de cuenta y contacto: nombre, correo electrónico, credenciales de acceso o identificadores de autenticación, y datos de perfil asociados a usuarios autorizados.",
        "Datos de organización y Espacio: nombre del Espacio, configuración, roles y membresías.",
        "Datos operativos del servicio: registros técnicos (por ejemplo, eventos de acceso, errores, métricas de uso del servicio) necesarios para seguridad, soporte y continuidad.",
        "Datos que los clientes gestionan dentro de Growth OS: contenidos, formularios, envíos, mensajes u otros registros que el cliente decide almacenar o procesar en su Espacio.",
        "Información proveniente de canales conectados: cuando el cliente conecta un canal externo (por ejemplo WhatsApp vía Meta u otros proveedores), pueden fluir mensajes, identificadores de conversación y metadatos del canal según la configuración del cliente y las reglas del proveedor.",
      ],
    },
    {
      id: "whatsapp-meta",
      title: "WhatsApp, Meta y otros canales",
      paragraphs: [
        `Si un cliente conecta WhatsApp u otro canal de Meta (u otros proveedores), el tratamiento de esos datos ocurre porque el cliente habilita la integración y usa el canal en su Espacio.`,
        `${PRODUCT} actúa como infraestructura técnica para que el cliente opere ese canal. Meta y otros proveedores tienen sus propias condiciones y políticas. El cliente es responsable de cumplir los requisitos aplicables al usar esos servicios.`,
        `Esta política no afirma prácticas de Meta ni de terceros; describe el rol de ${PRODUCT} como plataforma que el cliente configura.`,
      ],
    },
    {
      id: "finalidad",
      title: "Finalidad del tratamiento",
      paragraphs: [`Usamos la información para:`],
      bullets: [
        `Proveer, mantener y mejorar ${PRODUCT}.`,
        "Autenticar usuarios, administrar accesos y proteger cuentas.",
        "Prestar soporte y responder solicitudes (incluido contacto institucional).",
        "Garantizar seguridad, prevenir abuso y diagnosticar incidentes.",
        "Cumplir obligaciones legales aplicables cuando corresponda.",
        "Operar integraciones que el cliente haya conectado voluntariamente.",
      ],
    },
    {
      id: "seguridad",
      title: "Seguridad",
      paragraphs: [
        `Aplicamos medidas técnicas y organizativas razonables para proteger la información (por ejemplo, controles de acceso, cifrado de secretos sensibles cuando el producto lo contempla, y prácticas de operación seguras).`,
        `Ningún sistema es completamente libre de riesgo. Si tomas conocimiento de un incidente que afecte tu cuenta, contáctanos en ${SUPPORT}.`,
      ],
    },
    {
      id: "proveedores",
      title: "Proveedores necesarios para operar el servicio",
      paragraphs: [
        `Para operar ${PRODUCT} podemos usar proveedores de infraestructura y servicios auxiliares (por ejemplo, alojamiento, base de datos, correo transaccional, autenticación o almacenamiento de archivos), solo en la medida necesaria para prestar el servicio.`,
        `Estos proveedores tratan datos según nuestras instrucciones o sus términos de servicio aplicables al rol que cumplen.`,
      ],
    },
    {
      id: "conservacion",
      title: "Conservación",
      paragraphs: [
        `Conservamos la información mientras sea necesaria para prestar el servicio, cumplir obligaciones legales, resolver disputas y hacer valer acuerdos.`,
        `Los plazos concretos pueden variar según el tipo de dato, la configuración del Espacio y solicitudes válidas de eliminación. No fijamos en esta política plazos legales inventados.`,
      ],
    },
    {
      id: "derechos",
      title: "Derechos y solicitudes",
      paragraphs: [
        `Puedes solicitar información, actualización o eliminación de datos relacionados con tu uso de ${PRODUCT}, sujeto a verificación de identidad y a límites legales o contractuales aplicables.`,
        `Si tu solicitud se refiere a datos gestionados por una organización cliente en su Espacio, es posible que debamos derivarte al cliente o coordinar con él, porque ese cliente puede ser el responsable de esos datos.`,
        `Para solicitudes dirigidas a la plataforma, escribe a ${SUPPORT}. También puedes usar la página de eliminación de datos de ${PRODUCT}.`,
      ],
    },
    {
      id: "contacto",
      title: "Contacto",
      paragraphs: [
        `Canal institucional de soporte de ${PRODUCT}: ${SUPPORT}.`,
        `Operador de la plataforma: ${OPERATOR}.`,
      ],
    },
    {
      id: "cambios",
      title: "Cambios de esta política",
      paragraphs: [
        `Podemos actualizar esta política para reflejar cambios del servicio o requisitos aplicables. La fecha de última actualización aparece en esta página.`,
        `Cuando el cambio sea relevante, procuraremos dar aviso razonable por los canales habituales del servicio.`,
      ],
    },
  ],
};

export const PLATFORM_TERMS_OF_SERVICE: PlatformLegalDocument = {
  slug: "terminos",
  title: "Términos de servicio",
  description: `Condiciones de uso de ${PRODUCT}, operada por ${OPERATOR}.`,
  intro: [
    `Estos términos regulan el uso de ${PRODUCT}, plataforma de software operada por ${OPERATOR}. Al crear una cuenta, aceptar una invitación o usar el servicio, aceptas estos términos.`,
    `Si usas ${PRODUCT} en nombre de una organización, declaras tener autoridad para vincular a esa organización.`,
  ],
  showToc: true,
  sections: [
    {
      id: "servicio",
      title: "Uso de Growth OS",
      paragraphs: [
        `${PRODUCT} permite operar Espacios con funciones de portal, administración, formularios, mensajería y canales, según el plan o acuerdo comercial vigente.`,
        `El servicio se presta “tal cual” está disponible en cada momento, sin garantizar que todas las funciones existan para todos los clientes ni que se mantengan sin cambios.`,
      ],
    },
    {
      id: "cuenta-espacios",
      title: "Cuenta y Espacios",
      paragraphs: [
        `Eres responsable de la confidencialidad de tus credenciales y de la actividad realizada con tu cuenta.`,
        `Cada Espacio pertenece a una organización cliente. Los administradores del Espacio gestionan usuarios, roles, contenidos y configuraciones dentro de ese ámbito.`,
        `No debes compartir accesos de forma insegura ni intentar acceder a Espacios ajenos.`,
      ],
    },
    {
      id: "responsabilidades",
      title: "Responsabilidades del cliente",
      paragraphs: [`El cliente es responsable de:`],
      bullets: [
        "La legalidad del contenido y de los datos que incorpora a su Espacio.",
        "Obtener las bases o consentimientos que correspondan frente a sus usuarios finales.",
        "Configurar correctamente roles, permisos e integraciones.",
        "Cumplir leyes aplicables a su actividad (incluida protección de datos cuando corresponda).",
        "Mantener actualizados los datos de contacto administrativos.",
      ],
    },
    {
      id: "canales",
      title: "Canales externos",
      paragraphs: [
        `El cliente puede conectar canales externos (por ejemplo WhatsApp/Meta u otros proveedores). Esas conexiones son opcionales y dependen de cuentas y credenciales del cliente o de las que el cliente autorice.`,
        `${PRODUCT} no controla la disponibilidad, políticas ni cambios de esos proveedores.`,
      ],
    },
    {
      id: "meta-terceros",
      title: "WhatsApp/Meta y otros proveedores",
      paragraphs: [
        `Al conectar WhatsApp vía Meta u otros servicios de terceros, el cliente acepta también los términos de esos proveedores.`,
        `Los costos que cobre Meta u otros proveedores externos por sus servicios no forman parte automáticamente de la licencia de ${PRODUCT} y corresponden al cliente, salvo acuerdo comercial distinto con ${OPERATOR}.`,
        `${PRODUCT} puede documentar o facilitar la conexión técnica; ello no implica que ${OPERATOR} asuma cargos de terceros ni la relación comercial del cliente con esos proveedores.`,
      ],
    },
    {
      id: "disponibilidad",
      title: "Disponibilidad",
      paragraphs: [
        `Procuramos mantener ${PRODUCT} disponible y en buen funcionamiento, pero pueden existir mantenciones, incidentes o degradaciones. No garantizamos disponibilidad ininterrumpida salvo que un acuerdo escrito lo establezca expresamente.`,
      ],
    },
    {
      id: "uso-permitido",
      title: "Uso permitido",
      paragraphs: [`Queda prohibido, entre otros:`],
      bullets: [
        "Usar el servicio para actividades ilícitas, engañosas o abusivas.",
        "Intentar vulnerar seguridad, eludir controles de acceso o interferir con el servicio.",
        "Realizar scraping masivo no autorizado o sobrecargar intencionalmente la infraestructura.",
        "Revender o sublicenciar el acceso de forma no autorizada.",
        "Infringir derechos de terceros mediante contenidos o comunicaciones enviadas desde el Espacio.",
      ],
    },
    {
      id: "propiedad",
      title: "Propiedad intelectual",
      paragraphs: [
        `${PRODUCT}, su software, marcas y materiales de plataforma son de ${OPERATOR} o de sus licenciantes. Estos términos no transfieren titularidad al cliente.`,
        `El cliente conserva los derechos sobre el contenido que legítimamente incorpore a su Espacio, otorgando a ${OPERATOR} una licencia limitada para alojarlo y procesarlo solo en la medida necesaria para prestar el servicio.`,
      ],
    },
    {
      id: "suspension",
      title: "Suspensión y cierre",
      paragraphs: [
        `Podemos suspender o restringir el acceso ante incumplimiento de estos términos, riesgo de seguridad, requerimiento legal o falta de pago cuando aplique.`,
        `El cliente puede solicitar el cierre de su cuenta o Espacio según los canales de soporte. La eliminación de datos se gestiona conforme a la política de privacidad y a la página de eliminación de datos.`,
      ],
    },
    {
      id: "limitaciones",
      title: "Limitaciones razonables",
      paragraphs: [
        `En la máxima medida permitida por la ley aplicable, ${OPERATOR} no responde por daños indirectos, lucro cesante, pérdida de datos del cliente por configuraciones inadecuadas, ni por interrupciones atribuibles a terceros (incluida Meta u otros proveedores de canal).`,
        `La responsabilidad total de ${OPERATOR} frente al cliente, cuando exista, se limitará a lo establecido en el acuerdo comercial vigente o, en su defecto, a un monto razonable vinculado a las sumas pagadas por el servicio en el período reciente acordado.`,
      ],
    },
    {
      id: "cambios",
      title: "Cambios",
      paragraphs: [
        `Podemos actualizar estos términos. La fecha de última actualización aparece en esta página. El uso continuado del servicio después de la entrada en vigor de cambios relevantes constituye aceptación, salvo que la ley o un acuerdo escrito dispongan otra cosa.`,
      ],
    },
    {
      id: "contacto",
      title: "Contacto",
      paragraphs: [
        `Consultas sobre estos términos: ${SUPPORT}.`,
        `Operador: ${OPERATOR}.`,
      ],
    },
  ],
};

export const PLATFORM_DATA_DELETION: PlatformLegalDocument = {
  slug: "eliminacion-de-datos",
  title: "Eliminación de datos",
  description: `Cómo pedir que eliminemos tus datos de ${PRODUCT}.`,
  intro: [
    `Esta página explica cómo solicitar la eliminación de datos personales asociados a tu uso de ${PRODUCT}.`,
    `Está pensada como referencia pública simple, inclusive para requisitos de eliminación de datos de usuario de plataformas como Meta, cuando sean compatibles con el proceso aquí descrito.`,
  ],
  showToc: false,
  sections: [
    {
      id: "proceso",
      title: "Cómo pedir que eliminemos tus datos de Growth OS",
      paragraphs: [
        `Sigue este proceso:`,
      ],
      steps: [
        `Envía tu solicitud al canal oficial de soporte: ${SUPPORT}.`,
        "Indica la cuenta u organización relacionada (correo de la cuenta, nombre del Espacio u otros datos que permitan ubicar el registro).",
        `${PRODUCT} puede verificar tu identidad antes de continuar, para proteger la información de terceros.`,
        "Procesaremos la solicitud según corresponda: eliminación, anonimización o coordinación con la organización cliente cuando los datos pertenezcan a su Espacio.",
        "Te informaremos cuando la solicitud esté resuelta o si necesitamos información adicional.",
      ],
    },
    {
      id: "alcance",
      title: "Qué cubre (y qué puede no cubrir)",
      paragraphs: [
        `Las solicitudes dirigidas a ${PRODUCT} cubren datos que la plataforma trata como operador del servicio (por ejemplo, cuenta de acceso y registros de soporte).`,
        `Si los datos viven principalmente en el Espacio de un cliente (por ejemplo, un envío de formulario o una conversación de su operación), es posible que debamos coordinar con ese cliente o indicarte que la solicitud debe hacerse ante él.`,
        `No inventamos ni prometemos plazos legales fijos en esta página. El tiempo de respuesta depende de la verificación, del alcance de los datos y de obligaciones de conservación aplicables.`,
      ],
    },
    {
      id: "contacto",
      title: "Contacto",
      paragraphs: [
        `Soporte institucional: ${SUPPORT}.`,
      ],
    },
  ],
};

export function getPlatformLegalDocument(
  slug: PlatformLegalDocument["slug"]
): PlatformLegalDocument {
  switch (slug) {
    case "privacidad":
      return PLATFORM_PRIVACY_POLICY;
    case "terminos":
      return PLATFORM_TERMS_OF_SERVICE;
    case "eliminacion-de-datos":
      return PLATFORM_DATA_DELETION;
  }
}
