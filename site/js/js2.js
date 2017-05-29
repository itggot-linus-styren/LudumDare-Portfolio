/* Global variables */
var previousPage = null;
var previousSelected = null;

var hasLoadedArticles = false;
var articles = {};

var is_mobile = false;

var doRefreshCanvas;
var gridCanvas;
var canvas;
var ctx;
var lastTime = (new Date()).getTime();

var rstartx;
var rstarty;
var rendx;
var rendy;
var mouse_down = false;

var lines = [];

/* Webkit stuff */
var vendors = ['webkit', 'moz'];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

/* Hide all containers and open home container on website load */
$(function () {
    $("#wiki-container").children ().slice (1).hide ();
 
    hasLoadedArticles = true;
    $(".wiki-article").each (function () {
        articles[$(this).attr ("data-article_name")] = this;
    });

    var listItems = "";
    for (var a in articles) {
        listItems += "<li><a href=\"#\" onclick=\"openArticle ('#" + articles[a].id + "')\">" + a + "</li>";
    }
    $(".article-list").html (listItems);

    $(".content").hide ();
    openPage ("#home-container");
    previousSelected = $(".drawer > ul")[0].children[0].children[0];
    $(previousSelected).addClass ("selected");

    canvas = document.querySelector (".sandbox");
    gridCanvas = document.querySelector (".grid-canvas");
    ctx = canvas.getContext ("2d");
/*
    var mql = window.matchMedia('screen and (device-width: 360px) and (device-height: 640px), screen and (device-height: 360px) and (device-width: 640px)');
    mql.addEventListener(
        function(mq) {
            is_mobile = mq.matches;
        }
    );*/


    canvas.onselectstart = function() { return false; };
    canvas.unselectable = "on";
    canvas.style.MozUserSelect = "none";
    canvas.style.webkitUserSelect = "none";

    canvas.onmousedown = function (e) {
        var mpos = getMousePos (e);
        var start_x = mpos.x;
        var start_y = mpos.y;
        rstartx = Math.floor (start_x / 40) * 40 + 20;
        rstarty = Math.floor (start_y / 40) * 40 + 20;
        mouse_down = true;
    }

    canvas.ontouchstart = function (e) { 
        var start_x = e.targetTouches[0].pageX;
        var start_y = e.targetTouches[0].pageY;
        rstartx = Math.floor (start_x / 40) * 40 + 20;
        rstarty = Math.floor (start_y / 40) * 40 + 20;
        mouse_down = true;
    }

    canvas.onmouseup = function () {
        lines.push({sx: rstartx, sy: rstarty, ex: rendx, ey: rendy});
        mouse_down = false;
    }

    canvas.ontouchend = function () {
        canvas.onmouseup ();
    }

    canvas.onmousemove = function (e) {
        var mpos = getMousePos (e);

        rendx = Math.floor (mpos.x / 40) * 40 + 20;
        rendy = Math.floor (mpos.y / 40) * 40 + 20;
    }

    canvas.ontouchmove = function (e) {
        rendx = Math.floor (e.targetTouches[0].pageX / 40) * 40 - 20;
        rendy = Math.floor (e.targetTouches[0].pageY / 40) * 40 - 20;
    }

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

    $("#wiki-search").on ('keyup', function (e) {
        if (e.keyCode == 13) { /* on enter pressed */
            search ();
        }
    });

    $("#wiki-search").on ('click', function (e) {
        $(".search-results").removeClass ("searched");
    });
});

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
    if (previousSelected == a) return;
    if (previousSelected != null) {
        $(previousSelected).removeClass ("selected");
    }
    $(a).addClass ("selected");
    previousSelected = a;
}

function openPage (id) {
    $('#drawer-toggle').prop('checked', false);
    if ($(previousPage) == $(id)) return;

    if (previousPage != null) {
        $(previousPage).removeClass ("selected");
        $(previousPage).hide ();
    }

    $(id).addClass ("selected");
    $(".selected").show ();
    previousPage = id;
   
    doRefreshCanvas = false;
    if (id.indexOf ("sandbox") !== -1) {
        drawAndSaveGrid ();
        doRefreshCanvas = true;
        canvasDraw ();
    }
}

