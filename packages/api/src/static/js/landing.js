document.getElementsByClassName("server")[0].innerHTML = "Loading data...";

let req = new XMLHttpRequest();
req.open("GET", "http://localhost:3000/api/featuredServer", true);

req.onload = () => {
    const serverData = JSON.parse(req.responseText);

    let serverHTML = `
        <a href="https://lilo.northernsi.de/server/{server_name}">
            <div class="favicon">
                <img src="{favicon}" width="64px" alt="Server Favicon">
            </div>
            <div class="align-right">
                <div class="server-header">
                    <h3>{server_name}</h3>
                    <p>{player_count}</p>
                </div>
                <p class="motd">{motd}</p>
                <p class="small-info">
                    running on <span>{version}</span> <span>{version_number}</span> with a latency of <span>{latency}</span>
                </p>
            </div>
        </a>`;

    serverHTML = serverHTML.replace(/{server_name}/g, serverData.server_name);
    serverHTML = serverHTML.replace(/{motd}/g, serverData.motd);
    serverHTML = serverHTML.replace(/{favicon}/g, serverData.favicon);
    serverHTML = serverHTML.replace(/{latency}/g, serverData.latency);
    serverHTML = serverHTML.replace(/{version}/g, serverData.version);
    serverHTML = serverHTML.replace(/{version_number}/g, serverData.version_number);
    serverHTML = serverHTML.replace(/{player_count}/g, serverData.player_count);

    switch (req.status) {
        case 200:
            document.getElementsByClassName("server")[0].innerHTML = serverHTML;
            break;
        default:
            document.getElementsByClassName("server")[0].innerHTML = "No data available";
            break;
    }
}

req.onerror = () => {
    document.getElementsByClassName("server")[0].innerHTML = "No data available";
}

req.send(null);