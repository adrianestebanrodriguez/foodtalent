import { ChefHat } from "lucide-react";
import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-bold text-white mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            FoodTalent
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Términos y Condiciones de Uso</h1>
          <p className="text-slate-400 text-sm">Última actualización: Julio 2026</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-10 text-slate-300 text-sm leading-relaxed space-y-8">
          <Section title="1. Objeto">
            <p>Los presentes Términos y Condiciones (en adelante, los &ldquo;Términos&rdquo;) regulan el acceso y uso de la plataforma FoodTalent (en adelante, &ldquo;la Plataforma&rdquo; o &ldquo;FoodTalent&rdquo;), operada por Alquimia Foods (en adelante, &ldquo;el Operador&rdquo;), cuyo propósito es conectar a empresas del sector de alimentos (en adelante, &ldquo;Empresarios&rdquo; o &ldquo;Clientes&rdquo;) con profesionales especializados en formulación de productos, procesos, asuntos regulatorios, productividad y operación de planta (en adelante, &ldquo;Profesionales&rdquo;), mediante un motor de búsqueda y recomendación asistido por inteligencia artificial.</p>
            <p>El uso de la Plataforma implica la aceptación plena e incondicional de estos Términos. Si el usuario no está de acuerdo con alguna de sus disposiciones, debe abstenerse de utilizar la Plataforma.</p>
          </Section>

          <Section title="2. Definiciones">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Plataforma:</strong> el sitio web, aplicación y demás medios digitales a través de los cuales FoodTalent presta sus servicios.</li>
              <li><strong>Empresario o Cliente:</strong> persona natural o jurídica que utiliza la Plataforma para identificar y contactar Profesionales que resuelvan una necesidad específica de su empresa.</li>
              <li><strong>Profesional:</strong> persona natural que se registra en la Plataforma ofreciendo sus servicios de consultoría o asesoría especializada en la industria de alimentos.</li>
              <li><strong>Perfil:</strong> conjunto de información registrada por el Profesional en la Plataforma, incluyendo experiencia, proyectos, certificaciones y disponibilidad.</li>
              <li><strong>Proyecto gestionado:</strong> todo servicio, consultoría o trabajo que se concreta entre un Empresario y un Profesional como resultado directo o indirecto del uso de la Plataforma.</li>
              <li><strong>Comisión:</strong> valor que FoodTalent cobra por la intermediación y gestión de un Proyecto gestionado, conforme a lo establecido en la Sección 8.</li>
              <li><strong>Datos personales:</strong> cualquier información vinculada o que pueda asociarse a una persona natural determinada o determinable, en los términos de la Ley 1581 de 2012 y sus decretos reglamentarios.</li>
            </ul>
          </Section>

          <Section title="3. Aceptación de los términos y capacidad legal">
            <p>El acceso y registro en la Plataforma está reservado a personas naturales mayores de edad (18 años o más) con capacidad legal para contratar, y a personas jurídicas debidamente representadas. El Operador se reserva el derecho de solicitar documentos que acrediten dicha capacidad y de suspender cuentas cuando existan dudas razonables al respecto.</p>
            <p>El registro en la Plataforma constituye la aceptación expresa de estos Términos, de la Política de Tratamiento de Datos Personales referida en la Sección 15, y de cualquier documento incorporado por referencia.</p>
          </Section>

          <Section title="4. Descripción del servicio y rol de FoodTalent">
            <p>FoodTalent actúa como intermediario tecnológico y comercial entre Empresarios y Profesionales del sector de alimentos. La Plataforma utiliza un motor de búsqueda asistido por inteligencia artificial que analiza la necesidad descrita por el Empresario y recomienda los perfiles profesionales más idóneos, con base en la información registrada en la base de datos propia de FoodTalent.</p>
            <p>FoodTalent no es una bolsa de empleo ni una agencia de contratación laboral. Su función se limita a la identificación, verificación preliminar, recomendación y gestión comercial del contacto entre las partes, en los términos descritos en la Sección 7.</p>
            <p>Las recomendaciones generadas por la Plataforma, incluyendo los porcentajes de compatibilidad o &ldquo;match&rdquo;, constituyen una orientación basada en el análisis de la información disponible y no representan una garantía de idoneidad, disponibilidad ni de resultados del Profesional recomendado.</p>
          </Section>

          <Section title="5. Registro y cuentas de usuario">
            <p>Para acceder a las funcionalidades de la Plataforma, los Profesionales deben crear una cuenta, suministrando información veraz, completa y actualizada. El usuario es responsable de la confidencialidad de sus credenciales de acceso y de toda actividad realizada desde su cuenta.</p>
            <p>El Operador podrá verificar, en cualquier momento, la veracidad de la información suministrada, y suspender o cancelar cuentas que contengan información falsa, inexacta o que no pueda ser corroborada.</p>
          </Section>

          <Section title="6. Perfiles profesionales y proceso de verificación">
            <p>Todo Profesional que se registre en la Plataforma acepta que, previo a la publicación o activación completa de su Perfil, FoodTalent realizará un proceso de verificación que incluye, entre otros:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Contacto directo con el Profesional para corroborar la información registrada (experiencia, formación, proyectos y certificaciones).</li>
              <li>Verificación de referencias laborales o comerciales suministradas por el Profesional.</li>
              <li>Revisión de la coherencia entre la información registrada y fuentes públicas disponibles (por ejemplo, contenido técnico publicado por el Profesional).</li>
            </ul>
            <p>La verificación no constituye una certificación profesional, académica ni gremial, y no exime al Profesional de su responsabilidad por la veracidad de la información registrada. FoodTalent podrá identificar el estado de verificación del Perfil mediante etiquetas visibles para los Empresarios (por ejemplo, &ldquo;Perfil verificado&rdquo; o &ldquo;Pendiente de verificación&rdquo;).</p>
            <p>FoodTalent se reserva el derecho de negar, suspender o retirar la publicación de un Perfil cuando la información no pueda ser corroborada satisfactoriamente.</p>
          </Section>

          <Section title="7. Intermediación comercial y contacto exclusivo a través de FoodTalent">
            <p>Con el fin de garantizar la calidad del servicio, la trazabilidad de los proyectos y el cobro correspondiente de comisiones, las Partes aceptan expresamente que:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Todo contacto inicial entre un Empresario y un Profesional identificado a través de la Plataforma se realiza por intermedio de FoodTalent, y no de forma directa entre las partes.</li>
              <li>FoodTalent gestiona la presentación de las partes, así como los términos generales de negociación del proyecto (alcance, condiciones comerciales preliminares y coordinación logística), sin perjuicio de que las condiciones específicas del proyecto se definan entre Empresario y Profesional bajo la coordinación de FoodTalent.</li>
              <li>Ninguna de las partes podrá utilizar la información obtenida a través de la Plataforma para contactar, contratar o subcontratar directamente a la contraparte eludiendo la intermediación de FoodTalent y el pago de la Comisión correspondiente (cláusula de no circunvención, Sección 9).</li>
            </ul>
          </Section>

          <Section title="8. Comisiones, tarifas y condiciones económicas">
            <SubSection title="8.1 Condiciones para Profesionales">
              <ul className="list-disc pl-5 space-y-1">
                <li>El registro de Profesionales en la Plataforma durante el primer año es gratuito.</li>
                <li>A partir del segundo año de registro, la permanencia en la Plataforma tiene un costo anual de USD 200 (doscientos dólares americanos) o su equivalente en pesos colombianos según la tasa de cambio representativa del mercado vigente al momento del pago, salvo que FoodTalent determine y comunique una tarifa distinta. Los costos de permanencia en la Plataforma pueden cambiar según condiciones de mercado y serán comunicadas a los Profesionales por escrito para su aceptación o rechazo.</li>
                <li>Por cada Proyecto gestionado a través de la Plataforma, FoodTalent cobrará al Profesional una comisión equivalente al 20% del valor total acordado por el proyecto.</li>
                <li>La comisión se causa sobre el valor bruto acordado entre las partes para el proyecto, y su forma de facturación y momento de pago serán informados por FoodTalent al inicio de cada proyecto gestionado.</li>
              </ul>
            </SubSection>
            <SubSection title="8.2 Condiciones para Empresarios / Clientes">
              <ul className="list-disc pl-5 space-y-1">
                <li>El acceso a la búsqueda y recomendación de perfiles profesionales en la Plataforma no tiene costo para el Empresario.</li>
                <li>El contacto con los Profesionales recomendados, así como la gestión y negociación de los términos del proyecto, se adelanta directamente con FoodTalent.</li>
                <li>Por cada proyecto adelantado con FoodTalent, se cobrará al Empresario una comisión equivalente al 20% del valor total del proyecto, salvo que se acuerde una condición distinta por escrito para un caso particular.</li>
              </ul>
            </SubSection>
            <SubSection title="8.3 Forma y condiciones de pago">
              <p>Los valores correspondientes a comisiones y a la tarifa anual de permanencia serán facturados por FoodTalent conforme a la normativa tributaria vigente aplicable. Los impuestos, retenciones o gravámenes que apliquen sobre dichos pagos serán asumidos por cada parte conforme a la ley aplicable en su jurisdicción, salvo pacto expreso en contrario.</p>
              <p>FoodTalent se reserva el derecho de modificar las tarifas y porcentajes de comisión, previa comunicación a los usuarios con una antelación razonable, sin que dicha modificación afecte los proyectos ya iniciados bajo condiciones previamente acordadas.</p>
            </SubSection>
          </Section>

          <Section title="9. Cláusula de no circunvención">
            <p>Empresarios y Profesionales se obligan a no eludir la intermediación de FoodTalent para la contratación de proyectos derivados directa o indirectamente del contacto facilitado por la Plataforma. Esta obligación se extiende por un período de doce (12) meses contados desde la fecha del último contacto gestionado por FoodTalent entre las partes.</p>
            <p>El incumplimiento de esta cláusula faculta a FoodTalent para exigir el pago de la comisión que hubiera correspondido conforme a la Sección 8, sin perjuicio de las demás acciones legales a que haya lugar y de las medidas de suspensión o retiro previstas en la Sección 12.</p>
          </Section>

          <Section title="10. Obligaciones de los Profesionales">
            <ul className="list-disc pl-5 space-y-1">
              <li>Suministrar información veraz, completa y verificable sobre su experiencia, formación, certificaciones y proyectos realizados.</li>
              <li>Actualizar oportunamente su Perfil cuando la información registrada cambie de manera sustancial.</li>
              <li>Cumplir con los términos, plazos y condiciones acordados en cada Proyecto gestionado a través de FoodTalent.</li>
              <li>Pagar oportunamente la Comisión correspondiente a cada proyecto y, cuando aplique, la tarifa anual de permanencia en la Plataforma.</li>
              <li>Abstenerse de incurrir en las conductas descritas en la Sección 12 como causales de penalización o retiro del Perfil.</li>
            </ul>
          </Section>

          <Section title="11. Obligaciones de los Empresarios / Clientes">
            <ul className="list-disc pl-5 space-y-1">
              <li>Suministrar información veraz sobre la necesidad, alcance y condiciones del proyecto a gestionar.</li>
              <li>Adelantar todo contacto con los Profesionales recomendados a través de FoodTalent, conforme a la Sección 7.</li>
              <li>Cumplir con las condiciones comerciales acordadas para cada proyecto, incluyendo el pago de la Comisión correspondiente a FoodTalent.</li>
              <li>Hacer uso adecuado de la información de los Profesionales a la que tenga acceso, absteniéndose de utilizarla para fines distintos a la evaluación y contratación del proyecto gestionado.</li>
            </ul>
          </Section>

          <Section title="12. Suspensión, penalización y retiro de perfiles">
            <p>FoodTalent podrá suspender temporalmente o retirar de forma definitiva el Perfil de un Profesional, así como restringir el acceso de un Empresario a la Plataforma, cuando se presente alguna de las siguientes situaciones:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Incumplimiento comprobado de los términos, plazos o condiciones acordadas en un Proyecto gestionado.</li>
              <li>Suministro de información falsa, inexacta o que no pueda ser corroborada durante el proceso de verificación o con posterioridad al registro.</li>
              <li>Elusión de la intermediación de FoodTalent en contravención de la cláusula de no circunvención (Sección 9).</li>
              <li>Conductas que afecten la reputación de la Plataforma, de otros usuarios o que constituyan una infracción a la normativa aplicable.</li>
              <li>Reiteradas calificaciones negativas debidamente documentadas por parte de Empresarios o Profesionales.</li>
            </ul>
            <p>Previo al retiro definitivo de un Perfil, y salvo en casos de gravedad manifiesta, FoodTalent procurará informar al Profesional o Empresario involucrado, otorgando la oportunidad de presentar sus descargos a través del correo electrónico oficial indicado en la Sección 24. La decisión final sobre la suspensión o retiro corresponde a FoodTalent.</p>
            <p>El retiro de un Perfil no exime al Profesional o Empresario del cumplimiento de las obligaciones económicas ya causadas al momento del retiro.</p>
          </Section>

          <Section title="13. Naturaleza de la relación entre las partes">
            <p>La vinculación de un Profesional a la Plataforma no genera relación laboral, de agencia, de representación ni de subordinación alguna con FoodTalent ni con los Empresarios que lo contraten. Los Profesionales prestan sus servicios de manera independiente y autónoma, siendo responsables por sus propias obligaciones fiscales, de seguridad social y demás que les correspondan conforme a la ley aplicable.</p>
            <p>FoodTalent no es parte del contrato de prestación de servicios que se celebre entre el Empresario y el Profesional para la ejecución del proyecto, y su responsabilidad se limita a la labor de intermediación, verificación preliminar y gestión comercial descrita en estos Términos.</p>
          </Section>

          <Section title="14. Propiedad intelectual y contenido">
            <p>La Plataforma, su software, diseño, marcas, logotipos y demás elementos distintivos son de propiedad de FoodTalent / Alquimia Foods y se encuentran protegidos por la normativa de propiedad intelectual aplicable. Se prohíbe su reproducción, distribución o uso no autorizado.</p>
            <p>El Profesional conserva la titularidad sobre la información y contenido que registra en su Perfil, y otorga a FoodTalent una licencia no exclusiva, gratuita y revocable para utilizar, mostrar y procesar dicha información con el único fin de operar la Plataforma y facilitar el proceso de búsqueda y recomendación, incluyendo su procesamiento mediante herramientas de inteligencia artificial.</p>
          </Section>

          <Section title="15. Tratamiento de datos personales y habeas data">
            <p>FoodTalent, a través de Alquimia Foods, actúa como responsable del tratamiento de los datos personales recolectados en la Plataforma, en cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 y demás normas que las modifiquen, adicionen o sustituyan, así como de las disposiciones de la Superintendencia de Industria y Comercio (SIC) como autoridad de protección de datos en Colombia.</p>

            <SubSection title="15.1 Datos recolectados">
              <p>La Plataforma recolecta, entre otros, datos de identificación (nombre, correo electrónico, teléfono), datos profesionales (experiencia, formación, certificaciones, proyectos), y datos de uso de la Plataforma. En el caso de Profesionales cuya información sea identificada inicialmente a través de fuentes públicas (por ejemplo, contenido publicado en plataformas de video), dicha información solo será incorporada de forma completa al Perfil una vez el Profesional otorgue su consentimiento expreso mediante el registro voluntario en la Plataforma.</p>
            </SubSection>

            <SubSection title="15.2 Finalidades del tratamiento">
              <ul className="list-disc pl-5 space-y-1">
                <li>Operar el motor de búsqueda y recomendación de perfiles profesionales.</li>
                <li>Verificar la información registrada por los Profesionales.</li>
                <li>Gestionar el contacto comercial entre Empresarios y Profesionales.</li>
                <li>Facturar y recaudar las comisiones y tarifas correspondientes.</li>
                <li>Enviar comunicaciones relacionadas con el servicio, incluyendo invitaciones a profesionales identificados a través de fuentes públicas.</li>
                <li>Cumplir con obligaciones legales, contables y tributarias.</li>
              </ul>
            </SubSection>

            <SubSection title="15.3 Derechos de los titulares (derechos ARCO)">
              <p>Todo titular de datos personales tiene derecho a conocer, actualizar, rectificar y suprimir su información, así como a revocar el consentimiento otorgado para su tratamiento, en los términos del artículo 8 de la Ley 1581 de 2012. Estas solicitudes podrán presentarse a través del correo electrónico oficial <a href="mailto:alquimiafoods@proton.me" className="text-emerald-400 hover:underline">alquimiafoods@proton.me</a>, indicando el derecho que se desea ejercer y la información necesaria para su identificación.</p>
              <p>FoodTalent dará respuesta a las consultas dentro de los diez (10) días hábiles siguientes a su recepción, y a los reclamos dentro de los quince (15) días hábiles siguientes, prorrogables conforme a lo establecido en la ley.</p>
            </SubSection>

            <SubSection title="15.4 Transferencia y transmisión de datos">
              <p>Para la operación del motor de búsqueda y recomendación, la Plataforma podrá transmitir datos personales a proveedores tecnológicos que prestan servicios de procesamiento de información e inteligencia artificial, incluyendo proveedores con infraestructura fuera del territorio colombiano. Dicha transmisión se realizará garantizando niveles adecuados de protección de datos, conforme a lo dispuesto en la normativa aplicable, y únicamente para las finalidades aquí descritas.</p>
            </SubSection>

            <SubSection title="15.5 Conservación de la información">
              <p>Los datos personales se conservarán mientras sean necesarios para las finalidades del tratamiento y mientras exista una relación contractual o legal que lo justifique. En caso de retiro de un Perfil, FoodTalent podrá conservar la información necesaria para atender obligaciones legales, contables o para la defensa de sus derechos, y eliminará o anonimizará el resto de la información conforme a su política interna de retención.</p>
            </SubSection>

            <SubSection title="15.6 Menores de edad">
              <p>La Plataforma no está dirigida a menores de edad y no recolecta intencionalmente datos personales de menores de 18 años.</p>
            </SubSection>
          </Section>

          <Section title="16. Confidencialidad">
            <p>Las partes se obligan a mantener la confidencialidad de la información no pública a la que tengan acceso con ocasión del uso de la Plataforma o de la ejecución de un Proyecto gestionado, y a no divulgarla a terceros sin autorización previa, salvo requerimiento de autoridad competente.</p>
          </Section>

          <Section title="17. Exclusión de garantías y limitación de responsabilidad">
            <p>FoodTalent realiza esfuerzos razonables para verificar la información registrada por los Profesionales; sin embargo, no garantiza la idoneidad absoluta, disponibilidad continua ni el resultado específico de los proyectos ejecutados por los Profesionales recomendados. La decisión final de contratación corresponde exclusivamente al Empresario.</p>
            <p>En la máxima medida permitida por la ley aplicable, FoodTalent no será responsable por daños indirectos, lucro cesante o perjuicios derivados de la ejecución, incumplimiento o resultado de un proyecto acordado entre Empresario y Profesional, cuya responsabilidad corresponde exclusivamente a las partes contratantes del respectivo proyecto.</p>
          </Section>

          <Section title="18. Fuerza mayor">
            <p>Ninguna de las partes será responsable por el incumplimiento de sus obligaciones cuando este se derive de circunstancias de fuerza mayor o caso fortuito, entendidas conforme a la legislación colombiana.</p>
          </Section>

          <Section title="19. Modificaciones a los términos">
            <p>FoodTalent podrá modificar estos Términos en cualquier momento. Las modificaciones serán informadas a los usuarios a través de la Plataforma o del correo electrónico registrado, y entrarán en vigencia a partir de su publicación, salvo que se indique una fecha distinta. El uso continuado de la Plataforma tras la publicación de los cambios constituye aceptación de los mismos.</p>
          </Section>

          <Section title="20. Vigencia y terminación">
            <p>Estos Términos rigen desde el momento del registro del usuario y durante todo el tiempo en que mantenga una cuenta activa en la Plataforma. Cualquiera de las partes podrá terminar la relación en cualquier momento, sin perjuicio del cumplimiento de las obligaciones económicas y demás compromisos causados con anterioridad a la terminación, incluyendo lo dispuesto en la cláusula de no circunvención (Sección 9).</p>
          </Section>

          <Section title="21. Cesión">
            <p>El usuario no podrá ceder los derechos y obligaciones derivados de estos Términos sin autorización previa y escrita de FoodTalent. FoodTalent podrá ceder estos Términos en el marco de procesos de reorganización empresarial, fusión o venta de la totalidad o parte de sus activos, previa notificación a los usuarios.</p>
          </Section>

          <Section title="22. Divisibilidad">
            <p>Si alguna disposición de estos Términos fuera declarada nula, inválida o inaplicable por autoridad competente, dicha disposición se entenderá separada del resto, sin afectar la validez y exigibilidad de las demás disposiciones.</p>
          </Section>

          <Section title="23. Ley aplicable y resolución de conflictos">
            <p>Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia derivada de su interpretación o ejecución que no pueda resolverse mediante arreglo directo entre las partes se someterá, en primera instancia, a un mecanismo de conciliación ante un centro de conciliación autorizado, y en su defecto, a la jurisdicción ordinaria colombiana competente.</p>
          </Section>

          <Section title="24. Notificaciones y canal oficial de comunicación">
            <p>Toda comunicación relacionada con la Plataforma, incluyendo solicitudes de soporte, ejercicio de derechos de habeas data, reclamos, descargos frente a procesos de suspensión o retiro de Perfil, y demás asuntos contractuales, deberá adelantarse a través del correo electrónico oficial:</p>
            <p className="text-emerald-400 font-semibold">alquimiafoods@proton.me</p>
            <p>Las comunicaciones enviadas a este correo se entenderán recibidas por FoodTalent para todos los efectos contractuales previstos en estos Términos.</p>
          </Section>

          <Section title="25. Acuerdo íntegro">
            <p>Estos Términos, junto con la Política de Tratamiento de Datos Personales y demás documentos incorporados por referencia, constituyen el acuerdo íntegro entre el usuario y FoodTalent respecto del uso de la Plataforma, y prevalecen sobre cualquier acuerdo o entendimiento previo, salvo pacto expreso y escrito en contrario.</p>
          </Section>

          <Section title="26. Aceptación">
            <p>Al registrarse y utilizar la Plataforma, el usuario declara haber leído, entendido y aceptado la totalidad de estos Términos y Condiciones.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
