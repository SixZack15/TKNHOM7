document.addEventListener('DOMContentLoaded', function() {
    // --- GLOBAL STATE ---
    let allRestaurants = [];
    let translations = {};
    let currentLang = localStorage.getItem('language') || 'en';
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

    // --- INITIALIZATION ---
    async function initializeApp() {
        await loadTranslations(currentLang);
        await fetchRestaurants();
        setupCommonEventListeners();
    }

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`${lang}.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            translations = await response.json();
            currentLang = lang;
            localStorage.setItem('language', lang);
            applyTranslations();
        } catch (error) {
            console.error("Could not load translations:", error);
            if (lang !== 'en') {
                await loadTranslations('en');
            }
        }
    }

    async function fetchRestaurants() {
        try {
            const response = await fetch('restaurants.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            allRestaurants = data.restaurants;
            initializePage();
        } catch (error) {
            console.error("Could not fetch restaurants:", error);
        }
    }

    function initializePage() {
        const page = window.location.pathname.split("/").pop();
        const urlParams = new URLSearchParams(window.location.search);

        updateCartBadge(); 

        if (page === 'index.html' || page === '' || page === 'index') {
            displayDailyDeals();
            const locateMeBtn = document.getElementById('locate-me-btn');
            if (locateMeBtn) {
                locateMeBtn.addEventListener('click', () => {
                    const addressInput = document.getElementById('address-input');
                    if (addressInput) {
                        addressInput.value = "123 Le Loi, District 1, Ho Chi Minh City";
                    }
                });
            }
        } else if (page === 'search.html' || page === 'search') {
            initSearchPage(urlParams);
        } else if (page === 'city.html' || page === 'city') {
            initCityPage(urlParams);
        } else if (page === 'menu.html' || page === 'menu') {
            initMenuPage(urlParams);
        } else if (page === 'cart.html' || page === 'cart') {
            initCartPage();
        } else if (page === 'checkout.html' || page === 'checkout') {
            initCheckoutPage();
        } else if (page === 'qr-payment.html' || page === 'qr-payment') { // <-- ADD THIS BLOCK
            initQrPaymentPage();
        } else if (page === 'order-confirmation.html' || page === 'order-confirmation') {
            initOrderConfirmationPage();
        }
    }

    // --- TRANSLATION & UI ---
    function applyTranslations() {
        document.documentElement.lang = currentLang;
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (translations[key]) el.textContent = translations[key];
        });
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
            const key = el.getAttribute('data-lang-key-placeholder');
            if (translations[key]) el.placeholder = translations[key];
        });
        updateHeaderUI();
        updateHeroUI();
    }

    function updateHeaderUI() {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        const navs = document.querySelectorAll('.main-nav');
        const page = window.location.pathname.split("/").pop();

        navs.forEach(nav => {
            nav.querySelectorAll('.auth-dynamic').forEach(el => el.remove());
            const languageSwitcher = nav.querySelector('.language-switcher');
            const cartIcon = nav.querySelector('.cart-icon');
            const referenceNode = languageSwitcher || cartIcon;

            if (loggedInUser) {
                const welcomeSpan = document.createElement('span');
                welcomeSpan.className = 'nav-link auth-dynamic';
                welcomeSpan.textContent = `${translations.welcome || 'Welcome'}, ${loggedInUser.fullName.split(' ')[0]}`;
                const logoutLink = document.createElement('a');
                logoutLink.href = '#';
                logoutLink.className = 'nav-link auth-dynamic';
                logoutLink.textContent = translations.logout || 'Logout';
                logoutLink.addEventListener('click', handleLogout);
                nav.insertBefore(welcomeSpan, referenceNode);
                nav.insertBefore(logoutLink, referenceNode);
            } else {
                if (page !== 'login.html' && page !== 'login') {
                    const loginLink = document.createElement('a');
                    loginLink.href = 'login.html';
                    loginLink.className = 'nav-link auth-dynamic';
                    loginLink.setAttribute('data-lang-key', 'login');
                    loginLink.textContent = translations.login || 'Log in';
                    nav.insertBefore(loginLink, referenceNode);
                }
                if (page !== 'signup.html' && page !== 'signup') {
                    const signupLink = document.createElement('a');
                    signupLink.href = 'signup.html';
                    signupLink.className = 'btn btn-primary auth-dynamic';
                    signupLink.setAttribute('data-lang-key', 'signup');
                    signupLink.textContent = translations.signup || 'Sign up';
                    nav.insertBefore(signupLink, referenceNode);
                }
            }
        });
        const currentLangText = document.getElementById('current-lang-text');
        if (currentLangText) currentLangText.textContent = currentLang.toUpperCase();
    }
    
    function updateHeroUI() {
        const heroTitle = document.querySelector('h1[data-lang-key="heroTitle"]');
        const loginSublink = document.getElementById('login-sublink');
        if (!heroTitle || !loginSublink) return;
        
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        if (loggedInUser) {
            const hour = new Date().getHours();
            let greetingKey;
            if (hour < 12) { greetingKey = "greetingGoodMorning"; } 
            else if (hour < 18) { greetingKey = "greetingGoodAfternoon"; }
            else { greetingKey = "greetingGoodEvening"; }

            const firstName = loggedInUser.fullName.split(' ')[0];
            heroTitle.textContent = `${translations[greetingKey] || 'Hello'}, ${firstName}! ${translations.cravingText || 'What are you craving today?'}`;
            loginSublink.style.display = 'none';
        } else {
            heroTitle.textContent = translations.heroTitle || 'Sign up for free delivery on your first order';
            loginSublink.style.display = 'block';
        }
    }

    // --- PAGE-SPECIFIC INITIALIZERS ---
    function initSearchPage(params) {
        const address = params.get('address');
        document.getElementById('header-address').textContent = address || 'All Locations';
        populateFilters();
        populateCuisineBubbles();
        renderRestaurants(allRestaurants);
        
        document.getElementById('filters-sidebar').addEventListener('change', handleFilterChange);
        document.getElementById('search-input-main').addEventListener('input', handleFilterChange);
    }

    function initCityPage(params) {
        const city = params.get('city');
        document.title = `${translations.deliveryIn || "Food Delivery in"} ${city} - Mr. Lexx`;
        
        const cityNameEl = document.getElementById('city-name');
        if (cityNameEl) cityNameEl.textContent = city;
        
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.innerHTML = `
                <a href="index.html" data-lang-key="homepage">Homepage</a>
                <i class="fas fa-chevron-right"></i>
                <span>${city}</span>`;
        }
        
        const cityRestaurants = allRestaurants.filter(r => r.city === city);
        renderRestaurants(cityRestaurants, document.getElementById('city-restaurant-grid'));
        applyTranslations();
    }

    function initMenuPage(params) {
        const restaurantId = parseInt(params.get('id'));
        const restaurant = allRestaurants.find(r => r.id === restaurantId);
        if (!restaurant) {
            document.getElementById('menu-page-content').innerHTML = `<h1>Restaurant not found</h1>`;
            return;
        }
        document.title = `${restaurant.name} - Mr. Lexx`;
        displayRestaurantMenu(restaurant);

        const menuContainer = document.getElementById('menu-items-container');
        if (menuContainer) {
            menuContainer.addEventListener('click', (e) => {
                const menuItem = e.target.closest('.menu-item');
                if (menuItem) {
                    const itemId = parseInt(menuItem.dataset.itemId);
                    const restaurantId = parseInt(menuItem.dataset.restaurantId);
                    openItemModal(itemId, restaurantId);
                }
            });
        }
    }

    // --- DYNAMIC CONTENT RENDERING ---
    function createRestaurantCard(restaurant) {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.onclick = () => window.location.href = `menu.html?id=${restaurant.id}`;

        const tags = (restaurant.tags || []).map(tag => `<span>${tag}</span>`).join('');
        const isNew = restaurant.is_new ? `<span class="new-tag">New</span>` : '';
        const isAd = restaurant.ad ? `<span class="ad-tag">Ad</span>` : '';

        card.innerHTML = `
            <div class="card-image">
                <img src="${restaurant.image}" alt="${restaurant.name}">
                <div class="card-tags">${tags}${isNew}${isAd}</div>
            </div>
            <div class="card-content">
                <h3>${restaurant.name}</h3>
                <span class="rating"><i class="fas fa-star"></i> ${restaurant.rating} (${restaurant.reviews >= 1000 ? (restaurant.reviews/1000).toFixed(1) + 'k+' : restaurant.reviews + '+'})</span>
                <p class="card-cuisine">${restaurant.price_range} · ${restaurant.cuisine}</p>
            </div>`;
        return card;
    }

    function renderRestaurants(restaurants, container = document.getElementById('restaurant-grid')) {
        if (!container) return;
        container.innerHTML = '';
        if (restaurants.length > 0) {
            restaurants.forEach(r => container.appendChild(createRestaurantCard(r)));
        } else {
            container.innerHTML = `<p data-lang-key="noResults">No restaurants found matching your criteria.</p>`;
            applyTranslations();
        }
    }

    function displayDailyDeals() {
        const container = document.getElementById('deals-container');
        if (!container) return;
        const deals = allRestaurants.filter(r => r.tags && r.tags.length > 0).slice(0, 8);
        renderRestaurants(deals, container);
    }
    
    function displayRestaurantMenu(restaurant) {
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.innerHTML = `
                <a href="index.html" data-lang-key="homepage">Homepage</a>
                <i class="fas fa-chevron-right"></i>
                <a href="city.html?city=${encodeURIComponent(restaurant.city)}">${restaurant.city}</a>
                <i class="fas fa-chevron-right"></i>
                <span>${restaurant.name}</span>`;
        }
    
        const menuHeader = document.getElementById('menu-header');
        if (menuHeader) {
            menuHeader.innerHTML = `
                <img src="${restaurant.image}" alt="${restaurant.name}" class="restaurant-logo-img">
                <div class="restaurant-info">
                    <h1>${restaurant.name}</h1>
                    <p>${restaurant.cuisine}</p>
                    <div class="info-line">
                        <span><i class="fas fa-star"></i> ${restaurant.rating} (${restaurant.reviews}+)</span>
                        <span><i class="fas fa-motorcycle"></i> ₫${restaurant.delivery_fee.toLocaleString('de-DE')}</span>
                        <span><i class="fas fa-wallet"></i> Min. ₫${restaurant.min_order.toLocaleString('de-DE')}</span>
                    </div>
                </div>`;
        }
    
        const dealsSection = document.getElementById('available-deals');
        if (dealsSection && restaurant.deals && restaurant.deals.length > 0) {
            dealsSection.style.display = 'block';
            dealsSection.innerHTML = `<h3 data-lang-key="availableDeals"></h3>` + restaurant.deals.map(deal => `
                <div class="deal-item">
                    <i class="fas fa-percent"></i>
                    <div>
                        <strong>${deal.discount}</strong>
                        <p>${deal.condition}</p>
                    </div>
                </div>`).join('');
        } else if(dealsSection) {
            dealsSection.style.display = 'none';
        }
    
        const menuNav = document.getElementById('menu-nav');
        const menuContainer = document.getElementById('menu-items-container');
        if (menuNav && menuContainer && restaurant.menu) {
            menuNav.innerHTML = '';
            menuContainer.innerHTML = '';
            Object.keys(restaurant.menu).forEach((category, index) => {
                const categoryId = `category-${category.replace(/\s+/g, '-')}`;
                const navLink = document.createElement('a');
                navLink.href = `#${categoryId}`;
                navLink.textContent = `${category} (${restaurant.menu[category].length})`;
                if(index === 0) navLink.classList.add('active');
                menuNav.appendChild(navLink);
    
                const categorySection = document.createElement('section');
                categorySection.id = categoryId;
                categorySection.className = 'menu-category-section';
                
                const itemsHTML = restaurant.menu[category].map(item => `
                    <div class="menu-item" data-item-id="${item.id}" data-restaurant-id="${restaurant.id}">
                        <div class="item-details">
                            <h3>${item.name}</h3>
                            ${item.description ? `<p>${item.description}</p>` : ''}
                            <p class="price">₫${item.price.toLocaleString('de-DE')}</p>
                        </div>
                        ${item.image ? `
                        <div class="item-image-container">
                            <img src="${item.image}" alt="${item.name}">
                            <button class="add-item-btn"><i class="fas fa-plus"></i></button>
                        </div>` : `<div class="item-image-container"><button class="add-item-btn" style="position: static; transform: none;"><i class="fas fa-plus"></i></button></div>`}
                    </div>`).join('');
    
                categorySection.innerHTML = `<h2>${category}</h2><div class="menu-item-list">${itemsHTML}</div>`;
                menuContainer.appendChild(categorySection);
            });
        }
        applyTranslations();
    }

    // --- CART, CHECKOUT, & ORDER LOGIC ---
    function updateCartBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cart.forEach(item => {
            if (typeof item.quantity !== 'number' || isNaN(item.quantity)) {
                console.error('Invalid quantity found in cart item:', item);
                item.quantity = 1; // Correcting invalid data
            }
        });
        const cartIcons = document.querySelectorAll('.cart-icon');
        cartIcons.forEach(cartIcon => {
            let badge = cartIcon.querySelector('.cart-badge');
            if (totalItems > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'cart-badge';
                    cartIcon.appendChild(badge);
                }
                badge.textContent = totalItems;
            } else if (badge) {
                badge.remove();
            }
        });
    }

    function saveCart() {
        sessionStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        if (window.location.pathname.endsWith('cart.html') || window.location.pathname.endsWith('cart')) {
            if (cart.length === 0) {
                window.location.reload();
            } else {
                renderCartItems();
            }
        }
    }

    function addToCart(newItem, quantity = 1, instructions = '') {
        // Check if cart is from a different restaurant
        if (cart.length > 0 && cart[0].restaurantId !== newItem.restaurantId) {
            if (!confirm(translations.alertNewCart || "You can only order from one restaurant at a time. Starting a new cart will clear your current one.")) {
                return false; // User cancelled
            }
            cart = []; // Clear the cart
        }

        // If there are no instructions, try to find an existing item to increment quantity
        if (instructions === '') {
            const existingItem = cart.find(item => item.id === newItem.id && !item.instructions);
            if (existingItem) {
                existingItem.quantity += quantity;
                return true; // Item updated
            }
        }

        // Add as a new, unique item if it has instructions or doesn't exist yet
        // We use Date.now() to create a unique ID for this specific cart entry
        cart.push({
            ...newItem,
            quantity: quantity,
            instructions: instructions,
            cartItemId: Date.now() // Unique ID for this specific entry in the cart
        });
        return true; // Item added
    }

    function updateCartQuantity(cartItemId, change) {
        const itemIndex = cart.findIndex(i => i.cartItemId === cartItemId);
        if (itemIndex > -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1); // Remove item if quantity is 0 or less
            }
            saveCart();
        }
    }

    function removeFromCart(cartItemId) {
        cart = cart.filter(i => i.cartItemId !== cartItemId);
        saveCart();
    }

    // Add this new function to script.js
    function initQrPaymentPage() {
        const pendingOrder = JSON.parse(sessionStorage.getItem('pendingOrder'));
        if (!pendingOrder) {
            window.location.href = 'cart.html';
            return;
        }

        // --- Populate Page Details ---
        const totalAmount = pendingOrder.total;
        const qrReference = pendingOrder.qrReference;
        
        // Using VietQR API for a dynamic QR code
        // Replace with your actual bank info if needed
        const bankId = "970436"; // Vietcombank's BIN
        const accountNumber = "999988887777"; // Your account number
        const qrImageUrl = `https://img.vietqr.io/image/${bankId}-${accountNumber}-print.png?amount=${totalAmount}&addInfo=${qrReference}&accountName=MR%20LEXX%20STORE`;
        
        document.getElementById('qr-code-image').src = qrImageUrl;
        document.getElementById('qr-amount').textContent = `₫${totalAmount.toLocaleString('de-DE')}`;
        document.getElementById('qr-reference').textContent = qrReference;
        
        // --- Countdown Timer Logic ---
        let duration = 5 * 60; // 5 minutes in seconds
        const timerDisplay = document.getElementById('countdown-timer');
        const interval = setInterval(() => {
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (--duration < 0) {
                clearInterval(interval);
                alert(translations.qrExpiredText || "The payment time has expired. Please create a new order.");
                sessionStorage.removeItem('pendingOrder');
                window.location.href = 'cart.html';
            }
        }, 1000);

        // --- Confirm Button Logic ---
        document.getElementById('confirm-transaction-btn').addEventListener('click', () => {
            clearInterval(interval); // Stop the timer
            // Move the pending order to lastOrder for the confirmation page
            sessionStorage.setItem('lastOrder', JSON.stringify(pendingOrder));
            sessionStorage.removeItem('pendingOrder');
            window.location.href = 'order-confirmation.html';
        });
        
        // --- NEW: CANCEL BUTTON LOGIC ---
        // Add this entire block
        document.getElementById('cancel-order-btn').addEventListener('click', () => {
            clearInterval(interval); // Stop the timer immediately
            
            // Remove the order data that was waiting for payment
            sessionStorage.removeItem('pendingOrder');
            
            // Inform the user and redirect
            alert("Your order has been cancelled.");
            window.location.href = 'index.html'; // Redirect to the homepage
        });
        
        applyTranslations();
    }

    function placeOrder() {
        // --- Validation Section (remains the same) ---
        if (document.getElementById('address-form-view').style.display !== 'none') {
            if (!document.getElementById('fullname').value || !document.getElementById('phone').value || !document.getElementById('address').value) {
                alert(translations.alertFillFields || 'Please fill in all delivery address fields.');
                return;
            }
        }
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        if (paymentMethod === 'card' && document.getElementById('card-form-view').style.display !== 'none') {
            if (!document.getElementById('card-number').value || !document.getElementById('expiry-date').value || !document.getElementById('cvc').value) {
                alert(translations.alertFillFields || 'Please fill in all credit card details.');
                return;
            }
        }
        
        // --- Data Gathering & Routing Logic ---
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        let deliveryAddress = {};
        if (document.getElementById('address-form-view').style.display !== 'none') {
            deliveryAddress = {
                fullName: document.getElementById('fullname').value,
                phone: document.getElementById('phone').value,
                street: document.getElementById('address').value
            };
        } else {
            deliveryAddress = JSON.parse(localStorage.getItem(`userInfo_${loggedInUser.email}`)).deliveryAddress;
        }

        const restaurant = allRestaurants.find(r => r.id === cart[0].restaurantId);
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (restaurant.delivery_fee || 0);

        // This is the base order object
        const orderObject = {
            restaurantId: cart[0].restaurantId,
            items: cart,
            total: total,
            orderDate: new Date().toLocaleString('en-GB'),
            deliveryAddress: deliveryAddress,
            paymentInfo: { method: paymentMethod }
        };

        // --- ROUTING BASED ON PAYMENT METHOD ---
        if (paymentMethod === 'qr') {
            // For QR, create a pending order and redirect to the QR page
            orderObject.qrReference = 'MRLEXX' + Date.now(); // Generate unique reference
            sessionStorage.setItem('pendingOrder', JSON.stringify(orderObject));
            cart = [];
            sessionStorage.removeItem('cart');
            window.location.href = 'qr-payment.html';

        } else {
            // For Cash or Card, proceed to confirmation directly
            if (paymentMethod === 'card') {
                let cardDetails = {};
                if (document.getElementById('card-form-view').style.display !== 'none') {
                    const cardNumber = document.getElementById('card-number').value;
                    cardDetails = { cardNumber: `**** **** **** ${cardNumber.slice(-4)}`, expiryDate: document.getElementById('expiry-date').value };
                } else {
                    cardDetails = JSON.parse(localStorage.getItem(`userInfo_${loggedInUser.email}`)).paymentCard;
                }
                orderObject.paymentInfo.details = cardDetails;
            }
            
            // Save user info
            if (loggedInUser) {
                const userInfo = JSON.parse(localStorage.getItem(`userInfo_${loggedInUser.email}`)) || {};
                userInfo.deliveryAddress = deliveryAddress;
                if (paymentMethod === 'card') { userInfo.paymentCard = orderObject.paymentInfo.details; }
                localStorage.setItem(`userInfo_${loggedInUser.email}`, JSON.stringify(userInfo));
            }

            sessionStorage.setItem('lastOrder', JSON.stringify(orderObject));
            cart = [];
            sessionStorage.removeItem('cart');
            window.location.href = 'order-confirmation.html';
        }
    }

    // --- MODAL LOGIC ---
    function openItemModal(itemId, restaurantId) {
        const restaurant = allRestaurants.find(r => r.id === restaurantId);
        let selectedItem = null;
        for (const category in restaurant.menu) {
            const found = restaurant.menu[category].find(item => item.id === itemId);
            if (found) {
                selectedItem = found;
                break;
            }
        }
        if (!selectedItem) return;

        const modal = document.getElementById('item-modal-overlay');
        const modalContent = document.getElementById('modal-content-wrapper');
        const modalFooter = document.getElementById('modal-footer');

        let fbtHTML = '';
        if (selectedItem.recommended_sides && selectedItem.recommended_sides.length > 0) {
            const allMenuItems = Object.values(restaurant.menu).flat();
            const recommendedItems = selectedItem.recommended_sides
                .map(sideId => allMenuItems.find(item => item.id === sideId))
                .filter(item => item);

            if (recommendedItems.length > 0) {
                fbtHTML = `
                <div class="modal-section">
                    <h4 data-lang-key="frequentlyBoughtTogether"></h4>
                    <div id="fbt-items-container">
                    ${recommendedItems.map(item => `
                        <div class="fbt-item">
                            <label>
                                <input type="checkbox" class="fbt-checkbox" data-item-id="${item.id}">
                                <span>${item.name}</span>
                            </label>
                            <span class="fbt-price">+ ₫${item.price.toLocaleString('de-DE')}</span>
                        </div>
                    `).join('')}
                    </div>
                </div>`;
            }
        }

        modalContent.innerHTML = `
            ${selectedItem.image ? `<div class="modal-image-header"><img src="${selectedItem.image}" alt="${selectedItem.name}"></div>` : ''}
            <div class="modal-item-info">
                <h3>${selectedItem.name}</h3>
                <p class="price">₫${selectedItem.price.toLocaleString('de-DE')}</p>
                ${selectedItem.description ? `<p class="description">${selectedItem.description}</p>` : ''}
            </div>
            ${fbtHTML} 
            <div class="modal-section">
                <h4 data-lang-key="specialInstructions"></h4>
                <textarea id="special-instructions-input" data-lang-key-placeholder="specialInstructionsPlaceholder"></textarea>
            </div>`;
        
        modalFooter.innerHTML = `
            <div class="quantity-selector">
                <button id="decrease-quantity">-</button>
                <span id="item-quantity">1</span>
                <button id="increase-quantity">+</button>
            </div>
            <button class="btn btn-primary add-to-cart-btn" data-lang-key="addToCartBtn"></button>`;
        
        applyTranslations();
        modal.classList.add('show');
        
        let quantity = 1;
        const quantityEl = document.getElementById('item-quantity');
        document.getElementById('increase-quantity').onclick = () => {
            quantity++;
            quantityEl.textContent = quantity;
        };
        document.getElementById('decrease-quantity').onclick = () => {
            if (quantity > 1) {
                quantity--;
                quantityEl.textContent = quantity;
            }
        };
        
        // --- Updated "Add to cart" button logic ---
        document.querySelector('.add-to-cart-btn').onclick = () => {
            // Get the special instructions from the textarea
            const instructions = document.getElementById('special-instructions-input').value.trim();

            // Add the main item first, passing the instructions
            const success = addToCart({
                id: selectedItem.id,
                name: selectedItem.name,
                price: selectedItem.price,
                restaurantId: restaurant.id,
            }, quantity, instructions);

            // If user cancelled clearing the cart, stop here
            if (!success) return;

            // Add checked "frequently bought together" items (without instructions)
            document.querySelectorAll('.fbt-checkbox:checked').forEach(checkbox => {
                const sideItemId = parseInt(checkbox.dataset.itemId);
                const allMenuItems = Object.values(restaurant.menu).flat();
                const sideItem = allMenuItems.find(item => item.id === sideItemId);
                if (sideItem) {
                    // Add each side item with a quantity of 1 and no instructions
                    addToCart({
                        id: sideItem.id,
                        name: sideItem.name,
                        price: sideItem.price,
                        restaurantId: restaurant.id,
                    }, 1, ''); // Pass empty string for instructions
                }
            });

            // Save all new items to the cart at once and close the modal
            saveCart();
            modal.classList.remove('show');
        };
    }

    // --- PAGE INITIALIZERS ---
    function initCartPage() {
        const container = document.getElementById('cart-container');
        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart-container">
                    <i class="fas fa-shopping-bag empty-cart-icon"></i>
                    <h2 data-lang-key="cartEmptyTitle"></h2>
                    <p data-lang-key="cartEmptySubtitle"></p>
                    <a href="search.html" class="btn btn-primary" data-lang-key="cartEmptyBtn"></a>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="checkout-container">
                    <aside class="order-summary full-width-cart" id="cart-summary">
                        <h3 data-lang-key="orderSummaryTitle"></h3>
                    </aside>
                </div>`;
            renderCartItems();
        }
        applyTranslations();
    }

    function renderCartItems() {
        const summaryContainer = document.getElementById('cart-summary');
        if (!summaryContainer) return;

        const restaurant = allRestaurants.find(r => r.id === cart[0].restaurantId);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        summaryContainer.innerHTML = `
            <h3 data-lang-key="orderSummaryTitle"></h3>
            <p style="font-weight: 600; margin-bottom: 20px;">${restaurant.name}</p>
            <div id="cart-items-list">
                ${cart.map(item => `
                    <div class="cart-item" data-cart-item-id="${item.cartItemId}">
                        <div class="cart-item-details">
                            <div class="cart-item-info">
                                <div class="cart-item-quantity-controls">
                                    <button class="quantity-btn decrease-btn">-</button>
                                    <span>${item.quantity}</span>
                                    <button class="quantity-btn increase-btn">+</button>
                                </div>
                                <p class="cart-item-name">${item.name}</p>
                            </div>
                            ${item.instructions ? `<p class="cart-item-instructions"><em>"${item.instructions}"</em></p>` : ''}
                        </div>
                        <div class="cart-item-price">
                            <span>₫${(item.price * item.quantity).toLocaleString('de-DE')}</span>
                            <button class="remove-item-btn">×</button>
                        </div>
                    </div>`).join('')}
            </div>
            <div class="summary-details">
                <div class="summary-line">
                    <span data-lang-key="subtotal"></span>
                    <span>₫${subtotal.toLocaleString('de-DE')}</span>
                </div>
                <div class="summary-line total-line">
                    <span data-lang-key="total"></span>
                    <span>₫${subtotal.toLocaleString('de-DE')}</span>
                </div>
            </div>
            <a href="checkout.html" class="btn btn-primary checkout-btn" data-lang-key="checkoutBtn"></a>`;

        // Re-attach event listeners for the newly created buttons
        document.getElementById('cart-items-list').addEventListener('click', e => {
            const cartItem = e.target.closest('.cart-item');
            if (!cartItem) return;
            const cartItemId = parseInt(cartItem.dataset.cartItemId); // Use the unique cartItemId
            if (e.target.classList.contains('increase-btn')) updateCartQuantity(cartItemId, 1);
            if (e.target.classList.contains('decrease-btn')) updateCartQuantity(cartItemId, -1);
            if (e.target.classList.contains('remove-item-btn')) removeFromCart(cartItemId);
        });
        applyTranslations();
    }

    // --- REFACTORED initCheckoutPage FUNCTION ---
    function initCheckoutPage() {
        if (cart.length === 0) {
            window.location.href = 'cart.html';
            return;
        }
        const restaurant = allRestaurants.find(r => r.id === cart[0].restaurantId);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = restaurant.delivery_fee || 0;
        const total = subtotal + deliveryFee;
    
        const summaryContainer = document.getElementById('checkout-order-summary');
        summaryContainer.innerHTML = `
            <h3 data-lang-key="orderSummaryTitle"></h3>
            ${cart.map(item => `
                <div class="cart-item-readonly">
                    <div class="cart-item-details">
                        <p><span>${item.quantity} x</span> ${item.name}</p>
                        ${item.instructions ? `<p class="cart-item-instructions"><em>"${item.instructions}"</em></p>` : ''}
                    </div>
                    <span>₫${item.price.toLocaleString('de-DE')}</span>
                </div>`).join('')}
            <div class="summary-details">
                <div class="summary-line">
                    <span data-lang-key="subtotal"></span>
                    <span>₫${subtotal.toLocaleString('de-DE')}</span>
                </div>
                <div class="summary-line">
                    <span data-lang-key="deliveryFee"></span>
                    <span>₫${deliveryFee.toLocaleString('de-DE')}</span>
                </div>
                <div class="summary-line total-line">
                    <span data-lang-key="total"></span>
                    <span class="total-price">₫${total.toLocaleString('de-DE')}</span>
                </div>
            </div>
            <button class="btn btn-primary checkout-btn" id="place-order-btn" data-lang-key="placeOrderBtn"></button>`;
        
        document.getElementById('place-order-btn').addEventListener('click', placeOrder);
    
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        const userInfo = loggedInUser ? JSON.parse(localStorage.getItem(`userInfo_${loggedInUser.email}`)) : null;
    
        const savedAddressView = document.getElementById('saved-address-view');
        const addressFormView = document.getElementById('address-form-view');
        const changeAddressBtn = document.getElementById('change-address-btn');
    
        if (userInfo && userInfo.deliveryAddress) {
            document.getElementById('saved-address-name').textContent = userInfo.deliveryAddress.fullName;
            document.getElementById('saved-address-details').textContent = userInfo.deliveryAddress.street;
            document.getElementById('saved-address-phone').textContent = userInfo.deliveryAddress.phone;
            savedAddressView.style.display = 'block';
            addressFormView.style.display = 'none';
            changeAddressBtn.style.display = 'inline-block';
        }
    
        changeAddressBtn.addEventListener('click', () => {
            savedAddressView.style.display = 'none';
            addressFormView.style.display = 'block';
            changeAddressBtn.style.display = 'none';
        });
        
        const cardDetailsSection = document.getElementById('card-details-section');
        const savedCardView = document.getElementById('saved-card-view');
        const cardFormView = document.getElementById('card-form-view');
        const changeCardBtn = document.getElementById('change-card-btn');
        
        document.querySelectorAll('input[name="payment"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('.payment-option').forEach(label => label.classList.remove('active'));
                e.target.closest('.payment-option').classList.add('active');
                
                if (e.target.value === 'card') {
                    cardDetailsSection.style.display = 'block';
                     if (userInfo && userInfo.paymentCard) {
                        document.getElementById('saved-card-number').textContent = userInfo.paymentCard.cardNumber;
                        document.getElementById('saved-card-expiry').textContent = `Expires: ${userInfo.paymentCard.expiryDate}`;
                        savedCardView.style.display = 'block';
                        cardFormView.style.display = 'none';
                        changeCardBtn.style.display = 'inline-block';
                    } else {
                        savedCardView.style.display = 'none';
                        cardFormView.style.display = 'block';
                        changeCardBtn.style.display = 'none';
                    }
                } else {
                    cardDetailsSection.style.display = 'none';
                }
            });
        });
    
        changeCardBtn.addEventListener('click', () => {
            savedCardView.style.display = 'none';
            cardFormView.style.display = 'block';
            changeCardBtn.style.display = 'none';
        });
    
        applyTranslations();
    }

    // --- REFACTORED initOrderConfirmationPage FUNCTION ---
    function initOrderConfirmationPage() {
        const lastOrder = JSON.parse(sessionStorage.getItem('lastOrder'));
        if (!lastOrder) {
            window.location.href = 'index.html';
            return;
        }

        const restaurant = allRestaurants.find(r => r.id === lastOrder.restaurantId);

        // Main confirmation text
        document.getElementById('confirmation-subtitle').textContent = `${translations.confirmSubtitleText || 'Your order from'} ${restaurant.name} ${translations.confirmOnItsWay || 'is on its way.'}`;
        document.getElementById('confirmation-eta').innerHTML = `<strong data-lang-key="confirmETA"></strong> ${restaurant.delivery_time || '25-35 minutes'}`;

        // New details box
        document.getElementById('confirmation-restaurant-name').textContent = `Order from ${restaurant.name}`;
        
        // Itemized list with instructions
        const itemsListContainer = document.getElementById('confirmation-items-list');
        itemsListContainer.innerHTML = lastOrder.items.map(item => `
            <div class="confirmation-item">
                <p class="item-line"><span>${item.quantity} x</span> ${item.name}</p>
                ${item.instructions ? `<p class="item-instructions"><em>"${item.instructions}"</em></p>` : ''}
            </div>
        `).join('');

        document.getElementById('confirmation-date').textContent = lastOrder.orderDate;
        document.getElementById('confirmation-name').textContent = lastOrder.deliveryAddress.fullName;
        document.getElementById('confirmation-address').textContent = `${lastOrder.deliveryAddress.street}, ${restaurant.city}`;

        let paymentMethodText = '';
        switch (lastOrder.paymentInfo.method) {
            case 'cash': paymentMethodText = 'Cash on Delivery'; break;
            case 'card': paymentMethodText = `Credit/Debit Card (${lastOrder.paymentInfo.details.cardNumber})`; break;
            case 'qr': paymentMethodText = 'Bank Transfer (QR)'; break;
        }
        document.getElementById('confirmation-payment').textContent = paymentMethodText;
        document.getElementById('confirmation-total').textContent = `₫${lastOrder.total.toLocaleString('de-DE')}`;

        // Clear the temporary order details
        sessionStorage.removeItem('lastOrder');
        applyTranslations();
    }

    // --- FILTERING LOGIC (SEARCH PAGE) ---
    function populateFilters() {
        const cuisines = [...new Set(allRestaurants.map(r => r.cuisine))];
        const priceRanges = [...new Set(allRestaurants.map(r => r.price_range))].sort();

        const cuisineHTML = cuisines.map(c => `
            <div class="filter-option">
                <label><input type="checkbox" name="cuisine" value="${c}"> ${c}</label>
            </div>`).join('');

        const priceRangeHTML = priceRanges.map(p => `
            <div class="filter-option">
                <label><input type="radio" name="price" value="${p}"> ${p}</label>
            </div>`).join('');

        const filterHTML = `
            <div class="filter-group">
                <h4 data-lang-key="filterPrice"></h4>
                <div class="filter-option"><label><input type="radio" name="price" value="all" checked> <span data-lang-key="filterAll"></span></label></div>
                ${priceRangeHTML}
            </div>
            <div class="filter-group">
                <h4 data-lang-key="filterCuisine"></h4>
                ${cuisineHTML}
            </div>`;
        
        document.getElementById('filters-sidebar').innerHTML += filterHTML;
        document.getElementById('modal-body-filters').innerHTML = filterHTML;
        applyTranslations();
    }

    function populateCuisineBubbles() {
        const container = document.getElementById('cuisine-bubbles-container');
        if (!container) return;
        const popularCuisines = [
            { name: "Rice Dishes", img: "images/suon.jpg" }, { name: "Noodles", img: "images/pho.jpg" },
            { name: "Fried Chicken", img: "images/chicken.jpg" }, { name: "Bubble Tea", img: "images/trasua.jpg" },
            { name: "Grill", img: "images/grilled.jpg" }, { name: "Pizza", img: "images/pizza.jpg" }
        ];
        container.innerHTML = popularCuisines.map(c => `
            <div class="cuisine-bubble" data-cuisine="${c.name}">
                <img src="${c.img}" alt="${c.name}">
                <span>${c.name}</span>
            </div>`).join('');
        
        container.addEventListener('click', e => {
            const bubble = e.target.closest('.cuisine-bubble');
            if(bubble) {
                const cuisine = bubble.dataset.cuisine;
                document.querySelectorAll('input[name="cuisine"]').forEach(c => c.checked = false);
                const checkbox = document.querySelector(`input[name="cuisine"][value="${cuisine}"]`);
                if(checkbox) checkbox.checked = true;
                handleFilterChange();
            }
        });
    }

    function handleFilterChange() {
        const searchTerm = document.getElementById('search-input-main').value.toLowerCase();
        const selectedPrice = document.querySelector('input[name="price"]:checked').value;
        const selectedCuisines = [...document.querySelectorAll('input[name="cuisine"]:checked')].map(el => el.value);

        const filtered = allRestaurants.filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(searchTerm) || r.cuisine.toLowerCase().includes(searchTerm) || (r.menu ? Object.values(r.menu).flat().some(item => item.name.toLowerCase().includes(searchTerm)) : false);
            const matchesPrice = selectedPrice === 'all' || r.price_range === selectedPrice;
            const matchesCuisine = selectedCuisines.length === 0 || selectedCuisines.includes(r.cuisine);
            return matchesSearch && matchesPrice && matchesCuisine;
        });

        // --- MODIFIED LINE ---
        // Hide/show cuisine bubbles using visibility to preserve layout space and prevent shrinking/shifting.
        document.getElementById('cuisine-section').style.visibility = selectedCuisines.length > 0 ? 'hidden' : 'visible';
        
        renderRestaurants(filtered);
    }

    // --- AUTHENTICATION & OTHER HANDLERS ---
    function handleLogout(e) {
        e.preventDefault();
        sessionStorage.removeItem('loggedInUser');
        alert(translations.alertLogout || 'You have been logged out.');
        window.location.href = 'index.html';
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!fullName || !email || !password) {
                alert(translations.alertFillFields || 'Please fill in all fields.');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.find(user => user.email === email)) {
                alert(translations.alertUserExists || 'An account with this email already exists.');
                return;
            }

            users.push({ fullName, email, password });
            localStorage.setItem('users', JSON.stringify(users));
            alert(translations.alertSignupSuccess || 'Signup successful! Please log in.');
            window.location.href = 'login.html';
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!email || !password) {
                alert(translations.alertEnterEmailPass || 'Please enter both email and password.');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                sessionStorage.setItem('loggedInUser', JSON.stringify(user));
                window.location.href = 'index.html';
            } else {
                alert(translations.alertInvalidLogin || 'Invalid email or password.');
            }
        });
    }

    // --- COMMON EVENT LISTENERS ---
    function setupCommonEventListeners() {
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        const mainNav = document.getElementById('main-nav');
        if (mobileNavToggle && mainNav) {
            mobileNavToggle.addEventListener('click', () => mainNav.classList.toggle('mobile-active'));
        }

        const langSwitcher = document.getElementById('language-switcher');
        if (langSwitcher) {
            langSwitcher.addEventListener('click', (e) => {
                e.stopPropagation();
                langSwitcher.classList.toggle('active');
            });
        }
        document.querySelectorAll('.language-dropdown a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = e.target.getAttribute('data-lang');
                if (lang !== currentLang) {
                    currentLang = lang;
                    localStorage.setItem('language', lang);
                    loadTranslations(lang).then(() => window.location.reload());
                }
            });
        });
        document.addEventListener('click', () => {
            if (langSwitcher && langSwitcher.classList.contains('active')) {
                langSwitcher.classList.remove('active');
            }
        });

        const homeSearchForm = document.getElementById('search-form');
        if (homeSearchForm) {
            homeSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const address = document.getElementById('address-input').value.trim();
                window.location.href = `search.html?address=${encodeURIComponent(address)}`;
            });
        }

        const cityGrid = document.getElementById('cities-grid');
        if(cityGrid) {
            cityGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.city-card');
                if (card) window.location.href = `city.html?city=${encodeURIComponent(card.dataset.city)}`;
            });
        }

        const openBtn = document.getElementById('open-filters-modal-btn');
        const filterModalCloseBtn = document.getElementById('close-filters-modal-btn');
        const applyBtn = document.getElementById('apply-filters-btn');
        const modal = document.getElementById('filter-modal');
        if(openBtn && modal) openBtn.addEventListener('click', () => modal.classList.add('show'));
        if(filterModalCloseBtn && modal) filterModalCloseBtn.addEventListener('click', () => modal.classList.remove('show'));
        if(applyBtn && modal) {
            applyBtn.addEventListener('click', () => {
                const modalFilters = document.getElementById('modal-body-filters');
                const sidebarFilters = document.getElementById('filters-sidebar');
                modalFilters.querySelectorAll('input').forEach(modalInput => {
                    const mainInput = sidebarFilters.querySelector(`input[name="${modalInput.name}"][value="${modalInput.value}"]`);
                    if(mainInput) mainInput.checked = modalInput.checked;
                });
                handleFilterChange();
                modal.classList.remove('show');
            });
        }

        const modalOverlay = document.getElementById('item-modal-overlay');
        const itemModalCloseBtn = document.getElementById('modal-close-btn');
        if (modalOverlay && itemModalCloseBtn) {
            itemModalCloseBtn.addEventListener('click', () => {
                modalOverlay.classList.remove('show');
            });
        }
    }

    // --- START THE APP ---
    initializeApp();
});