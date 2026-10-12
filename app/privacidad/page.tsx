import React from 'react';

export default function PrivacidadPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-[10px] font-bold tracking-widest text-accent uppercase mb-1 block">Privacidad</span>
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidad</h1>
      </div>
      
      <div className="bg-card border border-border-theme rounded-2xl p-8 text-foreground/90 leading-relaxed space-y-6 shadow-xl">
        <section>
          <h2 className="text-xl font-bold text-accent mb-2">1. Recopilación de Información</h2>
          <p className="text-sm text-muted leading-relaxed">
            En Chituk, recolectamos información básica necesaria para mantener tu cuenta y ofrecerte una experiencia
            personalizada. Esto incluye tu dirección de correo electrónico, nombre de usuario y los scripts 
            que decides guardar o publicar en nuestra plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-2">2. Uso de la Información</h2>
          <p className="text-sm text-muted leading-relaxed">
            Utilizamos tu información exclusivamente para gestionar tu acceso, mostrar tus interacciones 
            (como 'likes', copias y favoritos) y mejorar la calidad de nuestra plataforma. No vendemos ni compartimos
            tu información personal con terceros de forma maliciosa o con fines comerciales ajenos a Chituk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-2">3. Seguridad de los Datos</h2>
          <p className="text-sm text-muted leading-relaxed">
            Tu información está protegida utilizando tecnologías de seguridad estándar de la industria.
            Sin embargo, te recomendamos utilizar contraseñas seguras y no compartir tus credenciales con nadie.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-2">4. Cookies y Almacenamiento Local</h2>
          <p className="text-sm text-muted leading-relaxed">
            Utilizamos almacenamiento local (Local Storage) y cookies estrictamente necesarias para 
            mantener tu sesión activa y recordar tus preferencias (como el tema de color seleccionado o 
            el estado de tus notificaciones). No utilizamos rastreadores invasivos de publicidad.
          </p>
        </section>
      </div>
    </div>
  );
}
