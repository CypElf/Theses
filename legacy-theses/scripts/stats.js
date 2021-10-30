(async () => {

    const btn = document.getElementsByClassName("button")[0]
    btn.addEventListener("click", async event => {
        event.preventDefault()
        const res = await fetch(`http://localhost/api/v1.php?q=${document.getElementById("query").value}`)
        let data = await res.json()
        data = data.map(these => {
            if (these.presentation_date)
                these.presentation_date = new Date(these.presentation_date)
            return these
        })

        Highcharts.chart('container', {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Thèses terminées'
            },

            accessibility: {
                announceNewData: {
                    enabled: true
                },
                point: {
                    valueSuffix: '%'
                }
            },

            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}: {point.y:.1f}%'
                    }
                }
            },

            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}%</b> of total<br/>'
            },

            series: [
                {
                    name: "Thèses",
                    colorByPoint: true,
                    data: [
                        {
                            name: "Non terminées",
                            y: data.filter(these => !these.finished).length / data.length * 100,
                            drilldown: "Chrome"
                        },
                        {
                            name: "Terminées",
                            y: data.filter(these => these.finished).length / data.length * 100,
                            drilldown: "Terminées"
                        }
                    ]
                }
            ]
        })

        const dates = data.map(these => these.presentation_date).sort((a, b) => a - b).filter(t => t != null)
        
        const years = [...new Set(dates.map(date => date.getFullYear()))]

        const thesesPerYear = years.map(year => data.filter(these => these.presentation_date?.getFullYear() === year).length)

        console.log(thesesPerYear)

        Highcharts.chart('container2', {
            chart: {
              type: 'areaspline'
            },
            title: {
              text: 'Thèses publiées au fil des années'
            },
            legend: {
              layout: 'vertical',
              align: 'left',
              verticalAlign: 'top',
              x: 150,
              y: 100,
              floating: true,
              borderWidth: 1,
              backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
            },
            xAxis: {
              categories: years
            },
            yAxis: {
              title: {
                text: 'Nombre de thèses'
              }
            },
            tooltip: {
              shared: true,
              valueSuffix: ' units'
            },
            credits: {
              enabled: false
            },
            plotOptions: {
              areaspline: {
                fillOpacity: 0.5
              }
            },
            series: [{
              name: 'Thèses',
              data: thesesPerYear
            }]
          })
    })
})()