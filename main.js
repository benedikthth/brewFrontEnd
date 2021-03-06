'use strict';
let path = 'http://brewApi.spock.is';
    // let path = 'http://localhost:9099'
let lastChecked = null;


let idealMin = 17; 
let idealMax = 19;
//let data = [];

let bottlingDay = new Date("2019-12-19T12:00:00.000Z");
// let dryHopDay = new Date("2019-12-09T12:00:00.000Z")
$(document).ready(()=>{
    lastChecked = Cookies.get('lastChecked') || Date.now();
    Cookies.set('lastChecked', Date.now());// - 1000 * 60 * 60 * 20);
    init();
});

/**
 * This is the first thing that is run,
 * gets data, then calls methods responsible
 * for visualizing the data.
 * 
 */
function init(){
    //

    let xPlotBands;
    // if( Date.now() - lastChecked > 1000 * 60 * 30){
    //     xPlotBands = [{ // mark the weekend
    //         color: 'rgb(255, 255, 150)',
    //         label: {
    //             text: 'New<br />Measurements.',
    //             style: {
    //                 color: '#606060'
    //             }
    //         },
    //         from: lastChecked,
    //         to: Date.now()
    //     }]   
    // } else {
    //     xPlotBands = [];
    // }

    $.when(  $.ajax({url:`${path}/temperature?hourLimit=${6}`, dataType: 'json'}),
        $.ajax({url:`${path}/temperature/regression`, dataType:'json'})
    ).done((d, r)=>{
        d=d[0];
        r= r[0].slope;
        
        // d = JSON.parse(d[0]);
        //avg = JSON.parse(avg[0]);
        // regression = JSON.parse(regression[0]);
        // console.log(regression);
        console.log(minutesSince(d[d.length-1].time));
        
        $('#heading').text(`Last measured temperature is ${d[0].temperature}°C - Next measurement in ${5 - minutesSince(d[0].time)} minutes (5 minute intervals)`);
        //data = JSON.parse(d);
        drawChart('data for the last 6 hours', '6HourChart', d, 20, null, null, r, 1000 * 60 * 60 );
        //console.log(minutesSince(data[0].dtime));
    });


    $.when( $.ajax( {url:`${path}/temperature?hourLimit=${3*7*24}`, dataType:'json'}),
            // $.ajax(`${path}/temperature/average`),
            $.ajax({url:`${path}/temperature/regression`, dataType:'json'})
    ).done((d, reg)=>{
        d = d[0];
        console.log(d);
        
        reg = reg[0].slope;

        let date = new Date(d[d.length -1].time);
        let interval = Math.floor((Date.now() - date)/1000/60);
        let intervalValue = (interval === 1)? 'minute': 'minutes';
        if(interval >= 60){ 
            interval = Math.floor(interval / 60);
            intervalValue = (interval === 1)? 'hour': 'hours';
            if(interval >= 24){
                interval = Math.ceil(interval / 24);
                intervalValue = (interval === 1)?'day':'days';
            }
        }
        
        
        drawChart(
            `Data since ${date.getDate()}/${date.getMonth()+1}, ${date.getHours()}:${date.getMinutes()}, (${interval} ${intervalValue} ago)`,
            'restHourChart',
            d,
            20,
            [{date: bottlingDay, text:'Bottling day'}],//, {date:new Date(), text:'Dryhop day'}],
            null,
            null
        );
        
    });

}


/**
 * takes a date and calculates how long since that date in minutes, rounds down..
 * 
 * @param {String} dateString 
 */
function minutesSince(dateString){
    // console.log(typeof(dateString));
    
    let d = new Date(dateString).getTime();
    console.log(d);
    
    let a = (Date.now() - d) / 1000 / 60;
    return a - (a % 1);
}

/**
 * 
 * 
 * @param {element} tr the tr element that the td is added to.
 * @param {number} val the value that goes into the td. 
 * @param {any} max the maximum value for this column. 
 * @param {any} min the minimum value for this column
 */
function addTd(tr, val, max, min){
    
    let td = $(`<td>${val}</td>`);
    if(val === max){
        $(td).addClass('table-info');
    } else if (val === min) {
        $(td).addClass('table-warning');
    }
    tr.append(td);
}


/**
 * 
 * @param {String} title title of graph
 * @param {String} renderingDiv id of div to render graph in.
 * @param {Object} data temperature tata to visualize in graph.
 * @param {Number} average average value of data.
 * @param {getDate} markers Markers.
 * @param {Object} xPlotBands any plot band that is useful.
 * @param {Object} regression object that represents data needed to form regression line
 * @param {Number} regressionLineLength number that represents the length of the regression line in seconds.
 */

