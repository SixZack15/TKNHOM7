document.addEventListener('DOMContentLoaded', function() {

    // --- COMMON: Mobile Navigation Toggle ---
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const mainNav = document.getElementById('main-nav');
    if (mobileNavToggle && mainNav) {
        mobileNavToggle.addEventListener('click', () => {
            mainNav.classList.toggle('mobile-active');
        });
    }

    // --- COMMON: Language Switcher ---
    const languageSwitcher = document.querySelector('.language-switcher');
    if (languageSwitcher) {
        const currentLangElement = document.getElementById('current-lang');
        const languageDropdown = document.querySelector('.language-dropdown');
        const translations = {
            EN: { 
                login: 'Log in', signup: 'Sign up', heroTitle: 'Sign up for free delivery on your first order', locateMe: 'Locate me', findFood: 'Find food', loginToSee: 'Log in to see saved addresses', dailyDeals: 'Daily deals on Mr. Lexx', findUs: 'Find us in these cities and many more!',
                loginTitle: 'Log in to Mr. Lexx', emailLabel: 'Email', passwordLabel: 'Password', forgotPassword: 'Forgot password?', loginBtn: 'Log in', orDivider: 'or', loginWithGoogle: 'Continue with Google', loginWithFacebook: 'Continue with Facebook', noAccount: "Don't have an account?", signUpLink: 'Sign up',
                signupTitle: 'Create an account', fullNameLabel: 'Full Name', signupBtn: 'Sign up', hasAccount: 'Already have an account?', logInLink: 'Log in',
                cartEmptyTitle: 'Your cart is empty', cartEmptySubtitle: "Looks like you haven't added anything to your cart yet.", cartEmptyBtn: 'Browse restaurants',
                orderSummaryTitle: 'Order Summary', subtotal: 'Subtotal', total: 'Total', checkoutBtn: 'Proceed to Checkout', deliveryFee: 'Delivery fee',
                checkoutPageTitle: 'Checkout', deliveryTitle: 'Delivery address', paymentTitle: 'Payment method', paymentCash: 'Cash on delivery', paymentCard: 'Credit/Debit Card', placeOrderBtn: 'Place Order',
                cardNumber: 'Card Number', expiryDate: 'Expiry Date', cvc: 'CVC',
                confirmTitle: 'Order Confirmed!', confirmSubtitle: 'Your order from Phở Thìn 13 Lò Đúc is on its way.', confirmETA: 'Estimated delivery time:', confirmBtn: 'Back to Homepage',
                aboutTitle: 'Connecting Vietnam, One Meal at a Time', aboutSubtitle: 'Learn more about our mission to bring the best local flavors right to your doorstep.',
                storyTitle: 'Our Story', storyText: 'Founded in the heart of Ho Chi Minh City, Mr. Lexx began with a simple idea: to make the incredible diversity of Vietnamese cuisine accessible to everyone. From the bustling street food stalls to the hidden culinary gems, we saw an opportunity to connect passionate local chefs with hungry customers. We are more than just a delivery app; we are a celebration of food, culture, and community.',
                missionTitle: 'Our Mission', missionText: 'Our mission is to empower local restaurants and provide our customers with a fast, reliable, and delightful food delivery experience. We are committed to using technology to bridge gaps, support small businesses, and deliver happiness in every order.',
                valuesTitle: 'Our Values', valueQuality: 'Quality First', valueQualityText: 'We partner with the best restaurants to ensure every meal is delicious and authentic.', valueSpeed: 'Speed & Reliability', valueSpeedText: 'Our advanced logistics network ensures your food arrives hot and on time.', valueCommunity: 'Community Support', valueCommunityText: 'We are dedicated to helping our local restaurant partners thrive and grow.',
                ctaTitle: 'Join the Mr. Lexx Family', ctaText: 'Are you a restaurant owner or a driver? Partner with us to reach more customers and grow your business.', ctaBtn: 'Become a Partner',
                aboutUsLink: 'About Us'
            },
            VI: { 
                login: 'Đăng nhập', signup: 'Đăng ký', heroTitle: 'Đăng ký để nhận giao hàng miễn phí cho đơn đầu tiên', locateMe: 'Vị trí của tôi', findFood: 'Tìm món', loginToSee: 'Đăng nhập để xem địa chỉ đã lưu', dailyDeals: 'Ưu đãi mỗi ngày trên Mr. Lexx', findUs: 'Tìm chúng tôi tại các thành phố này!',
                loginTitle: 'Đăng nhập vào Mr. Lexx', emailLabel: 'Email', passwordLabel: 'Mật khẩu', forgotPassword: 'Quên mật khẩu?', loginBtn: 'Đăng nhập', orDivider: 'hoặc', loginWithGoogle: 'Tiếp tục với Google', loginWithFacebook: 'Tiếp tục với Facebook', noAccount: 'Chưa có tài khoản?', signUpLink: 'Đăng ký',
                signupTitle: 'Tạo tài khoản', fullNameLabel: 'Họ và Tên', signupBtn: 'Đăng ký', hasAccount: 'Đã có tài khoản?', logInLink: 'Đăng nhập',
                cartEmptyTitle: 'Giỏ hàng của bạn trống', cartEmptySubtitle: 'Có vẻ như bạn chưa thêm gì vào giỏ hàng.', cartEmptyBtn: 'Xem nhà hàng',
                orderSummaryTitle: 'Tóm tắt đơn hàng', subtotal: 'Tạm tính', total: 'Tổng cộng', checkoutBtn: 'Tiến hành thanh toán', deliveryFee: 'Phí giao hàng',
                checkoutPageTitle: 'Thanh toán', deliveryTitle: 'Địa chỉ giao hàng', paymentTitle: 'Phương thức thanh toán', paymentCash: 'Tiền mặt khi nhận hàng', paymentCard: 'Thẻ Tín dụng/Ghi nợ', placeOrderBtn: 'Đặt hàng',
                cardNumber: 'Số thẻ', expiryDate: 'Ngày hết hạn', cvc: 'CVC',
                confirmTitle: 'Đã xác nhận đơn hàng!', confirmSubtitle: 'Đơn hàng của bạn từ Phở Thìn 13 Lò Đúc đang được giao đến.', confirmETA: 'Thời gian giao hàng dự kiến:', confirmBtn: 'Về trang chủ',
                aboutTitle: 'Kết nối Việt Nam, Từng Bữa Ăn', aboutSubtitle: 'Tìm hiểu thêm về sứ mệnh của chúng tôi để mang những hương vị địa phương tuyệt vời nhất đến tận cửa nhà bạn.',
                storyTitle: 'Câu chuyện của chúng tôi', storyText: 'Được thành lập tại trái tim của Thành phố Hồ Chí Minh, Mr. Lexx bắt đầu với một ý tưởng đơn giản: làm cho sự đa dạng đáng kinh ngạc của ẩm thực Việt Nam trở nên dễ tiếp cận với mọi người. Từ những gánh hàng rong nhộn nhịp đến những viên ngọc ẩm thực ẩn mình, chúng tôi đã nhìn thấy cơ hội kết nối những đầu bếp địa phương đầy nhiệt huyết với những khách hàng đang đói bụng. Chúng tôi không chỉ là một ứng dụng giao hàng; chúng tôi là một sự tôn vinh ẩm thực, văn hóa và cộng đồng.',
                missionTitle: 'Sứ mệnh của chúng tôi', missionText: 'Sứ mệnh của chúng tôi là trao quyền cho các nhà hàng địa phương và cung cấp cho khách hàng trải nghiệm giao đồ ăn nhanh chóng, đáng tin cậy và thú vị. Chúng tôi cam kết sử dụng công nghệ để thu hẹp khoảng cách, hỗ trợ các doanh nghiệp nhỏ và mang lại hạnh phúc trong mỗi đơn hàng.',
                valuesTitle: 'Giá trị của chúng tôi', valueQuality: 'Chất lượng hàng đầu', valueQualityText: 'Chúng tôi hợp tác với các nhà hàng tốt nhất để đảm bảo mỗi bữa ăn đều thơm ngon và đích thực.', valueSpeed: 'Tốc độ & Tin cậy', valueSpeedText: 'Mạng lưới hậu cần tiên tiến của chúng tôi đảm bảo thức ăn của bạn được giao đến nóng hổi và đúng giờ.', valueCommunity: 'Hỗ trợ cộng đồng', valueCommunityText: 'Chúng tôi tận tâm giúp đỡ các đối tác nhà hàng địa phương của mình phát triển và lớn mạnh.',
                ctaTitle: 'Gia nhập Gia đình Mr. Lexx', ctaText: 'Bạn là chủ nhà hàng hay tài xế? Hãy hợp tác với chúng tôi để tiếp cận nhiều khách hàng hơn và phát triển doanh nghiệp của bạn.', ctaBtn: 'Trở thành Đối tác',
                aboutUsLink: 'Về Chúng Tôi'
            }
        };
        languageDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedLang = e.target.getAttribute('data-lang');
            if (selectedLang) {
                currentLangElement.innerHTML = `${selectedLang} <i class="fas fa-chevron-down"></i>`;
                document.querySelectorAll('[data-lang-key]').forEach(element => {
                    const key = element.getAttribute('data-lang-key');
                    if (translations[selectedLang] && translations[selectedLang][key]) {
                        element.innerText = translations[selectedLang][key];
                    }
                });
            }
        });
    }

    // --- HOMEPAGE SPECIFIC ---
    const dealsContainer = document.getElementById('deals-container');
    if (dealsContainer) {
        const scrollLeftBtn = document.getElementById('scroll-left');
        const scrollRightBtn = document.getElementById('scroll-right');
        scrollRightBtn.addEventListener('click', () => dealsContainer.scrollBy({ left: dealsContainer.clientWidth * 0.8, behavior: 'smooth' }));
        scrollLeftBtn.addEventListener('click', () => dealsContainer.scrollBy({ left: -dealsContainer.clientWidth * 0.8, behavior: 'smooth' }));
    }
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        const locateMeBtn = document.getElementById('locate-me-btn');
        const addressInput = document.getElementById('address-input');
        locateMeBtn.addEventListener('click', () => { addressInput.value = '123 Le Loi, District 1, Ho Chi Minh City'; addressInput.focus(); });
        searchForm.addEventListener('submit', (e) => { e.preventDefault(); alert(`Redirecting to search page for: ${addressInput.value}`); });
    }

    // --- SEARCH PAGE SPECIFIC ---
    const filtersSidebar = document.getElementById('filters-sidebar');
    if (filtersSidebar) {
        const modalBody = document.getElementById('modal-body');
        const filterContentHTML = `<div class="filter-group"><h4>Sort by</h4><div class="filter-option"><label><input type="radio" name="sort" value="relevance" checked> Relevance</label></div><div class="filter-option"><label><input type="radio" name="sort" value="distance"> Distance</label></div><div class="filter-option"><label><input type="radio" name="sort" value="delivery_time"> Fastest delivery</label></div></div><div class="filter-group"><h4>Quick filters</h4><div class="quick-filters"><button class="active">Ratings 4+</button><button>Top restaurant</button></div></div><div class="filter-group"><h4>Cuisines</h4><div id="cuisine-list"><div class="filter-option"><label><input type="checkbox" value="rice"> Rice Dishes</label></div><div class="filter-option"><label><input type="checkbox" value="salads"> Salads</label></div><div class="filter-option"><label><input type="checkbox" value="soups"> Soups</label></div><div class="filter-option"><label><input type="checkbox" value="chicken"> Fried Chicken</label></div><div class="filter-option"><label><input type="checkbox" value="noodles"> Noodles</label></div><div class="filter-option hidden"><label><input type="checkbox" value="fast_food"> Fast Food</label></div><div class="filter-option hidden"><label><input type="checkbox" value="bubble_tea"> Bubble Tea</label></div><div class="filter-option hidden"><label><input type="checkbox" value="coffee"> Coffee & Tea</label></div><div class="filter-option hidden"><label><input type="checkbox" value="grill"> Grill</label></div><div class="filter-option hidden"><label><input type="checkbox" value="sandwiches"> Sandwiches</label></div><div class="filter-option hidden"><label><input type="checkbox" value="tom_yum"> Tom Yum</label></div></div><button id="show-more-cuisines">Show more</button></div>`;
        filtersSidebar.innerHTML += filterContentHTML;
        modalBody.innerHTML = filterContentHTML;
        function setupShowMore(container) {
            const showMoreBtn = container.querySelector('#show-more-cuisines');
            if (showMoreBtn) {
                showMoreBtn.addEventListener('click', () => {
                    const isShowingAll = showMoreBtn.textContent === 'Show less';
                    container.querySelectorAll('#cuisine-list .hidden').forEach(item => { item.style.display = isShowingAll ? 'none' : 'block'; });
                    showMoreBtn.textContent = isShowingAll ? 'Show more' : 'Show less';
                });
            }
        }
        setupShowMore(filtersSidebar);
        setupShowMore(modalBody);
    }
    const filterModal = document.getElementById('filter-modal');
    if (filterModal) {
        const openModalBtn = document.getElementById('open-filters-modal-btn');
        const closeModalBtn = document.getElementById('close-filters-modal-btn');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        openModalBtn.addEventListener('click', () => filterModal.classList.add('show'));
        closeModalBtn.addEventListener('click', () => filterModal.classList.remove('show'));
        applyFiltersBtn.addEventListener('click', () => { alert('Filters applied! (This is a demo)'); filterModal.classList.remove('show'); });
        filterModal.addEventListener('click', (e) => { if (e.target === filterModal) filterModal.classList.remove('show'); });
    }

    // --- MENU PAGE SPECIFIC ---
    const itemModalOverlay = document.getElementById('item-modal-overlay');
    if (itemModalOverlay) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => { itemModalOverlay.classList.add('show'); document.body.style.overflow = 'hidden'; });
        });
        const closeMenuModal = () => { itemModalOverlay.classList.remove('show'); document.body.style.overflow = 'auto'; };
        document.getElementById('modal-close-btn').addEventListener('click', closeMenuModal);
        itemModalOverlay.addEventListener('click', (e) => { if (e.target === itemModalOverlay) closeMenuModal(); });
        let quantity = 1;
        document.getElementById('increase-quantity').addEventListener('click', () => { quantity++; document.getElementById('item-quantity').textContent = quantity; });
        document.getElementById('decrease-quantity').addEventListener('click', () => { if (quantity > 1) { quantity--; document.getElementById('item-quantity').textContent = quantity; } });
    }

    // --- AUTH PAGE SPECIFIC ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) { loginForm.addEventListener('submit', (e) => { e.preventDefault(); alert('Login successful! (This is a demo)'); }); }
    const signupForm = document.getElementById('signup-form');
    if (signupForm) { signupForm.addEventListener('submit', (e) => { e.preventDefault(); alert('Signup successful! (This is a demo)'); }); }

    // --- CART & CHECKOUT PAGE SPECIFIC ---
    const cartQuantitySpan = document.getElementById('cart-item-quantity');
    if (cartQuantitySpan) {
        const decreaseBtn = document.getElementById('cart-decrease');
        const increaseBtn = document.getElementById('cart-increase');
        const itemPriceEl = document.getElementById('cart-item-total-price');
        const subtotalEl = document.getElementById('summary-subtotal');
        const totalEl = document.getElementById('summary-total');
        const basePrice = 65000;

        const updateCartPrice = () => {
            let quantity = parseInt(cartQuantitySpan.textContent);
            const totalPrice = basePrice * quantity;
            const formattedPrice = `₫${totalPrice.toLocaleString('de-DE')}`;
            itemPriceEl.textContent = formattedPrice;
            subtotalEl.textContent = formattedPrice;
            totalEl.textContent = formattedPrice;
        };

        increaseBtn.addEventListener('click', () => { cartQuantitySpan.textContent = parseInt(cartQuantitySpan.textContent) + 1; updateCartPrice(); });
        decreaseBtn.addEventListener('click', () => { let currentQuantity = parseInt(cartQuantitySpan.textContent); if (currentQuantity > 1) { cartQuantitySpan.textContent = currentQuantity - 1; updateCartPrice(); } });
    }
    const paymentOptions = document.querySelectorAll('.payment-option');
    if (paymentOptions.length > 0) {
        const cardForm = document.getElementById('card-details-form');
        paymentOptions.forEach(option => {
            option.addEventListener('click', () => {
                paymentOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                option.querySelector('input[type="radio"]').checked = true;
                if (cardForm) {
                    cardForm.style.display = option.dataset.paymentMethod === 'card' ? 'block' : 'none';
                }
            });
        });
    }
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'order-confirmation.html';
        });
    }
});