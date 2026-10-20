# Delicious Bites

A static restaurant website with WhatsApp ordering and optional Supabase storage for menu items, orders, and reservation requests. Payments remain manual and are confirmed with the restaurant.

## Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run [`supabase-schema.sql`](./supabase-schema.sql).
3. The supplied project URL and **publishable key** are already set in `backend-config.js`. If you rotate them, update that file with the project URL and public key from Supabase:

   ```js
   window.DELICIOUS_BITES_CONFIG = {
       supabaseUrl: "https://YOUR-PROJECT.supabase.co",
       supabaseAnonKey: "YOUR-PUBLISHABLE-OR-ANON-KEY"
   };
   ```

   The browser key is public by design; Row Level Security in the SQL schema limits its access. Never put a `service_role` key or other secret in this website.
4. Serve the site over HTTP(S) and test a menu read, test order, and reservation request. Opening files directly with `file://` is not a production deployment.
5. Manage menu entries in Supabase Table Editor. Keep image paths relative to the site (for example, `foodimg/jollof.jpg`). Use `available = false` to hide an item without deleting its history.

When Supabase credentials are blank, the included menu and WhatsApp ordering continue to work, but orders and reservations are not saved to a database. After setup, new requests are stored in Supabase and the site still opens a WhatsApp message for confirmation.

## Before taking real customer orders

- Replace placeholder business details and confirm the phone number, prices, menu, opening hours, location, and delivery rules.
- Add a server-side anti-spam/rate-limit or CAPTCHA workflow for public submissions, and review Supabase logs.
- Restrict database access further if you add staff accounts or an admin dashboard. Do not expose private customer records to the anonymous browser role.
- Configure a production domain and HTTPS, then submit test requests from a phone.

There is no payment processing or automatic reservation confirmation.
