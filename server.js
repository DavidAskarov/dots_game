/**
 * Created by Dev on 10.10.2015.
 */
var
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    clients = [];

var one = true;
var two = true;

function requestHandler(req, res) {
    var
        content = '',
        fileName = path.basename(req.url),
        localFolder = __dirname + '/public/';

    if(fileName === '')
    {
        fileName = 'index.html';
    }

    if(fileName !== '')
    {
        content = localFolder + fileName;
        fs.readFile(content,function(err,contents){
            if(!err)
            {
                res.end(contents);
            }
            else
            {
                console.dir(err);
            };
        });
    }
    else
    {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h1>Sorry, the page you are looking for cannot be found HA HA HA.</h1>');
    };
};

var server = http.createServer(requestHandler);
var port = process.env.PORT || 3000;
server.listen(port);

var WebSocketServer = require('websocket').server;

var wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function(request)
{
    var connection = request.accept(null, request.origin);
    var dots = [];


    if(clients.length <= 1)
    {
        clients.push(connection); // add to array user connection
        var num = clients.indexOf(connection);
        console.log('number join ' + num);
    }
    else
    {
        var messageLater = JSON.stringify({action: 'later', tryLater: 'Try later'});
        connection.sendUTF(messageLater);
        return;
    }

    connection.on('message', function(mes)
    {
        var data = JSON.parse(mes.utf8Data);
        switch(data.action)
        {
            case 'myStep':
                if(connection === clients[0] && one === true)
                {
                    var my = JSON.stringify({action: 'step', colorDot: 'blue', coordinate: data.click});
                    clients[0].sendUTF(my);
                    var op = JSON.stringify({action: 'step', colorDot: 'red', coordinate: data.click});

                    if(clients.length > 1)
                        clients[1].sendUTF(op);
                    one = false;

                    var m1 = JSON.stringify({action: 'nextMove', next1: 'one'});
                    clients[0].sendUTF(m1);
                    findingContours(data.click);
                }
                else if(connection === clients[1] && two === true)
                {
                    var my = JSON.stringify({action: 'step', colorDot: 'blue', coordinate: data.click});
                    clients[1].sendUTF(my);
                    var op = JSON.stringify({action: 'step', colorDot: 'red', coordinate: data.click});

                    if(clients.length > 1)
                        clients[0].sendUTF(op);

                    two = false;
                    var m2 = JSON.stringify({action: 'nextMove', next1: 'two'});
                    clients[1].sendUTF(m2);
                    findingContours(data.click);
                }
                break;

            case 'removeMyDots':
                for(var i = 0; i < dots.length; i++)
                {
                    if(dots[i] === data.removeDots)
                    {
                        dots.splice(i, 1);
                    }
                }
                break;

            case 'disconnected':
                dots.splice(0, dots.length);
                console.log("Delete succsesful");
                console.log(dots.length);
                break;

            case 'clientNextMove':
                if(data.stepClient === 'one')
                {
                    one = true;
                    console.log("one true");
                }
                else if(data.stepClient === 'two')
                {
                    two = true;
                    console.log("two true");
                }
                break;
        }
    });

    connection.on('close', function()
    {
        var removeConnected = clients.indexOf(connection);
        clients.splice(removeConnected, 1);
        if(clients.length > 0)
        {
            var messageOpponentDisconnected = JSON.stringify({action: 'opponentDisconnected', message: 'Your opponent disconnected'});
            clients[0].sendUTF(messageOpponentDisconnected);
        }
    });


    function findingContours(xy)
    {
        dots.push(xy);
        var strFirstX = xy.charAt(0);
        var strFirstY = xy.charAt(1);
        var checkedDots=[];
        var contour = [];
        var capturedDots=[];

        var clockwise=function(x, y)
        {
            return [(x), (y-1), (x+1), (y-1), (x+1), (y), (x+1), (y+1), (x), (y+1), (x-1), (y+1), (x-1), (y), (x-1), (y-1)];
        };

        var isClosed=determineContour(strFirstX, strFirstY, (strFirstX + strFirstY), clockwise);

        if(isClosed)
        {
            for(var y=0;y<10;y++)
            {
                for(var x=0;x<10;x++)
                {
                    if(!containsContour(x, y))
                    {
                        if(containsPolygon(x, y))
                        {
                            capturedDots.push(""+x+y);
                        }
                    }
                }
            }
        }

        console.log("Captured dots");
        for(var cd=0;cd<capturedDots.length;cd++)
        {
            console.log(capturedDots[cd]);
            for(var ii = 0; ii < dots.length; ii++)
            {
                if(capturedDots[cd] === dots[ii])
                {
                    console.log('SELECT DOTS: '+dots[ii])
                }
            }
            console.log("Count dots: " + dots.length);
            dots.push(capturedDots[cd]);

        }

        for(var cl = 0; cl < clients.length; cl++)
        {
            if(clients[cl] !== connection)
            {
                clients[cl].sendUTF(JSON.stringify({ action: 'OpponentCaptured', captured: capturedDots}));
            }
            else
            {
                connection.sendUTF(JSON.stringify( { action: 'MyCaptured', contour: contour, captured: capturedDots} ));
            }
        }

        function containsContour(x, y)
        {
            for(var i=0; i<contour.length;i++)
            {
                if(x==contour[i].charAt(0) && y==contour[i].charAt(1))
                {
                    return true;
                }
            }
            return false;
        }

        function containsPolygon(x, y)
        {
            var npoints=contour.length;

            if (npoints <= 2)
            {
                return false;
            }
            var hits = 0;

            var lastx = Number(strFirstX);
            var lasty = Number(strFirstY);
            var curx=0, cury=0;

            for (var i = 0; i < npoints; lastx = curx, lasty = cury, i++)
            {
                curx=Number(contour[i].charAt(0));
                cury=Number(contour[i].charAt(1));

                if (cury == lasty)
                {
                    continue;
                }

                var leftx;
                if (curx < lastx)
                {
                    if (x >= lastx)
                    {
                        continue;
                    }
                    leftx = curx;
                }
                else
                {
                    if (x >= curx)
                    {
                        continue;
                    }
                    leftx = lastx;
                }

                var test1, test2;
                if (cury < lasty)
                {
                    if (y < cury || y >= lasty)
                    {
                        continue;
                    }
                    if (x < leftx)
                    {
                        hits++;
                        continue;
                    }
                    test1 = x - curx;
                    test2 = y - cury;
                }
                else
                {
                    if (y < lasty || y >= cury)
                    {
                        continue;
                    }
                    if (x < leftx)
                    {
                        hits++;
                        continue;
                    }
                    test1 = x - lastx;
                    test2 = y - lasty;
                }

                if (test1 < (test2 / (lasty - cury) * (lastx - curx)))
                {
                    hits++;
                }
            }

            return ((hits & 1) != 0);
        }

        function determineContour(strCurrX, strCurrY, strPrevXY, getDirection)
        {
            var numCurrX=Number(strCurrX);
            var numCurrY=Number(strCurrY);

            var neighborArr=getDirection(numCurrX, numCurrY);

            for(var j = 0; j < neighborArr.length; j=j+2)
            {
                if(checkNeighborDot(neighborArr[j],  neighborArr[j+1],  strCurrX, strCurrY, strPrevXY, getDirection)) return true;
            }

            if(contour.length>0)
            {
                contour.pop();
            }

            return false;
        }

        function checkNeighborDot(numNeighborX, numNeighborY, strPrevX, strPrevY, strPrevXY, getDirection)
        {
            console.log("check  Dot: "+numNeighborX+" "+numNeighborY+" "+strPrevX+" "+strPrevY+" "+strPrevXY);
            var isChecked=false;
            var strNeighborX=""+numNeighborX;
            var strNeighborY=""+numNeighborY;


            if((strNeighborX + strNeighborY) !== strPrevXY )
            {
                console.log("Not prev");
                for(var i=dots.length-1;i>=0;i--)
                {
                    if( (strNeighborX) == dots[i].charAt(0) && (strNeighborY) == dots[i].charAt(1) )
                    {
                        console.log("In my dots");
                        for(var c = 0; c < checkedDots.length; c++)
                        {
                            if( (strNeighborX + strNeighborY) == checkedDots[c] )
                            {
                                isChecked=true;
                            }
                        }

                        if(isChecked === false)
                        {
                            console.log("Not checked");
                            contour.push(strNeighborX + strNeighborY);
                            checkedDots.push(strNeighborX + strNeighborY);
                            if(strNeighborX == strFirstX && strNeighborY == strFirstY)
                            {
                                console.log("End");
                                return true;
                            }
                            else
                            {
                                console.log("Continue");
                            }

                            if( determineContour( strNeighborX, strNeighborY, (strPrevX + strPrevY), getDirection ) )
                            {
                                return true;
                            }
                        }
                        else
                        {
                            console.log("Checked");
                        }
                    }
                    else
                    {
                        console.log("Not in my dots");
                    }
                }
            }
            else
            {
                console.log("Prev");
            }
            return false;
        }
    }
});










