var previousItem;
var prevContainerId;
var previousPage;
var previousSelected;

var hasLoadedArticles = false;
var articles = {};

var dontHideArticle = false;
var overrideClick = false;

$(function() {
    $(".game-container").each(function (i, container) {
        $(container).children ().slice (1).hide ();
    });

    hasLoadedArticles = true;
    $(".game-article").each (function () {
        articles[$(this).attr ("data-article_name")] = this;
    });

    previousItem = $('input[name=t]:checked', '#tabs');
    var contentId = $(previousItem).attr('class').split(" ")[0];
	var contentDiv = $('#' + contentId);   
    $(contentDiv).css('opacity', '1');
    $(contentDiv).css('pointer-events', 'auto');
    $(".content:not(#" + contentId + ")").hide();
	prevContainerId = '#' + contentId;
    previousSelected = $("#drawer > ul")[0].children[0].children[0].children[0];
    $(previousSelected).addClass("selected");
    $(".sticky-scroller").scroll(updateHeight);

    /* Converts SVG files to inline SVG
     * see http://stackoverflow.com/a/11978996/3013334 for more information
     */
    $('img.svg').each(function(){
        var $img = jQuery(this);
        var imgID = $img.attr('id');
        var imgClass = $img.attr('class');
        var imgURL = $img.attr('src');

        jQuery.get(imgURL, function(data) {
            // Get the SVG tag, ignore the rest
            var $svg = jQuery(data).find('svg');

            // Add replaced image's ID to the new SVG
            if(typeof imgID !== 'undefined') {
                $svg = $svg.attr('id', imgID);
            }
            // Add replaced image's classes to the new SVG
            if(typeof imgClass !== 'undefined') {
                $svg = $svg.attr('class', imgClass+' replaced-svg');
            }

            // Remove any invalid XML tags as per http://validator.w3.org
            $svg = $svg.removeAttr('xmlns:a');

            // Replace image with new SVG
            $img.replaceWith($svg);

        }, 'xml');

    });

    $("#game-search").on ('keyup', function (e) {
        if (e.keyCode == 13) { /* on enter pressed */
            search ();
        }
    });

    $("#game-search").on ('click', function (e) {
        $(".search-results").removeClass ("searched");
    });

    $('#drawer-toggle').change(function() {
        if (this.checked) {
             $("#drawer-toggle-label").removeClass("do_ripple");
        } else {
             $("#drawer-toggle-label").addClass("do_ripple");
        }
    });

    $('.back_arrow').click(function() {
        console.log("clicked!");
        setTimeout(function() {
            $(".game-article").hide();
        }, 500);
        $(".game-article").each(function() {
            $(this).prev().css('opacity', '0');
            $(this).prev().hide();
        });
        var that = this;
        $('#tabs input[type="radio"]').each(function(i, radio) {
            if(radio.classList.contains($(that).parent().parent().attr('id'))) {
                console.log(radio);
                overrideClick = true;
                $(radio).prop("checked", true);
                $(radio).click();
                //var container = $("#" + $(this).attr('class').split(" ")[0] + " > div:nth-of-type(1)");
            }
        });
    });

    $('.game-miniature > img').click(function() {
        openArticle("#" + $(this).parent().attr('class').split(" ")[1]);
    });

    $('#tabs input[type="radio"]').click(function() {
        if (!$(this).prop("checked") || (!overrideClick && $(previousItem).attr('class').split(" ")[0] === $(this).attr('class').split(" ")[0]))
            return;

        var container = $("#" + $(this).attr('class').split(" ")[0] + " > div:nth-of-type(1)");
        $(container).show();
        $(container).css('opacity', '1');
        var that = this;
        if ($(".sticky-scroller").scrollTop() > 0) {
            var duration = Math.min(500 * $(".sticky-scroller").scrollTop() / 100, 400);
            $(".sticky-scroller").animate({scrollTop:$(".sticky-scroller").offset().top}, duration, "linear", function() {
                doTransition(that, true);
            });
        } else {
            doTransition(that, true);
        }
        if (overrideClick) overrideClick = false;
    });

    $("#drawer > ul > li > div > a").on('click', function() {
        var parentDiv = $(this).parent();
        parentDiv.addClass('drawer_list_item_active');
        setTimeout(function() {
            parentDiv.removeClass('drawer_list_item_active');
        }, 250);
    });
});

