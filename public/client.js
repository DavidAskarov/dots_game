/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

    var dotsRow = ['0','1', '2', '3', '4','5', '6', '7', '8', '9'];
    var dotsColumn = ['0','1', '2', '3', '4','5', '6', '7', '8', '9'];
    var ipAdress = '127.0.0.1';
    var port = 3000;
    var arrayMyDots = [];
    var flagCountingDots = true;
    var flagDisconnected = false;
    var flagOpponentCuptured = false;
    var countRedDots = 0;
    var myCuptDots = 0, flagMyCaptDots = false;
   // var websocket = new WebSocket("ws://"+ipAdress + ":"+port);

    var host = location.origin.replace(/^http/, 'ws')
    var websocket = new WebSocket(host);
    websocket.onmessage = function(message)
    {
        var jsonObj = JSON.parse(message.data);

        switch(jsonObj.action)
        {
            case 'step':
                var btn = document.getElementById((jsonObj.coordinate));
                btn.style.background=jsonObj.colorDot;
                btn.disabled = true;
                arrayMyDots.push(btn);

                if(jsonObj.colorDot === 'red')
                {
                    ++countRedDots;
                }
                else if(jsonObj.colorDot === 'blue')
                {
                    ++myCuptDots;
                }
                controllerOpponent();
                break;

            case 'later':
                alert(jsonObj.tryLater);
                break;

            case 'opponentDisconnected':
                alert(jsonObj.message);
                countRedDots = 0;
                myCuptDots = 0;
                controllerOpponent();

                for(var i = 0; i < arrayMyDots.length; i++)
                {
                    arrayMyDots[i].style.background = 'lightgray';
                    arrayMyDots[i].disabled = false;
                }
                arrayMyDots.splice(0, arrayMyDots.length); // deleted my array dots
                var mesDisc = JSON.stringify({action: 'disconnected'});
                websocket.send(mesDisc);
                break;

            case 'MyCaptured':
                var capturedDots = jsonObj.captured;

                countRedDots -= capturedDots.length;
                myCuptDots += capturedDots.length;

                controllerOpponent();

                for(var i=0;i<capturedDots.length;i++)
                {
                    var myBtn = document.getElementById(capturedDots[i]);
                    myBtn.style.background="blue";
                    myBtn.disabled = true;
                    arrayMyDots.push(myBtn);
                }
                break;

            case 'OpponentCaptured':
                var capturedDots1 = jsonObj.captured;

                countRedDots += capturedDots1.length;
                myCuptDots -=capturedDots1.length;
                controllerOpponent();

                for(var i=0;i<capturedDots1.length;i++)
                {
                    var btnOpponent = document.getElementById(capturedDots1[i]);
                    btnOpponent.style.background="red";

                    arrayMyDots.push(btnOpponent);
                    sendServerOpponentCupturedMyDots(capturedDots1[i]);
                }
                break
            case 'nextMove':
                var client = jsonObj.next1;
                if(client === 'one')
                {
                    var dd = JSON.stringify({action: 'clientNextMove', stepClient: 'two'});
                    websocket.send(dd);
                }
                else
                {
                    var ee = JSON.stringify({action: 'clientNextMove', stepClient: 'one'});
                    websocket.send(ee);
                }
                break;
        }
    };

    var myApp = angular.module('myApp', []);

    myApp.controller('myCreateButtonCtrl', function($scope)
    {
        $scope.rows = dotsRow;
        $scope.colums= dotsColumn;

        $scope.colorBtn = {
            colorButton:'lightgray',
            borderRadius: '50%',
            margin: '15px'
        };
    });

    myApp.controller('myClickButtonCtrl', function ($scope)
    {
        $scope.clickButtom = function (r,c)
        {
            sendServerDot(r+c);
        };
    });

    myApp.controller('setIp', function ($scope)
    {
        $scope.ip = '';
        $scope.port = '';

        $scope.setMyIp = function (ip, port)
        {
            window.location.href = "http://" + ip +":" + port;
        };
    });



/////////////////////////
    function sendServerDot(message)
    {
        var messageServer = JSON.stringify({action: 'myStep' ,click: message});
        websocket.send(messageServer);
    }

    function sendServerOpponentCupturedMyDots(xy)
    {
        var message = JSON.stringify({action:'removeMyDots', removeDots: xy});
        websocket.send(message);
    }

    function controllerOpponent()
    {
        var elementOpponent = angular.element(document.querySelector('#opponentCountPoint'));
        var myElement = angular.element(document.querySelector('#myCountPoint'));

        if(myCuptDots < 0)
            myElement = 0;
        if(countRedDots < 0)
            elementOpponent = 0;

        myElement.text(myCuptDots);
        elementOpponent.text(countRedDots);
    }





