let req = new XMLHttpRequest();
req.open("GET", `https://lilo.northernsi.de/server/${/[^/]*$/.exec(document.location.href)[0]}/stats?size=640`, true);

req.onload = () => {
    const stats = JSON.parse(req.responseText);
    let playerCount = [],
        times = [];

    // 720 statistic entries = 12 hours
    for (let i = 1; i <= 720; i++) {
        playerCount.push(stats[stats.length - 721 + i].online);
        times.push(stats[stats.length - 721 + i].time);
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
            foreColor: "#fff",
            parentHeightOffset: 60
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

    let chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
}

req.send(null);