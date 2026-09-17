/*
# Módulos dinámicos + seed "Módulos 11 - 13"

## Overview
1. Nueva tabla `modules` (carpetas de preguntas creadas por el usuario).
2. `questions.module_id` (FK a modules, nullable). `group_number` se conserva
   como "parte" dentro del módulo (sigue siendo global y único por parte).
3. Se crean los 3 módulos existentes y se asignan las preguntas por rango de grupo.
4. Se crea el módulo "Módulos 11 - 13" (grupos 22-26) con 53 preguntas
   del examen de direccionamiento IP (CCNA1 v7).

## Security
- RLS habilitado en modules, acceso completo a anon+authenticated (single-tenant,
  igual que el resto de tablas).
*/

CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'brand',
  icon text NOT NULL DEFAULT 'folder',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_modules" ON modules;
DROP POLICY IF EXISTS "anon_insert_modules" ON modules;
DROP POLICY IF EXISTS "anon_update_modules" ON modules;
DROP POLICY IF EXISTS "anon_delete_modules" ON modules;
CREATE POLICY "anon_select_modules" ON modules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_modules" ON modules FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_modules" ON modules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_modules" ON modules FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_questions_module ON questions(module_id);

INSERT INTO modules (id, name, description, color, icon, position) VALUES
  ('11111111-1111-4111-8111-000000000001', 'Módulo 14 y 15', 'Capa de transporte y aplicación', 'brand', 'graduation-cap', 1),
  ('11111111-1111-4111-8111-000000000002', 'Linux', 'Prueba de conocimientos de Linux', 'emerald', 'terminal', 2),
  ('11111111-1111-4111-8111-000000000003', 'Parcial 1', 'Preguntas del Parcial 1', 'sky', 'file-text', 3),
  ('11111111-1111-4111-8111-000000000004', 'Módulos 11 - 13', 'Examen de direccionamiento IP (CCNA1 v7)', 'amber', 'network', 4)
ON CONFLICT (id) DO NOTHING;

UPDATE questions SET module_id = '11111111-1111-4111-8111-000000000001' WHERE module_id IS NULL AND group_number BETWEEN 1 AND 6;
UPDATE questions SET module_id = '11111111-1111-4111-8111-000000000002' WHERE module_id IS NULL AND group_number BETWEEN 7 AND 16;
UPDATE questions SET module_id = '11111111-1111-4111-8111-000000000003' WHERE module_id IS NULL AND group_number BETWEEN 17 AND 21;

-- Preguntas Módulos 11 - 13 (solo si aún no existen)
DO $$
DECLARE
  base_qid int;
