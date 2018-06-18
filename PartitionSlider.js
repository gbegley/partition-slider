var PartitionSlider = function(config ){

    var ps = this;
    ps.pct = d3.format(".0%");
    ps.f2p = d3.format(".2");
    ps.f2d = function(d){return +ps.f2p(d);};

    var defaults = {
        colors : [
            'rgba(255,0,0,0.7)',
            'rgba(250,105,0,0.7)',
            'rgba(79,155,255,0.5)',
            'rgba(0,177,0,0.65)'
        ],
        segments : [
            {name:'D',pct:0.30,color:'rgba(255,0,0,0.7)'},
            {name:'C',pct:0.40,color:'rgba(250,105,0,0.7)'},
            {name:'B',pct:0.20,color:'rgba(79,155,255,0.5)'},
            {name:'A',pct:0.10,color:'rgba(0,177,0,0.65)'}
        ],
        width:500,
        height:100,
        segment : {
            height:50,
            format : function(d){return ps.pct(d.pct);}
        },
        margins : {
            top:5,
            right:14,
            bottom:2,
            left:14
        },
    };

    var ds = defaults.segments;
    ps.config = Object.create(config||{});
    for(var k in defaults) if(!ps.config[k]) ps.config[k] = defaults[k];

    ps.segments = ps.config.segments || defaults.segments;
    ps.segments.forEach(function(d,i){
        d.position = i;
        if(!d.color) d.color = ds[i % ds.length ].color;
    });

    ps.id = config.id || 'partitionSlider';
    ps.root = ps.config.root ? ps.config.root : typeof ps.id == 'string' ? d3.select("#"+ps.id) : null;
    var cm = ps.config.margins;


    ps.root = (ps.config.root && d3.select(ps.config.root)) ||
        ps.config.selector && d3.select(ps.config.selector) ||
        ps.config.id && d3.select("#"+ps.config.id);

    if(!ps.root) ps.root = d3.select("body");

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

        var startPct = 0;
        var segments = tray.selectAll("g.segment").data(ps.segments);
        segments.exit().remove();
        segments.enter().append("g").attr("class",function(s){return "segment segment-"+s.name+" segment-pos-"+s.position;})
            .attr("transform",function( s ){
                var w = ps.xscale(s.pct);
                s.startPct = startPct;
                startPct = startPct + s.pct;
                return "translate("+ps.xscale(s.startPct)+",0)"
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
                    .classed("pctLabel",true)
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
        console.log('adding drag handlers');
        var container = stage.select(".segments-tray");
        var dragStartPct = 0;
        stage.selectAll("g.segments-tray g.slider").call(
                d3.drag()
                    .container(container.node())
                    .on("start",function(){
                        d3.event.sourceEvent.preventDefault();
                        d3.select(this).style("fill","red");
                        console.log('drag started');
                        dragStartPct = ps.xscale.invert(d3.event.x);
                    })
                    .on("end",function(){
                        d3.select(this).style("fill","white");
                    })
                    .on("drag",function(){
                        var gSlider = d3.select(this),
                            d = d3.event.subject,
                            p = d.position;
                        gSlider.attr("transform",function(d){
                            return "translate("+d3.event.x+",0)";
                        });
                        var h = ps.segments[d.position], l = ps.segments[d.position-1];

                        var slidePct = ps.f2d( ps.xscale.invert(d3.event.x));
                        var hstartPct = h.startPct;
                        var hdeltaPct = ps.f2d( slidePct - hstartPct );
                        var hpctStartNew = ps.f2d(hstartPct + hdeltaPct);
                        var hpct = ps.f2d( h.pct - hdeltaPct);
                        var lpct = ps.f2d( hpctStartNew - l.startPct );

                        // updateSegments(ps.stage);
                        // console.log("X: "+d3.event.x+
                        //     " N: "+d.name+":"+p+" LPct: "+l.pct+"->"+lpct+" HPct: "+h.pct+"->"+hpct+"@"+hpctStartNew);

                        var hw = ps.xscale(hpct), lw = ps.xscale(lpct), hp = ps.xscale(hpctStartNew);
                        var hg = d3.select("g.segment-pos-"+p)
                            .attr("transform","translate("+hp+",0)");
                        hg.select("rect.segment").attr("width",hw);
                        hg.select("g.label").attr("transform","translate("+hw/2+","+ps.config.segment.height/2+")");
                        hg.select("text.pctLabel").text(ps.pct(hpct));


                        var lg = d3.select("g.segment-pos-"+(p-1));
                        lg.select("rect.segment").attr("width",lw);
                        lg.select("g.label").attr("transform","translate("+lw/2+","+ps.config.segment.height/2+")");
                        lg.select("text.pctLabel").text(ps.pct(lpct));

                        h.pct = hpct;
                        h.startPct = hpctStartNew;
                        l.pct = lpct;

                    })
        );
    };


    if(ps.root) {

        var bcr = ps.root.node().getBoundingClientRect();
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