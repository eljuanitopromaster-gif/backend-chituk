import React from 'react';

export default function TerminosPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-[10px] font-bold tracking-widest text-accent uppercase mb-1 block">Legal</span>
        <h1 className="text-3xl font-bold text-foreground">Términos de Servicio</h1>
      </div>
      
      <div className="bg-card border border-border-theme rounded-2xl p-8 text-foreground/90 leading-relaxed space-y-6 shadow-xl">
        <section>
          <h2 className="text-xl font-bold text-accent mb-2">1. Aceptación de los Términos</h2>
          <p className="text-sm text-muted leading-relaxed">
            Al acceder y utilizar Chituk, aceptas estar sujeto a estos términos de servicio. 
            Nuestra plataforma es una herramienta educativa y un repositorio creado por la comunidad. 
            El uso que le des al contenido de esta plataforma es bajo tu propio riesgo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-2">2. Uso Responsable</h2>
          <p className="text-sm text-muted leading-relaxed">
            No nos hacemos responsables por sanciones, baneos o cualquier otra penalización
            que pueda surgir del uso de scripts de terceros en plataformas como Roblox. 
            El código compartido aquí tiene propósitos de aprendizaje, investigación y desarrollo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-2">3. Publicación de Contenido</h2>
          <p className="text-sm text-muted leading-relaxed">
            Al publicar un script, declaras que tienes los derechos para compartirlo o que es de código abierto. 
            Cualquier script que contenga código malicioso, intente robar información o viole 
            la privacidad de los usuarios será eliminado de inmediato y la cuenta del autor será suspendida.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-2">4. Moderación</h2>
          <p className="text-sm text-muted leading-relaxed">
            El equipo de Chituk se reserva el derecho de revisar, aprobar, deshabilitar o eliminar 
            cualquier script o comentario que resulte inapropiado, inseguro o perjudicial para la comunidad.
          </p>
        </section>
      </div>
    </div>
  );
}