BEGIN
  IF EXISTS (SELECT 1 FROM questions WHERE module_id = '11111111-1111-4111-8111-000000000004') THEN
    RETURN;
  END IF;
  SELECT COALESCE(MAX((regexp_match(qid, '^Q(\d+)$'))[1]::int), 0) INTO base_qid FROM questions;

  INSERT INTO questions (qid, topic, subtopic, question, question_image, options, option_images, correct_index, correct_indices, explanation, difficulty, group_number, module_id) VALUES

  ('Q' || lpad((base_qid + 1)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un administrador desea crear cuatro subredes a partir de la dirección de red 192.168.1.0/24. ¿Cuál es la dirección de red y la máscara de subred de la segunda subred utilizable?', '', ARRAY['Subred 192.168.1.32 / Máscara de subred 255.255.255.240','Subred 192.168.1.8 / Máscara de subred 255.255.255.224','Subred 192.168.1.128 / Máscara de subred 255.255.255.192','Subred 192.168.1.64 / Máscara de subred 255.255.255.192','Subred 192.168.1.64 / Máscara de subred 255.255.255.240']::text[], ARRAY['','','','','']::text[], 3, ARRAY[3]::int[], 'Tema 11.5.2

La cantidad de bits que se toman prestados sería dos, lo que da un total de 4 subredes utilizables:

192.168.1.0

192.168.1.64

192.168.1.128

192.168.1.192

Dado que se toman prestados 2 bits, la nueva máscara de subred sería /26 o 255.255.255.192.', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 2)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuántas direcciones de host se encuentran disponibles en la red 192.168.10.128/26?', '', ARRAY['30','32','60','62','64']::text[], ARRAY['','','','','']::text[], 3, ARRAY[3]::int[], 'Tema 11.5.2

Un prefijo /26 ofrece 6 bits de host, lo que proporciona un total de 64 direcciones, dado que 2^6 = 64. Al restar las direcciones de red y de broadcast, quedan 62 direcciones de host utilizables.', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 3)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuántas direcciones de host están disponibles en la red 172.16.128.0 con la máscara de subred 255.255.252.0?', '', ARRAY['510','512','1022','1024','2046','2048']::text[], ARRAY['','','','','','']::text[], 2, ARRAY[2]::int[], 'Tema 11.5.2

Una máscara 255.255.252.0 equivale a un prefijo /22. Un prefijo de /22 proporciona 22 bits para la porción de red y deja 10 bits para la porción de host. Los 10 bits de la porción de host proporcionan 1022 direcciones IP utilizables (2^10 – 2 = 1022).', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 4)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuáles son los tres bloques de direcciones definidos por la RFC 1918 para el uso en redes privadas? Elija tres opciones.', '', ARRAY['239.0.0.0/8','192.168.0.0/16','169.254.0.0/16','10.0.0.0/8','100.64.0.0/14','172.16.0.0/12']::text[], ARRAY['','','','','','']::text[], 1, ARRAY[1,3,5]::int[], 'Tema 11.3.1

En la RFC 1918, “Address Allocation for Private Internets (Asignación de direcciones para redes privadas)”, se definen los tres bloques de direcciones IPv4 para redes privadas que no deben ser enrutables en la Internet pública.

10.0.0.0/8

172.16.0.0/12

192.168.0.0/16', 'hard', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 5)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'El administrador de un sitio debe hacer que una red específica del sitio debe admitir 126 hosts. ¿Cuál de las siguientes máscaras de subred tiene la cantidad de bits de host requerida?', '', ARRAY['255.255.255.224','255.255.255.240','255.255.255.0','255.255.255.128']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 11.5.2

La máscara de subred 255.255.255.0 tiene 8 bits de host. La máscara 255.255.255.128 da como resultado 7 bits de host. La máscara 255.255.255.224 tiene 5 bits de host. Por último, 255.255.255.240 representa 4 bits de host.', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 6)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Consulte la ilustración. Considerando las direcciones ya utilizadas y la indicación de mantenerse dentro del rango de red 10.16.10.0/24, ¿cuál de las siguientes direcciones de subred se podría asignar a la red que tiene 25 hosts?', 'https://examenredes.com/wp-content/uploads/2021/08/i280251n1v1.jpg', ARRAY['10.16.10.128/28','10.16.10.240/28','10.16.10.224/26','10.16.10.160/26','10.16.10.64/27','10.16.10.240/27']::text[], ARRAY['','','','','','']::text[], 4, ARRAY[4]::int[], 'Tema 11.8.4

Las direcciones de 10.16.10.0 a 10.16.10.63 se toman para la red que se encuentra más a la izquierda. La red central utiliza las direcciones de 10.16.10.192 a 10.16.10.207. El espacio de direcciones de 208 a 255 presupone la máscara /28, que no otorga suficientes bits de host como para admitir 25 direcciones de host. Los intervalos de direcciones disponibles incluyen las direcciones 10.16.10.64/26 y 10.16.10.128/26. Para admitir 25 hosts, se necesitan 5 bits de host, por lo que se requiere la máscara /27. Se podrían crear cuatro subredes /27 a partir de las direcciones disponibles entre 10.16.10.64 y 10.16.10.191:

10.16.10.64/27

10.16.10.96/27

10.16.10.128/27

10.16.10.160/27', 'hard', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 7)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es la cantidad de direcciones IP de host disponibles en una red que tiene la máscara /26?', '', ARRAY['62','16','254','32','256','64']::text[], ARRAY['','','','','','']::text[], 0, ARRAY[0]::int[], 'Tema 11.5.2

La máscara /26 equivale a /255.255.255.192. La máscara deja libres 6 bits de host. Con 6 bits de host, hay 64 direcciones IP disponibles. Una dirección representa el número de subred, y otra representa la dirección de difusión, por lo que se pueden utilizar 62 direcciones para asignar a los dispositivos de red.', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 8)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué rango de prefijos de direcciones se reserva para las direcciones IPv4 de multidifusión?', '', ARRAY['240.0.0.0 – 254.255.255.255','169.254.0.0 – 169.254.255.255','127.0.0.0 – 127.255.255.255','224.0.0.0 – 239.255.255.255']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 11.2.3

Las direcciones IPv4 de multidifusión usan el rango de direcciones clase D reservado a 224.0.0.0 a 239.255.255.255.', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 9)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un mensaje se envía a todos los hosts en una red remota. ¿Qué tipo de mensaje es?', '', ARRAY['Unicast','Multicast','Broadcast limitado','Broadcast dirigido']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 11.2.2

Un broadcast dirigido es un mensaje que se envía a todos los hosts de una red específica. Es útil para enviar un broadcast a todos los hosts de una red no local. Un mensaje multicast es un mensaje que se envía a un grupo seleccionado de hosts que forman parte de un grupo multicast suscrito. El broadcast limitado se utiliza para comunicaciones que se limitan a los hosts de la red local. Un mensaje unicast es un mensaje que se envía de un host a otro.', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 10)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué dirección es una dirección unicast local de enlace IPv6 válida?', '', ARRAY['FD80::1:1234','FE0A::100:7788:998F','FEC 8:1::FFFF','FE80::1:4545:6578:ABC1','FC90:5678:4251:FFFF']::text[], ARRAY['','','','','']::text[], 3, ARRAY[3]::int[], 'Tema 12.3.7

Las LLAS IPv6 están en el rango fe80::/10. /10 indica que los primeros 10 bits son 1111 1110 10xx xxxx. El primer hexteto tiene un rango de 1111 1110 1000 0000 (fe80) to 1111 1110 1011 1111 (febf).', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 11)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál de estas direcciones es la abreviatura más corta para la dirección IP: 3FFE:1044:0000:0000:00AB:0000:0000:0057?', '', ARRAY['3FFE:1044:0:0:00AB::0057','3FFE:1044::00AB::0057','3FFE:1044:0000:0000:00AB::57','3FFE:1044:0000:0000:00AB::0057','3FFE:1044::AB::57','3FFE:1044:00:AB::57']::text[], ARRAY['','','','','','']::text[], 5, ARRAY[5]::int[], 'Tema 12.2.3

Las reglas para reducir la notación de direcciones IPv6 son:

1. Omita cualquier 0 (ceros) a la izquierda en cualquier hexteto.

2. Los dos puntos dobles (::) pueden reemplazar cualquier cadena única y contigua de uno o más segmentos de 16 bits (hextetos) que estén compuestas solo por ceros.

3. Los dos puntos dobles :: solo se pueden usar una vez en una dirección.', 'medium', 22, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 12)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué tipo de dirección IPv6 es FE80::1?', '', ARRAY['Unidifusión global','Link-local','Multidifusión','Bucle invertido']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 12.3.7

Las direcciones IPv6 link-local comienzan con FE80::/10, que corresponde a cualquier dirección desde FE80:: hasta FEBF::. Las direcciones link-local se utilizan de manera extensiva en IPv6 y permiten que los dispositivos conectados directamente se comuniquen entre sí en el enlace que comparten.', 'medium', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 13)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Consulte la ilustración. Una empresa implementa un esquema de direccionamiento IPv6 para su red. En el documento de diseño de la empresa, se indica que la porción de subred de las direcciones IPv6 se utiliza para el nuevo diseño de red jerárquico. En él, la subsección de sitio representa los diferentes sitios geográficos de la empresa, la subsección de subsitio representa los diferentes campus de cada sitio, y la subsección de subred indica cada segmento de la red separado por routers. Con este esquema, ¿cuál es la cantidad máxima de subredes que se obtiene por subsitio ?', 'https://examenredes.com/wp-content/uploads/2021/08/2021-08-22_234255.jpg', ARRAY['256','0','16','4']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 12.8.1

Debido a que se utiliza solamente un carácter hexadecimal para representar la subred, ese carácter puede representar 16 valores diferentes, que van de 0 a F.', 'hard', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 14)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué se utiliza en el proceso EUI-64 para crear una ID de interfaz IPv6 en una interfaz habilitada IPv6?', '', ARRAY['Una dirección IPv4 configurada en la interfaz','La dirección MAC de la interfaz habilitada IPv6','Una dirección IPv6 proporcionada por un servidor DHCPv6','Una dirección hexadecimal de 64 bits aleatoriamente generada']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 12.5.6

El proceso EUI-64 utiliza la dirección MAC de una interfaz para crear una ID de interfaz (IID). Dado que la dirección MAC solo tiene 48 bits de longitud, deben agregarse 16 bits adicionales (FF:FE) a la dirección MAC para crear la ID de interfaz de 64 bits completa.', 'medium', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 15)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es el prefijo de la dirección de host 2001:DB8:BC15:A:12AB::1/64?', '', ARRAY['2001:DB8:BC15','2001:DB8:BC15:A','2001:DB8:BC15:A:1','2001:DB8:BC15:A:12']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 12.3.2

La porción de red, o prefijo, de una dirección IPv6 se identifica por medio de la longitud de prefijo. La longitud de prefijo /64 indica que los primeros 64 bits de la dirección IPv6 corresponden a la porción de red. Por lo tanto, el prefijo es 2001:DB8:BC15:A.', 'medium', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 16)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué prefijo IPv6 se reserva para la comunicación entre dispositivos en el mismo enlace?', '', ARRAY['FDFF::/7','2001::/32','FC00::/7','FE80::/10']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 12.3.7

Las direcciones de unidifusión locales de enlace IPv6 se encuentran en el rango de prefijos FE80::/10 y no son enrutables. Se usan solo para las comunicaciones entre dispositivos en el mismo enlace.', 'medium', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 17)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué tipo de dirección IPv6 hace referencia a cualquier dirección de unidifusión asignada a varios hosts?', '', ARRAY['anycast','Local única','Unidifusión global','link-local']::text[], ARRAY['','','','']::text[], 0, ARRAY[0]::int[], 'Tema 12.3.1

Las especificaciones IPv6 incluyen direcciones anycast. Una dirección anycast es una dirección IPv6 de unidifusión que se asigna a varios dispositivos.', 'medium', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 18)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuáles de los siguientes son dos tipos de direcciones IPv6 unicast? (Elija dos).', '', ARRAY['Anycast','Multicast','Link-local','Loopback','Broadcast']::text[], ARRAY['','','','','']::text[], 2, ARRAY[2,3]::int[], 'Tema 12.3.3

Multicast, anycast y unicast son tipos de direcciones IPv6. No hay una dirección de broadcast en IPv6. Loopback y link-local son tipos específicos de direcciones unicast.', 'hard', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 19)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué servicio proporciona direccionamiento IPv6 dinámicas globales a las terminales sin utilizar un servidor que registre las direcciones IPv6 disponibles?', '', ARRAY['DHCPv6 sin información de estado','Direccionamiento IPv6 estático','SLAAC','DHCPv6 con información de estado']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 12.5.2

Mediante la configuración automática de dirección independiente del estado (SLAAC), una PC puede enviar una solicitud a un router y recibir la longitud del prefijo de la red. A partir de esta información, la PC puede generar su propia dirección IPv6 de unidifusión global.', 'medium', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 20)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un técnico utiliza el comando ping 127.0.0.1 . ¿Qué está probando el técnico?', '', ARRAY['La conectividad entre dos PC en la misma red','La conectividad entre dos dispositivos Cisco adyacentes','La conectividad entre una PC y el gateway predeterminado','La conectividad física de una PC determinada y la red','El stack de TCP/IP en un host de red']::text[], ARRAY['','','','','']::text[], 4, ARRAY[4]::int[], 'Tema 13.3.1

127.0.0.1 es la dirección de loopback local de cualquier dispositivo de red TCP/IP. Hacer ping a esta dirección le permite al técnico revisar el stack de protocolos TCP/IP de ese dispositivo específico.', 'medium', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 21)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Consulte la ilustración. Un administrador intenta resolver problemas de conectividad entre la PC1 y la PC2 y, para lograrlo, utiliza el comando tracert en la PC1. Sobre la base del resultado que se muestra, ¿por dónde debería comenzar a resolver el problema el administrador?', 'https://examenredes.com/wp-content/uploads/2021/08/2021-08-22_235818.jpg', ARRAY['PC2','SW2','R2','SW1','R1']::text[], ARRAY['','','','','']::text[], 4, ARRAY[4]::int[], 'Tema 13.3.2

Tracert se utiliza para rastrear la ruta que toma un paquete. La única respuesta correcta fue la del primer dispositivo en la ruta ubicado en la misma red LAN que el host emisor. El primer dispositivo es el gateway predeterminado del router R1. Por lo tanto, el administrador debe comenzar la resolución de problemas en R1.', 'hard', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 22)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué protocolo utiliza el comando traceroute para enviar y recibir solicitudes y respuestas de eco?', '', ARRAY['TCP','SNMP','Telnet','ICMP']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 13.1.1

Traceroute emplea ICMP (⁪protocolo de mensajería de control de Internet) para enviar y recibir mensajes de solicitud de eco y respuesta de eco.', 'medium', 23, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 23)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál de las siguientes es la notación de duración de prefijo para la máscara de subred 255.255.255.224?', '', ARRAY['/26','/28','/27','/25']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 11.1.3

El formato binario para 255.255.255.224 es 11111111.11111111.11111111.11100000. La duración de prefijo es la cantidad de números 1 consecutivos en la máscara de subred. Por lo tanto, la duración de prefijo es /27.', 'medium', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 24)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál de las siguientes subredes incluiría la dirección 192.168.1.96 como dirección de host utilizable?', '', ARRAY['192.168.1.64/29','192.168.1.32/28','192.168.1.64/26','192.168.1.32/27']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 11.5.1

Para la subred de 192.168.1.64/26, hay 6 bits para las direcciones de host, por lo que hay 64 direcciones posibles. Sin embargo, la primera y la última subred son las direcciones de red y de broadcast de esta subred. Por lo tanto, el rango de direcciones de host para esta subred va de192.168.1.65 a 192.168.1.126. Las otras subredes no contienen la dirección 192.168.1.96 como dirección de host válida.', 'medium', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 25)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Abra la actividad de PT. Complete las instrucciones de la actividad y luego responda la pregunta.', 'https://examenredes.com/wp-content/uploads/2021/08/2021-09-10_163912.jpg', ARRAY['2001:DB8:1:1::1','2001:DB8:1:1::A','2001:DB8:1:2::2','2001:DB8:1:2::1','2001:DB8:1:3::1','2001:DB8:1:3::2','2001:DB8:1:4::1']::text[], ARRAY['','','','','','','']::text[], 0, ARRAY[0,3,5]::int[], 'Tema 13.3.2

Mediante el comando ipv6config en PC2 se muestra la dirección IPv6 de PC2, que es 2001:DB8:1:4::A. La dirección local del enlace IPV6, FE80::260:70FF:FE34:6930, no se utiliza en el seguimiento/rastreo de rutas. Mediante el comando tracert 2001:DB8:1:4::A en PC1 se muestran cuatro direcciones: 2001:DB8:1:1::1, 2001:DB8:1:2::1, 2001:DB8:1:3::2, y 2001:DB8:1:4::A.', 'hard', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 26)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un host está transmitiendo un multicast. ¿Qué host o hosts lo recibirán?', '', ARRAY['un grupo de hosts especialmente definido','dispositivos de red directamente conectados','un host específico','el vecino más cercano de la misma red']::text[], ARRAY['','','','']::text[], 0, ARRAY[0]::int[], 'Tema 11.2.3
La transmisión de multidifusión (multicast) está diseñada para enviar paquetes desde un único origen hacia un grupo específico de hosts que se han suscrito o unido previamente a una dirección de grupo multicast (por ejemplo, dispositivos que escuchan protocolos de enrutamiento o transmisiones de video streaming). A diferencia de un broadcast (que llega a todos los hosts de la subred) o un unicast (que va a un solo host específico), el multicast optimiza el ancho de banda enviando el tráfico únicamente a los miembros interesados.', 'medium', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 27)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es el formato comprimido de la dirección IPv6 2002:0420:00c4:1008:0025:0190:0000:0990?', '', ARRAY['2002:42:10:c400::909','2002:420:c4:1008:25:190::990','2002:4200::25:1090:0:99','2002:42::25:1090:0:99']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 12.2.2
Para comprimir una dirección IPv6 se deben aplicar dos reglas fundamentales:

Omitir los ceros a la izquierda en cualquier hexteto (segmento de 16 bits). De este modo: 0420 pasa a ser 420, 00c4 se convierte en c4, 0025 queda como 25, 0190 pasa a ser 190 y 0990 se reduce a 990. Los ceros a la derecha no se eliminan.
Utilizar los dos puntos dobles (::) para reemplazar una cadena contigua de uno o más hextetos compuestos exclusivamente por ceros. En esta dirección, el séptimo hexteto es 0000, por lo que se comprime usando ::.

Aplicando estos pasos, la dirección original se reduce de forma correcta a 2002:420:c4:1008:25:190::990.', 'medium', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 28)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un usuario emite un comando ping fe 80:65 ab:dcc1::100 y recibe una respuesta que incluye un código 4 . ¿Qué representa este código?', '', ARRAY['Protocolo inalcanzable','Host fuera de alcance','Red inalcanzable','Puerto inalcanzable']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 13.1.3
Cuando un dispositivo responde a un mensaje ICMPv6 con un mensaje de «Destino inalcanzable» (Tipo 1), utiliza diferentes valores de Código para detallar el motivo exacto del fallo. En el protocolo ICMPv6, los códigos se definen de la siguiente manera:

Código 0: No hay ruta hacia el destino (Red inalcanzable).
Código 1: Comunicación con el destino administrativamente prohibida.
Código 3: Dirección e IP de destino inalcanzable (Host fuera de alcance).
Código 4: Puerto inalcanzable.

Por lo tanto, el código 4 le indica específicamente al emisor que el paquete llegó al host de destino, pero la capa de transporte (TCP/UDP) no encontró ninguna aplicación o servicio escuchando en el puerto especificado.', 'medium', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 29)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuántos bits se deben tomar prestados de la porción de host de una dirección para admitir un router con cinco redes conectadas?', '', ARRAY['Dos','Cuatro','Cinco','Tres']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 11.5.2

Cada red que se conecta directamente a la interfaz de un router requiere su propia subred. La fórmula 2 n , en la que “n” es el número de bits que se toman prestados, se utiliza para calcular la cantidad de subredes disponibles cuando se toma prestado un número específico de bits.', 'medium', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 30)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué tres direcciones son direcciones públicas válidas? (Escoja tres opciones).', '', ARRAY['10.15.250.5','198.133.219.17','172.31.1.25','128.107.12.117','192.168.1.245','64.104.78.227']::text[], ARRAY['','','','','','']::text[], 1, ARRAY[1,3,5]::int[], 'Tema 11.3.1

Los rangos de direcciones IPv4 privadas son los siguientes:

10.0.0.0 – 10.255.255.255

172.16.0.0 – 172.31.255.255

192.168.0.0 – 192.168.255.255', 'hard', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 31)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Una compañía tiene la dirección de red 192.168.1.64 con la máscara de subred 255.255.255.192. La compañía desea crear dos subredes que contengan 10 hosts y 18 hosts, respectivamente. ¿Cuáles son las dos redes con las que se lograría eso? (Elija dos).', '', ARRAY['192.168.1.64/27','192.168.1.96/28','192.168.1.16/28','192.168.1.192/28','192.168.1.128/27']::text[], ARRAY['','','','','']::text[], 0, ARRAY[0,1]::int[], 'Tema 11.8.3

La subred 192.168.1.64 /27 tiene 5 bits asignados a direcciones de host, por lo que admite 32 direcciones, pero solo 30 direcciones IP de host válidas. La subred 192.168.1.96/28 tiene 4 bits para direcciones de host y admite 16 direcciones, pero solo 14 direcciones IP de host válidas.', 'hard', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 32)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un administrador de red recibió el prefijo IPv6 2001:DB8::/48 para realizar la división en subredes. Suponiendo que el administrador no realiza la división en subredes en la porción de ID de interfaz del espacio de direcciones, ¿cuántas subredes puede crear a partir del prefijo /48?', '', ARRAY['4096','65 536','256','16']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 12.8.1

Con un prefijo de red de 48, habrá 16 bits disponibles para la división en subredes, ya que la ID de interfaz comienza en el bit 64. Un total de 16 bits tiene como resultado 65 536 subredes.', 'medium', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 33)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Dado el prefijo de dirección IPv6 2001:db8::/48, ¿cuál es la última subred que se crea si se cambia el prefijo de subred a /52?', '', ARRAY['2001:db8:0:8000::/52','2001:db8:0:f000::/52','2001:db8:0:f::/52','2001:db8:0:f00::/52']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 12.8.1

El prefijo 2001:db8::/48 tiene 48 bits de red. Si establecemos subredes en una /52, moveremos los cuatro bits del límite de red hacia la derecha y crearemos 16 subredes. La primera subred es 2001:db8::/52; la última subred es 2001:db8:0:f000::/52.', 'medium', 24, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 34)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un dispositivo con IPv6 habilitado envía un paquete de datos con la dirección de destino FF02::1. ¿Cuál es el destino de este paquete?', '', ARRAY['Todos los dispositivos con IPv6 habilitado en el enlace local o en la red','El único dispositivo IPv6 en el enlace que se configuró únicamente con esta dirección','Solo los routers configurados con IPv6','Solo los servidores DHCP IPv6']::text[], ARRAY['','','','']::text[], 0, ARRAY[0]::int[], 'Tema 12.8.2

Esta dirección es una de las direcciones IPv6 de multidifusión asignadas. Los paquetes dirigidos a FF02::1 son para todos los dispositivos IPv6 con habilitado en el enlace o la red. Los paquetes dirigidos a FF02::2 son para todos los routers IPv6 que existan en la red.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 35)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué protocolo admite la configuración automática de dirección sin estado (SLAAC) para permitir la asignación dinámica de direcciones IPv6 a un host?', '', ARRAY['UDP','ICMPv6','DHCPv6','ARPv6']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 12.5.1

SLAAC usa mensajes ICMPv6 al asignar una dirección IPv6 a un host de forma dinámica. DHCPv6 es un método alternativo para asignar direcciones IPv6 a un host. ARPv6 no existe. El protocolo de descubrimiento de vecinos (NDP) proporciona funcionalidad de ARP para las redes IPv6. UDP es el protocolo de la capa de transporte que usa DHCPv6.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 36)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Qué mensaje ICMPv6 se envía cuando el campo de límite de saltos IPv6 de un paquete se reduce a cero y el paquete no se puede reenviar?', '', ARRAY['Red inalcanzable','Tiempo excedido','Puerto inalcanzable','Protocolo inalcanzable']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 13.2.1

