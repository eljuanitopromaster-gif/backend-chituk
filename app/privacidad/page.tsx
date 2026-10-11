import React from 'react';

export default function PrivacidadPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-white mb-6">Política de Privacidad</h1>
      
      <div className="bg-card border border-neutral-800 rounded-xl p-8 text-neutral-300 leading-relaxed space-y-6">
        <section>
          <h2 className="text-xl font-bold text-accent mb-3">1. Recopilación de Información</h2>
          <p>
            En Chituk, recolectamos información básica necesaria para mantener tu cuenta y ofrecerte una experiencia
            personalizada. Esto incluye tu dirección de correo electrónico, nombre de usuario y los scripts 
            que decides guardar o publicar en nuestra plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-3">2. Uso de la Información</h2>
          <p>
            Utilizamos tu información exclusivamente para gestionar tu acceso, mostrar tus interacciones 
            (como 'likes' y favoritos) y mejorar la calidad de nuestra plataforma. No vendemos ni compartimos
            tu información personal con terceros de forma maliciosa o con fines comerciales ajenos a Chituk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-3">3. Seguridad de los Datos</h2>
          <p>
            Tu información está protegida utilizando tecnologías de seguridad estándar de la industria.
            Sin embargo, te recomendamos utilizar contraseñas seguras y no compartir tus credenciales con nadie.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-accent mb-3">4. Cookies y Almacenamiento Local</h2>
          <p>
            Utilizamos almacenamiento local (Local Storage) y cookies estrictamente necesarias para 
            mantener tu sesión activa y recordar tus preferencias (como el modo de visualización o 
            el estado de tus notificaciones). No utilizamos rastreadores de publicidad invasivos.
          </p>
        </section>
      </div>
    </div>
  );
}
