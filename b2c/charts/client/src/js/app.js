import Chart     from "chart.js";            // Module for drawing diagrams
import Socket    from "socket.io-client";    // Sockets, to get data from server
import Functions from "./lib/Functions";     // Helpful functions

const socket = Socket.connect();

// variable for store the diagram
let diagram   = false;

// timer for frenquency of refresh diagrams
let refreshTimer = 500;

// variable for store the amount of diagrams
let diagramsAmount = 1;
// variable for store the diagrams
let diagrams  = [];

// if we can reload all diagrams
let pending = false;




$( document ).ready(() => {

  // Emitted when single diagram points was inited
  socket.on('coordinates', (points) => {
    initSingleDiagram(points);
  });

  // Emitted when several diagram points was inited
  socket.on('diagrams', (data) => {
    if (diagramsAmount == 1) {
      diagramsAmount = data.length;
      $('select').val(diagramsAmount);
    }

    // if pending is going do nothing
    if (!pending) {
      initDiagrams();
    }
  });


  /**
   * Handle change amount of diagrams
   */
  $('form.number').on('submit', (e) => {
    e.preventDefault();

    let number = $(e.target).find('select').val();
    number == 1 ? initSingle() : initSeveral(number);
  });

});


/**
 * Init single diagram
 */
function initSingle() {
  // set amount diagrams to 1
  diagramsAmount = 1;

  if ($('#diagrams .item').length > 1 || diagrams.length) {
    removeExternalDiagrams(1, true);
  }

  Functions.sendRequest("/api/v1/init/single", false, {method: "GET"})
      .then(({points}) => {
        initSingleDiagram(points);
      })
      .catch(Functions.showMsg);
}


/**
 * Init several diagrams
 * @param number
 */
function initSeveral(number) {
  checkDiagramBlocks(number);

  Functions.sendRequest(`/api/v1/init/several/${number}`, false, {method: "GET"})
      .then(({n, data}) => {
        diagramsAmount = n;
      })
      .catch(Functions.showMsg);
}


/**
 * Add orr remove diagrams
 * @param number
 */
function checkDiagramBlocks(number) {
  let diagramsSet = $('#diagrams .item');

  if (diagramsSet.length > number) {
    removeExternalDiagrams(number);
  } else {
    for (let i = diagramsSet.length; i < number; i++) {
      $('#diagrams .item').last().after(`<canvas id="diagram${i}" class="item"></canvas>`);
    }
  }
}


/**
 * Remove diagrams which we do not need more
 * @param number
 * @param single
 */
function removeExternalDiagrams(number, single = false) {

  // Destroy first element if hare is single diagram
  if (single) {
    if (diagrams.length && "destroy" in diagrams[0]) {
      diagrams[0].destroy();
    }
  }

  $('#diagrams .item').each((index, elem) => {
    if (index > number - 1) {
      // If diagram already exists, destroy it
      tryDestroyExisted(diagrams[index]);
      elem.remove();
    }
  });

  diagrams.splice(number, diagrams.length - number);
}


/**
 * Init several diagrams when sockets notified us on data points ready
 */
function initDiagrams() {
  pending = true;
  checkDiagramBlocks(diagramsAmount);

  if (diagramsAmount > 1) {
    // Try destroy single diagram
    tryDestroyExisted(diagram);

    // Get the diagrams data by http request
    getDiagramsData()
        .then((data) => {
          data.map((points,index) => {
            initDiagram(points, index)
          });

          // Clear pending throughout time
          setTimeout(() => pending = false, refreshTimer)
        })
        .catch(Functions.showMsg)
  }

  pending = false;
}



/**
 * Draw diagram when several
 * @param points
 * @param index
 */
function initDiagram(points, index) {
  // If diagram already exists, destroy it
  let diagram = diagrams.length && diagrams[index] ? diagrams[index] : false;

  tryDestroyExisted(diagram);

  let diagramBlock = document.getElementById(`diagram${index || ""}`);

  if (!diagramBlock) {
    console.log('no block');
    return false;
  }

  // Draw the circle diagram
  diagrams[index] = new Chart(diagramBlock, getDiagramParams(points));
}


/**
 * Get diagrams points
 * @returns {Promise}
 */
function getDiagramsData() {
  let data = [];

  return new Promise((resolve, reject) => {
    let getByNumber = (number = 0) => {

      Functions.sendRequest(`/api/v1/points/${number}`, false, {method: "GET"})
          .then(({points}) => {
            data.push(points);
            number == diagramsAmount - 1 ? resolve(data) : getByNumber(number + 1)
          })
          .catch(Functions.showMsg);
    };

    getByNumber();
  });
  
}


/**
 * Draw diagram
 * @param points
 */
function initSingleDiagram(points) {
  // If diagram already exists, destroy it
  tryDestroyExisted(diagram);

  // Draw the circle diagram
  diagram = new Chart(document.getElementById("diagram"), getDiagramParams(points));
}


/**
 * Destroy diagram
 * @param diagram
 */
function tryDestroyExisted(diagram) {
  if (diagram && "destroy" in diagram) {
    diagram.destroy();
  }
}


/**
 * Get params for drawing the diagram
 * @param points
 * @returns {{type: string, data: {labels: *, datasets: *[]}}}
 */
function getDiagramParams(points) {
  return {
    type: 'line',
    data: {
      labels: points,
      datasets: [{
        label: "Frequency",
        data: points,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
        borderCapStyle: 'butt',
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        pointBorderColor: "rgba(75,192,192,1)",
        pointBackgroundColor: "#fff",
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgba(75,192,192,1)",
        pointHoverBorderColor: "rgba(220,220,220,1)",
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        lineTension: 0.1
      }]}}
}