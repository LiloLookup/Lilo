let req = new XMLHttpRequest();
req.open("GET", `http://localhost:3000/server/${/[^/]*$/.exec(document.location.href)[0]}/stats?size=480`, true);

req.onload = () => {
    const stats = JSON.parse(req.responseText);
    let playerCount = [],
    times = [];

    // 480 statistic entries = 6 hours
    for (let i = 1; i <= 480; i++) {
        playerCount.push(stats[stats.length - 481 + i].online);
        times.push(stats[stats.length - 481 + i].time);
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