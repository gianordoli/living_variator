var ChartMaker = {

    makeChart: function(container, control){

        var margin = {top: 10, right: 10, bottom: 10, left: 10};
        var width  = 200 - margin.left - margin.right;
        var height = 200 - margin.top - margin.bottom;

        var obj = {};

        var dataset;

        var svg, chart;
        var xScale, yScale;

        obj.setup = function(container, control){
            obj.control = control;
            svg = d3.select(container)
                        .append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("id", "chart-"+control)
                        ;
        }

        obj.update = function(_dataset){
            dataset = dataset;
            console.log(dataset);


        }

        obj.setup(container, control);

        return obj;
    }
}