ICMPv6 utiliza el campo de límite de saltos en el encabezado del paquete IPv6 para determinar si el paquete ha caducado. Si el campo límite de salto ha alcanzado cero, un router enviará un mensaje de tiempo excedido hacia el origen indicando que el router no puede reenviar el paquete.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 37)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es el formato comprimido de la dirección IPv6 2001:0db8:0000:0000:0000:a0b0:0008:0001?', '', ARRAY['2001:db8:1::ab8:0:1','2001:db8:0:1::8:1','2001:db8::a0b0:8:1','2001:db8::ab8:1:0:1000']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 12.2.2

ICMPv6 utiliza el campo de límite de saltos en el encabezado del paquete IPv6 para determinar si el paquete ha caducado. Si el campo límite de salto ha alcanzado cero, un router enviará un mensaje de tiempo excedido hacia el origen indicando que el router no puede reenviar el paquete.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 38)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Consulte la ilustración. Un administrador debe enviar un mensaje a todos los integrantes de la red del router A. ¿Cuál de las siguientes es la dirección de difusión para la red 172.16.16.0/22?', 'https://examenredes.com/wp-content/uploads/2021/08/8-2021-09-28_062336.jpg', ARRAY['172.16.255.255','172.16.23.255','172.16.19.255','172.16.16.255','172.16.20.255']::text[], ARRAY['','','','','']::text[], 2, ARRAY[2]::int[], 'Tema 11.1.6

