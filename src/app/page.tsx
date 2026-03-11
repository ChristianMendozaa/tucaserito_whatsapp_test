'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [status, setStatus] = useState<string>('Esperando...');

  useEffect(() => {
    // Configurar y cargar el SDK de Facebook
    (window as any).fbAsyncInit = function() {
      (window as any).FB.init({
        appId            : process.env.NEXT_PUBLIC_META_APP_ID, 
        autoLogAppEvents : true,
        xfbml            : true,
        version          : 'v21.0'
      });
      setIsSdkLoaded(true);
      setStatus('SDK cargado, listo para iniciar sesión.');
    };

    const script = document.createElement('script');
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const launchWhatsAppSignup = () => {
    if (!isSdkLoaded) {
      alert("El SDK de Facebook aún no ha cargado.");
      return;
    }

    setStatus("Abriendo ventana de Meta...");
    // Configuración específica para Embedded Signup de WhatsApp
    // Documentación: https://developers.facebook.com/docs/whatsapp/embedded-signup/
    
    // Meta FB.login API no soporta una función asíncrona ("async (response) =>") directamente como callback.
    // Usamos una función normal y manejamos lo asíncrono adentro.
    (window as any).FB.login((response: any) => {
      if (response.authResponse) {
        const code = response.authResponse.code;
        setStatus(`Autorizado en Meta. Enviando token temporal al servidor...`);
        
        // Creamos una función asíncrona interna y la ejecutamos
        const sendTokenToBackend = async () => {
            try {
               const dummyClientId = "CLIENT_001";
               const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
               
               const res = await fetch(`${apiUrl}/api/auth/oauth_callback?client_id=${dummyClientId}&token_code=${code}&phone_number_id=dummy_phone&waba_id=dummy_waba`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json'
                 }
               });
           
               if (res.ok) {
                   const data = await res.json();
                   setStatus(`¡Éxito! WhatsApp vinculado correctamente a tu cuenta.`);
                   console.log("Respuesta del servidor:", data);
               } else {
                   const errorData = await res.json();
                   setStatus(`Error al vincular: ${errorData.detail || 'Fallo desconocido'}`);
               }
            } catch (error) {
                console.error("Fetch error:", error);
                setStatus("Error de conexión con el servidor backend.");
            }
        };
        
        // Ejecutamos la función interna
        sendTokenToBackend();
        
      } else {
        setStatus("El usuario canceló el inicio de sesión o no lo autorizó.");
      }
    }, {
      config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {
        },
        featureType: '',
        sessionInfoVersion: '2',
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-slate-100">
        <h1 className="text-3xl font-extrabold mb-4 text-slate-800">WhatsApp Signup</h1>
        <p className="text-slate-500 mb-8">Conecta tu cuenta de WhatsApp Business para usar nuestro Bot.</p>
        
        <button 
          onClick={launchWhatsAppSignup}
          disabled={!isSdkLoaded}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg w-full disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isSdkLoaded ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
              Conectar con Facebook
            </>
          ) : 'Cargando SDK...'}
        </button>

        <div className="mt-8 p-4 bg-slate-50 rounded-lg text-sm text-left break-words text-slate-700 border border-slate-200">
          <strong className="block mb-1 text-slate-500 uppercase text-xs tracking-wider">Estado de conexión</strong> 
          <span className="font-medium">{status}</span>
        </div>
      </div>
    </main>
  );
}
