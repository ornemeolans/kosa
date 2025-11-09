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
            setupEventListeners(); 
            renderFilterButtons(); // Generar botones al cargar
            filterAndSearchProducts(); // Aplicar filtros y ordenamiento por defecto
            updateCart();
        })
        .catch(error => {
            console.error("Error al cargar datos:", error);
            // Mostrar mensaje de error en el contenedor de productos si la carga falla
            const container = document.getElementById("grid");
            if(container) container.innerHTML = '<p style="text-align: center; color: red;">Error al cargar los productos. Por favor, verifica la consola.</p>';
        });
});

function setupEventListeners() {
    const searchInput = document.getElementById("search-input");
    if(searchInput) {
        searchInput.addEventListener("input", filterAndSearchProducts);
    }
}

// Genera los botones de filtro dinámicamente
function renderFilterButtons() {
    const allCategories = productsData.map(p => p.category).filter((value, index, self) => self.indexOf(value) === index).sort();
    const allColors = productsData.map(p => p.color).filter((value, index, self) => self.indexOf(value) === index).filter(c => c).sort(); 

    const categoryContainer = document.getElementById('category-buttons-container');
    const colorContainer = document.getElementById('color-buttons-container');

    if (!categoryContainer || !colorContainer) {
        console.warn("Contenedores de botones de filtro no encontrados.");
        return; 
    }

    // Generar botones de Categoría
    categoryContainer.innerHTML = '';
    
    let allCatBtn = document.createElement('button');
    allCatBtn.textContent = 'Todas';
    allCatBtn.setAttribute('data-filter-value', 'all');
    allCatBtn.classList.add('filter-btn', 'active');
    allCatBtn.onclick = handleFilterButtonClick;
    categoryContainer.appendChild(allCatBtn);

    allCategories.forEach(category => {
        let button = document.createElement('button');
        button.textContent = category;
        button.setAttribute('data-filter-value', category);
        button.classList.add('filter-btn');
        button.onclick = handleFilterButtonClick;
        categoryContainer.appendChild(button);
    });

    // Generar botones de Color
    colorContainer.innerHTML = '';

    let allColorBtn = document.createElement('button');
    allColorBtn.textContent = 'Todos los Colores';
    allColorBtn.setAttribute('data-filter-value', 'all');
    allColorBtn.classList.add('filter-btn', 'active');
    allColorBtn.onclick = handleFilterButtonClick;
    colorContainer.appendChild(allColorBtn);
    
    allColors.forEach(color => {
        let button = document.createElement('button');
        button.textContent = color;
        button.setAttribute('data-filter-value', color);
        button.classList.add('filter-btn');
        button.onclick = handleFilterButtonClick;
        colorContainer.appendChild(button);
    });
}

// Maneja el clic en los botones de filtro (selección múltiple)
function handleFilterButtonClick(event) {
    const button = event.currentTarget;
    const isAllButton = button.getAttribute('data-filter-value') === 'all';
    const container = button.parentElement;
    const allButton = container.querySelector('[data-filter-value="all"]'); 

    if (isAllButton) {
        container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    } else {
        if (allButton) {
            allButton.classList.remove('active');
        }
        
        button.classList.toggle('active');

        const activeButtons = container.querySelectorAll('.filter-btn.active');
        if (activeButtons.length === 0 && allButton) { 
            allButton.classList.add('active');
        }
    }
    
    filterAndSearchProducts();
}

// FUNCIÓN MODIFICADA: Genera los controles de cantidad
function generateQuantityControls(productName, maxStock) {
    const availableStock = Math.max(0, maxStock); 
    
    let selectOptions = '';
    const initialQuantity = availableStock > 0 ? 1 : 0; 
    
    for (let i = 1; i <= Math.min(5, availableStock); i++) {
        const isSelected = i === 1 ? 'selected' : '';
        selectOptions += `<option value="${i}" ${isSelected}>${i}</option>`;
    }
    
    if (availableStock > 5) {
        selectOptions += `<option value="more">Más de 5...</option>`;
    } else if (availableStock === 0) {
        selectOptions = `<option value="0" selected>Agotado</option>`;
    }

    // Almacenamos maxStock en un atributo de datos para que las funciones lo lean
    const html = `
        <div class="quantity-control-wrapper" data-product-name="${productName}" data-max-stock="${availableStock}">
            <div class="unit-count-select">
                <p>Cantidad:</p>
                <select onchange="handleQuantityChange(this)" data-current-quantity="${initialQuantity}" ${availableStock === 0 ? 'disabled' : ''}>
                    ${selectOptions}
                </select>
            </div>
            <div class="manual-input-wrapper d-none">
                <input type="number" min="1" max="${availableStock}" value="${initialQuantity}" placeholder="Cantidad" class="form-control-sm">
                <button onclick="handleManualQuantityInput(this)" class="btn-accept-quantity">Aceptar</button>
            </div>
        </div>
    `;
    return html;
}

