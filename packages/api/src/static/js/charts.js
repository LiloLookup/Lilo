document.querySelector("#chart").innerHTML = "Loading data...";

let req = new XMLHttpRequest(),
    range = 12,
    options = {
        series: [{
            name: "Players",
            data: [1, 2, 3, 5]
        }],
        chart: {
            id: " ",
            animations: {
                enabled: false
            },
            height: "150%",
            width: "100%",
            type: "area",
            foreColor: "#fff"
        },
        theme: {
            mode: "dark",
            palette: "palette1"
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: "smooth"
        },
        yaxis: {
            forceNiceScale: true
        },
        xaxis: {
            type: "datetime",
            categories: [1, 2, 3, 4]
        },
        tooltip: {
            x: {
                format: "dd/MM/yy HH:mm"
            },
        },
        title: {
            text: `${/[^/]*$/.exec(document.location.href)[0].split(/[?#]/)[0]}`,
            rotate: -90,
            offsetX: 0,
            offsetY: 0,
            style: {
                color: "#fff",
            },
        }
    };

function runRequest() {
    options.series = [];
    options.xaxis.categories = [];

    req.open("GET", `/server/${/[^/]*$/.exec(document.location.href)[0].split(/[?#]/)[0]}/stats?size=${range * 60}`, true);
    req.onload = () => {
        const stats = JSON.parse(req.responseText);
        let playerCount = [],
            times = [];

        for (let i = 0; i < stats.length; i++) {
            playerCount.push(stats[i].online);
            times.push(stats[i].time);
        }

        options.series = [{
            name: "Players",
            data: playerCount
        }];
        options.xaxis.categories = times;

        switch (req.status) {
            case 200:
                document.querySelector("#chart").innerHTML = "";
                let chart = new ApexCharts(document.querySelector("#chart"), options);
                chart.render();
                break;
            default:
                document.querySelector("#chart").innerHTML = "No data available";
                break;
        }
    }

    req.onerror = () => {
        document.querySelector("#chart").innerHTML = "No data available";
    }

    req.send(null);
}

function requestLoop() {
    runRequest();

    setTimeout(function () {
        requestLoop();
    }, 60000);
}

function changeRange(newRange) {
    range = newRange;

    for (let element of document.getElementsByClassName("active"))
        element.classList.remove("active");
    document.getElementById(`${range}h`).classList.add("active");

    runRequest();
}

requestLoop();