var PartitionSlider = function(config ){

    var pct = d3.format(".0%");

    var defaults = {
        segments : [
            {name:'D',pct:0.30,color:'rgba(255,0,0,0.7)'},
            {name:'C',pct:0.40,color:'rgba(250,105,0,0.7)'},
            {name:'B',pct:0.20,color:'rgba(79,155,255,0.5)'},
            {name:'A',pct:0.10,color:'rgba(0,177,0,0.65)'}
        ],
        width:500,
        height:70,
        segment : {
            height:35,
            format : function(d){return pct(d.pct);}
        },
        margins : {
            top:5,
            right:14,
            bottom:2,
            left:14
        },
    };


    var ps = this;
    ps.config = Object.create(config||{});
    for(var k in defaults) if(!ps.config[k]) ps.config[k] = defaults[k];

    ps.segments = ps.config.segments || defaults.segments;
    ps.segments.forEach(function(d,i){
        d.position = i;
    });

    ps.id = config.id || 'partitionSlider';
    ps.root = d3.select("#"+ps.id);
    var cm = ps.config.margins;


    var root = ps.root = d3.select("#"+config.id), svg = null;
    if(!root) root = ps.root = d3.select("body");

    var initialize = function(){
        // Create scale
        var xscale = ps.xscale = d3.scaleLinear()
            .domain([0,1])
            .range([0, ps.config.width - cm.left - cm.right]);
    };

    var drawAxis = function( root ){
        var cm = ps.config.margins;

        // Add scales to axis
        var x_axis = ps.x_axis = d3.axisBottom().scale(ps.xscale);
        x_axis.ticks(9);
        x_axis.tickFormat(d3.format(".0%"));

        //Append group and insert axis
        var gxasix = root.append("g").attr("transform","translate(0,"+(ps.config.height-cm.top-cm.bottom-20)+")");
        gxasix.call(x_axis);
    };

    var updateSegments = function( root ) {
        var tray = root.select("g.segments-tray");
        if(tray.size()==0) {
            tray = root.append("g")
                .classed("segments-tray",true)
            //    .attr("transform","translate(0,"+(ps.config.height/2)+")")
            ;
        }

        var start = 0;
        var segments = tray.selectAll("g.segment").data(ps.segments);
        segments.exit().remove();
        segments.enter().append("g").attr("class",function(s){return "segment segment-"+s.name+" segment-pos-"+s.position;})
            .attr("transform",function( s ){
                var w = ps.xscale(s.pct);
                s.start = start;
                start = start + w;
                return "translate("+s.start+",0)"
            })
                .append("rect")
                    .attr("class",function(s){return "segment segment-"+s.name;})
                    .attr("height",ps.config.segment.height)
                    .attr("width",function(s){return ps.xscale(s.pct);})
                    .style("fill",function(s){return s.color;})
        ;
        tray.selectAll("g.segment")
            .append("g").classed("label",true)
            .attr("transform",function(d){
                var x =  ps.xscale(d.pct)/2;
                var y =  ps.config.segment.height/2;
                return "translate("+x+","+y+")";
            })
            .each(function(d){
                var g = d3.select(this);
                var t1 = g.append("text")
                    .attr("dy",-ps.config.segment.height/6)
                    .style("font-size","10px")
                    .text(ps.config.segment.format);
                var t2 = g.append("text")
                    .attr("dy",ps.config.segment.height/4)
                    .style("font-weight","bold")
                    .style("font-size","12px")
                    .text(function(d){return d.name;});
                g.selectAll("text")
                    .style("text-anchor","middle")
                    .style("font-family","arial");
            });

        tray.selectAll("g.segment")
            .append("text")
            .style("font-size","10px")
            .style("font-family","arial")
            .style("text-anchor","start")
            .attr("dy",ps.config.segment.height/2)
            .attr("dx",function(s){return ps.xscale(s.pct)/2;})
            .text();

        var sliderSoFar = 0;
        var sliders = tray.selectAll("g.slider")
                .data(ps.segments);
        sliders.exit().remove();
        sliders.enter()
            .append("g").attr("class",function(d){
                return "slider";
            })
            .attr("transform",function(d){
                var w =  ps.xscale(d.pct);
                var y =  0; // ps.config.segment.height/2;
                var x = sliderSoFar;
                sliderSoFar+=w;
                var r =  "translate("+x+","+y+")";
                return r;
            })
            .append("rect")
            .attr("height",ps.config.segment.height*1.2)
            .attr("width",ps.config.segment.height/4)
            .attr("x",-ps.config.segment.height/8)
            .attr("y",-ps.config.segment.height*0.2/2)
            .attr("rx",5)
            .attr("ry",5)
            .style("stroke","#bbb")
            .style("stroke-width",1)
            .style("fill","white")
            .style("fill-opacity",0.6)
            .style("cursor","ew-resize")
        ;
        tray.select("g.slider").remove();
    };


    var addDragHandlers = function(stage) {
        var container = stage.select(".segments-tray");
        var pos = 0;
        stage.selectAll("g.segments-tray g.slider").call(
                d3.drag()
                    .container(container.node())
                    .on("start",function(){
                        d3.event.sourceEvent.preventDefault();
                        d3.select(this).style("fill","red");
                        console.log('drag started');
                        pos = d3.event.x;
                    })
                    .on("end",function(){
                        d3.select(this).style("fill","white");
                    })
                    .on("drag",function(){
                        var gSlider = d3.select(this), d = d3.event.subject, p = d.position, delta = d3.event.x - pos;
                        gSlider.attr("transform",function(d){
                            return "translate("+d3.event.x+",0)";
                        });
                        var h = ps.segments[d.position], l = ps.segments[d.position-1];
                        h.pct -= delta;
                        l.pct += delta;
                        // updateSegments(ps.stage);
                        console.log("Pos:"+pos+" X: "+d3.event.x+" N: "+d.name+" pos: "+p+" dx: "+d3.event.dx+" D: "+delta+" LPct: "+l.pct+" HPct: "+h.pct);





                        // var traypct = pctp2(x.invert(trayx));
                        // var d = d3.event.subject;
                        //
                        // var sh = d3.select(this);
                        //
                        //
                        // var low = segments.get(d.position-1), high = d;
                        // var lowTrayItem = d3.select(".slider-tray-item-"+low.position);
                        // var newLowPct = pctp2( traypct - low.start );
                        // var lowPctDelta = pctp2(newLowPct - low.pct);
                        //
                        // var highTrayItem = d3.select(".slider-tray-item-"+high.position);
                        // var highPctDelta = pctp2(traypct-high.start);
                        //
                        // low.pct = newLowPct;
                        // high.start = traypct;
                        // high.pct = pctp2(high.pct-lowPctDelta);
                        // console.log('dragging tray-x:'+trayx+" -> "+traypct+", low-pct: "+low.pct+"   high-pct: "+high.pct);
                        //
                        // sh.style("left",(traypct*100)+"%");
                        // lowTrayItem.style("width",(low.pct*100)+"%");
                        // lowTrayItem.select(".slider-tray-item-label").text(low.pct*100+"%")
                        //
                        // highTrayItem.style("left",(high.start*100)+"%").style("width",(high.pct)*100+'%');
                        // highTrayItem.select(".slider-tray-item-label").text(high.pct*100+"%")

                    })
        );
    };


    if(ps.root) {

        var bcr = root.node().getBoundingClientRect();
        // Append SVG
        var svg = ps.svg = ps.root
            .append("svg")
            .attr("width", ps.config.width)
            .attr("height", ps.config.height);
        var stage = ps.stage = svg.append("g")
            .classed("stage",true)
            .attr("transform","translate("+cm.left+","+cm.top+")");

        initialize();
        drawAxis( stage );
        updateSegments( stage );

        addDragHandlers( stage );

    }






};