// FUNCIÓN MODIFICADA: Maneja el cambio en el select
function handleQuantityChange(selectElement) {
    const wrapper = selectElement.closest('.quantity-control-wrapper');
    const manualWrapper = wrapper.querySelector('.manual-input-wrapper');
    const inputField = manualWrapper.querySelector('input');
    
    const currentQuantity = parseInt(selectElement.getAttribute('data-current-quantity')) || 1;
    const maxStock = parseInt(wrapper.getAttribute('data-max-stock'));

    if (selectElement.value === 'more') {
        manualWrapper.classList.remove('d-none');
        
        // Si ya hay una cantidad > 5 guardada, la usamos para pre-llenar. Si no, 6.
        const suggestedValue = currentQuantity > 5 ? currentQuantity : 6; 
        inputField.value = Math.min(suggestedValue, maxStock);
        
        inputField.focus();
        selectElement.style.display = 'none'; 
    } else {
        // Opción 1-5 o Agotado seleccionada
        manualWrapper.classList.add('d-none');
        selectElement.style.display = 'inline-block';
        if (selectElement.value !== '0') {
            // Actualiza la cantidad actual si no es 'Agotado'
            selectElement.setAttribute('data-current-quantity', selectElement.value);

            // Restablece el texto de la opción 'more' si fue modificado
            const moreOption = selectElement.querySelector('option[value="more"]');
            if (moreOption) {
                moreOption.textContent = `Más de 5...`;
            }
        }
    }
}

// FUNCIÓN MODIFICADA: Maneja la aceptación del input manual
function handleManualQuantityInput(button) {
    const manualWrapper = button.closest('.manual-input-wrapper');
    const wrapper = button.closest('.quantity-control-wrapper');
    const selectElement = wrapper.querySelector('select');
    const inputField = manualWrapper.querySelector('input');
    
    const maxStock = parseInt(wrapper.getAttribute('data-max-stock'));
    let desiredQuantity = parseInt(inputField.value) || 1;

    // Validación
    if (desiredQuantity < 1) {
        desiredQuantity = 1;
        inputField.value = 1;
    } else if (desiredQuantity > maxStock) {
        Swal.fire({
            icon: 'warning',
            title: 'Stock Limitado',
            text: `Solo quedan ${maxStock} unidades disponibles.`,
            confirmButtonText: 'Aceptar'
        });
        desiredQuantity = maxStock;
        inputField.value = maxStock;
    }

    // 1. Actualiza el atributo de cantidad actual
    selectElement.setAttribute('data-current-quantity', desiredQuantity);

    // 2. Oculta el campo manual y muestra el select
    manualWrapper.classList.add('d-none');
    selectElement.style.display = 'inline-block';
    
    const moreOption = selectElement.querySelector('option[value="more"]');

    // 3. Sincroniza el select con el valor aceptado
    if (desiredQuantity > 5) {
        // Si la cantidad es > 5, selecciona 'more' y actualiza su texto.
        if (moreOption) {
            selectElement.value = 'more';
            moreOption.textContent = `Más de 5... (${desiredQuantity} u.)`;
        }
    } else if (desiredQuantity >= 1 && desiredQuantity <= 5) {
        // Si la cantidad es 1-5, selecciona el valor numérico
        selectElement.value = desiredQuantity.toString();
        // Aseguramos que el texto de 'more' esté limpio si volvemos a 1-5
        if (moreOption) {
            moreOption.textContent = `Más de 5...`;
        }
    }
}


