document.addEventListener('DOMContentLoaded', function() {
    // --- GLOBAL STATE ---
    let allRestaurants = [];
    let translations = {};
    let currentLang = localStorage.getItem('language') || 'en';
    let cart = JSON.parse(sessionStorage.getItem('cart')) || []; // <-- ADD THIS LINE

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
            currentLang = lang; // Set current language
            localStorage.setItem('language', lang); // Save it
            applyTranslations();
        } catch (error) {
            console.error("Could not load translations:", error);
            if (lang !== 'en') {
                // If translation fails, try falling back to English
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

        updateCartBadge(); // <-- ADD THIS LINE to update the badge on every page

        if (page === 'index.html' || page === '' || page === 'index') {
            displayDailyDeals();
        } else if (page === 'search.html' || page === 'search') {
            initSearchPage(urlParams);
        } else if (page === 'city.html' || page === 'city') {
            initCityPage(urlParams);
        } else if (page === 'menu.html' || page === 'menu') {
            initMenuPage(urlParams);
        } else if (page === 'cart.html' || page === 'cart') { // <-- ADD THIS BLOCK
            initCartPage();
        } else if (page === 'checkout.html' || page === 'checkout') { // <-- ADD THIS BLOCK
            initCheckoutPage();
        } else if (page === 'order-confirmation.html' || page === 'order-confirmation') { // <-- ADD THIS BLOCK
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
        updateHeroUI(); // Call this again in case it's the index page
    }

    function updateHeaderUI() {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        const navs = document.querySelectorAll('.main-nav');
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
                const loginLink = document.createElement('a');
                loginLink.href = 'login.html';
                loginLink.className = 'nav-link auth-dynamic';
                loginLink.setAttribute('data-lang-key', 'login');
                loginLink.textContent = translations.login || 'Log in';
                const signupLink = document.createElement('a');
                signupLink.href = 'signup.html';
                signupLink.className = 'btn btn-primary auth-dynamic';
                signupLink.setAttribute('data-lang-key', 'signup');
                signupLink.textContent = translations.signup || 'Sign up';
                nav.insertBefore(loginLink, referenceNode);
                nav.insertBefore(signupLink, referenceNode);
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
        renderRestaurants(allRestaurants); // Initial render
        
        // Add event listeners for filters
        document.getElementById('filters-sidebar').addEventListener('change', handleFilterChange);
        document.getElementById('search-input-main').addEventListener('input', handleFilterChange);
    }

    function initCityPage(params) {
        const city = params.get('city');
        document.title = `${translations.deliveryIn || "Food Delivery in"} ${city} - Mr. Lexx`;
        
        const cityHeroTitle = document.getElementById('city-hero-title');
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
        const grid = document.getElementById('city-restaurant-grid');
        renderRestaurants(cityRestaurants, grid);
        applyTranslations(); // Re-apply for dynamic content
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
        // Breadcrumbs
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.innerHTML = `
                <a href="index.html" data-lang-key="homepage">Homepage</a>
                <i class="fas fa-chevron-right"></i>
                <a href="city.html?city=${encodeURIComponent(restaurant.city)}">${restaurant.city}</a>
                <i class="fas fa-chevron-right"></i>
                <span>${restaurant.name}</span>`;
        }
    
        // Header
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
    
        // Deals
        const dealsSection = document.getElementById('available-deals');
        if (dealsSection && restaurant.deals && restaurant.deals.length > 0) {
            dealsSection.style.display = 'block';
            dealsSection.innerHTML = restaurant.deals.map(deal => `
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
    
        // Menu Navigation and Items
        const menuNav = document.getElementById('menu-nav');
        const menuContainer = document.getElementById('menu-items-container');
        if (menuNav && menuContainer && restaurant.menu) {
            menuNav.innerHTML = '';
            menuContainer.innerHTML = '';
            Object.keys(restaurant.menu).forEach((category, index) => {
                const categoryId = `category-${category.replace(/\s+/g, '-')}`;
                // Nav link
                const navLink = document.createElement('a');
                navLink.href = `#${categoryId}`;
                navLink.textContent = `${category} (${restaurant.menu[category].length})`;
                if(index === 0) navLink.classList.add('active');
                menuNav.appendChild(navLink);
    
                // Section
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
        // If on cart page, re-render to show changes
        if (window.location.pathname.endsWith('cart.html') || window.location.pathname.endsWith('cart')) {
            if (cart.length === 0) {
                window.location.reload();
            } else {
                renderCartItems();
            }
        }
    }

    function addToCart(newItem) {
        // Check if cart is from a different restaurant
        if (cart.length > 0 && cart[0].restaurantId !== newItem.restaurantId) {
            if (!confirm(translations.alertNewCart || "You have items from another restaurant. Clear the cart and add this new item?")) {
                return;
            }
            cart = []; // Clear the cart if user confirms
        }

        const existingItem = cart.find(item => item.id === newItem.id);
        if (existingItem) {
            existingItem.quantity += newItem.quantity;
        } else {
            cart.push(newItem);
        }
        saveCart();
    }

    function updateCartQuantity(itemId, change) {
        const itemIndex = cart.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1); // Remove item if quantity is 0 or less
            }
            saveCart();
        }
    }

    function removeFromCart(itemId) {
        cart = cart.filter(i => i.id !== itemId);
        saveCart();
    }

    function placeOrder() {
        const lastOrder = {
            restaurantId: cart[0].restaurantId,
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
        sessionStorage.setItem('lastOrder', JSON.stringify(lastOrder));
        
        // Clear the cart
        cart = [];
        sessionStorage.removeItem('cart');
        
        window.location.href = 'order-confirmation.html';
    }

    // --- MODAL LOGIC ---
    function openItemModal(itemId, restaurantId) {
        const restaurant = allRestaurants.find(r => r.id === restaurantId);
        let selectedItem = null;
        // Find the item across all categories in the menu
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

        modalContent.innerHTML = `
            ${selectedItem.image ? `<div class="modal-image-header"><img src="${selectedItem.image}" alt="${selectedItem.name}"></div>` : ''}
            <div class="modal-item-info">
                <h3>${selectedItem.name}</h3>
                <p class="price">₫${selectedItem.price.toLocaleString('de-DE')}</p>
                ${selectedItem.description ? `<p class="description">${selectedItem.description}</p>` : ''}
            </div>
            <div class="modal-section">
                <h4 data-lang-key="specialInstructions"></h4>
                <textarea data-lang-key-placeholder="specialInstructionsPlaceholder"></textarea>
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
        
        // Modal event listeners
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
        document.querySelector('.add-to-cart-btn').onclick = () => {
            addToCart({
                id: selectedItem.id,
                name: selectedItem.name,
                price: selectedItem.price,
                quantity: quantity,
                restaurantId: restaurant.id
            });
            modal.classList.remove('show');
        };
    }

    // --- NEW PAGE INITIALIZERS ---

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
                        <!-- Cart items will be rendered here -->
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
                    <div class="cart-item" data-item-id="${item.id}">
                        <div class="cart-item-info">
                            <div class="cart-item-quantity-controls">
                                <button class="quantity-btn decrease-btn">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn increase-btn">+</button>
                            </div>
                            <p class="cart-item-name">${item.name}</p>
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
            const itemId = parseInt(cartItem.dataset.itemId);
            if (e.target.classList.contains('increase-btn')) updateCartQuantity(itemId, 1);
            if (e.target.classList.contains('decrease-btn')) updateCartQuantity(itemId, -1);
            if (e.target.classList.contains('remove-item-btn')) removeFromCart(itemId);
        });
        applyTranslations();
    }

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
                    <span>${item.quantity} x</span>
                    <p>${item.name}</p>
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
        applyTranslations();
    }

    function initOrderConfirmationPage() {
        const lastOrder = JSON.parse(sessionStorage.getItem('lastOrder'));
        if (!lastOrder) {
            window.location.href = 'index.html';
            return;
        }
        
        const restaurant = allRestaurants.find(r => r.id === lastOrder.restaurantId);
        document.getElementById('confirmation-subtitle').textContent = `${translations.confirmSubtitleText || 'Your order from'} ${restaurant.name} ${translations.confirmOnItsWay || 'is on its way.'}`;
        document.getElementById('confirmation-eta').innerHTML = `<strong data-lang-key="confirmETA"></strong> ${restaurant.delivery_time || '25-35 minutes'}`;
        
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
                <h4 data-lang-key="filterPrice">Price Range</h4>
                <div class="filter-option"><label><input type="radio" name="price" value="all" checked> <span data-lang-key="filterAll">All</span></label></div>
                ${priceRangeHTML}
            </div>
            <div class="filter-group">
                <h4 data-lang-key="filterCuisine">Cuisine</h4>
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
            { name: "Rice Dishes", img: "images/rice.jpg" }, { name: "Noodles", img: "images/noodles.jpg" },
            { name: "Fried Chicken", img: "images/chicken.jpg" }, { name: "Bubble Tea", img: "images/trasua.jpg" },
            { name: "Grill", img: "images/grilled.jpg" }, { name: "Tom Yum", img: "images/tomyum.jpg" }
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
                // Uncheck all other cuisine boxes
                document.querySelectorAll('input[name="cuisine"]').forEach(c => c.checked = false);
                // Check the one that was clicked
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
            const matchesSearch = r.name.toLowerCase().includes(searchTerm) || r.cuisine.toLowerCase().includes(searchTerm);
            const matchesPrice = selectedPrice === 'all' || r.price_range === selectedPrice;
            const matchesCuisine = selectedCuisines.length === 0 || selectedCuisines.includes(r.cuisine);
            return matchesSearch && matchesPrice && matchesCuisine;
        });

        // Hide/show cuisine bubbles
        document.getElementById('cuisine-section').style.display = selectedCuisines.length > 0 ? 'none' : 'block';

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
        // Mobile Nav
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        const mainNav = document.getElementById('main-nav');
        if (mobileNavToggle && mainNav) {
            mobileNavToggle.addEventListener('click', () => mainNav.classList.toggle('mobile-active'));
        }

        // Language Switcher
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
                    loadTranslations(lang);
                    window.location.reload(); // <-- CHANGE THIS LINE
                }
            });
        });
        document.addEventListener('click', () => {
            if (langSwitcher && langSwitcher.classList.contains('active')) {
                langSwitcher.classList.remove('active');
            }
        });

        // Homepage Search Form
        const homeSearchForm = document.getElementById('search-form');
        if (homeSearchForm) {
            homeSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const address = document.getElementById('address-input').value.trim();
                window.location.href = `search.html?address=${encodeURIComponent(address)}`;
            });
        }

        // City Card Navigation
        const cityGrid = document.getElementById('cities-grid');
        if(cityGrid) {
            cityGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.city-card');
                if (card) window.location.href = `city.html?city=${encodeURIComponent(card.dataset.city)}`;
            });
        }

        // Mobile Filter Modal Buttons
        const openBtn = document.getElementById('open-filters-modal-btn');
        const filterModalCloseBtn = document.getElementById('close-filters-modal-btn'); // <-- RENAMED VARIABLE
        const applyBtn = document.getElementById('apply-filters-btn');
        const modal = document.getElementById('filter-modal');
        if(openBtn && modal) openBtn.addEventListener('click', () => modal.classList.add('show'));
        if(filterModalCloseBtn && modal) filterModalCloseBtn.addEventListener('click', () => modal.classList.remove('show')); // <-- UPDATED USAGE
        if(applyBtn && modal) {
            applyBtn.addEventListener('click', () => {
                // Sync filters from modal to main page and apply
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

        // Item Modal Close Button
        const modalOverlay = document.getElementById('item-modal-overlay');
        const itemModalCloseBtn = document.getElementById('modal-close-btn'); // <-- RENAMED VARIABLE
        if (modalOverlay && itemModalCloseBtn) {
            itemModalCloseBtn.addEventListener('click', () => { // <-- UPDATED USAGE
                modalOverlay.classList.remove('show');
            });
        }
    }

    // --- START THE APP ---
    initializeApp();
});