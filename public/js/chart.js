var ChartMaker = {

    makeChart: function(container, control){

        var margin = {top: 10, right: 0, bottom: 10, left: 30};
        var width  = 200 - margin.left - margin.right;
        var height = 200 - margin.top - margin.bottom;

        var obj = {};

        var dataset = [];
        var nDataPoints = 100;

        var svg, chart;
        var xScale, yScale;
        var yAxis;

        setup(container, control);

        function setup(container, control){

            // FUNCTIONS
            x = d3.scale.linear()
                .domain([0, nDataPoints - 1])
                .range([0, width]);

            y = d3.scale.linear()
                .domain([0, 255])
                .range([height, 0]);

            yAxis = d3.svg.axis()
              .scale(y)
              .orient("left")
              ;

            line = d3.svg.line()
                .x(function(d, i) { return x(i); })
                .y(function(d, i) { return y(d); });

            // SVG ELEMENTS
            svg = d3.select(container)
                        .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .attr("id", "chart-"+control)
                        ;

            chart = svg.append("g")
                   .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                   ;

            chart.append("g")
                .attr("class", "y axis")
                ;

            yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                ;

            chart.select('.y.axis')
                .call(yAxis)
                ;

            chart.append("path")
                .attr("class", "line")
                ;
        }

        obj.update = function(_dataset){
            dataset.push(_dataset["outputFinalValue"]);
            // console.log(_dataset);
            if(dataset.length > nDataPoints){
                dataset.splice(0, 1);
            }

            // chart.selectAll("path.line").remove();

            chart.select("path.line")
                .datum(dataset)
                .attr("d", line);

        };

        return obj;
    }
}