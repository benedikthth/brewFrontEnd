'use strict';

let maxColor = {r: 150, g: 0, b:0},
minColor = {r: 0, g: 150, b:200};
let lastChecked = null;
//let data = [];

let bottlingDay = new Date("2018-08-11T12:00:00.000Z");
let earlyBD = new Date("2018-08-05T12:00:00.000Z");

$(document).ready(()=>{
    lastChecked = Cookies.get('lastChecked') || Date.now();
    Cookies.set('lastChecked', Date.now());
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
    let hour = 4;
    $.ajax( {url: `http://www.brewApi.spock.is/temperature?hourLimit=${6}` }).done((d)=>{
        d = JSON.parse(d);
        $('#heading').text(`Last measured temperature is ${d[0].temperature}°C - Next measurement in ${5 - minutesSince(d[0].dtime)} minutes (5 minute intervals)`);
        //data = JSON.parse(d);
        drawChart(d, 'data for the last 6 hours', '6HourChart');
        //console.log(minutesSince(data[0].dtime));
    });

    $.ajax( {url: `http://www.brewApi.spock.is/temperature?hourLimit=${12}` }).done((d)=>{
        d = JSON.parse(d);
        //data = JSON.parse(d);
        drawChart(d, 'data for the last 12 hours', '12HourChart');
        //console.log(minutesSince(data[0].dtime));
    });

    $.ajax( {url: `http://www.brewApi.spock.is/temperature?hourLimit=${24}` }).done((d)=>{
        d = JSON.parse(d);
        //data = JSON.parse(d);
        drawChart(d, 'data for the last 24 hours', '24HourChart');
        //console.log(minutesSince(data[0].dtime));
    });

    $.ajax( {url: `http://www.brewApi.spock.is/temperature` }).done((d)=>{
        d = JSON.parse(d);

        let date = new Date(d[d.length -1].dtime);
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
        
        drawChart(d, `Data since ${date.getDate()}/${date.getMonth()+1}, ${date.getHours()}:${date.getMinutes()}, (${interval} ${intervalValue} ago)`, 'restHourChart', bottlingDay);
        //console.log(minutesSince(data[0].dtime));
    });

}


/**
 * takes a date and calculates how long since that date in minutes, rounds down..
 * 
 * @param {String} dateString 
 */
function minutesSince(dateString){
    let d = new Date(dateString.replace(' ', 'T')+'Z').getTime();
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
let poop ;

function drawChart(data, title, renderingDiv, withEndDate){
    //configure plot-bands
    $(renderingDiv).empty();
    let xPlotBands;
    if( Date.now() - lastChecked > 1000 * 60 * 30){
        xPlotBands = [{ // mark the weekend
            color: 'rgb(255, 255, 150)',
            label: {
                text: 'New<br />Measurements.',
                style: {
                    color: '#606060'
                }
            },
            from: lastChecked,
            to: Date.now()
        }]   
    } else {
        xPlotBands = null;
    }

    withEndDate = withEndDate || null;

    Highcharts.chart(renderingDiv, {

        tooltip: {
            formatter: function () {
                let d = new Date(this.x);
                let timeAgo = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
                let mstring = (timeAgo === 1)? 'minute ago':'minutes ago';
                if(timeAgo >= 60){
                    timeAgo = Math.round(timeAgo / 60);
                    mstring = (timeAgo === 1)? 'hour ago' : 'hours ago';
                }
                
                return `${d.getDate()}/${d.getMonth()+1} - ${d.getHours()}:${d.getMinutes()}<br />
                    <b>${this.y}°C </b> <br />
                    <em>${timeAgo} ${mstring}</em>
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
            
            max: (withEndDate === null)? null : new Date(withEndDate.getTime() + 1000 * 60 * 60 * 3),

            plotLines: (withEndDate === null)? null : [{
                color: '#AAAAAA',
                dashStyle: 'dash',
                width: 1,
                value: withEndDate,
                label: {
                    rotation: 90,
                    y: 20,
                    style: {
                        fontStyle: 'italic'
                    },
                    text: `Bottling day. (${withEndDate.getDate()}/${withEndDate.getMonth()+1})`
                },
                zIndex: 3
            },{
                color: '#AAAAAA',
                dashStyle: 'dash',
                width: 1,
                value: earlyBD,
                label: {
                    rotation: 90,
                    y: 20,
                    style: {
                        fontStyle: 'italic'
                    },
                    text: `Proposed earlier Bottling day. (${earlyBD.getDate()}/${earlyBD.getMonth()+1})`
                },
                zIndex: 3
            }]
        },
        
        
        yAxis: {
          title: {
            text: 'Temperature (°C)'
          },

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
                from: 22,
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
                from: 20, 
                to: 22,
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
                to: 20,
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
        /*
        tooltip: {

          headerFormat: '<b>{series.name}</b><br>',
          pointFormat: '{point.x:%e. %b - %H:%M}: <b>{point.y:.2f} c</b> <br /> <i>{1+2}</i>'
        },
        */
        plotOptions: {
          spline: {
            marker: {
              enabled: false
            }
          }
        },
      
        series: [{
          name: 'Temperature (°C)',
          data: getData(data)
        }]
    });
}

function getData(data){

    let arr = data.map((x)=>{
        return [new Date(x.dtime.replace(' ','T')+'Z').getTime(), x.temperature]
    })
  
    return arr.reverse();

}