function updateHeight() {
    var elem = $('#tabs');
    var scrollOffset = Math.max(192 - $(".sticky-scroller").scrollTop(), 0);
    if (scrollOffset == 0) {
        $("#tabs").addClass("tabs-sticky");
    } else {
        $("#tabs").removeClass("tabs-sticky");
    }
}

function doTransition(that, usingTabs) {
    var oldContentDiv = null;
    if (previousItem != null && !overrideClick) {
        console.log("I HATE YOU!" + $(previousItem));
        var oldId = $(previousItem).attr('class').split(" ")[0];
		oldContentDiv = $('#' + oldId);
        oldContentDiv.removeClass('content-hide-remove');
        oldContentDiv.removeClass('content-hide-remove-backwards');
		if ($(that).isAfter(previousItem)) {
        	oldContentDiv.addClass('content-hide-add');
		} else {
        	oldContentDiv.addClass('content-hide-add-backwards');
		}
        if (usingTabs) {
            setTimeout(function() {
                oldContentDiv.css('opacity', '0');
            }, 500);
        }
    }

    contentDiv = null;
    if (usingTabs) {
        var contentId = $(that).attr('class').split(" ")[0];
        prevContainerId = '#' + contentId;
	    contentDiv = $(prevContainerId);
	    $(contentDiv).show();
    	$(contentDiv).addClass('transition-container');
	    contentDiv.css('opacity', '1');
    } else {
        contentDiv = $(that);
    }
	contentDiv.removeClass('content-hide-add').removeClass('content-hide-add-backwards');
	if ($(that).isAfter(previousItem)) {
		contentDiv.addClass('content-hide-remove');
	} else {
		contentDiv.addClass('content-hide-remove-backwards');
	}
    if (!dontHideArticle) {
        $(".games-container").show();
        $(".game-article").each(function(i, article) {
            if ($(article).is(":visible")) {
                $(article).prev().hide();
            }
        });
    }
    if (usingTabs) {
        setTimeout(function() {
            if (oldContentDiv != null && !overrideClick)
                $(oldContentDiv).hide();
            $(contentDiv).removeClass('transition-container');
            if (!dontHideArticle) {
                $(".game-article").hide();
            } else {
                dontHideArticle = false;
            }
        }, 500);   
        previousItem = that;
    } else {
        setTimeout(function() {
            if (!dontHideArticle) {
                $(".game-article").hide();
            } else {
                dontHideArticle = false;
            }
        }, 500);   
    }
}

(function($) {
    $.fn.isAfter = function(sel){
        return this.prevAll().filter(sel).length !== 0;
    };

    $.fn.isBefore= function(sel){
        return this.nextAll().filter(sel).length !== 0;
    };
})(jQuery);

function search () {
    var searchResults = $(".search-results > li");
    if (searchResults.length > 0) {
        searchResults[0].children[0].click ();
        $(".search-results").addClass ("searched");
    }
}

function toggleSearch (toggle) {
    if (toggle && !$(".searchbar").hasClass ("closed")) {
        search ();
    }

    if (toggle) $(".searchbar").removeClass ("closed");
    else $(".searchbar").addClass ("closed");
}

function select (a) {
    if (a === null) return;
    if (previousSelected == a) return;
    if (previousSelected != null) {
        $(previousSelected).removeClass ("selected");
    }
    $(a).addClass ("selected");
    previousSelected = a;
}

function selectOpenAndClose(that, containerId) {
    $('#drawer-toggle').prop('checked', false);
    $(containerId + " > div:nth-of-type(1)").show();
    $(containerId + " > div:nth-of-type(1)").css('opacity', '1');
    if (prevContainerId == containerId) {
        return;
    }
    select(that);

    if (prevContainerId != null) {
        $(prevContainerId).removeClass ("selected");
        $(prevContainerId).hide ();
    }

    $(containerId).addClass ("selected");
    //$(".selected").show ();

    previousItem = $('input[name=t]:checked', '#tabs');
    $('.' + containerId.slice(1, containerId.length)).prop('checked', true);
	var oldPrevContainerId = prevContainerId;
	$(containerId).show();
	$(containerId).addClass('transition-container');
	$(prevContainerId).css('opacity', '0');
	$(containerId).css('opacity', '1');
	$(containerId + " > div:nth-of-type(1)").show();
	$(containerId + " > div:nth-of-type(1)").css('opacity', '1');

	prevContainerId = containerId;

	setTimeout(function() {
		$(oldPrevContainerId).hide();
		$(prevContainerId).removeClass('transition-container');
	}, 100);

    doTransition(containerId, false);

    previousItem = $('input[name=t]:checked', '#tabs');
}