function filterAndSearchProducts() {
    const searchInput = document.getElementById("search-input");
    const searchText = searchInput ? searchInput.value.toLowerCase() : "";
    
    const categoryContainer = document.getElementById('category-buttons-container');
    const activeCategoryButtons = categoryContainer ? Array.from(categoryContainer.querySelectorAll('.filter-btn.active')) : [];
    const selectedCategories = activeCategoryButtons.map(btn => btn.getAttribute('data-filter-value')).filter(val => val !== 'all');
    
    const colorContainer = document.getElementById('color-buttons-container');
    const activeColorButtons = colorContainer ? Array.from(colorContainer.querySelectorAll('.filter-btn.active')) : [];
    const selectedColors = activeColorButtons.map(btn => btn.getAttribute('data-filter-value')).filter(val => val !== 'all');

    const priceMin = parseFloat(document.getElementById("price-min")?.value) || 0;
    const priceMax = parseFloat(document.getElementById("price-max")?.value) || Infinity;
    
    const sortSelect = document.getElementById("sort-select");
    const sortBy = sortSelect ? sortSelect.value : 'relevance';


    let filteredProducts = productsData.filter(product => {
        const searchMatch = product.name.toLowerCase().includes(searchText) || product.description.toLowerCase().includes(searchText);
        const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
        const colorMatch = selectedColors.length === 0 || (product.color && selectedColors.includes(product.color));
        const priceMatch = product.price >= priceMin && product.price <= priceMax;
        return searchMatch && categoryMatch && colorMatch && priceMatch;
    });

    switch (sortBy) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'relevance':
        default:
            break;
    }

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
        const carouselId = `carousel-${product.name.replace(/\s+/g, '-')}-${index}`; 
        const imagesHTML = product.images.map((img, i) => `
            <div class="carousel-item ${i === 0 ? 'active' : ''}">
                <img src="${img}" class="d-block w-100" alt="${product.name} imagen ${i + 1}" style="height: 300px; object-fit: cover;">
            </div>
        `).join('');

        const isLowStock = product.stock <= 3 && product.stock > 0;
        const stockMessage = product.stock === 0 ? '<p class="stock-warning-units" style="color: red; font-weight: bold;">AGOTADO</p>' : 
                             isLowStock ? `<p class="stock-warning-units" style="color: #A0522D; font-weight: bold;">⚠️ Quedan ${product.stock} unidad(es)</p>` : 
                             '';

        const quantityControlsHTML = generateQuantityControls(product.name, product.stock);


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
                        <p>Precio: $${product.price.toLocaleString('es-AR')}</p>
                    </div>
                    ${quantityControlsHTML}
                    <div class="add-to-cart mt-auto"> <button ${product.stock === 0 ? 'disabled' : ''} onclick="addToCart(this)">Agregar al carrito</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += productHTML;
    });
}

function addToCart(button) {
    let card = button.closest('.card-body');
    let title = card.querySelector('.card-title').textContent;

    let product = productsData.find(p => p.name === title);
    if (!product) return;

    const quantityWrapper = card.querySelector('.quantity-control-wrapper');
    const selectElement = quantityWrapper.querySelector('select');
    
    // Lee la cantidad actual aceptada del atributo 'data-current-quantity'
    let unitCount = parseInt(selectElement.getAttribute('data-current-quantity')) || 0;
    
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
    let totalAmountSpan = document.getElementById('total-amount-cart'); 
    
    if (!cartContainer) return; 
    cartContainer.innerHTML = '';

    let grandTotal = 0;
    if (cart.length === 0) {
        cartContainer.innerHTML = '<li>El carrito está vacío</li>';
        updateCartCounter(0); 
        if (totalAmountSpan) totalAmountSpan.textContent = '$0';
        return;
    }


    cart.forEach((item, index) => {
        grandTotal += item.total;
        let listItem = document.createElement('li');
        let text = `${item.title} (${item.unitCount}u.): $${item.total.toLocaleString('es-AR')} `;
        text += `<button class="btn-eliminar" onclick="removeUnits(${index})">Eliminar</button>`;
        
        listItem.innerHTML = text.trim(); 
        cartContainer.appendChild(listItem);
    });

    if (totalAmountSpan) totalAmountSpan.textContent = `$${grandTotal.toLocaleString('es-AR')}`;

    let totalItems = cart.reduce((total, item) => total + item.unitCount, 0);
    updateCartCounter(totalItems);
}

function removeUnits(index) {
    let itemToRemove = cart[index];
    let product = productsData.find(p => p.name === itemToRemove.title);
    if(product && product.stock !== undefined) {
        product.stock += itemToRemove.unitCount; 
    }

    cart.splice(index, 1);
    
    localStorage.setItem("cart-kosa", JSON.stringify(cart));
    updateCart();
    filterAndSearchProducts(); 
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
    window.location.href = "pago.html"; 
}

function toggleFilters() {
    const filterPanel = document.getElementById('filter-panel');
    filterPanel.classList.toggle('open');
}

// Exponer funciones al scope global
window.addToCart = addToCart;
window.removeUnits = removeUnits;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.filterAndSearchProducts = filterAndSearchProducts;
window.toggleFilters = toggleFilters;
window.handleFilterButtonClick = handleFilterButtonClick; 
window.generateQuantityControls = generateQuantityControls;
window.handleQuantityChange = handleQuantityChange;
window.handleManualQuantityInput = handleManualQuantityInput;