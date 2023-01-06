document.getElementsByClassName("server")[0].innerHTML = "Loading data...";

let req = new XMLHttpRequest();
req.open("GET", "/api/server/random", true);

req.onload = () => {
    const serverData = JSON.parse(req.responseText);

    let serverHTML = `
        <div onclick="document.location.href = '/server/${serverData.server_name}'" style="cursor: pointer;">
            <div class="favicon">
                <img src="${serverData.favicon}" width="64px" height="64px" alt="Server Favicon">
            </div>
            <div class="align-right">
                <div class="server-header">
                    <h3>${serverData.server_name}</h3>
                    <p>${serverData.player_count}</p>
                </div>
                <p class="motd">${serverData.motd}</p>
                <p class="small-info">
                    running on <span>${serverData.version}</span> <span>${serverData.version_number}</span> with a latency of <span>${serverData.latency}</span>
                </p>
            </div>
        </a>`;

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