function openArticle (articleId) {
    dontHideArticle = true;
    setTimeout(function() {
        $(".game-article:not(" + articleId + ")").hide();
    }, 500);
    $('#tabs input[type="radio"]').each(function(i, radio) {
        if(radio.classList.contains($($(articleId)[0]).parent().attr('id'))) {
            $(radio).prop("checked", true);
            $(radio).click();
        }
    });
    $(".game-article").each(function() {
        $(this).prev().css('opacity', '0');
        $(this).prev().hide();
    });
    $(articleId).show();
    console.log("article opened!");
}

/* Search wiki for searchTerm and bring up menu including the first five results */
function onSearch (searchTerm) {
    var matchingArticles = [];
    var listItems = "";

    if (searchTerm === "") {
        $(".search-results").html ("");
        return;
    }
    $(".search-results").removeClass ("searched");

    if (!hasLoadedArticles) {
        hasLoadedArticles = true;
        $(".game-article").each (function () {
            articles[$(this).attr ("data-article_name")] = this;
        });
    }

    var c = searchTerm.toUpperCase ();
    for (var a in articles) {
        var index = a.toUpperCase ().indexOf (c);
        if (index !== -1) {
            matchingArticles.push (a);
        }
    }

    /* sort articles to show most relevant results first */
    matchingArticles.sort (function (a, b) {
        var indexA = a.toUpperCase ().indexOf (c); 
        var indexB = b.toUpperCase ().indexOf (c); 
        return  indexA < indexB ? -1 :
                indexA > indexB ? 1 : 0;
    });
    matchingArticles.forEach (function (a) {
        listItems += "<li><a href=\"#\" onclick=\"openArticle ('#" + articles[a].id + "')\">" + a + "</li>";
    });
    $(".search-results").html (listItems);
}

$('#game-search').on('input', function() {
    onSearch ($(this).val());
});

// Slide toggle function
$(function () {
    $('nav').on('click', 'li', function () {
        $(this).children('ul').slideToggle(function() {
            $(this).toggleClass('in out');
        });
        
        $(this).siblings().find('ul').slideUp(function() {
            $(this).removeClass('in').addClass('out');
        });
    });
});

