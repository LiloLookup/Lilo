<h1 align="center">
    Welcome to Lilo 💻
</h1>
<pre align="center">
    This document will introduce you to Lilo's functionalities and use case.
    You'll also learn how to install and use Lilo as a Minecraft: Java Edition server tracking tool!
</pre>
<hr>
<h3>Navigation</h3>
<pre>
    <a href="#what-is-ebio-backend">› What is Lilo?</a>
    <a href="#deploying">› Deploying</a>
    <a href="#using-nginx-as-a-reverse-proxy">› Using Nginx as a Reverse Proxy</a>
    <a href="#special-thanks">› Special thanks</a>
</pre>

<h3 id="what-is-ebio-backend">› What is Lilo?</h3>
Lilo keeps track of Minecraft: Java Edition servers by pinging them in a specific time-range and saving the response
results.
Lilo also detects if a server went down or is just experiencing packet losses and sends those warnings through a Discord
Webhook.
There's also a web interface available running on port <code>3000</code> which you can use to index a server by typing
the address
into the search bar.
From there you can also see all the statistics Lilo scraped from the server.

<h3 id="deploying">› Deploying</h3>
<b>Node.js</b> & a Node.js <b>package manager</b>, that's it!
<ol>
    <li>
        Run the install command from your favorite package manager (e.g. <code>npm i</code>, <code>pnpm i</code>, <code>bun i</code>)
    </li>
    <li>
        Run <code>ts-node -r tsconfig-paths/register apps/lilo/src/index.ts</code>
        You can also run it detached with `screen`, <a href="https://pm2.io/">pm2</a>, etc..
    </li>
    <li>
        Enjoy using Lilo :)
    </li>
</ol>
Soon, Lilo will switch over to <a href="https://bun.sh/">bun</a>, a fast all-in-one JavaScript runtime, as soon as DNS/TLS support is available.

<h3 id="using-nginx-as-a-reverse-proxy">› Using Nginx as a Reverse Proxy</h3>
Add this entry to your Nginx hosts/sites config (e.g. <code>/etc/nginx/sites-enabled/default</code>:
<pre>
server {
    listen 80;
    server_name lilo.company.com; # Must match with "LILO_HOST" from your .env file
    location / {
        proxy_pass http://localhost:3000; # Must match with "LILO_PORT"
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
</pre>
After you have added this entry and modified it with the correct values, you can reload/restart your Nginx server. Lilo
should now be available on your specified address.

<h3 id="special-thanks">› Special thanks</h3>
<a href="https://github.com/unordentlich">@unordentlich</a> for the wonderful CSS & OpenSearch contribution
