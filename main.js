'use strict';

let maxColor = {r: 150, g: 0, b:0},
minColor = {r: 0, g: 150, b:200};

//let data = [];

$(document).ready(()=>{    
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

    $.ajax( {url: `http://www.brewApi.spock.is/temperature?hourLimit=${48}` }).done((d)=>{
        d = JSON.parse(d);
        //data = JSON.parse(d);
        drawChart(d, 'data for the last 48 hours', '48HourChart');
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

function drawChart(data, title, renderingDiv){

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
          }
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
