document.querySelector("#chart").innerHTML = "Loading data...";

let req = new XMLHttpRequest();
req.open("GET", `https://lilo.northernsi.de/server/${/[^/]*$/.exec(document.location.href)[0]}/stats?size=640`, true);

req.onload = () => {
    const stats = JSON.parse(req.responseText);
    let playerCount = [],
        times = [];

    // 720 statistic entries = 12 hours
    for (let i = 0; i < stats.length; i++) {
        playerCount.push(stats[i].online);
        times.push(stats[i].time);
    }

    let options = {
        series: [{
            name: "Players",
            data: playerCount
        }],
        chart: {
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
            categories: times
        },
        tooltip: {
            x: {
                format: "dd/MM/yy HH:mm"
            },
        },
        title: {
            text: `${/[^/]*$/.exec(document.location.href)[0]}`,
            rotate: -90,
            offsetX: 0,
            offsetY: 0,
            style: {
                color: "#fff",
            },
        }
    };

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