import React from 'react';

export default function ComunidadPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-6 md:p-12 text-center max-w-3xl mx-auto">
      {/* Icon or Graphic with glowing Discord branding */}
      <div className="relative mb-8 group">
        <div className="absolute -inset-2 bg-[#5865F2]/30 rounded-full blur-xl group-hover:bg-[#5865F2]/50 transition-all duration-500"></div>
        <div className="relative w-24 h-24 bg-[#101218] border border-[#5865F2]/40 rounded-3xl flex items-center justify-center shadow-2xl">
          <svg className="w-12 h-12 text-[#5865F2] fill-current" viewBox="0 0 24 24">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
          </svg>
        </div>
      </div>
      
      {/* Content */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-full text-xs font-bold text-[#5865F2] uppercase tracking-wider mb-4">
        Servidor Oficial
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
        Comunidad Oficial de <span className="text-accent">Chituk</span>
      </h1>
      <p className="text-neutral-400 text-base md:text-lg mb-8 leading-relaxed max-w-xl">
        Únete a nuestro Discord oficial. Discute sobre scripts, ejecutores, obtén soporte directo de los administradores y la manada, comparte tus creaciones y entérate de las últimas actualizaciones antes que nadie.
      </p>

      {/* Highlights / Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mb-9 text-left">
        <div className="p-3.5 bg-card border border-neutral-800 rounded-xl">
          <div className="text-accent font-bold text-sm mb-0.5">Soporte 24/7</div>
          <div className="text-neutral-400 text-xs">Ayuda para configurar ejecutores y solucionar errores.</div>
        </div>
        <div className="p-3.5 bg-card border border-neutral-800 rounded-xl">
          <div className="text-[#00ADEF] font-bold text-sm mb-0.5">Updates en Vivo</div>
          <div className="text-neutral-400 text-xs">Notificaciones cuando Roblox actualiza sus versiones.</div>
        </div>
        <div className="p-3.5 bg-card border border-neutral-800 rounded-xl">
          <div className="text-[#22C55E] font-bold text-sm mb-0.5">Scripts Exclusivos</div>
          <div className="text-neutral-400 text-xs">Canales dedicados a compartir y testear nuevos scripts.</div>
        </div>
      </div>
      
      {/* Call to Action */}
      <a 
        href="https://discord.gg/mdvByagDr3" 
        target="_blank" 
        rel="noopener noreferrer"
        className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-lg rounded-xl hover:-translate-y-1 transition-all shadow-xl shadow-[#5865F2]/25 flex items-center gap-3 cursor-pointer group active:scale-95"
      >
        <svg className="w-6 h-6 fill-current group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
        </svg>
        Unirse a Discord Oficial
      </a>
      
      <div className="mt-12 border-t border-neutral-800/50 pt-6 w-full max-w-md">
        <p className="text-neutral-500 text-xs">
          Enlace permanente:{' '}
          <span className="font-mono text-neutral-400 select-all">discord.gg/mdvByagDr3</span>
        </p>
      </div>
    </div>
  );
}
