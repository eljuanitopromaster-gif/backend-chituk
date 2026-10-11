import React from 'react';

export default function TerminosPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-white mb-6">Términos de Servicio</h1>
      
      <div className="bg-card border border-neutral-800 rounded-xl p-8 text-neutral-300 leading-relaxed space-y-6">
        <section>
          <h2 className="text-xl font-bold text-accent mb-3">1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar Chituk, aceptas estar sujeto a estos términos de servicio. 
            Nuestra plataforma es una herramienta educativa y un repositorio creado por la comunidad. 
            El uso que le des al contenido de esta plataforma es bajo tu propio riesgo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-3">2. Uso Responsable</h2>
          <p>
            No nos hacemos responsables por baneos, suspensiones de cuenta o cualquier otra penalización
            que pueda surgir del uso de scripts de terceros en plataformas como Roblox. 
            El código compartido aquí tiene propósitos de aprendizaje y desarrollo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-3">3. Publicación de Contenido</h2>
          <p>
            Al publicar un script, declaras que tienes los derechos para compartirlo. 
            Cualquier script que contenga malware, intente robar información o viole gravemente 
            la privacidad de los usuarios será eliminado de inmediato y la cuenta del autor será suspendida.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-3">4. Moderación</h2>
          <p>
            El equipo de los Silverbacks se reserva el derecho de eliminar, modificar o deshabilitar
            cualquier contenido que consideremos inapropiado o perjudicial para la manada.
          </p>
        </section>
      </div>
    </div>
  );
}
