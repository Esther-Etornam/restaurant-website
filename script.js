const backend = window.restaurantBackend || null;
const whatsappNumber = "233547668196";
const whatsappUrl = function (message) {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

if (menuButton && navLinks) {
    menuButton.addEventListener("click", function () {
        const isOpen = navLinks.classList.toggle("active");
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navLinks.classList.remove("active");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open navigation");
        });
    });
}

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

const bookingDate = document.getElementById("bookingDate");
if (bookingDate) {
    const today = new Date();
    function formatDate(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }
    bookingDate.min = formatDate(today);
    const lastBookableDate = new Date(today);
    lastBookableDate.setDate(lastBookableDate.getDate() + 365);
    bookingDate.max = formatDate(lastBookableDate);
}

const bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const submitButton = bookingForm.querySelector("[type=submit]");
        const formData = new FormData(bookingForm);
        const reservation = {
            customer_name: String(formData.get("name")).trim(),
            phone: String(formData.get("phone")).trim(),
            reservation_date: String(formData.get("date")),
            reservation_time: String(formData.get("time")),
            guests: String(formData.get("guests"))
        };
        const message = [
            "Hello Delicious Bites, I would like to request a table.",
            "",
            `Name: ${reservation.customer_name}`,
            `Phone: ${reservation.phone}`,
            `Date: ${reservation.reservation_date}`,
            `Time: ${reservation.reservation_time}`,
            `Guests: ${reservation.guests}`
        ].join("\n");
        const result = document.getElementById("bookingResult");
        const link = document.createElement("a");
        link.href = whatsappUrl(message);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Continue to WhatsApp to send your request";
        submitButton.disabled = true;
        submitButton.textContent = "Preparing your request…";

        let saveError = null;
        if (backend) {
            try {
                const response = await backend.from("reservation_requests").insert(reservation);
                saveError = response.error;
            } catch (error) {
                saveError = error;
            }
            if (saveError) console.error("Reservation request was not saved to Supabase.", saveError);
        }

        const status = saveError
            ? "WhatsApp is ready, but we could not save this request online. Please send it so our team can help. "
            : `Your request${backend ? " has been saved" : " is ready"}. Your table is not confirmed until our team replies. `;
        result.replaceChildren(document.createTextNode(status), link);
        result.hidden = false;
        submitButton.disabled = false;
        submitButton.innerHTML = 'Prepare reservation request <span aria-hidden="true">↗</span>';
    });
}

const menuGrid = document.getElementById("menuGrid");
let menuRecordsPromise = Promise.resolve(null);

function makeMenuCard(item) {
    const article = document.createElement("article");
    article.className = "menu-card";
    article.dataset.name = item.name;
    article.dataset.category = item.category;
    article.dataset.price = String(item.price);

    const photo = document.createElement("div");
    photo.className = "menu-card-photo";
    const image = document.createElement("img");
    image.src = item.image_url;
    image.alt = item.name;
    image.loading = "lazy";
    photo.append(image);

    if (item.name.toLowerCase().includes("jollof")) {
        const tag = document.createElement("span");
        tag.className = "food-tag";
        tag.textContent = "A house favourite";
        photo.append(tag);
    }

    const body = document.createElement("div");
    body.className = "menu-card-body";
    const heading = document.createElement("div");
    heading.className = "menu-card-heading";
    const title = document.createElement("h3");
    title.textContent = item.name === "Ghanaian Jollof Rice" ? "Ghanaian Jollof" : item.name;
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = `GH₵${item.price}`;
    heading.append(title, price);

    const description = document.createElement("p");
    description.textContent = item.description;
    const bottom = document.createElement("div");
    bottom.className = "menu-card-bottom";
    const category = document.createElement("span");
    category.className = "dish-category";
    category.textContent = {
        rice: "RICE · GHANAIAN",
        local: "LOCAL FAVOURITE",
        grill: "FROM THE GRILL"
    }[item.category] || "MENU FAVOURITE";
    const add = document.createElement("button");
    add.className = "add-button";
    add.type = "button";
    add.dataset.add = "";
    add.setAttribute("aria-label", `Add ${item.name} to your order`);
    add.append(document.createTextNode("Add to order "));
    const plus = document.createElement("span");
    plus.setAttribute("aria-hidden", "true");
    plus.textContent = "+";
    add.append(plus);
    bottom.append(category, add);
    body.append(heading, description, bottom);
    article.append(photo, body);
    return article;
}

