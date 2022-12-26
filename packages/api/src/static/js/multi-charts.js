let serversQuery = new URLSearchParams(window.location.search).get("s").split(",");
let filteredQuery = serversQuery.filter((item, index) => serversQuery.indexOf(item) === index);
let queryString = "";
for (let server in filteredQuery)
    queryString += `${filteredQuery[server]},`;


document.querySelector("#chart").innerHTML = "Loading data...";

let range = 12,
    times = [],
    options = {
        series: [],
        chart: {
            animations: {
                enabled: false
            },
            height: 300,
            width: 400,
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
            rotate: -90,
            offsetX: 0,
            offsetY: 0,
            style: {
                color: "#fff",
            },
        }
    };

function runRequest() {
    let run = 0;

    options.series = [];
    options.xaxis.categories = [];
    times = [];

    for (let server in filteredQuery) {
        let req = new XMLHttpRequest();
        req.open("GET", `/server/${filteredQuery[server]}/stats?size=${range * 60}`, true);

        req.onload = () => {
            const stats = JSON.parse(req.responseText);
            let playerCount = [];

            for (let i = 0; i < stats.length; i++) {
                playerCount.push(stats[i].online);

                if (run === 0)
                    times.push(stats[i].time);
            }

            options.series.push({name: filteredQuery[server], data: playerCount});

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

            run++;
        }

        req.onerror = () => {
            document.querySelector("#chart").innerHTML = "No data available";
        }

        req.send(null);
    }

    options.xaxis.categories = times;
}

function requestLoop() {
    runRequest();
    setTimeout(requestLoop, 60000);
}

function changeRange(newRange) {
    range = newRange;

    for (let element of document.getElementsByClassName("active"))
        element.classList.remove("active");
    document.getElementById(`${range}h`).classList.add("active");

    runRequest();
}

requestLoop();