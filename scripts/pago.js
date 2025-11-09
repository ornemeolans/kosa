let cart = JSON.parse(localStorage.getItem("cart-kosa")) || [];
let totalCompra = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (cart.length === 0) {
        // Redirigir si el carrito está vacío
        window.location.href = "tienda.html";
        return;
    }
    
    renderSummary();
    setupCheckoutMercadoPago();

    // Listener para el formulario (si hubiera otros campos de envío/contacto)
    document.getElementById('payment-form').addEventListener('submit', function(event) {
        event.preventDefault();
        // Aquí se recolectaría la información del cliente y se enviaría al backend
        // para generar la preferencia de MP
        // En esta simulación, solo se llama a la función de MP
        console.log("Formulario de cliente enviado. Listo para generar preferencia de MP.");
    });
});

function renderSummary() {
    const summaryList = document.getElementById('order-summary-list');
    const totalElement = document.getElementById('total-amount');
    
    summaryList.innerHTML = '';
    totalCompra = cart.reduce((sum, item) => sum + item.total, 0);

    cart.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.title} (${item.unitCount}u) - $${item.total.toLocaleString('es-AR')}`;
        summaryList.appendChild(li);
    });

    totalElement.textContent = `$${totalCompra.toLocaleString('es-AR')}`;
}


function setupCheckoutMercadoPago() {
    // ⚠️ ATENCIÓN: Esta parte asume que tienes un BACKEND que genera la 'preferenceId'.
    // El 'preferenceId' debe generarse en tu servidor (backend) y no aquí.
    // El siguiente código es para la inicialización en el FRONTEND.
    
    const PUBLIC_KEY_MP = "TU_PUBLIC_KEY_DE_MERCADOPAGO"; // Reemplaza con tu llave pública

    if (!PUBLIC_KEY_MP.includes("TU_PUBLIC_KEY")) {
        // Inicializar el SDK de Mercado Pago
        const mp = new MercadoPago(PUBLIC_KEY_MP, {
            locale: 'es-AR'
        });
    }

    // SIMULACIÓN DE LLAMADA AL BACKEND PARA GENERAR PREFERENCIA
    // En un proyecto real, esto sería una llamada a tu API:
    // fetch('/api/create_preference', { method: 'POST', body: JSON.stringify(cart) })
    // .then(res => res.json())
    // .then(preference => {
    //     createCheckoutButton(mp, preference.id);
    // });

    // USAMOS UN MOCK DE PREFERENCE ID Y CREAMOS EL BOTÓN DIRECTAMENTE PARA MOSTRAR LA ESTRUCTURA
    const mockPreferenceId = "MOCK_PREFERENCE_ID_GENERADO_EN_BACKEND"; 

    // Solo si el total es > 0, se intenta crear el botón
    if (totalCompra > 0) {
        createCheckoutButton(mp, mockPreferenceId);
    }
}

function createCheckoutButton(mpInstance, preferenceId) {
    const bricksBuilder = mpInstance.bricks();
    const renderTarget = 'mercado-pago-container';

    // Borrar el contenido anterior (por si se llama más de una vez)
    document.getElementById(renderTarget).innerHTML = '';

    bricksBuilder.create("wallet", renderTarget, {
        initialization: {
            preferenceId: preferenceId,
            // Aquí puedes redirigir al usuario al finalizar la compra
            redirectMode: "modal" 
        },
        customization: {
            visual: {
                buttonText: "Pagar con Mercado Pago"
            },
            texts: {
                valueProp: 'smart_option', // Oculta la propuesta de valor de MP
            }
        },
        callbacks: {
            // Este callback te permite redirigir al usuario después de un pago exitoso
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                return new Promise((resolve, reject) => {
                    // Aquí iría la lógica de finalización de la orden
                    console.log("Intento de pago iniciado. Método:", selectedPaymentMethod);
                    console.log("FormData:", formData);
                    resolve(); 
                });
            },
            onReady: () => {
                console.log("Widget de Mercado Pago listo.");
            },
            onError: (error) => {
                console.error("Error al cargar el widget de MP:", error);
            },
        }
    });
}

// Limpiar el carrito al volver a la tienda si el pago no se completó (esto es solo un ejemplo de flujo)
window.addEventListener('beforeunload', () => {
    // Aquí se debe decidir si limpiar el carrito o no. Usualmente se limpia después de un pago exitoso.
    // Para la demo, lo dejamos para que el usuario pueda volver a verlo.
});