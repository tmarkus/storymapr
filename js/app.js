var lanes = 0; //number of lanes	
var default_story_text = "My cat ate my homework."

var cycle = ["none", "designed", "activated"]; //possible states a story can be in

function createCell() 
{
	var cell = $('<td class="cell"></td>');

	cell.droppable({
		hoverClass: "ui-state-hover",
		greedy: true,
		drop: function( event, ui ) {
			var draggedStory = $(".ui-draggable-dragging");

			var e = draggedStory.detach();
			e.removeAttr("style");				
			e.draggable();

			$(this).append(e);
			event.stopImmediatePropagation();
		}
	});

	//add a story to a cell
	cell.click(function() {
		if ($("#board").find("textarea").size() == 0) { //only add it if we don't have an open textarea
			$(this).append(createStory(default_story_text));
		}
	});

	return cell;
}

function addHeader(title)
{
	//increment the number of lanes
	lanes++;

	//add new header
	var headerCell = $('<th class="cell"></th');

	if (title == undefined)	title = "Header"

	var headerCellText = $("<span>");
	headerCell.append(headerCellText.text(title));

	//make header text editable
	$(headerCellText).editable(function(value, settings) {
		return value;
	},
	{
		type: 'text',
		onblur: 'submit' //store changes on lost focus
	});


	$("#board #thead .row").append(headerCell);


	//add a new cell to each row				
	$.each($("#board #tbody .row"), function() {
		$(this).append(createCell());	
	});
}

function addSprint()
{
	//add additional cells for the new row
	var row = $('<tr class="row"></tr>');

	for(var i=0; i < lanes; i++)
	{
		row.append(createCell());
	}

	$("#board #tbody").append(row);
	return row;	
}	

function createStory(storyText)
{
	var story = $('<div class="story">');
	story.addClass(cycle[0]); //give the story a default state

	var icoontjes = $('<div class="icoontjes">');

	//color switch
	var color = $('<span class="ui-icon ui-icon-circle-check right"></span>');
	color.click(function(event) {
		var story = $(this).parent().parent();
		
		for(var i=0; i < cycle.length; i++)
		{
			if ( story.hasClass(cycle[i]) ) {
				if (i == cycle.length-1)
				{
					story.addClass("none");
				}
				else
				{
					story.addClass(cycle[i+1]);
				}
				story.removeClass(cycle[i]);
				break;
			}
		}

		event.stopPropagation();
	});
	icoontjes.append(color);

	//click on a story -> do nothing
	//required such that we don't add a story in the same cell accidentally
	story.click(function(event) {
		event.stopPropagation();
	})

	//make story text editable
	var storyContent = $('<span class="storyText"></span>').html(storyText);
	$(storyContent).editable(function(value, settings) {return value.replace(/\n/g, "<br>"); }, 
		{
			data: function(value, settings) {
			return value.replace(/<br[\s\/]?>/gi, "\n");
		},
		type: 'textarea',
		onblur: 'submit' //store changes on lost focus
	});

	//enable autogrow for the newly created textarea
	$(storyContent).click(function(event) {
		$(this).find("textarea").autosize();
	});


	//add icons	
	story.append(icoontjes);
	story.append(storyContent);

	//temporarily disable editable clicks when dragging a story
	story.draggable({
						greedy: true,
						start: function() {
							var removeArea = $('<div class="remove-area--wrapper" id="removeArea"><div class="remove-area">Drag here to remove</div></div>');
							$("body").append(removeArea);
							$(this).find(".storyText").editable("disabled");
						
							$("#removeArea").droppable({
								//hoverClass: "ui-state-hover",
								greedy: true,
								drop: function( event, ui ) {
									var draggedStory = $(".ui-draggable-dragging");
									draggedStory.remove();
									
									$("#removeArea").animate({height: 0, opacity: 0}, 'slow', function(){ $("#removeArea").remove(); });
								}
							});
						},
						stop: function() {
							$("#removeArea").remove();
							$(this).find(".storyText").editable("enabled");
						},
					});

	return story;
}

function initBoard()
{
		lanes = 0;
		$("#board").empty();
		$("#board").append($('<thead id="thead"></div>').append('<tr class="row"></tr>'));
		$("#board").append($('<tbody id="tbody">'));
}

function importBoard(data)
{
	//set the title
	$("#title").text(data["title"]);
	
	//set the headers again
	jQuery.each(data["header"], function(i, val) {
		addHeader(val);
	});
	
	//import each sprint
	jQuery.each(data["cells"], function(i, row) {
		//first add a 'sprint' for the row
		var currentSprint = addSprint();
		
		jQuery.each(row, function(j, cell) {
			//then select the correct cell in that sprint
			currentSprint.find(".cell").each(function(k, cellInDocument) {
				if (j == k)
				{
					jQuery.each(cell, function(z, storyData) {
						
						//backwards compat for when stories only consisted of text
						if (typeof storyData == 'string')
						{
							$(cellInDocument).append(createStory(storyData));
						}
						else
						{
							var story = createStory(storyData.text);
							story.addClass(storyData.state);
							$(cellInDocument).append(story);
						}
					});
				}
			});
		});
	});
}

