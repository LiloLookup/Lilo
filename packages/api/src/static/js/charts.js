document.querySelector("#chart").innerHTML = "Loading data...";

let req = new XMLHttpRequest();

let options = {
    series: [{
        name: "Players",
        data: [1,2,3,5]
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
        categories: [1,2,3,4]
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

function runRequest() {
    req.open("GET", `${/[^/]*$/.exec(document.location.href)[0]}/stats?size=640`, true)

    req.onload = () => {
        const stats = JSON.parse(req.responseText);
        let playerCount = [],
            times = [];

        // 720 statistic entries = 12 hours
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
    setTimeout(runRequest, 15000);
}

runRequest();
