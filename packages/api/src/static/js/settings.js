document.getElementById("notification-toggle").innerHTML = `<input class="toggleBtn-gray" type="button" value="Loading...">`;
const infoReq = new XMLHttpRequest(),
    address = document.location.href.split("/")[document.location.href.split("/").length - 2];
infoReq.open("GET", `/server/${address}/info`, true);

infoReq.onload = () => {
    switch (infoReq.status) {
        case 200:
            const toggle = (JSON.parse(infoReq.responseText).notifications ? "Disable" : "Enable");
            document.getElementById("notification-toggle").innerHTML = `<input class="toggleBtn-${toggle.toUpperCase()}" onclick="notifications('${toggle.toUpperCase()}')" type="button" value="${toggle}">`;
            break;
        default:
            alert("An error occurred.");
            break;
    }
}

infoReq.onerror = onError;
infoReq.send(null);

function notifications(action) {
    const notificationsReq = new XMLHttpRequest();
    notificationsReq.open("POST", `/server/${address}/notifications`, true);
    notificationsReq.setRequestHeader("Accept", "application/json");
    notificationsReq.setRequestHeader("Content-Type", "application/json");

    notificationsReq.onload = () => {
        onLoad(notificationsReq);
    };

    notificationsReq.onerror = onError;

    notificationsReq.send(JSON.stringify({
        action: action
    }));
}

function deleteServer() {
    const deleteServerReq = new XMLHttpRequest();
    deleteServerReq.open("DELETE", `/server/${address}/delete`, true);
    deleteServerReq.setRequestHeader("Accept", "application/json");
    deleteServerReq.setRequestHeader("Content-Type", "application/json");

    deleteServerReq.send(null);
}

function onLoad(req) {
    switch (req.status) {
        case 200:
            window.location.reload(false);
            break;
        default:
            alert("An error occurred.");
            window.location.reload(false);
            break;
    }
}

function onError() {
    alert("An error occurred.");
    window.location.reload(false);
}