import type { Conversation } from "../types";

const AGENT_NAME = "Carlos M.";

export { AGENT_NAME };

export const mockConversations: Conversation[] = [
  {
    id: "rosa",
    name: "Rosa Elena Quispe Mamani",
    initials: "RQ",
    status: "esperando",
    time: "14:33",
    preview: "Necesito que alguien me ayude, ya intenté varias veces",
    context: {
      documento: "72••••84",
      telefono: "+51 959 ••• 214",
      especialidad: "Cardiología",
      zona: "Arequipa / Arequipa / Arequipa",
      horaTraspaso: "14:32",
    },
    motivo:
      "Motivo de derivación: sin cupos disponibles en la zona — el paciente solicitó hablar con un asesor.",
    messages: [
      {
        from: "bot",
        text: "Bienvenido al servicio de citas médicas de MINSA por WhatsApp. Este canal le ayuda a agendar una cita en el establecimiento que usted elija.",
        time: "14:20",
      },
      { from: "citizen", text: "Sí, quiero una cita", time: "14:20" },
      {
        from: "bot",
        text: "Indique el departamento, provincia y distrito donde desea atenderse.",
        time: "14:21",
      },
      { from: "citizen", text: "Arequipa, Arequipa, Arequipa", time: "14:21" },
      { from: "bot", text: "¿Qué especialidad necesita?", time: "14:22" },
      { from: "citizen", text: "Cardiología", time: "14:22" },
      {
        from: "bot",
        text: "No se encontraron cupos disponibles en Cardiología para los establecimientos de su zona en los próximos 15 días.",
        time: "14:29",
      },
      { from: "citizen", text: "Necesito que alguien me ayude, ya intenté varias veces", time: "14:31" },
      {
        from: "bot",
        text: "Entiendo. Lo comunico con un asesor para que revise otras opciones. Un momento, por favor.",
        time: "14:32",
      },
      { from: "system", text: "Traspaso a agente humano", time: "14:32" },
    ],
  },
  {
    id: "jhon",
    name: "Jhon Anderson Cusi Vilca",
    initials: "JC",
    status: "atencion",
    time: "14:18",
    preview: "Carlos M.: Ya verifiqué, su cita del jueves sigue activa, la duplicada la anulé",
    context: {
      documento: "45••••02",
      telefono: "+51 947 ••• 830",
      especialidad: "Medicina General",
      zona: "Lima / Lima / San Juan de Lurigancho",
      horaTraspaso: "14:05",
    },
    motivo: "Motivo de derivación: reclamo por cita duplicada — requiere anulación manual.",
    messages: [
      { from: "bot", text: "¿Qué especialidad necesita?", time: "13:58" },
      { from: "citizen", text: "Me salieron dos citas para el mismo día, eso está mal", time: "14:02" },
      { from: "bot", text: "Ese caso requiere revisión de un asesor. Lo comunico ahora.", time: "14:05" },
      { from: "system", text: "Traspaso a agente humano", time: "14:05" },
      {
        from: "agent",
        text: "Buenas tardes, Jhon. Soy Carlos. Reviso sus dos citas registradas, deme un momento.",
        time: "14:09",
      },
      { from: "agent", text: "Ya verifiqué, su cita del jueves sigue activa, la duplicada la anulé.", time: "14:18" },
    ],
  },
  {
    id: "maria",
    name: "Maria Fernanda Rojas Tito",
    initials: "MR",
    status: "resuelta",
    time: "13:47",
    preview: "Carlos M.: Quedó reprogramada para el 18 a las 9:40, cualquier cosa escríbanos",
    context: {
      documento: "68••••19",
      telefono: "+51 921 ••• 556",
      especialidad: "Ginecología",
      zona: "Cusco / Cusco / Cusco",
      horaTraspaso: "13:30",
    },
    motivo: "Motivo de derivación: quería reprogramar una cita ya confirmada — el bot no ofrece esa opción.",
    messages: [
      { from: "citizen", text: "Ya tengo una cita pero necesito cambiarla de fecha", time: "13:29" },
      { from: "bot", text: "Por este medio no puedo modificar una cita ya confirmada. La comunico con un asesor.", time: "13:30" },
      { from: "system", text: "Traspaso a agente humano", time: "13:30" },
      { from: "agent", text: "Hola María, con gusto la ayudo a reprogramar. ¿Qué día le queda mejor?", time: "13:33" },
      { from: "citizen", text: "El 18 en la mañana si se puede", time: "13:40" },
      { from: "agent", text: "Quedó reprogramada para el 18 a las 9:40, cualquier cosa escríbanos.", time: "13:47" },
    ],
  },
];
