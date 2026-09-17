/*
# Revert to single-user mode and seed CCNA questions

## Overview
Reverts the app from multi-user back to single-tenant (no auth). Removes
authenticated-only RLS policies and restores anon+authenticated access on
all tables. Seeds 57 questions from the CCNA Modulos 14-15 document,
organized into 6 groups (5 groups of 10 + 1 group of 7).

## Changes
1. Revert RLS policies on questions, quiz_sessions, session_answers,
   app_state, achievements back to anon+authenticated (single-tenant)
2. Add group_number column to questions
3. Clear existing questions and seed 57 new ones with group assignments

## Security
- All tables allow full CRUD for anon+authenticated (single-tenant, no auth)
- Data is intentionally shared - documented here
*/

-- Add group_number column to questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS group_number int NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_questions_group ON questions(group_number);

-- ============================================================
-- Revert RLS to anon+authenticated (single-tenant)
-- ============================================================

-- questions
DROP POLICY IF EXISTS "questions_select_auth" ON questions;
DROP POLICY IF EXISTS "questions_insert_auth" ON questions;
DROP POLICY IF EXISTS "questions_update_auth" ON questions;
DROP POLICY IF EXISTS "questions_delete_auth" ON questions;
DROP POLICY IF EXISTS "anon_select_questions" ON questions;
DROP POLICY IF EXISTS "anon_insert_questions" ON questions;
DROP POLICY IF EXISTS "anon_update_questions" ON questions;
DROP POLICY IF EXISTS "anon_delete_questions" ON questions;

CREATE POLICY "anon_select_questions" ON questions FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_questions" ON questions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_questions" ON questions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_questions" ON questions FOR DELETE
  TO anon, authenticated USING (true);

-- quiz_sessions
DROP POLICY IF EXISTS "sessions_select_own" ON quiz_sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON quiz_sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON quiz_sessions;
DROP POLICY IF EXISTS "sessions_delete_own" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_select_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_insert_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_update_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_delete_quiz_sessions" ON quiz_sessions;

CREATE POLICY "anon_select_quiz_sessions" ON quiz_sessions FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_quiz_sessions" ON quiz_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_quiz_sessions" ON quiz_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_quiz_sessions" ON quiz_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- session_answers
DROP POLICY IF EXISTS "answers_select_own" ON session_answers;
DROP POLICY IF EXISTS "answers_insert_own" ON session_answers;
DROP POLICY IF EXISTS "answers_update_own" ON session_answers;
DROP POLICY IF EXISTS "answers_delete_own" ON session_answers;
DROP POLICY IF EXISTS "anon_select_session_answers" ON session_answers;
DROP POLICY IF EXISTS "anon_insert_session_answers" ON session_answers;
DROP POLICY IF EXISTS "anon_update_session_answers" ON session_answers;
DROP POLICY IF EXISTS "anon_delete_session_answers" ON session_answers;

CREATE POLICY "anon_select_session_answers" ON session_answers FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_session_answers" ON session_answers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_session_answers" ON session_answers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_session_answers" ON session_answers FOR DELETE
  TO anon, authenticated USING (true);

-- app_state
DROP POLICY IF EXISTS "state_select_own" ON app_state;
DROP POLICY IF EXISTS "state_insert_own" ON app_state;
DROP POLICY IF EXISTS "state_update_own" ON app_state;
DROP POLICY IF EXISTS "state_delete_own" ON app_state;
DROP POLICY IF EXISTS "anon_select_app_state" ON app_state;
DROP POLICY IF EXISTS "anon_insert_app_state" ON app_state;
DROP POLICY IF EXISTS "anon_update_app_state" ON app_state;
DROP POLICY IF EXISTS "anon_delete_app_state" ON app_state;

CREATE POLICY "anon_select_app_state" ON app_state FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_app_state" ON app_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_app_state" ON app_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_app_state" ON app_state FOR DELETE
  TO anon, authenticated USING (true);

-- achievements
DROP POLICY IF EXISTS "ach_select_own" ON achievements;
DROP POLICY IF EXISTS "ach_insert_own" ON achievements;
DROP POLICY IF EXISTS "ach_delete_own" ON achievements;
DROP POLICY IF EXISTS "anon_select_achievements" ON achievements;
DROP POLICY IF EXISTS "anon_insert_achievements" ON achievements;
DROP POLICY IF EXISTS "anon_delete_achievements" ON achievements;

