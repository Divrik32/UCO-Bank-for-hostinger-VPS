google.charts.load('current', { 'packages': ['corechart', 'bar'] });
google.charts.setOnLoadCallback(drawStuff);

function drawStuff() {

    var button = document.getElementById('change-chart');
    var chartDiv = document.getElementById('chart_div');

    var data = google.visualization.arrayToDataTable([
        ['Charts', 'Profits', 'Loses'],
        ['2019', 14000, 2],
        ['2020', 24000, 4.5],
        ['2021', 30000, 1.3],
        ['2022', 50000, 5.9],
        ['2023', 60000, 13.1]
    ]);

    var materialOptions = {
        width: 550,
        chart: {

        },
        series: {
            0: { axis: 'Profits' }, // Bind series 0 to an axis named 'distance'.
            1: { axis: 'Losses' } // Bind series 1 to an axis named 'brightness'.
        },
        axes: {
            y: {
                distance: { label: 'parsecs' }, // Left y-axis.
                brightness: { side: 'right', label: 'apparent magnitude' } // Right y-axis.
            }
        }
    };

    var classicOptions = {
        width: 600,
        series: {
            0: { targetAxisIndex: 0 },
            1: { targetAxisIndex: 1 }
        },
        vAxes: {
            // Adds titles to each axis.
            0: { title: 'parsecs' },
            1: { title: 'apparent magnitude' }
        }
    };

    function drawMaterialChart() {
        var materialChart = new google.charts.Bar(chartDiv);
        materialChart.draw(data, google.charts.Bar.convertOptions(materialOptions));
    }

    function drawClassicChart() {
        var classicChart = new google.visualization.ColumnChart(chartDiv);
        classicChart.draw(data, classicOptions);
        button.innerText = 'Change to Material';
        button.onclick = drawMaterialChart;
    }

    drawMaterialChart();
};


// Line Charts

google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    var data = google.visualization.arrayToDataTable([
        ['Year', 'Loans', 'Shares'],
        ['2004', 1000, 400],
        ['2005', 1170, 460],
        ['2006', 660, 1120],
        ['2007', 1030, 540]
    ]);

    var options = {
        curveType: 'function',
        legend: { position: 'bottom' }
    };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
}