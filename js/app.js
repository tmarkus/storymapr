var lanes = 0; //number of lanes	
var default_story_text = "My cat ate my homework."

function createCell() 
{
	var cell = $('<div class="cell"></div>');

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

	//voeg een story toe aan een cell
	cell.click(function() {
		$(this).append(createStory(default_story_text));
	});

	return cell;
}

function addHeader(title)
{
	//increment the number of lanes
	lanes++;

	//add new header
	var headerCell = $('<div class="cell"></div');

	if (title == undefined)	title = "Header"

	headerCell.append($("<p>").text(title));

	headerCell.click(function() {
		var content = prompt("Content:");
		if (content)
		{
			$(headerCell).find("p").remove();
			$(headerCell).append($("<p>").text(content));
		}
	});
	$("#board #thead .row").append(headerCell);


	//add a new cell to each row				
	$("#board #tbody .row").append(createCell());
}

function addSprint()
{
	//add additional cells for the new row
	var row = $('<div class="row"></div>');

	for(var i=0; i < lanes; i++)
	{
		row.append(createCell());
	}

	$("#board > #tbody").append(row);
	return row;	
}	

function createStory(storyText)
{
	var story = $('<div class="story">');

	var icoontjes = $('<div class="icoontjes">');

	//remove a story
	var trash = $('<span class="ui-icon ui-icon-trash right"></span>');
	trash.click(function(event) {
		if (confirm("Are you sure you want to remove this story?")) 
		{
			story.remove();
		}
		event.stopPropagation();
	});
	icoontjes.append(trash);

	//edit a story
	var edit = $('<span class="ui-icon ui-icon-note right"></span>');
	edit.click(function(event) {
		context = prompt("Story content:");
		
		if (context)
		{
			story.find(".storyText").remove();
			story.append($('<span class="storyText"></span>').text(context));
		}
		event.stopPropagation();
	});
	icoontjes.append(edit);
	
	//color switch
	var color = $('<span class="ui-icon ui-icon-circle-check right"></span>');
	color.click(function(event) {
		var story = $(this).parent().parent();
		
		if (story.hasClass("activated"))	story.removeClass("activated");
		else								story.addClass("activated");
		
		event.stopPropagation();
	});
	icoontjes.append(color);

	story.append(icoontjes);
	story.append($('<span class="storyText"></span>').text(storyText));
	story.draggable({greedy: true});

	return story;
}

function initBoard()
{
		lanes = 0;
		$("#board").empty();
		$("#board").append($('<div id="thead"></div>').append('<div class="row"></div>'));
		$("#board").append($('<div id="tbody">'));
}

function importBoard(data)
{
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
	$("#board #thead .cell p").each (function() {
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

	data = {header: headers, cells: rows};
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