function exportBoard()
{
	//collect the headers
	var headers = [];
	$("#board #thead .cell").each (function() {
		headers.push($(this).text());
	});
	
	//iterate over a row
	var rows = [];
	$("#board #tbody .row").each (function() 
	{
		var cells = [];
		$(this).find(".cell").each(function () {
			var cell = [];
			$(this).find(".story .storyText").each(function() 
			{

				var resultState = "none";
				var parent = $(this).parent();
				cycle.forEach(function(state) {
					if (parent.hasClass(state))
					{
						resultState = state;
					}
				});
				
				cell.push({'text': $(this).html(), 'state': resultState});
			});
			cells.push(cell);
		});
		rows.push(cells);
	});

	var title = $("#title").text();

	data = {title: title, header: headers, cells: rows};
	console.log(data);
	
	return data
}

$(document).ready(function() {
	$('input[name=addSprint]').click(function() {
		addSprint();				
	});

	$('input[name=addLane]').click(function() {
		addHeader();
	});		

	//make title editable
	$("#title").editable(function(value, settings) {
		return value;
	},
	{
		type: 'text'
	});

	function updateBoard(currentBoard, newBoard)
	{
		//readable by anyone, but only writeable by the loggedIn user
		var mapACL = new Parse.ACL(Parse.User.current());
		mapACL.setPublicReadAccess(true);
		currentBoard.setACL(mapACL);

		currentBoard.save({data: exportBoard()}, {
			success: function(currentBoard) {
				var newurl = window.location+"?storymap="+currentBoard.id;

				if (newBoard)
				{
					alert("This storymap is now available at: " + newurl);
					window.location = newurl;
				}
			},
			error: function(currentBoard, error) {
				alert("Error: I'm sorry Dave, I can't let you do that. (" + error.code + " " + error.message + ")");			
			}
		});
	}

	//reset the board
	initBoard();

	// check if the url specifies a storymap id
	// YES? -> import it
	var name = window.location.search.substring(1).split("=")[1];
	if (name != undefined)
	{
		var StoryMap = Parse.Object.extend("StoryMap");
		var query = new Parse.Query(StoryMap);
		query.get(name, {
		  success: function(map) {
			importBoard(map.get("data"));
		  },
		  error: function(object, error) {
			// The object was not retrieved successfully.
			// error is a Parse.Error with an error code and description.
		  }
		});
	}
	else
	{
		//create a simple default storymap
		$('input[name=addLane]').click();
		$('input[name=addSprint]').click();
	}


	//set the login form and save button actions
	$(function() {
		$("#loginDialog").dialog({
			resizable: false,
			autoOpen: false,
			height:240,
			modal: true,
			buttons: {
				"Login": function() {
					//get username and password
					//try to fetch an existing parse user object or create the parse user object
					Parse.User.logIn($("input[name=username]").val(), $("input[name=password]").val(), {
					  success: function(user) {
						$("input[name=store]").val("save");
						$("#loginDialog").dialog("close");
					  },
					  error: function(user, error) {
						if (confirm("Failed to login. Do you want to create a new account?"))
						{
							var user = new Parse.User();
							user.set("username", $("input[name=username]").val());
							user.set("password", $("input[name=password]").val());
						
							user.signUp(null, {
							  success: function(user) {
								$("input[name=store]").val("save");
								$("#loginDialog").dialog("close");
							  },
							  error: function(user, error) {
								alert("Error: " + error.code + " " + error.message);
							  }
							});
						}
					  }
					});
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		})
	});

	//check whether we're already logged in and update the UI accordingly
	if (Parse.User.current())
	{
		$("input[name=store]").val("save");
	}

	//actions for the dual save/login button
	$('input[name=store]').click(function () {
	
		if ($(this).val() == "save") //asume user is logged in, so saving is possible
		{
			var StoryMap = Parse.Object.extend("StoryMap");
			var query = new Parse.Query(StoryMap);
		
			var currentBoard = undefined;
			var name = window.location.search.substring(1).split("=")[1];
		
			$(this).attr('disabled', true).attr('value', 'updating...');
		
			query.get(name, {
				  success: function(currentBoard) {
					$('input[name=store]').attr('disabled', false).attr('value', 'save');
					updateBoard(currentBoard, false);
				  },
				  error: function() {
				  	currentBoard = new StoryMap();
				  	updateBoard(currentBoard, true);
				  }
			 });
		}
		else //display the login form
		{
			$( "#loginDialog" ).dialog( "open" );
		}
	});
});
