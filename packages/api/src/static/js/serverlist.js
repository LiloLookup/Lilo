document.getElementsByClassName("servers")[0].innerHTML = "Loading data...";

let req = new XMLHttpRequest();
req.open("GET", "/api/servers", true);

req.onload = () => {
    const serverData = JSON.parse(req.responseText);

    let serversArray = [];
    for (let server in serverData)
        serversArray.push(`
        <a href="/server/${serverData[server].server_name}">
            <div class="favicon">
                <img src="${serverData[server].favicon}" width="64px" height="64px" alt="Server Favicon">
            </div>
            <div class="align-right">
                <div class="server-header">
                    <h3>${serverData[server].server_name}</h3>
                    <p>${serverData[server].player_count}</p>
                </div>
                <p class="motd">${serverData[server].motd}</p>
                <p class="small-info">
                    running on <span>${serverData[server].version}</span> <span>${serverData[server].version_name}</span> with a latency of <span>${serverData[server].latency}</span>
                </p>
            </div>
        </a>`);

    switch (req.status) {
        case 200:
            document.getElementsByClassName("servers")[0].innerHTML = "";

            for (let server in serversArray)
                document.getElementsByClassName("servers")[0].innerHTML += `<div class="server">${serversArray[server]}</div>`;
            break;
        default:
            document.getElementsByClassName("servers")[0].innerHTML = "No data available";
            break;
    }
}

req.onerror = () => {
    document.getElementsByClassName("servers")[0].innerHTML = "No data available";
}

req.send(null);