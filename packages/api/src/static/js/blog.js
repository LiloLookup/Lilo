let req = new XMLHttpRequest();
req.open("POST", "https://lilo.northernsi.de/blog/post", true);
req.setRequestHeader("Accept", "application/json");
req.setRequestHeader("Content-Type", "application/json");

req.onload = () => {
    switch (req.status) {
        case 200:
            document.location.href = JSON.parse(req.responseText).id;
            break;
        default:
            alert("An error occurred.");
            break;
    }
}

req.onerror = () => {
    alert("An error occurred.");
}

function convertTime(unixTimestamp) {
    if (unixTimestamp == undefined)
        return document.querySelector(".time").innerText = "Could not fetch publishing-date";

    let date = new Date(unixTimestamp),
        amPM = (date.getHours() > 12 && date.getHours() <= 23 ? "PM" : "AM"),
        hour = String((date.getHours() + 24) % 12);

    document.querySelector(".time").innerText = `${(String(date.getMonth() + 1).length === 1 ? `0${date.getMonth() + 1}` : date.getMonth() + 1)}/${(String(
        date.getDate()).length === 1 ? `0${date.getDate()}` : date.getDate())}/${date
        .getFullYear()} ${`${hour.length === 1 ? `0${hour}` : hour}` || 12}:${(String(date.getMinutes()).length === 1)
        ? `0${date.getMinutes()}` : date.getMinutes()}:${(String(date.getSeconds()).length === 1
        ? `0${date.getSeconds()}` : date.getSeconds())} ${amPM}`;
}

function createBlog(title, message) {
    req.send(JSON.stringify({
        "title": title,
        "message": message,
        "time": Date.now()
    }));
}