function drawChart(title, renderingDiv, data, average, markers, xPlotBands, slope, regressionLineLength){
    

    let series = [{
        name: 'Temperature (°C)',
        data: getData(data)
    }];

    if(slope !== null){

        

        //dummy line for now, starting at the last point. 
        let lineLength = regressionLineLength || 1000 * 60 * 60 * 12;
        let lastDatapoint = data[0]
        let beginX = new Date(lastDatapoint.time).getTime();
        let endX = beginX + lineLength;
        let beginY = lastDatapoint.temperature;

        //Clickhouse measures time in seconds.
        let endY = slope * (endX - beginX)/1000 + beginY;
        
        let dx = (endX - beginX)/4;
        let dy = (endY - beginY)/4;
        
        series.push({
            type: 'line',
            color: (endY > idealMax || endY < idealMin)?'Orange':'cyan',
            name: 'Temperature prediction',
            data: [[beginX,beginY], [beginX+dx, beginY+dy],
                [beginX+(2*dx), beginY+(2*dy)], [beginX+(3*dx), beginY+(3*dy)],
                [endX, endY]],
            marker: {
                enabled: false
            },
            states: {
                hover: {
                    lineWidth: 0
                }
            }
        });

    }


    //configure plot-bands
    $(renderingDiv).empty();

    markers = markers || null;

    if(markers){
        
        markers = markers.map(x=>{return {
            color: '#AAAAAA',
            dashStyle: 'dash',
            width: 1,
            value: x.date.getTime(),
            label: {
                rotation: 90,
                y: 20,
                style: {
                    fontStyle: 'italic'
                },
                text: `${x.text}. (${x.date.getDate()}/${x.date.getMonth()+1})`
            }, 
            zIndex: 3
        }})
    }
    
    //max should be the maximum of the maximum of datapoints, and maximum of markers.
    let max;
    if(markers){
        console.log(markers);
        
        let mx = markers[0].value;
        markers.forEach(i => {
            if( i.value > mx){
                mx = i.value
            }
        });

        max = Math.max(new Date(data[0].time).getTime() , mx) + 1000 * 60 * 60 * 10;

    } else {
        max = null;
    }
    
    
    Highcharts.chart(renderingDiv, {

        tooltip: {
            formatter: function () {
                let d = new Date(this.x);
                let timeAgo = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
                let mstring;
                if(timeAgo > 0){
                    mstring = (timeAgo === 1)? 'minute ago':'minutes ago';
                    if(timeAgo >= 60){
                        timeAgo = Math.round(timeAgo / 60);
                        mstring = (timeAgo === 1)? 'hour ago' : 'hours ago';
                    }
                    mstring = `<em>${timeAgo} ${mstring}</em>`
                } else {
                    timeAgo *= -1;
                    let tval = 'minutes';
                    if(timeAgo > 60){
                        timeAgo = Math.round(timeAgo / 60);
                        tval = 'hours';
                    }
                    mstring = `In ${timeAgo} ${tval}`
                }
                return `<b>${this.series.name}</b><br />
                    ${d.getDate()}/${d.getMonth()+1} - ${d.getHours()}:${d.getMinutes()}<br />
                    <b>${this.y.toFixed(2)}°C </b> <br />
                    ${mstring}
                    `;
            }
        },

        legend: {
            enabled: false
        },

        chart: {
          type: 'spline',
          backgroundColor: null
        },
        
        title: {
          text: title
        },
        
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            },
            title: {
                text: 'Date'
            },

            plotBands: xPlotBands,
            

            // max: (withEndDate === null)? null : new Date(withEndDate.getTime() + 1000 * 60 * 60 * 3),
            max: max,

            plotLines: (markers === null)? null :  markers,
       

        },
        
        
        yAxis: {
          title: {
            text: 'Temperature (°C)'
          },
          
          plotLines: [{
            color: '#ABABAB', 
            dashStyle: 'dash',
            width: 1,
            value: average,
            label: {
                rotation: 0,
                x: 200,
                y: 10,
                style: {
                    fontStyle: 'italic',
                    color: '#ABABAB'
                },
                text: `Average temperature: ${average.toFixed(2)}°C`
            },
            zIndex: 3

          }],
          
          alternateGridColor: null,
          min: 0,
          plotBands: [
              { // Light air
                from: 27,
                to: Infinity,
                color: 'rgba(255, 165, 0, 0.2)',
                label: {
                    text: 'Too hot',
                    style: {
                        color: '#606060'
                    }
                }
            },
            {
                from: idealMax,
                to: 27,
                color: 'rgba(185, 216, 0, 0.3)',
                label: {
                    text: 'Getting too hot',
                    style: {
                        color: '#606060'
                    }
                }
            },
            {
                from: idealMin, 
                to: idealMax,
                color: 'rgba(0, 255, 0, 0.4)',
                label: {
                    text: 'Ideal',
                    style: {
                        color: '#606060'
                    }
                }
            },
            {
                from: 12,
                to: idealMin,
                color: 'rgba(70, 255, 152, 0.3)',
                label: {
                    text: 'Getting too cold',
                    style: {
                        color: '#606060'
                    }
                }
            }, 
            {
                from: -Infinity,
                to: 12,
                color: 'rgba(0, 255, 255, 0.2)',
                label: {
                    text: 'Too Cold',
                    style: {
                        color: '#606060'
                    }
                }
            }
          ]

        },
        
        plotOptions: {
          spline: {
            marker: {
              enabled: false
            }
          }
        },
      
        series: series
    });
}

function getData(data){

    let arr = data.map((x)=>{
        return [new Date(x.time).getTime(), x.temperature]
    })
  
    return arr.reverse();

}
