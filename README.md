# Nearby Essentials

A web application for finding the nearest pharmacy, hospital, clinic, ATM, bank or supermarket around any area. 

When you are in an unfamiliar city and need medicine, cash or groceries quickly, map apps bury the answer amongst ads, reviews and unrelated pins. Nearby Essentials does one thing: you type an area, pick what you need and how far you are willing to go, and it lists the closest options sorted by distance, with phone numbers and a one-click link to directions. Places come from the [Geoapify API](https://www.geoapify.com/), which is built on OpenStreetMap data.


## Assignment Resources

- **Demo video:** [Link to Demo Video](https://www.youtube.com/watch?v=ioXvvapPq5o)
- **Deployed app:** [https://www.lnjoroge.tech](https://www.lnjoroge.tech)
- **Login:** none required, the app has no user accounts. The API key is provided in the submission comment.

| Server | Address |
| ------ | ------- |
| Web 01 | http://3.83.175.36/ |
| Web 02 | http://13.222.150.198/ |
| LB 01  | http://18.204.196.251/ |

## Features

- Search by area name (e.g. "Kacyiru, Kigali"), with no need to know coordinates
- Six categories: pharmacy, hospital, clinic, ATM, bank and supermarket
- Search radius of 500 m, 1 km, 2 km or 5 km
- Results table with name, address, distance, phone number and an Open in Maps button for Google Maps directions
- Sort by nearest first or name A-Z, filter by name, and show only places with a phone number (client-side, no extra API calls)
- Graceful error handling: friendly messages for an area that can't be found, empty results, map service failures and lost connections
- Input validation: the area must be 2-100 characters, checked in the browser and again on the server
- Server-side caching: identical searches within 1 hour are answered from cache (shown by the `X-Cache: HIT/MISS` header), saving API credits
- `/health` endpoint used by the load balancer's health checks

## How it works

The Express server does two jobs: it serves the frontend, and it proxies requests to Geoapify through one route, `/api/places`. Each search makes two Geoapify calls: the Geocoding API turns the typed area into coordinates, then the Places API finds places of the chosen category within the radius, ordered by distance. Only the fields the page needs are sent back to the browser. The API key lives only on the server in a `.env` file (never in the repository or the browser), which keeps it secure.

## Running locally

Requirements: Node.js 18 or newer.

1. Clone the repository:

   ```bash
   git clone https://github.com/lnjoroge-alu/summative-web-infra.git
   cd summative-web-infra
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and set your own Geoapify key (get one free by creating a project at [myprojects.geoapify.com](https://myprojects.geoapify.com/)):

   ```
   GEOAPIFY_KEY=your_key_here
   PORT=3000
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open http://localhost:3000 in your browser, type an area (e.g. "Kacyiru, Kigali"), choose a category and radius, and press Search.

## API used

- [Geoapify](https://www.geoapify.com/). Two endpoints are used: the [Geocoding API](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/) (`/v1/geocode/search`) to turn the area into coordinates, and the [Places API](https://apidocs.geoapify.com/docs/places/) (`/v2/places`) to find places by category within a radius. Place data [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). The free plan allows 3,000 credits per day and each uncached search costs 2 credits.

## Security notes

- The API key is read from `.env`, which is gitignored - it is never committed or exposed to the browser.
- Place data from the API is rendered with `append()` (never `innerHTML`), so a malicious place name cannot inject scripts into the page (XSS protection).
- The area input is limited to 2-100 characters in the form, and the server checks the same rules again, rejecting invalid or missing input with a 400 before any API call is made.

## Deployment (Part Two)

The app runs on two web servers (web-01, web-02) behind a HAProxy load balancer (lb-01). Live at https://www.lnjoroge.tech.

```
Browser ──► lb-01 (HAProxy, HTTPS termination + round robin)
              ├──► web-01 (nginx :80 ──► node :3000)
              └──► web-02 (nginx :80 ──► node :3000)
```

### Web servers (same steps on web-01 and web-02)

1. Install Node.js 20 and git:

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   ```

2. Clone the app and install dependencies:

   ```bash
   git clone https://github.com/lnjoroge-alu/summative-web-infra.git /home/ubuntu/nearby-essentials
   cd /home/ubuntu/nearby-essentials && npm ci
   ```

3. Copy the `.env` from the local machine (the key is not in git, so it is transferred separately over SSH) and lock its permissions:

   ```bash
   ssh -i ~/.ssh/school ubuntu@3.83.175.36 "umask 077; cat > /home/ubuntu/nearby-essentials/.env" < .env
   ```

4. Run the app as a systemd service so it starts on boot and restarts on crashes. `/etc/systemd/system/nearby-essentials.service`:

   ```ini
   [Unit]
   Description=Nearby Essentials app
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/nearby-essentials
   ExecStart=/usr/bin/node server.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable nearby-essentials
   sudo systemctl start nearby-essentials
   ```

5. Configure nginx as a reverse proxy: port 80 forwards to the Node app on localhost:3000, keeping the `X-Served-By` header that identifies which server answered. In `/etc/nginx/sites-available/default` (original backed up as `default.bak`):

   ```nginx
   server {
       listen 80;
       listen [::]:80 default_server;
       add_header X-Served-By 7119-web-01;   # 7119-web-02 on web-02

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Load balancer (lb-01)

HAProxy balances port 80/443 across both web servers with round robin. It terminates HTTPS with a Let's Encrypt certificate for lnjoroge.tech and www.lnjoroge.tech (renewed automatically by certbot) and redirects all HTTP to HTTPS. Health checks call the app's `/health` route, so if the Node app stops on one server, HAProxy stops sending traffic there. Both the `@` and `www` DNS records point to lb-01. The relevant config in `/etc/haproxy/haproxy.cfg`:

```
listen balancer
    bind :80
    bind *:443 ssl crt /etc/letsencrypt/live/www.lnjoroge.tech/lnjoroge.pem
    http-request redirect scheme https code 301 unless { ssl_fc }
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    server web-01 3.83.175.36:80 check
    server web-02 13.222.150.198:80 check
```

```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg && sudo systemctl reload haproxy
```

### Verifying the load balancing

Each web server adds its own `X-Served-By` header, so repeated requests through the load balancer show the traffic alternating:

```bash
curl -sI https://www.lnjoroge.tech | grep -i x-served-by
x-served-by: 7119-web-01

curl -sI https://www.lnjoroge.tech | grep -i x-served-by
x-served-by: 7119-web-02
```

The `/api/places` route was also verified end-to-end through the load balancer (HTTP 200 with live data). When the app was stopped on web-01, HAProxy sent all traffic to web-02 and the site stayed up. Updates are deployed one server at a time (`git pull`, `npm ci`, restart the service) so one server is always serving traffic.

## Challenges

- The Places API needs coordinates, not a place name, so every search first calls the Geocoding API. If the area can't be found, the server returns a 404 with a hint instead of making a useless Places request.
- Geoapify expects coordinates as `lon,lat`, the opposite of the usual order. Swapping them silently searches the wrong part of the world.
- The first deployed version showed no distances. I found that the Places API only returns a distance when a `bias=proximity:lon,lat` parameter is sent, and adding it fixed sorting by nearest too.
- Geoapify charges per request and per 20 places returned, so I limited results to 20 and added a 1-hour cache so repeat searches cost nothing.
- Many OpenStreetMap places have no phone number in `contact.phone`, so the server also checks the raw source data, and the phone filter lets users hide places without one.
- Each server has its own in-memory cache, so a search cached on web-01 is still a MISS the first time it reaches web-02. That is acceptable at this scale.

## Credits

- Place and geocoding data: [Geoapify](https://www.geoapify.com/), map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- Directions links: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
- HTTPS certificate: [Let's Encrypt](https://letsencrypt.org/)
- Built with [Express](https://expressjs.com/) and [dotenv](https://github.com/motdotla/dotenv)
