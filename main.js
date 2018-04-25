// 配置思路
// 吧线段属性,比如说宽度,颜色,放在一个hash里,然后每个属性又是一个hash,然后调用,变换,循环遍历,过渡效果,
//优化,所有的配置都可以用hash记下来.然后用户点击的时候,改颜色就行了

// 顺序:获取canvas
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");//获取2d上下文,上下文就是环境,环境里面有一些方法,API,用来画图

// 1.自动设置canvasSize
autoSetCanvasSize(canvas);

var isUsingBoard = false;
var isUsingEraser = false;
// 2.监听鼠标事件
listenToUser(canvas);

/**
 * 理清  用画笔,用橡皮的思路
 * 1. 最开始画笔放大,有颜色
 * 2. 点击橡皮,(1)isUsingEraser = true,(2)
 * 2. 点击画笔,(1)isUsingEraser = false,(2)橡皮出现画笔消失
 */
var eraser = document.getElementById('eraser');
var brush = document.getElementById("brush");
var actions = document.getElementById('actions');
var clearcanvas = document.getElementById("clearcanvas");
var body = document.getElementsByTagName("body")[0];
var choosedColor = 'black';//定义一个choosedColor变量,用来存当前选定的颜色,以免用橡皮擦的时候变成白色变不回来.

var download = document.getElementById("download");
// 橡皮擦,画笔,垃圾桶按钮,下载按钮
window.onload = function () { //打开网页先给画板一个白色的背景
    context.fillStyle = 'white';
    //这里会出现一个bug,如果在这里加上这句话.会导致最开始画的线中的点是白色的,出现黑线不连续情况,
    // 解决方法是把颜色变回黑色
    context.fillRect(0, 0, canvas.width, canvas.height);
    //解决方法是把颜色变回黑色
    context.fillStyle = 'black';//防止
}


if (document.body.ontouchstart === undefined) {
    eraser.onclick = beginUsingEraser;
    brush.onclick = beginUsingBrush;
    clearcanvas.onclick = beginUsingClearCanvas;
    download.onclick = beginUsingDownload;
} else {
    eraser.ontouchstart = beginUsingEraser;
    brush.ontouchstart = beginUsingBrush;
    clearcanvas.ontouchstart = beginUsingClearCanvas;
    download.ontouchstart = beginUsingDownload;
}

var color = document.getElementsByClassName("colors")[0];
var colorLiArr = color.getElementsByTagName('li');
var sizes = document.getElementById("sizes");
var sizeArr = sizes.getElementsByTagName('li');
var brushWidth = 2;

//选择线粗细和颜色
for (let i = 0; i < sizeArr.length; i++) {
    sizeArr[i].linew = (i + 1) * 2; //给线加一个属性,线宽度方便赋值
}
if (document.body.ontouchstart === undefined) {
    addLineWidthClick();//添加选择线宽度的点击事件
    addColorClickEvent();//添加选择颜色的点击事件
} else {
    addLineWidthTouch();//添加选择线宽度的触摸事件
    addColorTouchEvent();//添加选择颜色的点击事件
}


// 函数
//画线
function drawLine(beginx, beginy, endx, endy, lineWidth, color) {//开始xy,结束xy,线宽度
    context.beginPath();
    context.lineWidth = lineWidth;//先声明线的长度,不然他直接画了
    context.strokeStyle = color;  //注释掉是因为如果不写,默认是黑色
    context.moveTo(beginx, beginy);
    context.lineTo(endx, endy);
    context.stroke();
    context.closePath();
}

//画圈
function drawCircle(x, y, radius, color) {//画圆函数 ,xy圆心,radius半径
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
}

function autoSetCanvasSize(canvas) {//自动设置canvas函数
    //设置canvas宽高为窗口宽高
    setCanvasSize();
    //监听用户窗口大小拖动事件
    window.onresize = function (e) {
        setCanvasSize();
    };

    //设置canvas高宽为屏幕宽高函数
    function setCanvasSize() {

        var pagex = document.documentElement.clientWidth;//获取页面宽度
        var pagey = document.documentElement.clientHeight;//获取页面高度
        canvas.width = pagex;
        canvas.height = pagey;//这两个是属性值,不是css里面的样式,如果用样式,那么就是canvas.style
    }
}

