function getCookie(cookieName) {
    cookieName += "=";
    const cookiesArray = document.cookie.split(';');
    for (let cookie in cookiesArray) {
        let loopedCookie = cookiesArray[cookie].trim();
        if (loopedCookie.indexOf(cookieName) === 0)
            return loopedCookie.substring(cookieName.length);
    }

    return [];
}

document.getElementById("notification-toggle").innerHTML = `<input class="toggleBtn-gray" type="button" value="Loading...">`;
document.getElementById("public-toggle").innerHTML = `<input class="toggleBtn-gray" type="button" value="Loading...">`;
const infoReq = new XMLHttpRequest(),
    address = document.location.href.split("/")[document.location.href.split("/").length - 2];
infoReq.open("GET", `/server/${address}/info`, true);

infoReq.onload = () => {
    switch (infoReq.status) {
        case 200:
            const nToggle = (JSON.parse(infoReq.responseText).notifications ? "Disable" : "Enable"),
                pToggle = (JSON.parse(infoReq.responseText).public ? "Disable" : "Enable");
            document.getElementById("notification-toggle").innerHTML = `<input class="toggleBtn-${nToggle.toUpperCase()}" onclick="notifications('${nToggle.toUpperCase()}')" type="button" value="${nToggle}">`;
            document.getElementById("public-toggle").innerHTML = `<input class="toggleBtn-${pToggle.toUpperCase()}" onclick="publish('${pToggle.toUpperCase()}')" type="button" value="${pToggle}">`;
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
    notificationsReq.open("POST", `/server/${address}/notifications/${getCookie("access_token")}`, true);
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

function publish(action) {
    const publishReq = new XMLHttpRequest();
    publishReq.open("POST", `/server/${address}/visibility/${getCookie("access_token")}`, true);
    publishReq.setRequestHeader("Accept", "application/json");
    publishReq.setRequestHeader("Content-Type", "application/json");

    publishReq.onload = () => {
        onLoad(publishReq);
    };

    publishReq.onerror = onError;

    publishReq.send(JSON.stringify({
        action: action
    }));
}

function mirror(action, address, origin) {
    const mirrorReq = new XMLHttpRequest();
    mirrorReq.open("POST", `/server/${address}/mirror/${getCookie("access_token")}`, true);
    mirrorReq.setRequestHeader("Accept", "application/json");
    mirrorReq.setRequestHeader("Content-Type", "application/json");

    mirrorReq.onload = () => {
        onLoad(mirrorReq);
    };

    mirrorReq.onerror = onError;

    mirrorReq.send(JSON.stringify({
        action: action,
        address: address,
        origin: origin
    }));
}

function deleteServer() {
    const hasConfirmed = confirm("Are you sure you want to delete this server entirely from the database?");
    if (!hasConfirmed)
        return;

    const deleteServerReq = new XMLHttpRequest();
    deleteServerReq.open("DELETE", `/server/${address}/delete/${getCookie("access_token")}`, true);
    deleteServerReq.setRequestHeader("Accept", "application/json");
    deleteServerReq.setRequestHeader("Content-Type", "application/json");

    deleteServerReq.onload = () => {
        switch (deleteServerReq.status) {
            case 200:
                window.location.href = "/admin";
                break;
            default:
                alert("An error occurred.");
                window.location.reload(false);
                break;
        }
    };

    deleteServerReq.onerror = onError;

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