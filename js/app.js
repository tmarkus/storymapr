var lanes = 0; //number of lanes	
var default_story_text = "My cat ate my homework."

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

	var icoontjes = $('<div class="icoontjes">');

	//remove a story
	var trash = $('<span class="ui-icon ui-icon-trash right"></span>');
	trash.click(function(event) {
		story.remove();
		event.stopPropagation();
	});
	icoontjes.append(trash);
	
	//color switch
	var color = $('<span class="ui-icon ui-icon-circle-check right"></span>');
	color.click(function(event) {
		var story = $(this).parent().parent();
		story.toggleClass("activated");
		event.stopPropagation();
	});
	icoontjes.append(color);

	//click on a story -> do nothing
	//required such that we don't add a story in the same cell accidentally
	story.click(function(event) {
		event.stopPropagation();
	})

	//make story text editable
	var storyContent = $('<span class="storyText"></span>').text(storyText);
	$(storyContent).editable(function(value, settings) {
		return value;
	},
	{
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
							$(this).find(".storyText").editable("disabled");
						},
						stop: function() {
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
					jQuery.each(cell, function(z, text) {
						$(cellInDocument).append(createStory(text));
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
				cell.push($(this).text());
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

	//make header draggable and remove a story that you drag to that location
	$("header").droppable({
		hoverClass: "ui-state-hover",
		greedy: true,
		drop: function( event, ui ) {
			var draggedStory = $(".ui-draggable-dragging");

			var e = draggedStory.detach();
			event.stopImmediatePropagation();
		}
	});

	function updateBoard(currentBoard, newBoard)
	{
		currentBoard.save({data: exportBoard()}).then(function(object) {
			newurl = window.location+"?storymap="+object.id;
			
			if (newBoard)
			{
				alert("This storymap is now available at: " + newurl);
				window.location = newurl;
			}
		});
	}

	$('input[name=store]').click(function() {
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
	);


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
});