function listenToUser(canvas) {

    /**[特性检测],只检测是否支持touch触摸特性,不管你是不是手机或者电脑,因为有可能电脑也能触摸,
     *
     * 是否支持touch事件呢
     * 如果ontouchstart为undefined,说明未初始化,就是没有这个这个touch不支持
     * 如果ontouchstart为null,说明已经初始化了,只不过初始化为null,即ontouchstart=null;
     * 判断方法:
     *方法一:'ontouchstart' in document.body
     *方法二: document.body.ontouchstart === undefined
     *
     * 手机*/
    if (document.body.ontouchstart === undefined) {//不支持touch事件,说明是pc端
        /**
         * 理清是否用画板和是否用橡皮的逻辑
         * 首先画笔默认开启.isUsingEraser = false就是在用画笔,true就是在用橡皮擦
         *
         * 1.onmousedown时,isUsingBoard = true,肯定在用,不管是用的画笔还是橡皮擦,画板肯定在用,这时候区别画笔和橡皮就用if(isUsingEraser)就行了.
         * 2.onmousemove时有两层逻辑.首先if(isUsingBoard)判断是否在用画板,用就进入内部,没用就什么都不写.然后内部判断是否在用橡皮,if(isUsingEraser){}
         * 3.onmouseup时,只有一层逻辑,就是肯定不用画板了,不管他橡皮用不用.
         */
        canvas.onmousedown = function (e) {
            var x = e.clientX;
            var y = e.clientY;
            isUsingBoard = true;

            lastPoint = {//上一个点//设置成全局变量,好能接受的到
                'x': x,
                'y': y
            };

            if (isUsingEraser) {//用橡皮,把画笔颜色调成白色即可
                drawCircle(x, y, brushWidth / 2, 'white');
            } else {//不用橡皮,用画笔
                drawCircle(x, y, brushWidth / 2);
            }
        };

        canvas.onmousemove = function (e) {
            var x = e.clientX;
            var y = e.clientY;
            if (isUsingBoard) {

                newPoint = {//设置成全局变量,好能接受的到
                    'x': x,
                    'y': y
                };
                if (isUsingEraser) {//如果用橡皮,那就是把点和线的颜色变成白色而已
                    drawCircle(x, y, brushWidth / 2, 'white');
                    drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y, brushWidth, 'white');
                } else {
                    drawCircle(x, y, brushWidth / 2);//半径是1px,直径就是2px
                    //实际上不需要这个圈,因为不管有没有这个圈,他都会连线.所以删掉这句代码,也不影响
                    //经测试,必须加上这个圈,不然就会出现线不连贯的情况.

                    //老点与新点连线
                    drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y, brushWidth);
                }
                lastPoint = newPoint;//把现在这个新点变为下一个的老点.

            }
        };

        canvas.onmouseup = function () {
            isUsingBoard = false;
        };
    } else {//支持touch事件
        canvas.ontouchstart = function (e) {
            // 因为touch支持多点触控,所以触摸点相对于浏览器的坐标点放到了touchs数组里,0代表第一个触控点
            var x = e.touches[0].clientX;
            var y = e.touches[0].clientY;
            isUsingBoard = true;


            lastPoint = {//上一个点//设置成全局变量,好能接受的到
                'x': x,
                'y': y
            };

            if (isUsingEraser) {//用橡皮,把画笔颜色调成白色即可
                drawCircle(x, y, brushWidth / 2, 'white');
            } else {//不用橡皮,用画笔
                drawCircle(x, y, brushWidth / 2);
            }
        }
        canvas.ontouchmove = function (e) {
            // console.log('222');
            // console.log(e.touches[0].clientX);
            // console.log(e.touches[0].clientY);

            var x = e.touches[0].clientX;
            var y = e.touches[0].clientY;
            if (isUsingBoard) {

                newPoint = {//设置成全局变量,好能接受的到
                    'x': x,
                    'y': y
                };
                if (isUsingEraser) {//如果用橡皮,那就是把点和线的颜色变成白色而已
                    drawCircle(x, y, brushWidth / 2, 'white');
                    drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y, brushWidth, 'white');
                } else {
                    drawCircle(x, y, brushWidth / 2);//半径是1px,直径就是2px
                    //实际上不需要这个圈,因为不管有没有这个圈,他都会连线.所以删掉这句代码,也不影响
                    //经测试,必须加上这个圈,不然就会出现线不连贯的情况.

                    //老点与新点连线
                    drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y, brushWidth);
                }
                lastPoint = newPoint;//把现在这个新点变为下一个的老点.

            }
        }
        canvas.ontouchend = function (e) {
            isUsingBoard = false;
        }
    }
}

function beginUsingBrush() { //用笔
    isUsingEraser = false;
    //颜色变成当先选定的颜色.
    context.fillStyle = choosedColor;
    context.strokeStyle = choosedColor;

    eraser.classList.remove("active");
    eraser.classList.remove("eraseractive");
    brush.classList.add("active");
}