function openArticle (articleId) {
    openPage ("#wiki-container");
    $("#wiki-container").children ().hide ();
    $(articleId).show ();
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
        $(".wiki-article").each (function () {
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

$('#wiki-search').on('input', function() {
    onSearch ($(this).val());
});

function getMousePos (evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function canvasDraw () {
    if (!doRefreshCanvas) return;

    currentTime = (new Date()).getTime();
    delta = (currentTime - lastTime) / 1000;

    var sandbox_con = $("#sandbox-container");
    canvas.width = sandbox_con.width () - 3;
    canvas.height = sandbox_con.height () - 3;

    ctx.drawImage (gridCanvas, 0, 0);

    var tilesFromEdgeY = Math.floor (canvas.height / 120);
    var tilesFromEdgeX = Math.ceil (canvas.width / 240);
    var pos_x1 = 40 * tilesFromEdgeX + 20;
    var pos_y1 = 40 * tilesFromEdgeY + 20 - 5;
    var pos_x2 = pos_x1;
    var pos_y2 = Math.round(canvas.height / 40) * 40 - 40 * tilesFromEdgeY - 20 - 5;
    var pos_x3 = Math.round(canvas.width / 40) * 40 - 40 * tilesFromEdgeX - 20;
    var pos_y3 = Math.ceil((pos_y1 + pos_y2) / 80) * 40 - 20 - 5;


    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (var i = 0; i  < lines.length; i++) {
        var line = lines[i];
        ctx.beginPath ();
        ctx.moveTo (line.sx, line.sy);
        ctx.lineTo (line.sx, line.ey);
        ctx.stroke ();

        ctx.beginPath ();
        ctx.moveTo (line.sx, line.ey);
        ctx.lineTo (line.ex, line.ey);
        ctx.stroke ();
    }

    if (mouse_down) {
        ctx.beginPath ();
        ctx.moveTo (rstartx, rstarty);
        ctx.lineTo (rstartx, rendy);
        ctx.stroke ();

        ctx.beginPath ();
        ctx.moveTo (rstartx, rendy);
        ctx.lineTo (rendx, rendy);
        ctx.stroke ();
    }

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(pos_x1, pos_y1, 10, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.stroke();

    ctx.font = '11px Roboto';
    ctx.fillText ("IN 1", pos_x1 - 9, pos_y1 + 22);
    
    ctx.beginPath();
    ctx.arc(pos_x2,  pos_y2, 10, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.stroke();

    ctx.fillText ("IN 2", pos_x2 - 9, pos_y2 + 22);

    ctx.beginPath();
    ctx.arc(pos_x3,  pos_y3, 10, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.fillText ("OUT", pos_x3 - 11, pos_y3 + 22);

    lastTime = currentTime;

    window.requestAnimationFrame (canvasDraw);
}

window.addEventListener('resize', drawAndSaveGrid, false);

function drawAndSaveGrid () {
    var sandbox_con = $("#sandbox-container");
    
    if (!$(sandbox_con).is(':visible')) return;

    var canvas = document.querySelector (".grid-canvas");
    var ctx = canvas.getContext ("2d");
    var bw = sandbox_con.width () - 3;
    var bh = sandbox_con.height () - 3;
    canvas.width = bw;
    canvas.height = bh;
    var p = 0;
    for (var x = 0; x <= bw; x += 40) {
        ctx.moveTo(0.5 + x + p, p);
        ctx.lineTo(0.5 + x + p, bh + p);
    }

    for (var x = 0; x <= bh; x += 40) {
        ctx.moveTo(p, 0.5 + x + p);
        ctx.lineTo(bw + p, 0.5 + x + p);
    }

    ctx.strokeStyle = "black";
    ctx.stroke();
}