if (menuGrid) {
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
    const searchInput = document.getElementById("menuSearch");
    const resultsCount = document.getElementById("resultsCount");
    const emptyMenu = document.getElementById("emptyMenu");
    const backendNotice = document.getElementById("menuBackendNotice");
    let activeFilter = "all";

    function filterMenu() {
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        menuGrid.querySelectorAll(".menu-card").forEach(function (card) {
            const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
            const matchesSearch = card.dataset.name.toLowerCase().includes(query);
            const visible = matchesCategory && matchesSearch;
            card.hidden = !visible;
            if (visible) visibleCount += 1;
        });

        resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? "dish" : "dishes"}`;
        emptyMenu.textContent = menuGrid.querySelector(".menu-card")
            ? "No dishes match that search. Try another name or category."
            : "There are no menu items available right now.";
        emptyMenu.hidden = visibleCount !== 0;
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            activeFilter = button.dataset.filter;
            filterButtons.forEach(function (item) {
                const selected = item === button;
                item.classList.toggle("active", selected);
                item.setAttribute("aria-pressed", String(selected));
            });
            filterMenu();
        });
    });
    searchInput.addEventListener("input", filterMenu);
    menuGrid.addEventListener("click", function (event) {
        const addButton = event.target.closest("[data-add]");
        if (!addButton) return;
        const card = addButton.closest(".menu-card");
        if (card) window.dispatchEvent(new CustomEvent("menu-add", {
            detail: { name: card.dataset.name, price: Number(card.dataset.price) }
        }));
    });
    filterMenu();

    if (backend) {
        menuRecordsPromise = backend.from("menu_items")
            .select("name,description,price,category,image_url")
            .eq("available", true)
            .order("display_order", { ascending: true })
            .then(function (response) {
                if (response.error) throw response.error;
                const items = response.data.filter(function (item) {
                    return typeof item.name === "string" &&
                        typeof item.description === "string" &&
                        Number.isInteger(item.price) && item.price > 0 &&
                        ["rice", "local", "grill"].includes(item.category) &&
                        typeof item.image_url === "string" &&
                        /^(https:\/\/|\/|foodimg\/)/i.test(item.image_url) &&
                        !/[\u0000-\u001f]/.test(item.image_url);
                });
                if (response.data.length !== items.length) {
                    backendNotice.hidden = false;
                    backendNotice.textContent = "Some menu entries could not be displayed. Please contact us to confirm current dishes and prices.";
                }
                menuGrid.replaceChildren(...items.map(makeMenuCard));
                filterMenu();
                window.dispatchEvent(new CustomEvent("menu-updated", { detail: items }));
                return items;
            })
            .catch(function (error) {
                console.error("Live menu could not be loaded. Showing the local menu instead.", error);
                backendNotice.hidden = false;
                backendNotice.textContent = "We couldn’t load the latest menu, so these prices may not be current. Please confirm your order with us.";
                return null;
            });
    }
}

const cartButton = document.getElementById("cartButton");
if (cartButton) {
    const cartPanel = document.getElementById("cartPanel");
    const cartScrim = document.getElementById("cartScrim");
    const closeCart = document.getElementById("closeCart");
    const cartItems = document.getElementById("cartItems");
    const cartEmpty = document.getElementById("cartEmpty");
    const checkoutForm = document.getElementById("checkoutForm");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");
    const checkoutResult = document.getElementById("checkoutResult");
    let cart = [];

    try {
        const savedCart = JSON.parse(localStorage.getItem("deliciousBitesCart") || "[]");
        if (Array.isArray(savedCart)) {
            cart = savedCart.filter(function (item) {
                return item && typeof item.name === "string" && Number.isInteger(item.price) &&
                    Number.isInteger(item.quantity) && item.price > 0 && item.quantity > 0;
            });
        }
    } catch (error) {
        console.warn("The saved order could not be loaded.", error);
    }

    function saveCart() {
        try {
            localStorage.setItem("deliciousBitesCart", JSON.stringify(cart));
        } catch (error) {
            console.error("Your order could not be saved in this browser.", error);
        }
    }

    function setCartOpen(isOpen) {
        cartPanel.hidden = !isOpen;
        cartScrim.hidden = !isOpen;
        cartButton.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("cart-open", isOpen);
        if (isOpen) closeCart.focus();
        else cartButton.focus();
    }

    function renderCart() {
        cartItems.replaceChildren();
        const itemCount = cart.reduce(function (total, item) {
            return total + item.quantity;
        }, 0);
        const total = cart.reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);
        cartCount.textContent = String(itemCount);
        cartEmpty.hidden = cart.length > 0;
        checkoutForm.hidden = cart.length === 0;
        cartTotal.textContent = `GH₵${total}`;

        cart.forEach(function (item) {
            const row = document.createElement("div");
            row.className = "cart-item";
            const details = document.createElement("div");
            const title = document.createElement("h3");
            title.textContent = item.name;
            const price = document.createElement("div");
            price.className = "cart-item-price";
            price.textContent = `GH₵${item.price * item.quantity}`;
            const controls = document.createElement("div");
            controls.className = "quantity-controls";

            const decrease = document.createElement("button");
            decrease.type = "button";
            decrease.textContent = "−";
            decrease.setAttribute("aria-label", `Remove one ${item.name}`);
            decrease.addEventListener("click", function () {
                updateQuantity(item.name, -1);
            });

            const quantity = document.createElement("span");
            quantity.textContent = String(item.quantity);
            const increase = document.createElement("button");
            increase.type = "button";
            increase.textContent = "+";
            increase.setAttribute("aria-label", `Add one ${item.name}`);
            increase.addEventListener("click", function () {
                updateQuantity(item.name, 1);
            });
            controls.append(decrease, quantity, increase);
            details.append(title, price, controls);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-item";
            remove.textContent = "Remove";
            remove.setAttribute("aria-label", `Remove ${item.name} from your order`);
            remove.addEventListener("click", function () {
                cart = cart.filter(function (cartItem) {
                    return cartItem.name !== item.name;
                });
                saveCart();
                renderCart();
            });
            row.append(details, remove);
            cartItems.append(row);
        });
    }

    function updateQuantity(name, change) {
        const item = cart.find(function (cartItem) {
            return cartItem.name === name;
        });
        if (!item) return;
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter(function (cartItem) {
            return cartItem.name !== name;
        });
        saveCart();
        renderCart();
    }

    function addToCart(item) {
        if (typeof item.name !== "string" || !Number.isInteger(item.price) || item.price <= 0) return;
        const existing = cart.find(function (cartItem) {
            return cartItem.name === item.name;
        });
        if (existing) existing.quantity += 1;
        else cart.push({ name: item.name, price: item.price, quantity: 1 });
        saveCart();
        renderCart();
        setCartOpen(true);
    }

    window.addEventListener("menu-add", function (event) {
        addToCart(event.detail);
    });
    window.addEventListener("menu-updated", function (event) {
        const currentItems = new Map(event.detail.map(function (item) {
            return [item.name, item.price];
        }));
        cart = cart.filter(function (item) {
            return currentItems.has(item.name);
        }).map(function (item) {
            return { ...item, price: currentItems.get(item.name) };
        });
        saveCart();
        renderCart();
    });

    checkoutForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!cart.length) return;

        const submitButton = document.getElementById("checkoutButton");
        const formData = new FormData(checkoutForm);
        const order = {
            customer_name: String(formData.get("name")).trim(),
            phone: String(formData.get("phone")).trim(),
            fulfillment: String(formData.get("fulfillment")),
            customer_notes: String(formData.get("notes")).trim(),
            items: cart.map(function (item) {
                return { name: item.name, quantity: item.quantity, unit_price: item.price };
            }),
            total: cart.reduce(function (sum, item) {
                return sum + item.price * item.quantity;
            }, 0)
        };
        const message = [
            "Hello Delicious Bites, I would like to place an order.",
            "",
            `Name: ${order.customer_name}`,
            `Phone: ${order.phone}`,
            `Fulfilment: ${order.fulfillment}`,
            ...order.items.map(function (item) {
                return `${item.quantity} x ${item.name} — GH₵${item.unit_price * item.quantity}`;
            }),
            `Estimated total: GH₵${order.total}`,
            order.customer_notes ? `Notes: ${order.customer_notes}` : "",
            "",
            "Please confirm availability, delivery details and payment."
        ].filter(Boolean).join("\n");

        window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
        submitButton.disabled = true;
        submitButton.textContent = backend ? "Sending and saving order…" : "Sending your order…";
        checkoutResult.hidden = true;

        if (backend) {
            let saveError = null;
            try {
                const response = await backend.from("orders").insert(order);
                saveError = response.error;
            } catch (error) {
                saveError = error;
            }
            if (saveError) {
                console.error("Order was not saved to Supabase.", saveError);
                checkoutResult.textContent = "WhatsApp was opened, but we couldn’t save your order online. Please send the WhatsApp message and confirm the details with us.";
                checkoutResult.hidden = false;
            } else {
                checkoutResult.textContent = "Your order request was saved. Please send the WhatsApp message so we can confirm availability and payment.";
                checkoutResult.hidden = false;
            }
        }

        submitButton.disabled = false;
        submitButton.innerHTML = 'Send order on WhatsApp <span aria-hidden="true">↗</span>';
    });

    cartButton.addEventListener("click", function () {
        setCartOpen(cartPanel.hidden);
    });
    closeCart.addEventListener("click", function () {
        setCartOpen(false);
    });
    cartScrim.addEventListener("click", function () {
        setCartOpen(false);
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !cartPanel.hidden) setCartOpen(false);
    });
    renderCart();
    menuRecordsPromise.then(function (items) {
        if (items) window.dispatchEvent(new CustomEvent("menu-updated", { detail: items }));
    });
}