function beginUsingEraser() { //用橡皮
    isUsingEraser = true;
    eraser.classList.add("active");
    eraser.classList.add("eraseractive");
    brush.classList.remove("active");
}

function beginUsingClearCanvas() { //使用清屏按钮
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    clearcanvas.classList.add('shakeClass');//点击一下执行CSS3动画
    setTimeout(function () {//半秒后自动移除CSS3动画的类
        clearcanvas.classList.remove('shakeClass');
    }, 820)
}

function beginUsingDownload() {
    download.classList.add('moveToBottomClass');//点击一下执行CSS3动画
    setTimeout(function () {//半秒后自动移除CSS3动画的类
        download.classList.remove('moveToBottomClass');
    }, 820)

    var url = canvas.toDataURL();
    console.log(url)
    var a = document.createElement("a")
    a.href = url
    a.download = "我的画儿"
    document.body.appendChild(a)
    a.click()
}

function cleanChildActive(parentArr) {//清除所有颜色按钮的放大状态
    for (let i = 0; i < parentArr.length; i++) {
        parentArr[i].classList.remove("active");
    }
}

function addColorClickEvent() {//循环添加颜色点击事件
    for (let i = 0; i < colorLiArr.length; i++) {
        colorLiArr[i].onclick = function () {
            context.strokeStyle = this.id;
            context.fillStyle = this.id;
            choosedColor = this.id;
            cleanChildActive(colorLiArr);//清除其他颜色的活动
            this.classList.add("active");
            //把画笔弄成存在的
            brush.style.fill = this.id;
            beginUsingBrush();

        }
    }
}

function addColorTouchEvent() {//循环添加颜色触摸事件
    for (let i = 0; i < colorLiArr.length; i++) {
        colorLiArr[i].ontouchstart = function () {
            context.strokeStyle = this.id;
            context.fillStyle = this.id;
            choosedColor = this.id;
            cleanChildActive(colorLiArr);
            this.classList.add("active");
            brush.style.fill = this.id;
            beginUsingBrush();

        }
    }
}

function addLineWidthClick() {
    for (let i = 0; i < sizeArr.length; i++) {
        sizeArr[i].onclick = function () {
            cleanChildActive(sizeArr);
            // this.style.borderColor='#ff5113'
            this.classList.add('active');
            brushWidth = this.linew;
        }
    }
}

function addLineWidthTouch() {
    for (let i = 0; i < sizeArr.length; i++) {
        sizeArr[i].ontouchstart = function () {
            cleanChildActive(sizeArr);
            // this.style.borderColor='#ff5113'
            this.classList.add('active');
            brushWidth = this.linew;
        }
    }
}

/*

学习API
//学习API
// 1.画矩形
context.fillStyle = 'red';//填充颜色
context.fillRect(0, 0, 100, 100,);//填充矩形

context.fillStyle = 'black';
context.fillRect(25,25,100,100);//第二次写颜色,就是第二个矩形的

context.clearRect(45,45,60,60);

context.strokeStyle = 'yellow';
context.strokeRect(50,50,50,50);//只有框

// 2.路径填充
context.beginPath();
context.moveTo(240,240);//把笔移动到240240
context.lineTo(300,240);//开始画线
context.lineTo(300,300);
context.fill();//自动填充

//3.画圆
context.beginPath();
context.arc(250,250,30,0,Math.PI*2);//π/2是90°
// rc(x, y, radius, startAngle, endAngle, anticlockwise)
// 画一个以（x,y）为圆心的以radius为半径的圆弧（圆），从startAngle开始到endAngle结束，按照anticlockwise给定的方向（默认为顺时针）来生成。
//参数anticlockwise为一个布尔值。为true时，是逆时针方向，否则顺时针方向。
context.fill();//自动填充
// context.stroke();//描边,不填充

// canvas.onmousemove = function (e) {
//     var x = e.clientX;
//     var y = e.clientY;
//     context.fillStyle = 'red';//填充颜色
//     context.fillRect(x-3, y-3, 6, 6);//填充矩形
// }

*/


// 当touchstart的时候禁止屏幕滚动,添加不让手机端滚动js代码
// // var body = document.getElementsByTagName("body")[0];
// document.body.ontouchstart = function (ev) {
//     ev.preventDefault();
//     // 阻止滑动后的后续的默认事件
// }

document.body.addEventListener('touchmove', function (e) {
    e.preventDefault(); //阻止默认的处理方式(阻止下拉滑动的效果)
}, {passive: false}); //passive 参数不能省略，用来兼容ios和android