La red 172.16.16.0/22 tiene 22 bits en la porción de red y 10 bits en la porción de host. La conversión de la dirección de red al sistema binario da como resultado la máscara de subred 255.255.252.0. El intervalo de direcciones en esta red termina con la última dirección disponible antes de 172.16.20.0. Las direcciones de host válidas para esta red van de 172.16.16.1 a 172.16.19.254, por lo que la dirección de difusión es 172.16.19.255.', 'hard', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 39)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Una escuela secundaria de Nueva York (escuela A) utiliza tecnología de videoconferencia para establecer interacciones entre los estudiantes y otra escuela secundaria (escuela B) en Rusia. La videoconferencia se realiza entre dos terminales a través de Internet. El administrador de red de la escuela A configura el terminal con la dirección IP 209.165.201.10. El administrador envía una solicitud de dirección IP del terminal en la escuela B, y la respuesta es 192.168.25.10. Ninguna de las dos escuelas usa una VPN. El administrador sabe de inmediato que esta dirección IP no funcionará. ¿Por qué?', '', ARRAY['Es una dirección IP privada.','Existe un conflicto de direcciones IP.','Es una dirección link-local.','Es una dirección de loopback.']::text[], ARRAY['','','','']::text[], 0, ARRAY[0]::int[], 'Tema 11.3.1

