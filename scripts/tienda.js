let productsData = []; 
let cart = JSON.parse(localStorage.getItem("cart-kosa")) || []; 

document.addEventListener("DOMContentLoaded", function () {
    // 1. Cargar productos
    fetch('../productos.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar productos.json');
            }
            return response.json();
        })
        .then(products => {
            productsData = products; 
            generateProducts(productsData);
            updateCart();
            setupEventListeners();
        })
        .catch(error => {
            console.error("Error al cargar datos:", error);
            // Mostrar mensaje de error en la UI si es necesario
        });
});

function setupEventListeners() {
    const searchInput = document.getElementById("search-input");
    if(searchInput) {
        searchInput.addEventListener("input", filterAndSearchProducts);
    }
    
    document.querySelectorAll(".filter-btn").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterAndSearchProducts();
        });
    });
}

function filterAndSearchProducts() {
    const activeFilter = document.querySelector(".filter-btn.active").getAttribute("data-filter");
    const searchText = document.getElementById("search-input").value.toLowerCase();

    const filteredProducts = productsData.filter(product => {
        const categoryMatch = activeFilter === 'all' || product.category === activeFilter;
        const searchMatch = product.name.toLowerCase().includes(searchText) || product.description.toLowerCase().includes(searchText);
        return categoryMatch && searchMatch;
    });

    generateProducts(filteredProducts);
}


