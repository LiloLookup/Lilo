function notifications(address, action) {
    const req = new XMLHttpRequest();
    req.open("POST", "/server/notifications", true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json");

    req.onload = onLoad;
    req.onerror = onError;

    req.send(JSON.stringify({
        address: address,
        action: action
    }));
}

function deleteServer(address) {
    const req = new XMLHttpRequest();
    req.open("POST", "/server/delete", true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify({
        "address": address
    }));
}

function onLoad() {
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