La dirección IP 192.168.25.10 es una dirección IPv4 privada. Esta dirección no se enrutará por Internet, de modo que la escuela A no será capaz de llegar a la escuela B. Como la dirección es privada, puede utilizarse libremente en una red interna. En tanto no se asigne la misma dirección IP privada a dos dispositivos en una red interna, no habrá conflicto de IP. Los dispositivos a los que se les asigna una dirección IP privada deben utilizar NAT para comunicarse a través de Internet.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 40)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un host está transmitiendo un broadcast. ¿Qué host o hosts lo recibirán?', '', ARRAY['un host específico','el vecino más cercano de la misma red','todos los hosts de la misma subred','dispositivos de red directamente conectados']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 11.2.2

Se entrega un broadcast a cada host que tenga una dirección IP dentro de la misma red.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 41)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un usuario emite un comando ping 10.10.14.67 y recibe una respuesta que incluye un código 0 . ¿Qué representa este código?', '', ARRAY['Host fuera de alcance','Red inalcanzable','Protocolo inalcanzable','Puerto inalcanzable']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 13.1.3
En los mensajes ICMP de «Destino inalcanzable» (Tipo 3), el Código 0 significa específicamente Red inalcanzable. Esto indica que el router no tiene ninguna ruta configurada en su tabla de enrutamiento para llegar a la red de destino solicitada.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 42)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es el formato comprimido de la dirección IPv6 fe80:0000:0000:0000:0220:0b3f:f0e0:0029?', '', ARRAY['fe80:9ea0::2020:0:bf:e0:9290','fe80:9ea:0:2200::fe0:290','fe80:9ea0::2020::bf:e0:9290','fe80::220:b3f:f0e0:29']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 12.2.2