function generateProducts(products) {
    const container = document.getElementById("grid");
    if (!container) return; 
    container.innerHTML = "";
    
    if (products.length === 0) {
        container.innerHTML = '<p class="no-results-msg" style="text-align: center; margin-top: 20px;">No se encontraron artículos que coincidan con los filtros.</p>';
        return;
    }

    products.forEach((product, index) => {
        const carouselId = `carousel-${product.name.replace(/\s+/g, '-')}-${index}`; // Asegura ID único
        const imagesHTML = product.images.map((img, i) => `
            <div class="carousel-item ${i === 0 ? 'active' : ''}">
                <img src="${img}" class="d-block w-100" alt="${product.name} imagen ${i + 1}" style="height: 300px; object-fit: cover;">
            </div>
        `).join('');

        const isLowStock = product.stock <= 3 && product.stock > 0;
        const stockMessage = product.stock === 0 ? '<p class="stock-warning-units" style="color: red; font-weight: bold;">AGOTADO</p>' : 
                             isLowStock ? `<p class="stock-warning-units" style="color: #A0522D; font-weight: bold;">⚠️ Quedan ${product.stock} unidad(es)</p>` : 
                             '';

        const productHTML = `
            <div class="card-${index + 1}">
                <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-inner">
                        ${imagesHTML}
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Anterior</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Siguiente</span>
                    </button>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description}</p>
                    ${stockMessage}
                    <div class="count-controls">
                        <button onclick="decrementUnits(this)">-1</button>
                        <p>Precio: $${product.price.toLocaleString('es-AR')}</p>
                        <button onclick="incrementUnits(this)">+1</button>
                    </div>
                    <div class="unit-count">
                        <p>Cantidad:</p> <span id="unitCount">1</span>
                    </div>
                    <div class="add-to-cart">
                        <button ${product.stock === 0 ? 'disabled' : ''} onclick="addToCart(this)">Agregar al carrito</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += productHTML;
    });
}

function incrementUnits(button) {
    let card = button.closest('.card-body');
    let unitSpan = card.querySelector('.unit-count span');
    let count = parseInt(unitSpan.textContent) || 0;
    unitSpan.textContent = count + 1;
}

function decrementUnits(button) {
    let card = button.closest('.card-body');
    let unitSpan = card.querySelector('.unit-count span');
    let count = parseInt(unitSpan.textContent) || 0;
    if (count > 1) { // Se mantiene mínimo 1 para que el botón "Agregar" funcione bien
        unitSpan.textContent = count - 1;
    } else {
        unitSpan.textContent = 1;
    }
}

function addToCart(button) {
    let card = button.closest('.card-body');
    let title = card.querySelector('.card-title').textContent;

    let unitSpan = card.querySelector('.unit-count span');
    let unitCount = unitSpan ? parseInt(unitSpan.textContent) || 0 : 0;

    let product = productsData.find(p => p.name === title);
    if (!product) return;

    let price = product.price || 0;
    let total = unitCount * price;

    // Verificar stock antes de añadir
    if (unitCount > product.stock) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Stock',
            text: `❌ No hay suficientes unidades de ${title}. Stock disponible: ${product.stock}`,
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    if (unitCount > 0) {
        let existingItem = cart.find(item => item.title === title);

        if (existingItem) {
            existingItem.unitCount += unitCount;
            existingItem.total += total;
        } else {
            cart.push({
                title,
                unitCount,
                total,
                price: product.price 
            });
        }

        // Descontar del stock (solo en la simulación de productsData)
        product.stock -= unitCount;
        
        localStorage.setItem("cart-kosa", JSON.stringify(cart));
        updateCart();
        
        // Re-generar productos para actualizar la advertencia de stock si cambió
        filterAndSearchProducts(); 

        // Resetear el contador a 1 después de añadir al carrito
        if (unitSpan) unitSpan.textContent = 1; 

        Swal.fire({
            icon: 'success',
            title: 'Agregado al Carrito',
            text: `${unitCount} unidad(es) de ${title} han sido agregadas.`,
            showConfirmButton: false,
            timer: 1500
        });

    } else {
        Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: '❌ Por favor, selecciona al menos una unidad antes de agregar al carrito.',
            confirmButtonText: 'Aceptar'
        });
    }
}

function updateCart() {
    let cartContainer = document.getElementById('cart');
    let totalCart = document.getElementById('total-cart');
    if (!cartContainer) return; 
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        cartContainer.innerHTML = '<li>El carrito está vacío</li>';
        updateCartCounter(0); 
        if (totalCart) totalCart.textContent = '$0';
        return;
    }

    let grandTotal = 0;
    cart.forEach((item, index) => {
        grandTotal += item.total;
        let listItem = document.createElement('li');
        let text = `${item.title} (${item.unitCount}u.): $${item.total.toLocaleString('es-AR')} `;
        text += `<button class="btn-eliminar" onclick="removeUnits(${index})">Eliminar</button>`;
        
        listItem.innerHTML = text.trim(); 
        cartContainer.appendChild(listItem);
    });

    if (totalCart) totalCart.textContent = `$${grandTotal.toLocaleString('es-AR')}`;

    let totalItems = cart.reduce((total, item) => total + item.unitCount, 0);
    updateCartCounter(totalItems);
}

function removeUnits(index) {
    // 1. Devolver stock al producto original (simulación)
    let itemToRemove = cart[index];
    let product = productsData.find(p => p.name === itemToRemove.title);
    if(product && product.stock !== undefined) {
        product.stock += itemToRemove.unitCount; // Devuelve todas las unidades
    }

    // 2. Remover el ítem del carrito
    cart.splice(index, 1);
    
    // 3. Actualizar
    localStorage.setItem("cart-kosa", JSON.stringify(cart));
    updateCart();
    filterAndSearchProducts(); // Re-renderizar productos para actualizar stock/warning
}

function toggleCart() {
    const cartPanel = document.getElementById('cart-panel');
    cartPanel.classList.toggle('open');
}

function updateCartCounter(totalItems) {
    const cartButton = document.getElementById('cart-button');
    cartButton.innerHTML = `🛒 Carrito (${totalItems})`;
}

function checkout() {
    if (cart.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Carrito Vacío',
            text: 'Aún no tienes productos en el carrito.',
            confirmButtonText: 'Ir a Tienda'
        });
        return;
    }

    localStorage.setItem("cart-kosa", JSON.stringify(cart));
    window.location.href = "pago.html"; // Redirige a la página de pago
}

// Exponer funciones al scope global para que los botones HTML funcionen
window.incrementUnits = incrementUnits;
window.decrementUnits = decrementUnits;
window.addToCart = addToCart;
window.removeUnits = removeUnits;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.filterAndSearchProducts = filterAndSearchProducts;