var RankingConfig = function( profile ){

    var me = this;
    me.profile= profile;

    var rankColors = [
        'rgba(255,0,0,0.7)',
        'rgba(250,105,0,0.7)',
        'rgba(79,155,255,0.5)',
        'rgba(0,177,0,0.65)'
    ];


    var weightToPctMapper = function(d){
        if(!d.pct) d.pct = d.weight;
        if(!d.name) d.name=d.id;
        return d;
    };

    var createSlider = function(conf) {
        if(conf.root) conf.root.selectAll("svg").remove();
        if(conf.segments) {
            conf.segments = conf.segments.map(weightToPctMapper);
        }
        var ps = new PartitionSlider(conf);
        return ps;
    };

    var actdiv = function(sel,cls,t) {
        var s = sel.append("div");
        s.attr("class",cls);
        if(t) s.text(t);
        return s;
    };

    var actTitle = function(sel,cls,t,tools){
        var s = actdiv(sel,cls);
        var tdiv = s.append("div").attr("class","title");
        var tc = tdiv.append("div").attr("class","title-content");
        var tt = tdiv.append("div").attr("class","tools");
        tc.text(t);
        if(tools) {
            if(!tools.length) tools = [tools];
            tt.selectAll("i.tool.fa").data(tools).enter().append("i").attr("class",function(t){
                return "tool fa fa-"+t;
            });
        }
        return s;
    };

    var ranksCopy = function(source) {
        var a = [];
        for(var i=0;i<source.length;i++) {
            a[i] = {
                name:source[i].name,
                pct:source[i].pct
            };

        }
        return a;
    };


    me.appendTo = function( root, profile,tools ) {
        var me = this;
        me.profile = profile = profile || me.profile;
        var sroot = me.root = d3.select(root);



        var pd = actdiv(sroot,"profile");
        actTitle(pd,"profile-title",profile.name,tools);


        var metricGroupsSet = actdiv(pd,"metric-groups-set");
        var metricRanks = actdiv(metricGroupsSet,"metric-ranks");
        var mrt = actTitle(metricRanks,"metric-ranks-title","Metric Ranks");
        var metricRanksPartition = actdiv(metricRanks,"metric-ranks-partition partition");
        // metricRanks.select(".fa.fa-close").on("click",function(){metricRanks.style("visibility","hidden")});

        var metricGroups = actdiv(metricGroupsSet,"metric-groups");
        metricGroups.selectAll(".metric-group").data(profile.metricGroups).enter()
            .append("div").classed("metric-group",true)
            .each(function(d,mgi){
                var mg = d3.select(this);
                actTitle(mg,"metric-group-title group-title",d.name);
                var mgp = actdiv(mg,"metric-group-partition partition");
                var mgSlider = createSlider({root:mgp,segments:d.metrics,segment:{height:true}});
                mgp.style("borderColor",d.color);

                mg.selectAll("g.segment rect").on("click",function(d,i){
                    var rect = d3.select(this);
                    console.log("segment clicked");
                    d.ranks = d.ranks || ranksCopy(profile.defaultRanks.slice(0).reverse());
                    metricRanks.datum(d);
                    metricRanks.style("visibility","visible");
                    var tc = metricRanks.select(".metric-ranks-title .title .title-content");
                    tc.text("");
                    tc.selectAll("*").remove();
                    actdiv(tc,"heading","Metric Ranks")
                        .style("font-size","80%")
                        .style("font-weight","normal")
                    ;
                    actdiv(tc,"sub",d.name);

                    metricGroupsSet.selectAll("g.segment rect").classed("on",false);
                    rect.classed("on",true);
                    var s = createSlider({
                        root:metricRanks.select(".metric-ranks-partition"),
                        segments:d.ranks,
                        vertical:true,
                        segment:{
                            height:true,
                            colors : rankColors
                        }
                    });
                    s.root.selectAll("g.segment rect")
                        .style("fill-opacity","1")
                        .style("stroke-width","4")
                        .transition()
                        .duration(850)
                        .ease(d3.easeLinear)
                        .style("fill-opacity", 0.5)
                        .style("stroke-width","1")
                    ;

                })
            })
        ;

        var overallDiv = actdiv(pd,"metric-groups-overall");
        var overallTitle = actTitle(overallDiv,"overall","Overall");

        var metricGroupsPartition = actdiv(overallDiv,"metric-groups-partition partition");
        me.overallSlider = createSlider({root:metricGroupsPartition,segments:profile.metricGroups,segment:{height:true}});

        metricGroups.selectAll(".metric-group .partition")
            .data(me.overallSlider.config.segments)
            .each(function(s){
                var g = d3.select(this);
                g.style("border-color",s.color);
            })
        ;

    }

};