Omitir los ceros a la izquierda: En cada hexteto se eliminan los ceros iniciales. Por lo tanto, 0220 se convierte en 220, 0b3f en b3f y 0029 en 29.
Comprimir los ceros continuos con los dos puntos dobles (::): Los tres hextetos consecutivos compuestos por ceros (0000:0000:0000) se reemplazan por una única instancia de ::.

Al combinar ambos pasos, obtenemos la dirección abreviada correcta: fe80::220:b3f:f0e0:29.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 43)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es el propósito de los mensajes de ICMP?', '', ARRAY['Asegurar el envío de un paquete IP.','Proporcionar comentarios acerca de las transmisiones de paquetes IP.','Informar a los routers sobre cambios en la topología de la red.','Controlar el proceso de resolución de nombre de dominio a dirección IP']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 13.1.1

El propósito de los mensajes de ICMP es proporcionar comentarios sobre los problemas relacionados con el procesamiento de paquetes IP.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 44)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es el formato comprimido de la dirección IPv6 fe80:09ea:0000:2200:0000:0000:0fe0:0290?', '', ARRAY['fe80:9:20::b000:290','fe80:9ea0::2020:0:bf:e0:9290','fe80:9ea:0:2200::fe0:290','fe80:9ea0::2020::bf:e0:9290']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 12.2.2

