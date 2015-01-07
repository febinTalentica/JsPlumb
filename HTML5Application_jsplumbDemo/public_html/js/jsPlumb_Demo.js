jsPlumb.ready(function() {

	var instance = jsPlumb.getInstance({
		// default drag options
		DragOptions : { cursor: 'pointer', zIndex:2000 },
		// the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
		// case it returns the 'labelText' member that we set on each connection in the 'init' method below.
		ConnectionOverlays : [
			[ "Arrow", { location:1 } ],
			[ "Label", { 
				location:0.5,
				id:"label",
				cssClass:"aLabel"
			}]
		],
		Container:"flowchart-demo"
	});

	// this is the paint style for the connecting lines..
	var connectorPaintStyle = {
		lineWidth:4,
		strokeStyle:"#ffb7af",
		joinstyle:"round",
		outlineColor:"white",
		outlineWidth:2
	},
	// .. and this is the hover style. 
	connectorHoverStyle = {
		lineWidth:4,
		strokeStyle:"#216477",
		outlineWidth:2,
		outlineColor:"white"
	},
	endpointHoverStyle = {
		fillStyle:"#216477",
		strokeStyle:"#216477"
	},
	// the definition of source endpoints (the small blue ones)
	sourceEndpoint = {
                maxConnections:-1,
		endpoint:"Dot",
		paintStyle:{ 
			//strokeStyle:"#FFEF00",
			fillStyle:"#FFEF00",
			radius:8,   
			lineWidth:2 
		},				
		isSource:true,
		connector:[ "Bezier", { curviness:90 } ],								                
		//connector:[ "Bezier", { curviness:90, stub:[40, 60], gap:10, cornerRadius:5, alwaysRespectStubs:true } ],								                
		connectorStyle:connectorPaintStyle,
		hoverPaintStyle:endpointHoverStyle,
		connectorHoverStyle:connectorHoverStyle,
        dragOptions:{},
        overlays:[
        	[ "Label", { 
            	location:[0.5, 1.5], 
            	//label:"Drag",
            	cssClass:"endpointSourceLabel" ,
                label: "lovers"
            } ]
        ]
	},		
	// the definition of target endpoints (will appear when the user drags a connection) 
	targetEndpoint = {
                maxConnections:-1,
		endpoint:"Dot",					
		paintStyle:{ fillStyle:"#7AB02C",radius:8 },
		hoverPaintStyle:endpointHoverStyle,
		dropOptions:{ hoverClass:"hover", activeClass:"active" },
		isTarget:true,			
        overlays:[
        	[ "Label", { location:[0.5, -0.5], 
                        //label:"Drop", 
                        cssClass:"endpointTargetLabel" } ]
        ]
	},			
	init = function(connection) {			
		//connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
		connection.getOverlay("label").setLabel("Labels");
		connection.bind("editCompleted", function(o) {
			if (typeof console != "undefined")
				console.log("connection edited. path is now ", o.path);
		});
	};			

	var _addEndpoints = function(toId, sourceAnchors, targetAnchors) {
			for (var i = 0; i < sourceAnchors.length; i++) {
				var sourceUUID = toId + sourceAnchors[i];
                                console.log("uuid :: sourceUUID: " + sourceUUID);
				instance.addEndpoint("flowchart" + toId, sourceEndpoint, { anchor:sourceAnchors[i], uuid:sourceUUID });						
			}
			for (var j = 0; j < targetAnchors.length; j++) {
				var targetUUID = toId + targetAnchors[j];
                                console.log("uuid :: targetUUID: " + targetUUID);
				instance.addEndpoint("flowchart" + toId, targetEndpoint, { anchor:targetAnchors[j], uuid:targetUUID });						
			}
		};

	// suspend drawing and initialise.

        function MultiDimensionalArray(iRows, iCols) {
            var i;
            var j;
            var table = new Array(iRows);

            for (i = 0; i < iRows; i++) {
                table[i] = new Array(iCols);
                for (j = 0; j < iCols; j++) {
                    table[i][j] = false;
                }
            }
            return (table);
        }
        
        var top = 5;
        var left = 5;
        var fixedInScreen = {};
        //var multiArr = MultiDimensionalArray(5, 5);
	instance.doWhileSuspended(function() {
                function node(id,data) 
                {
                    this.nodeID = id;
                    this.nodeData = data;
                }
                function findNeighbours (x,y) 
                {
                    return [[x,y+1],[x+1,y+1],[x+1,y] ];
                }
                
                $.getJSON( "data/GraphData.json", function( json ) {
                    var nodes = json.nodes;
                    var rels = json.relation;
                    console.log( "JSON Data: " + JSON.stringify(json.nodes) );
                    //console.log( "JSON Data: " + $.parseJSON(json));
                    
                    $.each( nodes, function( key, val ) {
                        console.log("key :" + key + " :: val :" +val);
                        //var parsedCustomer = JSON.parse(val);
                        //console.log("parsed :" + parsedCustomer);
                        var nodeObject = $.extend(new node(), val);
                        console.log("customerObject :" + nodeObject.nodeID );
                        
                        $('<div/>', {
                            id: "flowchart" + nodeObject.nodeID,
                            //href: 'http://google.com',
                            //title: 'Become a Googler',
                            //rel: 'external',
                            text: nodeObject.nodeData
                        }).appendTo('#flowchart-demo');
                        $('#flowchart'+nodeObject.nodeID).addClass("window");
                        //top+=4;
                        //left+=10;
                        $('#flowchart'+nodeObject.nodeID).css({'top':top+'em','left':left+'em'});
                        fixedInScreen[nodeObject.nodeID] = false;
                    });
                    jsPlumb.draggable($(".window"));
                   // var x=0; // co-ordinates for the Matrix
                    //var y=0;
                    
                    $.each( rels, function( key, val ) {
                        console.log("Relation :: key :" + key + " :: val :" +val);
                        console.log("Fixed IN Key : " + fixedInScreen[key]);
                        if (!fixedInScreen[key])
                        {
                            $('#flowchart'+val).css({'top':top+'em','left':left+'em'});
                            fixedInScreen[key] = true;
                           // multiArr[x][y] = true;
                        }
                        _addEndpoints(key, ["RightMiddle"], []);
                        left+=17;
                        top = -1;
                        //var positions = findNeighbours(x,y);
                        //var posVar=0;
                        //var posX,posY;
                        $.each(val,function(arrKey,arrVal){
                            console.log("Relation arrVal :" + arrVal);
                            
                            if (!fixedInScreen[arrVal])
                            {
                                //[posX,posY] = [0,0];
                                //findPos (positions,posVar);
                              
                               // while(multiArr[positions[posVar][0]][positions[posVar][1]] === true)
                                //{
                               //     posVar++;
                               // }
                                //top = top * positions[posVar][0];
                                //left = left * positions[posVar][1];
                               // multiArr[positions[posVar][0]][positions[posVar][1]] = true;
                               // posVar++;
                                //console.log("posVar :" + posVar + " :: top:" + top + " :: left:" + left);
                                top+=2;
                                $('#flowchart'+arrVal).css({'top':top+'em','left':left+'em'});
                                top+=7;
                                fixedInScreen[arrVal] = true;
                            }
                            
                            _addEndpoints(arrVal, [], ["LeftMiddle"]);
                            instance.connect({uuids:[key+"RightMiddle", arrVal+"LeftMiddle"], editable:true});
                            //x = positions[posVar][0]+1;
                           // y = positions[posVar][1]+1;
                        });
                        
                        //var parsedCustomer = JSON.parse(val);
                        //console.log("parsed :" + parsedCustomer);
                       // var nodeObject = $.extend(new node(), val);
                       // console.log("customerObject :" + nodeObject.nodeID );
                    });
                    
                 });

/*
		_addEndpoints("Window5", [], ["LeftMiddle"]);			
		_addEndpoints("Window4", [], ["LeftMiddle"]);			
		_addEndpoints("Window2", ["BottomCenter"], ["LeftMiddle"]);
		_addEndpoints("Window3", ["RightMiddle"], ["LeftMiddle"]);
		_addEndpoints("Window1", ["RightMiddle"], []);   
                **/
		// listen for new connections; initialise them the same way we initialise the connections at startup.
		instance.bind("connection", function(connInfo, originalEvent) { 
			init(connInfo.connection);
		});			
					
		// make all the window divs draggable						
		instance.draggable(jsPlumb.getSelector(".flowchart-demo .window"), { grid: [20, 20] });		
		// THIS DEMO ONLY USES getSelector FOR CONVENIENCE. Use your library's appropriate selector 
		// method, or document.querySelectorAll:
		//jsPlumb.draggable(document.querySelectorAll(".window"), { grid: [20, 20] });
                
                /*
		// connect a few up
		instance.connect({uuids:["Window1RightMiddle", "Window2LeftMiddle"], editable:true});
		instance.connect({uuids:["Window2BottomCenter", "Window3LeftMiddle"], editable:true});
		instance.connect({uuids:["Window2BottomCenter", "Window4LeftMiddle"], editable:true});
		instance.connect({uuids:["Window3RightMiddle", "Window5LeftMiddle"], editable:true});
		//instance.connect({uuids:["Window4BottomCenter", "Window1TopCenter"], editable:true});
		//instance.connect({uuids:["Window3BottomCenter", "Window1BottomCenter"], editable:true});
		//
                **/
		//
		// listen for clicks on connections, and offer to delete connections on click.
		//
		instance.bind("click", function(conn, originalEvent) {
			if (confirm("Delete connection from " + conn.sourceId + " to " + conn.targetId + "?"))
				jsPlumb.detach(conn); 
		});	
		
		instance.bind("connectionDrag", function(connection) {
			console.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement, " of type ", connection.suspendedElementType);
		});		
		
		instance.bind("connectionDragStop", function(connection) {
			console.log("connection " + connection.id + " was dragged");
		});

		instance.bind("connectionMoved", function(params) {
			console.log("connection " + params.connection.id + " was moved");
		});
                
                jsPlumb.draggable(
			jsPlumb.getSelector(".window"),
			{ containment:".demo"}
		);
	});

	jsPlumb.fire("jsPlumbDemoLoaded", instance);
	
});