CREATE POLICY "anon_select_achievements" ON achievements FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_achievements" ON achievements FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_delete_achievements" ON achievements FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Clear and seed questions
-- ============================================================
DELETE FROM questions;

INSERT INTO questions (qid, topic, subtopic, question, options, correct_index, correct_indices, explanation, difficulty, group_number)
VALUES
('Q001', 'Modulos 14-15', '', '¿Cuáles son los tres campos que se utilizan en el encabezado de un segmento UDP? (Elija tres).', ARRAY['Tamaño de la ventana', 'Longitud', 'Número de secuencia', 'Puerto de origen', 'Checksum', 'Número de acuse de recibo'], 1, ARRAY[1, 3, 4], 'Tema 14.3.2 Un encabezado UDP consta solamente de los campos Puerto de origen, Puerto de destino, Longitud y Checksum. Número de secuencia, Número de acuse de recibo y Tamaño de la ventana son campos de encabezado TCP.', 'medium', 1),
('Q002', 'Modulos 14-15', '', '¿Cuáles son dos roles de la capa de transporte en la comunicación de datos en una red? (Escoja dos opciones).', ARRAY['Identificar la aplicación apropiada para cada transmisión de comunicación', 'Hacer un seguimiento de las transmisiones de comunicación individuales entre las aplicaciones en los hosts de origen y de destino.', 'proporcionar delimitación de tramas para identificar los bits que componen una trama', 'realizar una comprobación de redundancia cíclica en la trama para detectar errores', 'proporcionar la interfaz entre las aplicaciones y la red subyacente a través de la cual se transmiten los mensajes'], 0, ARRAY[0, 1], 'Tema 14.1.1 La capa de transporte tiene muchas responsabilidades. Algunas de las principales incluyen hacer seguimiento de las transmisiones de comunicación individuales, segmentar datos, e identificar la aplicación apropiada mediante números de puerto.', 'medium', 1),
('Q003', 'Modulos 14-15', '', '¿Qué información utiliza TCP para rearmar y reordenar los segmentos recibidos?', ARRAY['Números de fragmento', 'Números de acuse de recibo', 'Números de secuencia', 'Números de puerto'], 2, ARRAY[2], 'Tema 14.6.1 En la capa de transporte, TCP utiliza los números de secuencia en el encabezado de cada segmento TCP para rearmar los segmentos en el orden correcto.', 'medium', 1),
('Q004', 'Modulos 14-15', '', '¿Qué información importante se agrega al encabezado de la capa de transporte TCP/IP para asegurar la comunicación y la conectividad a un dispositivo de red remoto?', ARRAY['Direcciones físicas de destino y origen', 'Números de puerto de destino y origen', 'Direcciones de red lógicas de destino y origen', 'Temporización y sincronización'], 1, ARRAY[1], 'Tema 14.4.1 Los números de puerto de destino y origen se utilizan para identificar exactamente qué protocolo y qué proceso están realizando o respondiendo una solicitud.', 'medium', 1),
('Q005', 'Modulos 14-15', '', '¿Cuáles son las dos características relacionadas con las sesiones UDP? Elija dos opciones.', ARRAY['Se realiza el seguimiento de los segmentos de datos transmitidos.', 'Se vuelven a transmitir los paquetes de datos de los que no se realizó el acuse de recibo.', 'Los dispositivos de destino reciben el tráfico con una demora mínima.', 'No se realiza el acuse de recibo de los datos recibidos.', 'Los dispositivos de destino rearman los mensajes y los transfieren a una aplicación.'], 2, ARRAY[2, 3], 'Tema 14.7.1 UDP no realiza acuse de recibo de datos recibidos y los encabezados utilizan muy poca sobrecarga provocando demora mínima.', 'medium', 1),
('Q007', 'Modulos 14-15', '', '¿Cuál es el indicador del encabezado TCP que se utiliza en respuesta a un FIN recibido para finalizar la conectividad entre dos dispositivos de red?', ARRAY['RST', 'FIN', 'SYN', 'ACK'], 3, ARRAY[3], 'Tema 14.5.3 Cuando un dispositivo no tiene más datos para enviar, envía un segmento con el indicador FIN establecido. El dispositivo conectado responde con un indicador ACK para acusar el recibo.', 'medium', 1),
('Q008', 'Modulos 14-15', '', '¿Qué protocolo o servicio utiliza UDP para una comunicación cliente a servidor y TCP para la comunicación servidor a servidor?', ARRAY['HTTP', 'SMTP', 'FTP', 'DNS'], 3, ARRAY[3], 'Tema 14.4.3 DNS utiliza UDP cuando los clientes envían solicitudes a un servidor DNS, y TCP cuando dos servidores DNS se comunican directamente.', 'medium', 1),
('Q009', 'Modulos 14-15', '', '¿Qué clase de puerto se le debe solicitar a la IANA para utilizar con una aplicación específica?', ARRAY['Puerto privado', 'Puerto registrado', 'Puerto de origen', 'Puerto dinámico'], 1, ARRAY[1], 'Tema 14.4.3 La IANA asigna puertos registrados (del 1024 al 49151) a una entidad solicitante para que los utilice con procesos o aplicaciones específicos.', 'medium', 1),
('Q010', 'Modulos 14-15', '', '¿Cuáles son los tres protocolos de la capa de aplicación que utilizan TCP? Elija tres opciones.', ARRAY['SMTP', 'DHCP', 'TFTP', 'HTTP', 'FTP', 'SNMP'], 0, ARRAY[0, 3, 4], 'Tema 14.6.1 Algunos protocolas requieren el transporte de datos confiable que proporciona TCP. Ejemplos: SMTP, FTP y HTTP.', 'medium', 1),
('Q011', 'Modulos 14-15', '', '¿Cuáles son las tres afirmaciones que caracterizan el protocolo UDP? Elija tres opciones.', ARRAY['UDP proporciona funciones básicas sin conexión de la capa de transporte.', 'UDP proporciona mecanismos de control de flujo sofisticados.', 'UDP es un protocolo de sobrecarga baja que no proporciona mecanismo de control del flujo o secuenciación.', 'UDP proporciona un transporte de datos rápido y orientado a la conexión en la capa 3.', 'UDP depende del protocolo IP para la detección de errores y la recuperación.', 'UDP se basa en los protocolos de la capa de aplicación para la detección de errores.'], 0, ARRAY[0, 2, 5], 'Tema 14.7.1 UDP es un protocolo simple que proporciona las funciones básicas de la capa de transporte con sobrecarga mucho menor que TCP.', 'medium', 1),
('Q012', 'Modulos 14-15', '', '¿Qué dos campos se incluyen en el encabezado TCP pero no en el encabezado UDP? (Escoja dos opciones).', ARRAY['Puerto de origen', 'ventana', 'número de secuencia', 'Puerto de destino', 'checksum'], 1, ARRAY[1, 2], 'Tema 14.2.3 El número de secuencia y los campos de ventana se incluyen en el encabezado TCP, pero no en el encabezado UDP.', 'medium', 2),
('Q013', 'Modulos 14-15', '', '¿Qué campo en el encabezado TCP indica el estado del three-way handshake?', ARRAY['checksum', 'ventana', 'control bits', 'reservado'], 2, ARRAY[2], 'Tema 14.5.4 Los bits de control en el encabezado TCP indican el progreso y estado de la conexión.', 'medium', 2),
('Q014', 'Modulos 14-15', '', '¿Cómo se utilizan los números de puerto en el proceso de encapsulación TCP/IP?', ARRAY['Los números de puerto de origen y de puerto de destino se generan aleatoriamente.', 'Los números de puerto de destino se asignan automáticamente y no se pueden cambiar.', 'Los números de puerto de origen y los números de puerto de destino no son necesarios cuando UDP es el protocolo de capa de transporte que se utiliza para la comunicación.', 'Si se producen varias conversaciones que utilizan el mismo servicio, el número de puerto de origen se utiliza para realizar un seguimiento de las conversaciones separadas.'], 3, ARRAY[3], 'Tema 14.4.1 Los números de puerto de origen se generan aleatoriamente y se utilizan para rastrear diferentes conversaciones.', 'medium', 2),
('Q015', 'Modulos 14-15', '', '¿Qué tres afirmaciones describen un mensaje de descubrimiento de DHCP? (Elija tres).', ARRAY['Todos los hosts reciben el mensaje pero sólo responde un servidor de DHCP.', 'Solamente el servidor de DHCP recibe el mensaje.', 'La dirección IP de destino es 255.255.255.255.', 'El mensaje proviene de un cliente que busca una dirección IP.', 'El mensaje proviene de un servidor que ofrece una dirección IP.', 'La dirección MAC de origen tiene 48 bits (FF-FF-FF-FF-FF-FF).'], 0, ARRAY[0, 2, 3], 'Tema 15.4.7 Cuando un host configurado para utilizar DHCP se activa, envía un mensaje DHCPDISCOVER con broadcast FF-FF-FF-FF-FF-FF.', 'medium', 2),
('Q016', 'Modulos 14-15', '', '¿Qué dos protocolos pueden utilizar los dispositivos en el proceso de solicitud que implica el envío de un correo electrónico? (Elija dos opciones).', ARRAY['IMAP', 'POP', 'HTTP', 'POP3', 'SMTP', 'DNS'], 4, ARRAY[4, 5], 'Tema 15.3.2 SMTP es el protocolo predeterminado para enviar correo electrónico. El servidor puede utilizar DNS para encontrar la dirección del servidor de correo de destino.', 'medium', 2),
('Q017', 'Modulos 14-15', '', 'Cual capa del modelo OSI proporcionar la interfaz entre las aplicaciones y la red subyacente a través de la cual se transmiten los mensajes?', ARRAY['Transporte', 'Presentación', 'Sesión', 'Aplicación'], 3, ARRAY[3], 'Tema 15.1.1 La capa de aplicación proporciona la interfaz entre aplicaciones y la red subyacente.', 'medium', 2),
('Q018', 'Modulos 14-15', '', '¿Cuál de las siguientes es una característica clave del modelo de red entre pares?', ARRAY['Impresión en red por medio de un servidor de impresión', 'Redes sociales sin Internet', 'Uso compartido de recursos sin un servidor exclusivo', 'Red inalámbrica'], 2, ARRAY[2], 'Tema 15.2.2 El modelo P2P admite el uso compartido de datos, impresoras y recursos sin un servidor exclusivo.', 'medium', 2),
('Q019', 'Modulos 14-15', '', 'La capa de aplicación del modelo TCP/IP realiza las funciones de tres capas del modelo OSI. ¿De cuáles? Elija tres opciones.', ARRAY['Transporte', 'Sesión', 'Red', 'Aplicación', 'Enlace de datos', 'Física', 'Presentación'], 1, ARRAY[1, 3, 6], 'Tema 15.1.1 La capa de aplicación del modelo TCP/IP representa las capas de sesión, presentación y aplicación del modelo OSI.', 'medium', 2),
('Q020', 'Modulos 14-15', '', '¿Cuál es la capa del modelo TCP/IP que se utiliza para dar formato a los datos, comprimirlos y cifrarlos?', ARRAY['Acceso a la red', 'Interconexión de redes', 'Aplicación', 'Sesión', 'Presentación'], 2, ARRAY[2], 'Tema 15.1.1 La capa de aplicación del TCP/IP da formato a los datos, los comprime y los cifra, y crea diálogos entre aplicaciones.', 'medium', 2),
('Q021', 'Modulos 14-15', '', 'Una compañía fabricante se suscribe a ciertos servicios alojados por parte de su ISP. Entre los servicios requeridos, se incluyen el alojamiento web, la transferencia de archivos y el correo electrónico. ¿Qué protocolos representan estas tres aplicaciones clave? Elija tres opciones.', ARRAY['DHCP', 'SMTP', 'FTP', 'SNMP', 'HTTP', 'DNS'], 1, ARRAY[1, 2, 4], 'Tema 15.3.2 El ISP utiliza HTTP para web, FTP para transferencia de archivos, y SMTP para correo electrónico.', 'medium', 2),
('Q022', 'Modulos 14-15', '', '¿Qué protocolo de la capa de aplicación utiliza mensajes de tipo GET, PUT y POST?', ARRAY['SMTP', 'POP3', 'DHCP', 'HTTP', 'DNS'], 3, ARRAY[3], 'Tema 15.3.2 GET solicita datos, PUT carga recursos, POST carga archivos de datos a un servidor web.', 'medium', 3),
('Q023', 'Modulos 14-15', '', '¿Cuáles son los tres protocolos que funcionan en la capa de aplicación del modelo TCP/IP? (Elija tres opciones).', ARRAY['DHCP', 'FTP', 'POP3', 'TCP', 'ARP', 'UDP'], 0, ARRAY[0, 1, 2], 'Tema 15.1.3 FTP, DHCP y POP3 son protocolos de la capa de aplicación. TCP y UDP son de transporte. ARP es de capa de red.', 'medium', 3),
('Q024', 'Modulos 14-15', '', '¿Cuál de estas situaciones describe una función proporcionada por la capa de transporte?', ARRAY['Un estudiante reproduce una película corta con sonido basada en Web. La película y el sonido están codificados dentro del encabezado de la capa de transporte.', 'Un alumno utiliza un teléfono VoIP del aula para llamar a su casa. El identificador único grabado en el teléfono es una dirección de capa de transporte utilizada para establecer contacto con otro dispositivo de red en la misma red.', 'Un alumno tiene dos ventanas de explorador Web abiertas a fin de acceder a dos sitios Web. La capa de transporte garantiza que se entregue la página Web correcta a la ventana de explorador adecuada.', 'Un trabajador de una empresa accede a un servidor Web ubicado en una red corporativa. La capa de transporte da formato a la pantalla para que la página Web se visualice de manera adecuada, independientemente del dispositivo que se utilice para ver el sitio Web.'], 2, ARRAY[2], 'Tema 14.1.2 Los números de puerto de origen y destino identifican la aplicación y ventana correctas.', 'medium', 3),
('Q025', 'Modulos 14-15', '', '¿Cuáles son las tres capas del modelo OSI que proporcionan servicios de red similares a los que proporciona la capa de aplicación del modelo TCP/IP? (Elija tres).', ARRAY['Capa de enlace de datos', 'Capa de presentación', 'Capa de transporte', 'Capa de aplicación', 'Capa física', 'Capa de sesión'], 1, ARRAY[1, 3, 5], 'Tema 15.1.1 Las tres capas superiores del OSI (sesión, presentación, aplicación) proporcionan servicios similares a la capa de aplicación del TCP/IP.', 'medium', 3),
('Q026', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente está solicitando el servicio SSH. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['69', '67', '22', '80'], 2, ARRAY[2], 'Tema 15.5.1 El puerto por defecto para SSH es el 22.', 'medium', 3),
('Q027', 'Modulos 14-15', '', 'Un equipo que se está comunicando con un servidor web tiene un tamaño de ventana TCP de 6.000 bytes al enviar datos y un tamaño de paquete de 1.500 bytes. ¿Qué byte de información confirmará el servidor web después de haber recibido tres paquetes de datos del PC?', ARRAY['4501', '3000', '6001', '6000'], 0, ARRAY[0], 'Tema 14.6.3 Con ventana de 6000 y paquetes de 1500, tras 3 paquetes (4500 bytes), el servidor confirma el byte 4501.', 'medium', 3),
('Q028', 'Modulos 14-15', '', '¿Cuál de los siguientes es un ejemplo de comunicación de red que utiliza el modelo cliente-servidor?', ARRAY['Una estación de trabajo inicia una solicitud de DNS cuando el usuario escribe www.cisco.com en la barra de direcciones de un explorador Web.', 'Un usuario imprime un documento con una impresora conectada por cable a la estación de trabajo de un compañero.', 'Un usuario utiliza eMule para descargar un archivo compartido por un amigo después de que se determina la ubicación del archivo.', 'Una estación de trabajo inicia un protocolo ARP para encontrar la dirección MAC del host receptor.'], 0, ARRAY[0], 'Tema 15.2.1 En el modelo cliente-servidor, un dispositivo solicita un servicio de otro que actúa como servidor.', 'medium', 3),
('Q029', 'Modulos 14-15', '', '¿En qué modelo de red se utilizarían eDonkey, eMule, BitTorrent, Bitcoin y LionShare?', ARRAY['Basada en clientes', 'Red entre pares', 'Punto a punto', 'Maestro/esclavo'], 1, ARRAY[1], 'Tema 15.2.4 En el modelo P2P, se intercambian datos entre dos dispositivos sin un servidor exclusivo.', 'medium', 3),
('Q030', 'Modulos 14-15', '', '¿Qué aplicaciones o servicios permiten que los hosts actúen como cliente y servidor al mismo tiempo?', ARRAY['aplicaciones de correo electrónico', 'Aplicaciones P2P', 'Aplicaciones de cliente-servidor', 'Servicios de autenticación'], 1, ARRAY[1], 'Tema 15.2.2 Las aplicaciones P2P permiten que un dispositivo actúe como servidor y cliente simultáneamente.', 'medium', 3),
('Q031', 'Modulos 14-15', '', '¿Cuál es la función del mensaje HTTP GET?', ARRAY['Recuperar el correo electrónico del cliente desde un servidor de correo electrónico mediante el puerto TCP 110.', 'Cargar contenido de un cliente web a un servidor web.', 'Enviar información de errores de un servidor web a un cliente web.', 'Solicitar una página HTML de un servidor web.'], 3, ARRAY[3], 'Tema 15.3.2 GET solicita datos (como una página HTML) de un servidor web.', 'medium', 3),
('Q032', 'Modulos 14-15', '', '¿Qué protocolo utiliza un cliente para comunicarse en forma segura con el servidor web?', ARRAY['SMTP', 'HTTPS', 'IMAP', 'SMB'], 1, ARRAY[1], 'Tema 15.3.2 HTTPS proporciona comunicación segura cifrada con el servidor web.', 'medium', 4),
('Q033', 'Modulos 14-15', '', 'Una PC está descargando un archivo grande de un servidor. La ventana TCP es de 1000 bytes. El servidor envía el archivo utilizando segmentos de 100 bytes. ¿Cuántos segmentos enviará el servidor antes de requerir un acuse de recibo de la PC?', ARRAY['10 segmentos', '100 segmentos', '1000 segmentos', '1 segmento'], 0, ARRAY[0], 'Tema 14.6.5 Con ventana de 1000 bytes y segmentos de 100 bytes, se envían 10 segmentos antes del acuse de recibo.', 'medium', 4),
('Q034', 'Modulos 14-15', '', '¿Cuál de las siguientes es una característica de UDP?', ARRAY['UDP solamente transfiere los datos a la red cuando el destino está listo para recibirlos.', 'Las aplicaciones que utilizan UDP siempre se consideran poco confiables.', 'Los datagramas UDP pueden tomar la misma ruta y llegar al destino en el orden correcto.', 'UDP rearma los datagramas recibidos en el orden en que se recibieron.'], 3, ARRAY[3], 'Tema 14.7.2 UDP no reordena los datagramas; los rearma en el orden en que se recibieron.', 'medium', 4),
('Q035', 'Modulos 14-15', '', '¿Por qué HTTP utiliza TCP como protocolo de la capa de transporte?', ARRAY['Porque se pueden tolerar fácilmente errores de transmisión.', 'Porque HTTP es un protocolo de máximo esfuerzo.', 'Porque HTTP requiere entrega confiable.', 'Para asegurar la mayor velocidad de descarga posible.'], 2, ARRAY[2], 'Tema 14.1.6 HTTP requiere confiabilidad e integridad en la transmisión, por lo que utiliza TCP.', 'medium', 4),
('Q036', 'Modulos 14-15', '', '¿Qué tipos de aplicaciones son los más adecuados para el uso de UDP? (Escoja dos opciones).', ARRAY['Las aplicaciones que necesitan una entrega confiable', 'Aplicaciones que pueden tolerar cierta pérdida de datos, pero requieren demoras breves o que no haya demoras.', 'aplicaciones que necesitan el reordenamiento de segmentos', 'aplicaciones que manejan la confiabilidad por su cuenta.', 'aplicaciones que necesitan control de flujo de datos'], 1, ARRAY[1, 3], 'Tema 14.1.6 Las aplicaciones que toleran pérdida de datos y manejan confiabilidad por sí mismas son las más adecuadas para UDP.', 'medium', 4),
('Q037', 'Modulos 14-15', '', '¿Cuáles de las siguientes son tres responsabilidades de la capa de transporte? (Elija tres opciones.)', ARRAY['Identificar las aplicaciones y los servicios que deben manejar los datos transmitidos en el servidor y el cliente.', 'Dar a los datos un formato compatible para que los reciban los dispositivos de destino.', 'Realizar una detección de errores del contenido de las tramas.', 'Cumplir con los requisitos de confiabilidad de las aplicaciones, si corresponde.', 'Dirigir paquetes hacia la red de destino.', 'Realizar la multiplexación de varias transmisiones de comunicación desde muchos usuarios o aplicaciones en la misma red.'], 0, ARRAY[0, 3, 5], 'Tema 14.1.2 La capa de transporte identifica aplicaciones, gestiona confiabilidad y multiplexa comunicaciones.', 'medium', 4),
('Q038', 'Modulos 14-15', '', '¿Cuál de los siguientes enunciados sobre el protocolo de bloque de mensajes del servidor es verdadero?', ARRAY['Los clientes establecen una conexión a largo plazo con los servidores.', 'El protocolo SMB utiliza el protocolo FTP para la comunicación.', 'Los mensajes SMB no pueden autenticar una sesión.', 'Los diferentes tipos de mensajes SMB tienen formatos diferentes.'], 0, ARRAY[0], 'Tema 15.5.2 SMB es un protocolo para compartir archivos, impresoras y directorios. Los clientes establecen conexiones a largo plazo.', 'medium', 4),
('Q039', 'Modulos 14-15', '', '¿Qué modelo de red se utiliza cuando un autor carga el documento de un capítulo al servidor de archivos de una editorial?', ARRAY['Maestro/esclavo', 'Cliente/servidor', 'Punto a punto', 'Entre pares'], 1, ARRAY[1], 'Tema 15.2.1 En el modelo cliente/servidor, un dispositivo actúa como servidor para proporcionar un servicio como transferencia de archivos.', 'medium', 4),
('Q040', 'Modulos 14-15', '', '¿Qué tienen en común los modelos de red entre pares y de cliente/servidor?', ARRAY['Ambos modelos tienen servidores exclusivos.', 'Ambos modelos se utilizan solamente en entornos de red por cable.', 'Ambos modelos admiten dispositivos en el papel de servidor y de cliente.', 'Ambos modelos requieren el uso de protocolos basados en TCP/IP.'], 2, ARRAY[2], 'Tema 15.2.1 En ambos modelos existen clientes y servidores, aunque en P2P no hay servidor exclusivo.', 'medium', 4),
('Q041', 'Modulos 14-15', '', '¿Cuál de los siguientes es un protocolo común que se usa con aplicaciones entre pares como WireShare, Bearshare y Shareaza?', ARRAY['POP', 'SMTP', 'Gnutella', 'Ethernet'], 2, ARRAY[2], 'Tema 15.2.4 El protocolo Gnutella se usa en aplicaciones P2P para compartir archivos.', 'medium', 4),
('Q042', 'Modulos 14-15', '', '¿Cuál es una de las ventajas de usar SMB en lugar de FTP?', ARRAY['Solo SMB establece dos conexiones simultáneas con el cliente, por lo que la transferencia de datos es más rápida.', 'SMB es más confiable que FTP, porque SMB utiliza TCP, y FTP utiliza UDP.', 'Solo con SMB se pueden transferir datos en ambas direcciones.', 'Los clientes SMB pueden establecer una conexión a largo plazo con el servidor.'], 3, ARRAY[3], 'Tema 15.5.2 SMB permite conexiones a largo plazo con el servidor, a diferencia de FTP que requiere dos conexiones separadas.', 'medium', 5),
('Q043', 'Modulos 14-15', '', '¿Qué tipo de información contiene un registro MX de DNS?', ARRAY['El FQDN del alias que se utiliza para identificar un servicio', 'La dirección IP para una entrada de FQDN', 'El nombre de dominio asignado a los servidores de intercambio de correos', 'La dirección IP de un servidor de nombres autoritativo'], 2, ARRAY[2], 'Tema 15.4.2 Los registros MX asignan un nombre de dominio a servidores de intercambio de correos.', 'medium', 5),
('Q044', 'Modulos 14-15', '', 'Un equipo que se está comunicando con un servidor web tiene un tamaño de ventana TCP de 6.000 bytes al enviar datos y un tamaño de paquete de 1.500 bytes. ¿Qué byte de información confirmará el servidor web después de haber recibido cuatro paquetes de datos del PC?', ARRAY['1501', '1500', '6001', '3001'], 2, ARRAY[2], 'Tema 14.6.3 Con ventana de 6000 y paquetes de 1500, tras 4 paquetes (6000 bytes), el servidor confirma el byte 6001.', 'medium', 5),
('Q045', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente está solicitando el servicio POP3. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['67', '53', '110', '69'], 2, ARRAY[2], 'Tema 15.3.4 El puerto por defecto para POP3 es el 110.', 'medium', 5),
('Q046', 'Modulos 14-15', '', '¿Qué hace un cliente cuando tiene datagramas UDP para enviar?', ARRAY['Envía al servidor un segmento con el indicador SYN establecido para sincronizar la conversación.', 'Simplemente envía los datagramas.', 'Envía una consulta al servidor para ver si está listo para recibir datos.', 'Envía un protocolo de enlace de tres vías simplificado al servidor.'], 1, ARRAY[1], 'Tema 14.1.5 Cuando un cliente tiene datagramas UDP para enviar, simplemente los envía sin establecer conexión.', 'medium', 5),
('Q047', 'Modulos 14-15', '', '¿Cuáles son dos características de una red entre pares? (Escoja dos opciones).', ARRAY['Escalabilidad', 'Uso compartido de recursos sin un servidor exclusivo', 'cuentas de usuario centralizadas', 'flujo de datos en un solo sentido', 'recursos descentralizados'], 1, ARRAY[1, 4], 'Tema 15.2.2 Las redes P2P tienen recursos descentralizados y comparten recursos sin un servidor exclusivo.', 'medium', 5),
('Q048', 'Modulos 14-15', '', 'Un equipo que se está comunicando con un servidor web tiene un tamaño de ventana TCP de 6.000 bytes al enviar datos y un tamaño de paquete de 1.500 bytes. ¿Qué byte de información confirmará el servidor web después de haber recibido dos paquetes de datos del PC?', ARRAY['3001', '3000', '4500', '6001'], 0, ARRAY[0], 'Tema 14.6.3 Con ventana de 6000 y paquetes de 1500, tras 2 paquetes (3000 bytes), el servidor confirma el byte 3001.', 'medium', 5),
('Q049', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente solicita el servicio SNMP. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['110', '443', '80', '161'], 3, ARRAY[3], 'Tema 15.1.3 El puerto por defecto para SNMP es el 161.', 'medium', 5),
('Q050', 'Modulos 14-15', '', '¿En qué dos situaciones se prefiere el protocolo de transporte UDP en lugar del TCP? Elija dos opciones.', ARRAY['Cuando las aplicaciones no necesitan garantizar la distribución de los datos', 'Cuando se necesita un mecanismo de distribución rápido', 'Cuando la sobrecarga de la distribución no es un problema', 'Cuando las aplicaciones requieren la garantía de que un paquete llegue intacto, en secuencia y sin duplicado', 'Cuando los números de puerto de destino son dinámicos'], 0, ARRAY[0, 1], 'Tema 14.1.6 UDP se prefiere cuando no se necesita garantizar la entrega y se requiere velocidad.', 'medium', 5),
('Q051', 'Modulos 14-15', '', '¿Cuál de estos factores determina el tamaño de la ventana TCP?', ARRAY['La cantidad de datos que el destino puede procesar por vez', 'La cantidad de datos que se debe transmitir', 'La cantidad de datos que el origen puede enviar por vez', 'La cantidad de servicios incluidos en el segmento TCP'], 0, ARRAY[0], 'Tema 14.6.5 La ventana se determina por la cantidad de datos que el destino puede aceptar y procesar por vez.', 'medium', 5),
('Q052', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente está solicitando el servicio SMTP. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['110', '25', '443', '161'], 1, ARRAY[1], 'Tema 15.1.3 El puerto por defecto para SMTP es el 25.', 'medium', 6),
('Q053', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente está solicitando el servicio FTP. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['67', '69', '80', '21'], 3, ARRAY[3], 'Tema 15.5.1 El puerto por defecto para FTP es el 21.', 'medium', 6),
('Q054', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente está solicitando el servicio HTTP. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['80', '67', '53', '69'], 0, ARRAY[0], 'Tema 15.1.3 El puerto por defecto para HTTP es el 80.', 'medium', 6),
('Q055', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente está solicitando el servicio TFTP. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['69', '67', '53', '80'], 0, ARRAY[0], 'Tema 15.5.1 El puerto por defecto para TFTP es el 69.', 'medium', 6),
('Q056', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente está solicitando el servicio telnet. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['110', '23', '443', '161'], 1, ARRAY[1], 'Tema 15.1.3 El puerto por defecto para Telnet es el 23.', 'medium', 6),
('Q057', 'Modulos 14-15', '', 'Cuál es la capa del modelo OSI que puede proporcionar la interfaz entre las aplicaciones y la red subyacente a través de la cual se transmiten los mensajes?', ARRAY['Aplicación', 'Presentación', 'Sesión', 'Transporte'], 0, ARRAY[0], 'Tema 15.1.1 La capa de aplicación del OSI proporciona la interfaz entre aplicaciones y la red.', 'medium', 6),
('Q058', 'Modulos 14-15', '', 'Un cliente crea un paquete para enviar a un servidor. El cliente está solicitando el servicio HTTPS. ¿Qué número se utilizará como número de puerto de destino en el paquete de envío?', ARRAY['443', '161', '80', '110'], 0, ARRAY[0], 'Tema 15.3.2 El puerto por defecto para HTTPS es el 443.', 'medium', 6);