Omitir los ceros a la izquierda: Se eliminan los ceros iniciales de cada grupo de 16 bits (hexteto). Así, 09ea se convierte en 9ea, 0000 pasa a ser 0, 0fe0 se reduce a fe0 y 0290 queda como 290. (Nota: Los ceros a la derecha, como los de 2200, no se pueden quitar).
Comprimir con los dos puntos dobles (::): Esta regla permite reemplazar la cadena más larga y continua de ceros por un ::. En esta dirección tenemos dos bloques de ceros: un solo 0000 en el tercer hexteto y dos 0000:0000 consecutivos en el quinto y sexto hexteto. Se deben comprimir los dos consecutivos, transformándolos en ::.

Uniendo ambos pasos, la estructura resultante es fe80:9ea:0:2200::fe0:290.', 'medium', 25, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 45)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un host está transmitiendo un unicast. ¿Qué host o hosts lo recibirán?', '', ARRAY['un grupo de hosts especialmente definido','todos los hosts en Internet','un host específico','el vecino más cercano de la misma red']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 11.2.1
Una transmisión de unidifusión (unicast) es un tipo de comunicación punto a punto en la que los datos se envían desde un único host de origen hacia una única dirección IP de destino específica. A diferencia del broadcast (que se envía a todos los hosts de la subred) o del multicast (que se envía a un grupo selecto), un paquete unicast está destinado a un solo dispositivo en la red.', 'medium', 26, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 46)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un usuario ejecuta un traceroute a través de IPv6. ¿En qué momento dejaría de reenviar el paquete un router que se encuentra en la ruta hacia el dispositivo de destino?', '', ARRAY['Cuando el host responde con un mensaje de respuesta de eco ICMP','cuando el valor del campo Límite de saltos alcanza cero','cuando el valor del campo Límite de saltos alcanza 255','Cuando el router recibe un mensaje de ICMP de tiempo excedido']::text[], ARRAY['','','','']::text[], 1, ARRAY[1]::int[], 'Tema 13.2.1

Cuando se realiza un traceroute, el valor del campo Límite de saltos de un paquete IPv6 determina cuántos saltos entre routers puede dar el paquete. Una vez que el campo Límite de saltos alcanza un valor de cero, ya no se puede reenviar y el router receptor descartará el paquete.', 'medium', 26, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 47)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un usuario emite un comando ping fe 80:65 ab:dcc1::100 y recibe una respuesta que incluye un código 3 . ¿Qué representa este código?', '', ARRAY['No se puede alcanzar la dirección','más allá del alcance de la dirección de origen','comunicación con el destino prohibido administrativamente','no hay ruta para el destino.']::text[], ARRAY['','','','']::text[], 0, ARRAY[0]::int[], 'Tema 13.1.3
En los mensajes ICMPv6 de «Destino inalcanzable» (Tipo 1), los valores del campo Código especifican el motivo exacto por el cual no se pudo entregar el paquete. Las definiciones normativas son las siguientes:

Código 0: No hay ruta para el destino.
Código 1: Comunicación con el destino prohibida administrativamente.
Código 2: Más allá del alcance de la dirección de origen.
Código 3: No se puede alcanzar la dirección (la dirección de destino no está disponible en el enlace local o no se puede resolver).', 'medium', 26, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 48)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es el formato comprimido de la dirección IPv6 2002:0042:0010:c400:0000:0000:0000:0909?', '', ARRAY['2002:4200::25:1090:0:99','2002:420:c4:1008:25:190::990','2002:42:10:c400::909','2002:42::25:1090:0:99']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 12.2.2

Omitir los ceros a la izquierda: Se eliminan los ceros iniciales de cada grupo de 16 bits (hexteto). De este modo, 0042 se reduce a 42, 0010 pasa a ser 10 y 0909 se convierte en 909. Los ceros que no están a la izquierda (como los de c400) se mantienen intactos.
Comprimir con los dos puntos dobles (::): La cadena continua de tres bloques consecutivos de ceros (0000:0000:0000) se reemplaza por completo con una única instancia de ::.

