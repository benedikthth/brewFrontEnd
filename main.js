'use strict';

let maxColor = {r: 150, g: 0, b:0},
minColor = {r: 0, g: 150, b:200};

let data = [];

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
    $.ajax(
        {
            url: `http://www.brewApi.spock.is/temperature`,

        }
    ).done((d)=>{
       
        
        data = JSON.parse(d);
        data = data.filter((x)=>{return x!=null});
        
        drawChart();

        //console.log(minutesSince(data[0].dtime));
        

    })
}



/**
 * Assume that the table should only display for one station at a time.
 * 
 */
function drawTable(){
    //clear the old table.
    $('#table').empty();
    //default language is english.
    
 

    //table row for sum.
  
    //append table to div.
    //$('#table').append(table);
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


function drawChart(){

    Highcharts.chart('chart', {
        chart: {
          type: 'spline'
        },
        title: {
          text: `Last recorded temperature: <b>${data[0].temperature}</b>`
        },
        subtitle: {
          text: `Next measurement in ${15 - minutesSince(data[0].dtime)} minutes (15 minute intervals)`
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
            text: 'Temperature (C)'
          }
          //min: minVal() - 5
        },
        tooltip: {

          headerFormat: '<b>{series.name}</b><br>',
          pointFormat: '{point.x:%e. %b - %H:%M}: <b>{point.y:.2f} c</b>'
        },
      
        plotOptions: {
          spline: {
            marker: {
              enabled: true
            }
          }
        },
      
        series: [{
          name: 'Temperature',
          data: getData()
        }]
    });
}

function getData(){

    let arr = data.map((x)=>{
        return [new Date(x.dtime.replace(' ','T')+'Z').getTime(), x.temperature]
    })
  
    return arr.reverse();

}