// Ripple function
(function(){
	"use strict";

	var colour = "#ff84f3";
	var opacity = 0.3;
	var ripple_within_elements = ['button', 'a', 'img'];
	var ripple_without_diameter = 50;

	var overlays = {
		items: [],
		get: function(){
			var $element;
			for(var i = 0; i < overlays.items.length; i++){
				$element = overlays.items[i];
				if($element.transition_phase === false) {
					$element.transition_phase = 0;
					return $element;
				}
			}
			$element = document.createElement("div");
			$element.style.position = "absolute";
			$element.style.opacity = opacity;
            $element.style.zIndex = 5;
			$element.style.pointerEvents = "none";
			$element.style.background = "-webkit-radial-gradient(" + colour + " 64%, rgba(0,0,0,0) 65%) no-repeat";
			$element.style.background = "radial-gradient(" + colour + " 64%, rgba(0,0,0,0) 65%) no-repeat";
			$element.style.transform = "translateZ(0)";
			$element.transition_phase = 0;
			$element.rid = overlays.items.length;
			$element.next_transition = overlays.next_transition_generator($element);
			document.body.appendChild($element);
			overlays.items.push($element);
			return $element;
		},
		next_transition_generator: function($element){
			return function(){
				$element.transition_phase++;
				switch($element.transition_phase){
					case 1:
						$element.style[transition] = "all 0.2s ease-in-out";
						$element.style.backgroundSize = $element.ripple_backgroundSize;
						$element.style.backgroundPosition = $element.ripple_backgroundPosition;
						setTimeout($element.next_transition, 0.2 * 1000); //now I know transitionend is better but it fires multiple times when multiple properties are animated, so this is simpler code and (imo) worth tiny delays
						break;
					case 2:
						$element.style[transition] = "opacity 0.15s ease-in-out";
						$element.style.opacity = 0;
						setTimeout($element.next_transition, 0.15 * 1000);
						break;
					case 3:
						overlays.recycle($element);
						break;
				}
			};
		},
		recycle: function($element){
			$element.style.display = "none";
			$element.style[transition] = "none";
			if($element.timer) clearTimeout($element.timer);
			$element.transition_phase = false;
		}
	};

	var transition = function(){
		var i,
			el = document.createElement('div'),
			transitions = {
				'WebkitTransition':'webkitTransition',
				'transition':'transition',
				'OTransition':'otransition',
				'MozTransition':'transition'
			};
		for (i in transitions) {
			if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
				return transitions[i];
			}
		}
	}();

	var click = function(event){
		var $element = overlays.get(),
			touch,
			x,
			y;

		touch = event.touches ? event.touches[0] : event;

		$element.style[transition] = "none";
		$element.style.backgroundSize = "3px 3px";
		$element.style.opacity = opacity;
		if(touch.target.classList.contains("do_ripple") || ripple_within_elements.indexOf(touch.target.nodeName.toLowerCase()) > -1) {
			x = touch.offsetX;
			y = touch.offsetY;

			var dimensions = touch.target.getBoundingClientRect();
			if(!x || !y){
				x = (touch.clientX || touch.x) - dimensions.left;
				y = (touch.clientY || touch.y) - dimensions.top;
			}
			$element.style.backgroundPosition = x + "px " + y + "px";
			$element.style.width = dimensions.width + "px";
			$element.style.height = dimensions.height + "px";
			$element.style.left = (dimensions.left) + "px";
			$element.style.top = (dimensions.top + document.body.scrollTop + document.documentElement.scrollTop) + "px";
			var computed_style = window.getComputedStyle(event.target);
			for (var key in computed_style) {
				if (key.toString().indexOf("adius") > -1) {
					if(computed_style[key]) {
						$element.style[key] = computed_style[key];
					}
				} else if(parseInt(key, 10).toString() === key && computed_style[key].indexOf("adius") > -1){
					$element.style[computed_style[key]] = computed_style[computed_style[key]];
				}
			}
			$element.style.backgroundPosition = x + "px " + y + "px";
			$element.ripple_backgroundPosition = (x - dimensions.width)  + "px " + (y - dimensions.width) + "px";
			$element.ripple_backgroundSize = (dimensions.width * 2) + "px " + (dimensions.width * 2) + "px";

            var new_colour = $(touch.target).data("ripple_colour");
            if(new_colour === undefined) {
                new_colour = colour;
            }
			$element.style.background = "-webkit-radial-gradient(" + new_colour + " 64%, rgba(0,0,0,0) 65%) no-repeat";
			$element.style.background = "radial-gradient(" + new_colour + " 64%, rgba(0,0,0,0) 65%) no-repeat";
		} else { //click was outside of ripple element
			x = touch.clientX || touch.x || touch.pageX;
			y = touch.clientY || touch.y || touch.pageY;

			$element.style.borderRadius = "0px";
			$element.style.left = (x - ripple_without_diameter / 2) + "px";
			$element.style.top = (document.body.scrollTop + document.documentElement.scrollTop + y - ripple_without_diameter / 2) + "px";
			$element.ripple_backgroundSize = ripple_without_diameter + "px " + ripple_without_diameter + "px";
			$element.style.width = ripple_without_diameter + "px";
			$element.style.height = ripple_without_diameter + "px";
			$element.style.backgroundPosition = "center center";
			$element.ripple_backgroundPosition = "center center";
			$element.ripple_backgroundSize = ripple_without_diameter + "px " + ripple_without_diameter + "px";
			$element.style.background = "-webkit-radial-gradient(" + colour + " 64%, rgba(0,0,0,0) 65%) no-repeat";
			$element.style.background = "radial-gradient(" + colour + " 64%, rgba(0,0,0,0) 65%) no-repeat";
		}
		$element.ripple_x = x;
		$element.ripple_y = y;
		$element.style.display = "block";
		setTimeout($element.next_transition, 20);
	};

	if('ontouchstart' in window || 'onmsgesturechange' in window){
		document.addEventListener("touchstart", click, false);
	} else {
		document.addEventListener("click", click, false);
	}
}());
