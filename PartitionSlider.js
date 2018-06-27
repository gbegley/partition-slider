var PartitionSlider = function( config ){

    var ps = this;
    ps.pct = d3.format(".0%");
    ps.f2p = d3.format(".2");
    ps.f2d = function(d){return +ps.f2p(d);};
    var fpct = ps.fpct = function(s){return ps.scale(s.pct);};
    var vPixelHeight = ps.vPixelHeight = function(s){return ps.scale(1-s.pct);};
    var fpctd2 = ps.fpctd2 = function(s){return ps.scale(s.pct)/2;}
    var fcolor = ps.fcolor = function(s){return s.color;};

    // limits to tick multiples between 0 and 1 inclusive;
    ps.f2dt = function(d){
        var m = 1/ps.config.tick;
        var dm = Math.round(d*m);
        if(dm<0) dm=0;
        else if (dm>m) dm = m;
        var x = dm/m;
        return +ps.f2p(x);
    };

    var defaults = {
        colors : [
            'rgba(255,0,0,0.7)',
            'rgba(250,105,0,0.7)',
            'rgba(79,155,255,0.5)',
            'rgba(0,177,0,0.65)'
        ],
        vertical : false,
        segments : [
            {name:'D',pct:0.30,color:'rgba(255,0,0,0.7)'},
            {name:'C',pct:0.40,color:'rgba(250,105,0,0.7)'},
            {name:'B',pct:0.20,color:'rgba(79,155,255,0.5)'},
            {name:'A',pct:0.10,color:'rgba(0,177,0,0.65)'}
        ],
        tray : {
            width:500,
            height:100
        },
        segment : {
            height:50,
            format : function(d){return ps.pct(d.pct);}
        },
        margins : {
            top:15,
            right:14,
            bottom:15,
            left:14
        },
        tick : 0.05,
        x2Pct : function(){
            var pct = ps.scale.invert(d3.event.x);
        }
    };


    // apply unspecified defaults to config
    ps.config = Object.create(config||{});
    for(var k in defaults) {
        if(!ps.config[k]) {
            ps.config[k] = defaults[k];
        }
    }

    var cs = config.segments;

    // setup segments default;
    var pcs = ps.config.segments;
    var defaultColors = defaults.segments.map(function(s){return s.color;}).reverse();
    pcs.forEach(function(d,i){
        d.position = i;
        if(!d.color) {
            d.color = defaultColors[ i % defaultColors.length ];
        }
    });

    var cm = ps.config.margins;
    ps.root = ps.config.root ||
        typeof(ps.id) == 'string' ? d3.select("#"+ps.id) : (typeof(ps.selector) == 'string' ? d3.select(ps.selector) : null);


    ps.root = (ps.config.root && d3.select(ps.config.root)) ||
        ps.config.selector && d3.select(ps.config.selector) ||
        ps.config.id && d3.select("#"+ps.config.id);

    if(!ps.root) ps.root = d3.select("body");

    var initialize = function(){
        var v = ps.config.vertical;
        // Create scale
        var max, scale;
        if(v) {
            max = ps.config.height - cm.top - cm.bottom;
            scale = ps.scale = d3.scaleLinear().domain([0,1]).range([max,0]);
        } else {
            max = ps.config.width - cm.left - cm.right;
            scale = ps.scale = d3.scaleLinear().domain([0,1]).range([0, max]);
        }
    };

    var drawAxis = function( root ){
        var axis, v = ps.config.vertical;
        var gaxis = root.append("g")
            gaxis.classed("axis",true);

        // Add scales to axis
        if(v) {
            axis = ps.axis = d3.axisRight().scale(ps.scale);
            gaxis.attr("transform","translate("+(ps.config.segment.height+8)+",0)");
        } else {
            axis = ps.axis = d3.axisBottom().scale(ps.scale);
            gaxis.attr("transform","translate(0,"+(ps.config.segment.height+8)+")");
        }
        axis.ticks(9);
        axis.tickFormat(d3.format(".0%"));

        //Append group and insert axis
        gaxis.call(axis);
    };


    var createSegments = function( tray ) {
        var v = ps.config.vertical, h = ps.config.segment.height;

        var segments = tray.selectAll("g.segment").data(ps.config.segments);

        //segments.exit().remove();
        segments = segments.enter()
            .append("g").attr("class",function(s){return "segment segment-pos-"+s.position;});

        segments.append("rect")
            .style("fill",function(s){return s.color;})
            .attr("class",function(s){return "segment segment-"+s.position;})
        ;

        segments.append("g").classed("label",true);

        segments.selectAll("g.label")
            .append("text").classed("pctLabel",true)
            .style("font-size","9px")
            .attr("dy",h/6)
        ;

        segments.selectAll("g.label").append("text")
            .classed("nameLabel",true)
            .style("font-weight","bold")
            .style("font-size","11px")
            .attr("dy",-h/10)
            .text(function(d,i){return d.name;})
        ;

        segments.selectAll("g.label text")
            .style("text-anchor","middle")
            .style("font-family","arial");

        var sliders = tray.selectAll("g.slider").data(ps.config.segments);
        sliders = sliders.enter().append("g")
            .attr("class",function(d,i){
                return "slider slider-pos-"+d.position;
            })
        ;
        sliders.append("rect")
            .attr("height",v ? h/4 : h*1.2)
            .attr("width",v ? h*1.2 : h/4)
            .attr("x",v ? -h*0.2/2 : -h/8)
            .attr("y",v ? -h/8 : -h*0.2/2 )
            .attr("rx",5)
            .attr("ry",5)
            .style("stroke","#bbb")
            .style("stroke-width",1)
            .style("fill","white")
            .style("fill-opacity",0.6)
            .style("cursor",v ? "ns-resize" : "ew-resize")



    };

    var updateSegmentsTray = function( tray ) {
        var v = ps.config.vertical, h = ps.config.segment.height;

        var startPct = 0;
        var segments = tray.selectAll("g.segment");

        //segments.exit().remove();
        segments.attr("transform",function( d, i ){
                var t = null;
                d.startPct = startPct;
                startPct = startPct + d.pct;
                if(!v) {
                    var startPix = ps.scale(d.startPct);
                    t = "translate("+startPix+",0)";
                } else {
                    var sh = vPixelHeight(d,i);
                    var startPix = ps.scale(d.startPct);
                    t = "translate(0,"+(startPix-sh)+")";
                }
                return t;
            });
        segments.selectAll("rect")
                .attr("height",function(d,i){
                    var t = h;
                    if(v) { t = vPixelHeight(d,i);}
                    return t;
                })
                .attr("width", function(d,i){
                    var w = h;
                    if(!v) { w = fpct(d,i);}
                    return w;
                })
        ;

        segments.selectAll("g.label")
            .attr("transform",function(d,i){
                var x,y;
                if(!v) {
                    x =  ps.scale(d.pct)/2;
                    y =  h/2;
                } else {
                    x = h/2;
                    y = vPixelHeight(d,i) /2
                }
                var t = "translate("+x+","+y+")";
                return t;
            })
            .each(function(d){
                var g = d3.select(this);

                var pct =  g.select("text.pctLabel")
                    .text(ps.config.segment.format);
            });


        var pctSoFar = 0;
        var sliders = tray.selectAll("g.slider");
        sliders.attr("transform",function(d,i){
                var pctNow = pctSoFar;
                pctSoFar+=d.pct;
                var sliderPos = ps.scale(pctNow), x, y;
                if(!v) {
                    y = 0;
                    x = sliderPos;
                } else {
                    x = 0;
                    y = sliderPos;
                }
                var r =  "translate("+x+","+y+")";
                return r;
            })
        ;
    };

    var addDragHandlers = function(stage) {
        var v = ps.config.vertical, h = ps.config.segment.height;
        console.log('adding drag handlers');
        var tray = stage.select("g.segments-tray");
        var dragStartPct = 0;
        var pcs = ps.config.segments;
        tray.selectAll("g.slider").call(
                d3.drag()
                    .container(tray.node())
                    .on("start",function(){
                        var d = d3.event.subject;
                        console.log('drag started on slider '+d.position);
                        d3.event.sourceEvent.preventDefault();
                        d3.select(this).select("rect").style("fill","red");
                        dragStartPct = ps.scale.invert(d3.event.x);
                    })
                    .on("end",function(){
                        console.log('drag ended');
                        d3.select(this).selectAll("rect").style("fill","white");
                    })
                    .on("drag",function(){
                        var gSlider = d3.select(this),
                            d = d3.event.subject,
                            p = d.position;

                        // high and low segments
                        var h = pcs[d.position], l = pcs[d.position-1];

                        var slidePct = ps.f2dt( ps.scale.invert(v ? d3.event.y : d3.event.x));

                        if(slidePct < l.startPct) {
                            slidePct = l.startPct;
                        } else if (slidePct > (h.startPct+h.pct) ) {
                            slidePct = ps.f2dt( h.startPct+h.pct );
                        } else if (l.startPct == h.startPct ) {

                        }

                        var hstartPct = h.startPct;
                        var hdeltaPct = slidePct - hstartPct;
                        var hpctStartNew = ps.f2d( hstartPct + hdeltaPct );
                        var hpct = ps.f2dt( h.pct - hdeltaPct);
                        var lpct = ps.f2dt( hpctStartNew - l.startPct );
                        hpctStartNew = l.startPct + lpct;

                        h.pct = hpct;
                        h.weight = h.pct;
                        h.startPct = hpctStartNew;
                        l.pct = lpct;
                        l.weight = l.pct;

                        updateSegmentsTray( tray );
                    })
        );
    };



    if(ps.root) {

        var bcr = ps.root.node().getBoundingClientRect();
        // Append SVG
        var svg = ps.svg = ps.root
            .append("svg");
        var w = ps.config.width = ps.config.width || bcr.width;
        var h = ps.config.height = ps.config.height || bcr.height;

        svg.style("left", 0+"px").style("top", 0+"px");
        svg.style("width", w+"px" )
            .style("height", h +"px");

        var transform = "translate("+cm.left+","+cm.top+")";
        var stage = ps.stage = svg.append("g")
            .classed("stage",true).attr("transform",transform);

        var tray = stage.select("g.segments-tray");
        if(tray.size()==0) {
            tray = stage.append("g").classed("segments-tray",true);
            //if(v) tray.attr("transform","rotate(90,0,"+ps.config.segment.height+")");
        }


        initialize();
        drawAxis( stage );
        createSegments( tray );
        tray.select("g.slider").attr("display","none"); // remove the first slider (at 0%)

        updateSegmentsTray( tray );


        addDragHandlers( stage );

    }






};