Uniendo ambas reglas, la dirección se comprime correctamente como 2002:42:10:c400::909.', 'medium', 26, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 49)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un usuario emite un comando ping 2001:db8:face:39::10 y recibe una respuesta que incluye un código 2 . ¿Qué representa este código?', '', ARRAY['comunicación con el destino prohibido administrativamente','no hay ruta para el destino.','más allá del alcance de la dirección de origen','No se puede alcanzar la dirección']::text[], ARRAY['','','','']::text[], 2, ARRAY[2]::int[], 'Tema 13.1.3
En los mensajes ICMPv6 de «Destino inalcanzable» (Tipo 1), el campo Código detalla la razón exacta de la falla en la entrega del paquete. Los códigos estándar se clasifican de la siguiente manera:

Código 0: No hay ruta para el destino.
Código 1: Comunicación con el destino prohibida administrativamente.
Código 2: Más allá del alcance de la dirección de origen. Esto significa que el alcance de la dirección IP del emisor es demasiado limitado (por ejemplo, una dirección link-local) para comunicarse con la dirección IP de destino (que podría ser una dirección de unidifusión global).
Código 3: No se puede alcanzar la dirección.', 'medium', 26, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 50)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es la dirección IP de origen que utiliza un router de forma predeterminada cuando emite el comando traceroute ?', '', ARRAY['La dirección IP más baja que se configuró en el router','Una dirección IP de loopback','La dirección IP más alta que se configuró en el router','La dirección IP de la interfaz saliente']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 13.3.1

Cuando envía un mensaje de solicitud de eco, el router usará la dirección IP de la interfaz de salida como la dirección IP de origen. Este comportamiento predeterminado se puede cambiar si se hace un ping extendido y se especifica una dirección IP de origen específica.', 'medium', 26, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 51)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'Un usuario emite un comando ping 192.135.250.103 y recibe una respuesta que incluye un código 1 . ¿Qué representa este código?', '', ARRAY['Host fuera de alcance','Protocolo inalcanzable','Red inalcanzable','Puerto inalcanzable']::text[], ARRAY['','','','']::text[], 0, ARRAY[0]::int[], 'Tema 13.1.3
En los mensajes ICMPv4 de «Destino inalcanzable» (Tipo 3), el campo Código identifica el motivo exacto por el cual falló la entrega del paquete. Los códigos más comunes son:

Código 0: Red inalcanzable (el router no tiene una ruta hacia la red de destino).
Código 1: Host fuera de alcance / Host inalcanzable. Esto significa que el paquete llegó al router local que atiende a la red de destino, pero el host físico de destino no respondió en ese segmento (por ejemplo, está apagado o no se puede resolver mediante ARP).
Código 2: Protocolo inalcanzable.
Código 3: Puerto inalcanzable.', 'medium', 26, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 52)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', '¿Cuál es el formato comprimido de la dirección IPv6 2001:0db8:0000:0000:0ab8:0001:0000:1000?', '', ARRAY['2001:db8:0:1::8:1','2001:db8:1::ab8:0:1','2001:db8::a0b0:8:1','2001:db8::ab8:1:0:1000']::text[], ARRAY['','','','']::text[], 3, ARRAY[3]::int[], 'Tema 12.2.2

Omitir los ceros a la izquierda: Eliminamos los ceros iniciales de cada hexteto. De esta forma, 0db8 pasa a ser db8, 0ab8 se reduce a ab8, 0001 pasa a ser 1 y los bloques 0000 se reducen a un solo 0. (Nota: Los ceros finales, como los de 1000, no se pueden eliminar).
Comprimir con los dos puntos dobles (::): Reemplazamos la cadena continua de ceros más larga por ::. En esta dirección tenemos dos secuencias de ceros: una de dos bloques (0000:0000) en las posiciones 3 y 4, y otra de un solo bloque (0000) en la posición 7. Al elegir la secuencia más larga (la de dos bloques), esta se convierte en ::. El cero de la posición 7 se queda visible como un único 0.

Combinando ambas reglas, obtenemos la dirección abreviada correcta: 2001:db8::ab8:1:0:1000.', 'medium', 26, '11111111-1111-4111-8111-000000000004'),
  ('Q' || lpad((base_qid + 53)::text, 3, '0'), 'Módulos 11 - 13', 'Direccionamiento IP', 'A host is transmitting a multicast. ¿Qué host o hosts lo recibirán?', '', ARRAY['un grupo de hosts especialmente definido','todos los hosts en Internet','dispositivos de red directamente conectados','un host específico']::text[], ARRAY['','','','']::text[], 0, ARRAY[0]::int[], 'Tema 11.2.3
La transmisión de multidifusión (multicast) permite que un host de origen envíe un único paquete de datos a un grupo selecto de destinos simultáneamente. Para recibir este tráfico, los hosts deben unirse o suscribirse de forma explícita a una dirección IP de grupo multicast específica (rango 224.0.0.0 a 239.255.255.255 en IPv4). Los dispositivos que no pertenecen a este grupo ignoran el paquete, optimizando el ancho de banda de la red.', 'medium', 26, '11111111-1111-4111-8111-000000000004');
END $$;
