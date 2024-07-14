document.getElementById("canvas-container").addEventListener(
  "dragover",
  function (e) {
    e.preventDefault();
  },
  false
);

function handleSelection(e) {
  var selectedObject = e.target;
  updateControls(selectedObject);
}

document.getElementById("canvas-container").addEventListener(
  "drop",
  async function (e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    var canvasElement = canvas.getElement();
    var rect = canvasElement.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    // WebPに変換
    var webpFile;
    try {
      webpFile = await imgFile2webpFile(file);
    } catch (error) {
      console.error("Failed to convert to WebP", error);
      return;
    }

    var reader = new FileReader();
    reader.onload = function (f) {
      var data = f.target.result;

      fabric.Image.fromURL(data, function (img) {
        // console.log("drop stateStack.length", stateStack.length);
        if (stateStack.length >= 2) {
          var canvasX = x / canvasContinerScale;
          var canvasY = y / canvasContinerScale;
          putImageInFrame(img, canvasX, canvasY);
        } else {
          // console.log("drop img.width, img.height", img.width, img.height);
          resizeCanvasByNum(img.width, img.height);
          initialPutImage(img, 0, 0);
        }

        setImage2ImageInitPrompt(img);
      });
    };

    reader.readAsDataURL(webpFile);
  },
  false
);

function initialPutImage(img) {
  img.set({
    left: 0,
    top: 0,
  });
  setNotSave(img);
  canvas.add(img);

  canvas.setActiveObject(img);
  saveInitialState(img);
  canvas.renderAll();

  updateLayerPanel();
  saveStateByManual();
  return img;
}

function putImageInFrame(img, x, y) {
  img.set({ left: x, top: y, });

  setNotSave(img);
  canvas.add(img);

  var targetFrameIndex = findTargetFrame(x, y);

  if (targetFrameIndex !== -1) {
    var targetFrame = canvas.item(targetFrameIndex);
    var frameCenterX = targetFrame.left + (targetFrame.width * targetFrame.scaleX) / 2;
    var frameCenterY = targetFrame.top + (targetFrame.height * targetFrame.scaleY) / 2;
    var scaleToFitX = (targetFrame.width * targetFrame.scaleX) / img.width;
    var scaleToFitY = (targetFrame.height * targetFrame.scaleY) / img.height;
    var scaleToFit = Math.max(scaleToFitX, scaleToFitY);

    moveSettings(img, targetFrame);

    img.set({
      left: frameCenterX - (img.width * scaleToFit) / 2,
      top: frameCenterY - (img.height * scaleToFit) / 2,
      scaleX: scaleToFit * 1.05,
      scaleY: scaleToFit * 1.05,
    });

    if (img.name) {
      img.name = targetFrame.name + "-" + img.name;
    } else {
      img.name = targetFrame.name + " In Image";
    }

    setGUID(targetFrame, img);
  } else {
    var scaleToCanvasWidth = 300 / img.width;
    var scaleToCanvasHeight = 300 / img.height;
    var scaleToCanvas = Math.min(scaleToCanvasWidth, scaleToCanvasHeight);

    img.set({
      left: 50,
      top: 50,
      scaleX: scaleToCanvas,
      scaleY: scaleToCanvas,
    });
  }

  canvas.setActiveObject(img);
  saveInitialState(img);

  canvas.renderAll();
  updateLayerPanel();
  saveStateByManual();
  return img;
}

function findTargetFrame(x, y) {
  //console.log( "findTargetFrame:x y, ", x, " ", y );

  let objects = canvas.getObjects().reverse();
  for (let i = 0; i < objects.length; i++) {
    if (isShapes(objects[i])) {
      let frameBounds = objects[i].getBoundingRect(true);
      if (
        x >= frameBounds.left &&
        x <= frameBounds.left + frameBounds.width &&
        y >= frameBounds.top &&
        y <= frameBounds.top + frameBounds.height
      ) {
        return canvas.getObjects().length - 1 - i;
      }
    }
  }
  return -1;
}

function isWithin(image, frame) {
  let frameBounds = frame.getBoundingRect(true);
  let imageBounds = image.getBoundingRect(true);

  let within =
    imageBounds.left >= frameBounds.left &&
    imageBounds.top >= frameBounds.top &&
    imageBounds.left + imageBounds.width * image.scaleX <=
    frameBounds.left + frameBounds.width &&
    imageBounds.top + imageBounds.height * image.scaleY <=
    frameBounds.top + frameBounds.height;
  return within;
}

function adjustImageToFitFrame(image, frame) {
  let frameBounds = frame.getBoundingRect();
  let scale = Math.min(
    frameBounds.width / image.getScaledWidth(),
    frameBounds.height / image.getScaledHeight()
  );
  image.set({
    left: frameBounds.left + (frameBounds.width - image.width * scale) / 2,
    top: frameBounds.top + (frameBounds.height - image.height * scale) / 2,
    scaleX: scale,
    scaleY: scale,
  });
}

document
  .getElementById("CustomPanelButton")
  .addEventListener("click", function () {
    var x = document.getElementById("customPanelSizeX").value;
    var y = document.getElementById("customPanelSizeY").value;
    loadBookSize(x, y, false);
    canvas.renderAll();
    adjustCanvasSize();
  });

document.getElementById("A4-H").addEventListener("click", function () {
  loadBookSize(210, 297, true);
});
document.getElementById("A4-V").addEventListener("click", function () {
  loadBookSize(297, 210, true);
});
document.getElementById("B4-H").addEventListener("click", function () {
  loadBookSize(257, 364, true);
});
document.getElementById("B4-V").addEventListener("click", function () {
  loadBookSize(364, 257, true);
});

document.getElementById("insta").addEventListener("click", function () {
  loadBookSize(1080, 1080, true);
});

document.getElementById("insta-story").addEventListener("click", function () {
  loadBookSize(1080, 1920, true);
});

document
  .getElementById("insta-portrait")
  .addEventListener("click", function () {
    loadBookSize(1080, 1350, true);
  });

document.getElementById("fb-page-cover").addEventListener("click", function () {
  loadBookSize(1640, 664, true);
});

document.getElementById("fb-event").addEventListener("click", function () {
  loadBookSize(1920, 1080, true);
});

document
  .getElementById("fb-group-header")
  .addEventListener("click", function () {
    loadBookSize(1640, 856, true);
  });

document
  .getElementById("youtube-thumbnail")
  .addEventListener("click", function () {
    loadBookSize(1280, 720, true);
  });

document
  .getElementById("youtube-profile")
  .addEventListener("click", function () {
    loadBookSize(800, 800, true);
  });

document.getElementById("youtube-cover").addEventListener("click", function () {
  loadBookSize(2560, 1440, true);
});

document
  .getElementById("twitter-profile")
  .addEventListener("click", function () {
    loadBookSize(400, 400, true);
  });

document
  .getElementById("twitter-header")
  .addEventListener("click", function () {
    loadBookSize(1500, 500, true);
  });

function loadBookSize(width, height, addPanel) {
  // console.log("loadBookSize addPanel", addPanel);

  if (stateStack.length > 2) {
    executeWithConfirmation("New Project?", function () {
      changeDoNotSaveHistory();
      resizeCanvasToObject(width, height);
      if (addPanel) {
        addSquareBySize(width, height);
      } else {
        initImageHistory();
        saveState();
      }
      changeDoSaveHistory();
    });
  } else {
    changeDoNotSaveHistory();
    resizeCanvasToObject(width, height);
    if (addPanel) {
      addSquareBySize(width, height);
    } else {
      initImageHistory();
      saveState();
    }
    changeDoSaveHistory();
  }
}

function addSquareBySize(width, height) {
  initImageHistory();
  saveState();

  var strokeWidthScale = canvas.width / 700;
  var strokeWidth = 2 * strokeWidthScale;

  var widthScale = canvas.width / width;
  var heightScale = canvas.height / height;

  var svgPaggingWidth = svgPagging * widthScale;
  var svgPaggingHeight = svgPagging * heightScale;

  var svgPaggingHalfWidth = svgPaggingWidth / 2;
  var svgPaggingHalfHeight = svgPaggingHeight / 2;

  var newWidth  = width  * widthScale  - svgPaggingWidth  - strokeWidth;
  var newHeight = height * heightScale - svgPaggingHeight - strokeWidth;

  // console.log("addSquareBySize height", height);
  console.log("addSquareBySize svgPaggingWidth", svgPaggingWidth);
  console.log("addSquareBySize svgPaggingHeight", svgPaggingHeight);
  // console.log("addSquareBySize heightScale", heightScale);
  // console.log("addSquareBySize newHeight", newHeight);

  var square = new fabric.Polygon(
    [
      { x: 0, y: 0 },
      { x: newWidth, y: 0 },
      { x: newWidth, y: newHeight },
      { x: 0, y: newHeight },
    ],
    {
      left: svgPaggingHalfWidth,
      top: svgPaggingHalfHeight,
      scaleX: 1,
      scaleY: 1,
      strokeWidth: strokeWidth,
      strokeUniform: true,
      stroke: "black",
      objectCaching: false,
      transparentCorners: false,
      cornerColor: "Blue",
      isPanel: true,
    }
  );

  setText2ImageInitPrompt(square);
  setPanelValue(square);
  canvas.add(square);
  updateLayerPanel();
}

/** Load SVG(Verfical, Landscope) */
function loadSVGPlusReset(svgString) {
  initImageHistory();
  saveState();
  changeDoNotSaveHistory();

  console.log("svgPagging", svgPagging);

  fabric.loadSVGFromString(svgString, function (objects, options) {
    resizeCanvasToObject(options.width, options.height);

    var strokeWidthScale = canvas.width / 700;
    var strokeWidth = 2 * strokeWidthScale;

    var canvasUsableHeight = canvas.height - svgPagging - strokeWidth;
    var canvasUsableWidth  = canvas.width  - svgPagging - strokeWidth;
    var overallScaleX = canvasUsableWidth / options.width;
    var overallScaleY = canvasUsableHeight / options.height;
    var scaleToFit = Math.min(overallScaleX, overallScaleY);
    // var offsetX = (canvas.width - options.width * scaleToFit) / 2;
    var offsetY = (svgPagging / 2) + (canvasUsableHeight - options.height * scaleToFit) / 2;
    var offsetX = (svgPagging / 2) + (canvasUsableWidth  - options.width  * scaleToFit) / 2;

    // console.log("offsetY ", offsetY);
    // console.log("offsetX ", offsetX);

    // clipAreaCoords.left = offsetX;
    // clipAreaCoords.top = offsetY;
    // clipAreaCoords.width = options.width * scaleToFit + 4;
    // clipAreaCoords.height = options.height * scaleToFit + 4;

    var bgColorInput = document.getElementById("bg-color");
    canvas.backgroundColor = bgColorInput.value;

    objects.reverse().forEach(function (obj) {
      if (obj.type === "path") {
        var points = obj.path.map(function (item) {
          return {
            x: item[item.length - 2],
            y: item[item.length - 1],
            command: item[0],
          };
        });

        var threshold = Math.max(obj.width, obj.height) * 0.004;
        var startX = 0;
        var startY = 0;

        var vertices = points.filter(function (point, index, self) {
          if (point.command === "M") {
            startX = point.x;
            startY = point.y;
            return true;
          } else if (point.command === "C") {
            if (index === 0) {
              return true;
            }
            var prevPoint = self[index - 1];
            var xDiff = Math.abs(point.x - prevPoint.x);
            var yDiff = Math.abs(point.y - prevPoint.y);

            if (xDiff < threshold && yDiff < threshold) {
              return false;
            }

            var xDiff = Math.abs(point.x - startX);
            var yDiff = Math.abs(point.y - startY);
            if (xDiff < threshold && yDiff < threshold) {
              return false;
            }
            return true;
          }
          return false;
        });

        console.log("top ", obj.top * scaleToFit + offsetY);
        console.log("left ", obj.left * scaleToFit + offsetX);
        console.log("scaleX ", scaleX);
        console.log("scaleY ", scaleY);

        var polygon = new fabric.Polygon(vertices, {
          isPanel: true,
          scaleX: scaleToFit,
          scaleY: scaleToFit,
          top: obj.top * scaleToFit + offsetY,
          left: obj.left * scaleToFit + offsetX,
          stroke: obj.stroke,
          strokeWidth: strokeWidth,
          selectable: true,
          hasControls: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
          edit: false,
          hasBorders: true,
          cornerStyle: "rect",
          objectCaching: false,

          controls: fabric.Object.prototype.controls,
        });
        setText2ImageInitPrompt(polygon);




        canvas.add(polygon);
      } else {


        console.log("top ", obj.top * scaleToFit + offsetY);
        console.log("left ", obj.left * scaleToFit + offsetX);
        console.log("scaleToFit ", scaleToFit);

        obj.isPanel= true, (obj.scaleX = scaleToFit);
        obj.scaleY = scaleToFit;
        obj.scaleX = scaleToFit;
        obj.top = obj.top * scaleToFit + offsetY;
        obj.left = obj.left * scaleToFit + offsetX;
        obj.setCoords();
        obj.strokeWidth = strokeWidth;
        obj.selectable = true;
        obj.hasControls = true;
        obj.lockMovementX = false;
        obj.lockMovementY = false;
        obj.lockRotation = false;
        obj.lockScalingX = false;
        obj.lockScalingY = false;
        obj.objectCaching = false,

        canvas.add(obj);
      }
    });
    panelStrokeChange()
    canvas.renderAll();
  });

  resizeCanvas(canvas.width, canvas.height);
  changeDoSaveHistory();
  saveState();

  updateLayerPanel();
}

/** Disallow drag-on-drop. */
document.addEventListener("DOMContentLoaded", function () {
  var svgPreviewArea = document.getElementById("svg-container-vertical");
  svgPreviewArea.addEventListener(
    "mousedown",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
    },
    false
  );
});

/** Disallow drag-on-drop. */
document.addEventListener("DOMContentLoaded", function () {
  var svgPreviewArea = document.getElementById("svg-container-landscape");
  svgPreviewArea.addEventListener(
    "mousedown",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
    },
    false
  );
});

document.addEventListener("DOMContentLoaded", function () {
  var svgPreviewArea = document.getElementById("speech-bubble-area1");

  svgPreviewArea.addEventListener(
    "mousedown",
    function (event) {
      // スライダーと数値入力の要素上でのマウスダウンイベントは許可する
      if (
        !event.target.closest("input[type='range']") &&
        !event.target.closest("input[type='number']")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    false
  );
});

function addArRect() {
  var width = parseFloat(document.getElementById("ar_width").value);
  var height = parseFloat(document.getElementById("ar_height").value);

  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    return;
  }

  // console.log("addArRect width", width);
  // console.log("addArRect height", height);
  var canvasWidth = canvas.getWidth();
  var canvasHeight = canvas.getHeight();

  var canvasSize = Math.min(canvasWidth, canvasHeight) * 0.25;

  var aspectRatio = width / height;
  if (width > height) {
    width = canvasSize;
    height = canvasSize / aspectRatio;
  } else {
    height = canvasSize;
    width = canvasSize * aspectRatio;
  }

  var points = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  addShape(points);
}

function addShape(points, options = {}) {
  var canvasWidth = canvas.width;
  var canvasHeight = canvas.height;

  var minX = Math.min(...points.map((p) => p.x));
  var maxX = Math.max(...points.map((p) => p.x));
  var minY = Math.min(...points.map((p) => p.y));
  var maxY = Math.max(...points.map((p) => p.y));

  var shapeWidth = maxX - minX;
  var shapeHeight = maxY - minY;

  var scaleX = canvasWidth / 3 / shapeWidth;
  var scaleY = canvasHeight / 3 / shapeHeight;
  var scale = Math.min(scaleX, scaleY);

  options.strokeWidth = 2 * (canvas.width / 700);
  options.strokeUniform = true;
  options.stroke = "black";
  options.objectCaching = false;
  options.transparentCorners = false;
  options.isPanel = true;
  options.left = options.left || 50;
  options.top = options.top || 50;
  options.scaleX = scale;
  options.scaleY = scale;

  var shape = new fabric.Polygon(points, options);
  setText2ImageInitPrompt(shape);
  setPanelValue(shape);
  canvas.add(shape);
  updateLayerPanel();
}

function addSquare() {
  var points = [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 200 },
    { x: 0, y: 200 },
  ];
  addShape(points);
}

function addPentagon() {
  var side = 150;
  var angle = 54;
  var points = [];
  for (var i = 0; i < 5; i++) {
    var x = side * Math.cos((Math.PI / 180) * (angle + i * 72));
    var y = side * Math.sin((Math.PI / 180) * (angle + i * 72));
    points.push({ x: x, y: y });
  }
  addShape(points);
}

function addTallRect() {
  var points = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 400 },
    { x: 0, y: 400 },
  ];
  addShape(points);
}

function addTallTrap() {
  var points = [
    { x: 50, y: 0 },
    { x: 150, y: 0 },
    { x: 100, y: 400 },
    { x: 0, y: 400 },
  ];
  addShape(points);
}

function addWideRect() {
  var points = [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 100 },
    { x: 0, y: 100 },
  ];
  addShape(points);
}

function addWideTrap() {
  var points = [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 350, y: 100 },
    { x: 50, y: 100 },
  ];
  addShape(points);
}

function addTrapezoid() {
  var points = [
    { x: 50, y: 0 },
    { x: 200, y: 0 },
    { x: 150, y: 100 },
    { x: 0, y: 100 },
  ];
  addShape(points);
}

function addTriangle() {
  var points = [
    { x: 100, y: 0 },
    { x: 200, y: 200 },
    { x: 0, y: 200 },
  ];
  addShape(points);
}

function addCircle() {
  var circle = new fabric.Circle({
    radius: 100,
    left: 50,
    top: 50,
    strokeWidth: (canvas.width / 700) * 2,
    strokeUniform: true,
    stroke: "black",
    objectCaching: false,
    transparentCorners: false,
    cornerColor: "Blue",
    isPanel: true,
  });
  setText2ImageInitPrompt(circle);
  setPanelValue(circle);
  canvas.add(circle);
  updateLayerPanel();
}

function addHexagon() {
  var side = 100;
  var points = [];
  for (var i = 0; i < 6; i++) {
    var x = side * Math.cos((Math.PI / 180) * (60 * i));
    var y = side * Math.sin((Math.PI / 180) * (60 * i));
    points.push({ x: x, y: y });
  }
  addShape(points);
}

function addEllipse() {
  var ellipse = new fabric.Ellipse({
    rx: 100,
    ry: 50,
    left: 50,
    top: 50,
    strokeWidth: (canvas.width / 700) * 2,
    strokeUniform: true,
    stroke: "black",
    objectCaching: false,
    transparentCorners: false,
    cornerColor: "Blue",
    isPanel: true,
  });
  setText2ImageInitPrompt(ellipse);
  setPanelValue(ellipse);
  canvas.add(ellipse);
  updateLayerPanel();
}

function addRhombus() {
  var points = [
    { x: 0, y: 100 },
    { x: 100, y: 0 },
    { x: 200, y: 100 },
    { x: 100, y: 200 },
  ];
  addShape(points);
}

function addStar() {
  var points = [];
  var outerRadius = 100;
  var innerRadius = 50;
  for (var i = 0; i < 10; i++) {
    var radius = i % 2 === 0 ? outerRadius : innerRadius;
    var angle = (Math.PI / 5) * i;
    points.push({
      x: radius * Math.sin(angle),
      y: -radius * Math.cos(angle),
    });
  }
  addShape(points);
}

function canvasInScale( originalWidth, originalHeight){
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const scaleX = (canvasWidth * 0.4) / originalWidth;
  const scaleY = (canvasHeight * 0.4) / originalHeight;
  const scale = Math.min(scaleX, scaleY);
  return scale;
}

function addTv() {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  const originalWidth = 780;
  const originalHeight = 580;
  
  const scale = canvasInScale( originalWidth, originalHeight);
  
  const frame = new fabric.Rect({
    width: originalWidth,
    height: originalHeight,
    rx: 20,
    ry: 20,
    fill: '#333333',
    stroke: '#222222',
    strokeWidth: 2
  });
  
  const screenBorder = new fabric.Rect({
    width: 730,
    height: 490,
    fill: 'transparent',
    stroke: '#444444',
    strokeWidth: 5,
    left: 25,
    top: 25
  });
  
  const screen = new fabric.Rect({
    width: 720,
    height: 480,
    fill: '#000000',
    left: 30,
    top: 30
  });
  
  const logo = new fabric.Text('SANKAKU', {
    fontSize: 24,
    fill: '#FFFFFF',
    left: 35,
    top: 540
  });
  
  const controlPanel = new fabric.Rect({
    width: 200,
    height: 40,
    fill: '#444444',
    left: 550,
    top: 530
  });
  
  const dial1 = new fabric.Circle({
    radius: 10,
    fill: '#666666',
    left: 570,
    top: 540
  });

  const dial2 = new fabric.Circle({
    radius: 10,
    fill: '#666666',
    left: 620,
    top: 540
  });

  const dial3 = new fabric.Circle({
    radius: 10,
    fill: '#666666',
    left: 670,
    top: 540
  });
  
  const tv = new fabric.Group([
    frame, screenBorder, screen, logo, controlPanel,
    dial1, dial2, dial3
  ], {
    left: (canvasWidth - originalWidth * scale) / 2,
    top: (canvasHeight - originalHeight * scale) / 2,
    scaleX: scale,
    scaleY: scale
  });
  
  canvas.add(tv);
}


function addSmartphone() {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  const originalWidth = 300;
  const originalHeight = 600;
  
  const scale = canvasInScale( originalWidth, originalHeight);
  
  const frame = new fabric.Rect({
      width: originalWidth,
      height: originalHeight,
      rx: 30,
      ry: 30,
      fill: '#333333',
      stroke: '#222222',
      strokeWidth: 2
  });
  
  const screen = new fabric.Rect({
      width: originalWidth - 20,
      height: originalHeight - 100,  // 画面の高さを調整
      fill: '#000000',
      left: 10,
      top: 40
  });
  
  const homeButtonOuter = new fabric.Circle({
      radius: 25,
      fill: 'transparent',
      stroke: '#FFFFFF',
      strokeWidth: 2,
      left: originalWidth / 2 - 25,
      top: originalHeight - 55  // 位置を調整
  });

  const homeButtonInner = new fabric.Circle({
      radius: 23,
      fill: 'rgba(100, 100, 100, 0.5)',
      left: originalWidth / 2 - 23,
      top: originalHeight - 53  // 外側の円に合わせて調整
  });
  
  const camera = new fabric.Circle({
      radius: 5,
      fill: '#666666',
      left: originalWidth / 2 - 5,
      top: 20
  });
  
  const speaker = new fabric.Rect({
      width: 50,
      height: 5,
      rx: 2,
      ry: 2,
      fill: '#666666',
      left: originalWidth / 2 - 25,
      top: 10
  });
  
  const smartphone = new fabric.Group([
      frame, screen, homeButtonOuter, homeButtonInner, camera, speaker
  ], {
      left: (canvasWidth - originalWidth * scale) / 2,
      top: (canvasHeight - originalHeight * scale) / 2,
      scaleX: scale,
      scaleY: scale
  });
  
  canvas.add(smartphone);
}


function createButton(centerX, centerY, size, color, label = '', name = '') {
  const button = new fabric.Circle({
      radius: size / 2,
      fill: color,
      stroke: '#000000',
      strokeWidth: 2,
      shadow: new fabric.Shadow({color: 'rgba(0,0,0,0.6)', blur: 5, offsetX: 2, offsetY: 2}),
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0
  });

  const group = new fabric.Group([button], {
      left: centerX,
      top: centerY,
      originX: 'center',
      originY: 'center',
      name: name
  });

  // if (label) {
  //     const text = new fabric.Text(label, {
  //         fontSize: size / 2,
  //         fill: '#FFFFFF',
  //         originX: 'center',
  //         originY: 'center',
  //         left: 0,
  //         top: 0,
  //         fontWeight: 'bold'
  //     });
  //     group.addWithUpdate(text);
  // }

  return group;
}

function addRedDot(x, y, name) {
  const redDot = new fabric.Circle({
      radius: 3,
      fill: 'red',
      left: x,
      top: y,
      originX: 'center',
      originY: 'center'
  });

  const text = new fabric.Text(name, {
      fontSize: 12,
      fill: 'red',
      left: x + 5,
      top: y - 10,
      originX: 'left',
      originY: 'bottom'
  });

  canvas.add(redDot);
  canvas.add(text);
}

function addRefinedRazerKishiController() {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  const originalWidth = 200;
  const originalHeight = 350;
  
  const scale = canvasInScale( originalWidth+600, originalHeight);
  // 左右のコントローラー
  const leftController = new fabric.Rect({
      width: originalWidth,
      height: originalHeight,
      rx: 20,
      ry: 20,
      fill: '#2b2b2b',
      stroke: '#000000',
      strokeWidth: 2,
      left: 0,
      top: 25,
      name: 'Left Controller'
  });
  const rightController = new fabric.Rect({
      width: originalWidth,
      height: originalHeight,
      rx: 20,
      ry: 20,
      fill: '#2b2b2b',
      stroke: '#000000',
      strokeWidth: 2,
      left: 800,
      top: 25,
      name: 'Right Controller'
  });
  //addRedDot(rightController.left, rightController.top, rightController.name);

  // スマートフォン
  const smartphone = new fabric.Rect({
      width: 600,
      height: 300,
      rx: 20,
      ry: 20,
      fill: '#000000',
      stroke: '#333333',
      strokeWidth: 2,
      left: 200,
      top: 50,
      name: 'Smartphone'
  });
  //addRedDot(smartphone.left, smartphone.top, smartphone.name);

  // スマートフォン画面
  const screen = new fabric.Rect({
      width: 580,
      height: 280,
      rx: 15,
      ry: 15,
      fill: '#000000',
      left: 210,
      top: 60,
      name: 'Screen'
  });
  //addRedDot(screen.left, screen.top, screen.name);

  // 左側十字キー
  function createDPadButton(left, top, angle = 0, name = '') {
      const button = new fabric.Rect({
          width: 35,
          height: 35,
          fill: '#4a4a4a',
          stroke: '#000000',
          strokeWidth: 2,
          rx: 5,
          ry: 5,
          shadow: new fabric.Shadow({color: 'rgba(0,0,0,0.6)', blur: 5, offsetX: 2, offsetY: 2}),
          angle: angle
      });
      //addRedDot(left, top, name);
      return new fabric.Group([button], {left: left, top: top, name: name});
  }

  const dpadUp = createDPadButton(82, 195, 0, 'D-Pad Up');
  const dpadDown = createDPadButton(82, 265, 0, 'D-Pad Down');
  const dpadLeft = createDPadButton(47, 230, 0, 'D-Pad Left');
  const dpadRight = createDPadButton(117, 230, 0, 'D-Pad Right');
  const dpadCenter = new fabric.Rect({
      width: 25,
      height: 25,
      fill: '#4a4a4a',
      stroke: '#000000',
      strokeWidth: 2,
      left: 87,
      top: 235,
      name: 'D-Pad Center'
  });
  //addRedDot(dpadCenter.left, dpadCenter.top, dpadCenter.name);

  // 左ジョイスティック
  const leftStick = createButton(100, 130, 60, '#333333', '', 'Left Stick');
  //addRedDot(leftStick.left, leftStick.top, leftStick.name);

  // 右ジョイスティック
  const rightStick = createButton(900, 130, 60, '#333333', '', 'Right Stick');
  //addRedDot(rightStick.left, rightStick.top, rightStick.name);

  // 右側4つのボタン
  const buttonSize = 40;
  const buttonCenterX = 900;
  const buttonCenterY = 250;
  const buttonOffset = 45;

  const buttonA = createButton(buttonCenterX, buttonCenterY + buttonOffset, buttonSize, '#90EE90', 'A', 'Button A');
  //addRedDot(buttonA.left, buttonA.top, buttonA.name);
  const buttonB = createButton(buttonCenterX + buttonOffset, buttonCenterY, buttonSize, '#FFA07A', 'B', 'Button B');
  //addRedDot(buttonB.left, buttonB.top, buttonB.name);
  const buttonX = createButton(buttonCenterX - buttonOffset, buttonCenterY, buttonSize, '#ADD8E6', 'X', 'Button X');
  //addRedDot(buttonX.left, buttonX.top, buttonX.name);
  const buttonY = createButton(buttonCenterX, buttonCenterY - buttonOffset, buttonSize, '#FFFFE0', 'Y', 'Button Y');
  //addRedDot(buttonY.left, buttonY.top, buttonY.name);

  // LRボタン（シャドウ付き）
  function createTriggerButton(left, top, name) {
      const path = new fabric.Path('M 10 5 Q 60 0, 110 5 L 110 25 Q 60 30, 10 25 Z', {
          fill: '#333333',
          stroke: '#000000',
          strokeWidth: 2,
          left: left,
          top: top,
          name: name
      });
      //addRedDot(left, top, name);
      return path;
  }

  const leftTrigger = createTriggerButton(45, 0, 'Left Trigger');
  const rightTrigger = createTriggerButton(845, 0, 'Right Trigger');

  // すべての要素をグループ化
  const controller = new fabric.Group([
      leftController, rightController, smartphone, screen,
      dpadUp, dpadDown, dpadLeft, dpadRight, dpadCenter,
      leftStick, rightStick,
      buttonA, buttonB, buttonX, buttonY,
      leftTrigger, rightTrigger
  ], {
    left: (canvasWidth - originalWidth * scale) / 2,
    top: (canvasHeight - originalHeight * scale) / 2,
    scaleX: scale,
    scaleY: scale
});
  
  canvas.add(controller);
}

function addPentagon() {
  var side = 150;
  var angle = 54;
  var points = [];
  for (var i = 0; i < 5; i++) {
    var x = side * Math.cos((Math.PI / 180) * (angle + i * 72));
    var y = side * Math.sin((Math.PI / 180) * (angle + i * 72));
    points.push({ x: x, y: y });
  }
  addShape(points);
}

function addOctagon() {
  var side = 100;
  var points = [];
  for (var i = 0; i < 8; i++) {
    var x = side * Math.cos((Math.PI / 180) * (45 * i));
    var y = side * Math.sin((Math.PI / 180) * (45 * i));
    points.push({ x: x, y: y });
  }
  addShape(points);
}

function addTallRightLeaningTrapezoid() {
  var points = [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
    { x: 100, y: 300 },
    { x: 0, y: 300 },
  ];
  addShape(points);
}

function addRightSlantingTrapezoid() {
  var points = [
    { x: 0, y: 0 },
    { x: 300, y: 0 },
    { x: 350, y: 100 },
    { x: 0, y: 100 },
  ];
  addShape(points);
}

function Edit() {
  var poly = canvas.getActiveObject();
  if (!poly) return;

  poly.edit = !poly.edit;
  if (poly.edit) {
    var lastControl = poly.points.length - 1;
    poly.cornerStyle = "circle";
    poly.cornerColor = "rgba(0,0,255,0.5)";
    poly.controls = poly.points.reduce(function (acc, point, index) {
      acc["p" + index] = new fabric.Control({
        positionHandler: polygonPositionHandler,
        actionHandler: anchorWrapper(
          index > 0 ? index - 1 : lastControl,
          actionHandler
        ),
        actionName: "modifyPolygon",
        pointIndex: index,
      });
      return acc;
    }, {});
  } else {
    poly.cornerStyle = "rect";
    poly.controls = fabric.Object.prototype.controls;
  }
  poly.hasBorders = !poly.edit;
  canvas.requestRenderAll();
  updateLayerPanel();
}

function changePanelStrokeWidth(value) {
  var activeObject = canvas.getActiveObject();
  if (isPanel(activeObject)) {
    activeObject.set({
      strokeWidth: parseFloat(value),
      strokeUniform: true,
    });
    canvas.requestRenderAll();
  }
}
function changePanelStrokeColor(value) {
  var activeObject = canvas.getActiveObject();
  if (isPanel(activeObject)) {
    activeObject.set("stroke", value);
    canvas.requestRenderAll();
  }
}
function changePanelOpacity(value) {
  var activeObject = canvas.getActiveObject();
  if (isPanel(activeObject)) {
    const opacity = value / 100;
    activeObject.set("opacity", opacity);
    canvas.requestRenderAll();
  }
}
function changePanelFillColor(value) {
  var activeObject = canvas.getActiveObject();
  if (isPanel(activeObject)) {
    activeObject.set("fill", value);
    canvas.requestRenderAll();
  }
}


function panelStrokeChange() {
  var strokeWidthValue = document.getElementById("panelStrokeWidth").value;
  var strokeColorValue = document.getElementById("panelStrokeColor").value;

  canvas.getObjects().forEach(function (obj) {
    if (isPanel(obj)) {
      obj.set({
        strokeWidth: parseFloat(strokeWidthValue),
        strokeUniform: true,
      });
      obj.set("stroke", strokeColorValue);
    }
  });
  canvas.requestRenderAll();
}


function panelAllChange() {
  var strokeWidthValue = document.getElementById("panelStrokeWidth").value;
  var strokeColorValue = document.getElementById("panelStrokeColor").value;
  var opacityValue = document.getElementById("panelOpacity").value;
  const opacity = opacityValue / 100;
  var fillValue = document.getElementById("panelFillColor").value;

  canvas.getObjects().forEach(function (obj) {
    if (isPanel(obj)) {
      obj.set({
        strokeWidth: parseFloat(strokeWidthValue),
        strokeUniform: true,
      });
      obj.set("stroke", strokeColorValue);
      obj.set("fill", fillValue);
      obj.set("opacity", opacity);
    }
  });
  canvas.requestRenderAll();
}

function setPanelValue(obj) {
  // console.log("setPanelValue");
  var strokeWidthValue = document.getElementById("panelStrokeWidth").value;
  var strokeColorValue = document.getElementById("panelStrokeColor").value;
  var opacityValue = document.getElementById("panelOpacity").value;
  const opacity = opacityValue / 100;
  var fillValue = document.getElementById("panelFillColor").value;

  if (isPanel(obj)) {
    // console.log("setPanelValue isPanel");

    obj.set({
      strokeWidth: parseFloat(strokeWidthValue),
      strokeUniform: true,
    });
    obj.set("stroke", strokeColorValue);
    obj.set("fill", fillValue);
    obj.set("opacity", opacity);
    canvas.requestRenderAll();
  }
}

function polygonPositionHandler(dim, finalMatrix, fabricObject) {
  var x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
    y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
  return fabric.util.transformPoint(
    { x: x, y: y },
    fabric.util.multiplyTransformMatrices(
      fabricObject.canvas.viewportTransform,
      fabricObject.calcTransformMatrix()
    )
  );
}

function getObjectSizeWithStroke(object) {
  var stroke = new fabric.Point(
    object.strokeUniform ? 1 / object.scaleX : 1,
    object.strokeUniform ? 1 / object.scaleY : 1
  ).multiply(object.strokeWidth);
  return new fabric.Point(object.width + stroke.x, object.height + stroke.y);
}

function actionHandler(eventData, transform, x, y) {
  var polygon = transform.target,
    currentControl = polygon.controls[polygon.__corner],
    mouseLocalPosition = polygon.toLocalPoint(
      new fabric.Point(x, y),
      "center",
      "center"
    ),
    polygonBaseSize = getObjectSizeWithStroke(polygon),
    size = polygon._getTransformedDimensions(0, 0),
    finalPointPosition = {
      x:
        (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
        polygon.pathOffset.x,
      y:
        (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
        polygon.pathOffset.y,
    };
  polygon.points[currentControl.pointIndex] = finalPointPosition;
  polygon.dirty = true;
  return true;
}

function anchorWrapper(anchorIndex, fn) {
  return function (eventData, transform, x, y) {
    var fabricObject = transform.target,
      absolutePoint = fabric.util.transformPoint(
        {
          x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
          y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y,
        },
        fabricObject.calcTransformMatrix()
      ),
      actionPerformed = fn(eventData, transform, x, y),
      newDim = fabricObject._setPositionDimensions({}),
      polygonBaseSize = getObjectSizeWithStroke(fabricObject),
      newX =
        (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
        polygonBaseSize.x,
      newY =
        (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
        polygonBaseSize.y;
    fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
    return actionPerformed;
  };
}

var gridSize = 10;
var snapTimeout;
var isGridVisible = false;

function drawGrid() {
  var gridCanvas = document.createElement("canvas");
  gridCanvas.width = canvas.width;
  gridCanvas.height = canvas.height;
  var gridCtx = gridCanvas.getContext("2d");
  var baseColor = "#ccc";


  gridCtx.strokeStyle = baseColor;

  for (var i = 0; i <= canvas.width / gridSize; i++) {
    gridCtx.beginPath();
    gridCtx.moveTo(i * gridSize, 0);
    gridCtx.lineTo(i * gridSize, canvas.height);
    gridCtx.stroke();
  }

  for (var i = 0; i <= canvas.height / gridSize; i++) {
    gridCtx.beginPath();
    gridCtx.moveTo(0, i * gridSize);
    gridCtx.lineTo(canvas.width, i * gridSize);
    gridCtx.stroke();
  }

  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  var oneThirdX = canvas.width / 3;
  var twoThirdsX = (canvas.width / 3) * 2;
  var oneThirdY = canvas.height / 3;
  var twoThirdsY = (canvas.height / 3) * 2;

  var crossColor = darkenColor(baseColor, 5);
  gridCtx.strokeStyle = crossColor;

  gridCtx.beginPath();
  gridCtx.moveTo(centerX, 0);
  gridCtx.lineTo(centerX, canvas.height);
  gridCtx.stroke();

  gridCtx.beginPath();
  gridCtx.moveTo(0, centerY);
  gridCtx.lineTo(canvas.width, centerY);
  gridCtx.stroke();

  crossColor = darkenColor(baseColor, -70);
  gridCtx.strokeStyle = crossColor;

  gridCtx.beginPath();
  gridCtx.moveTo(oneThirdX, 0);
  gridCtx.lineTo(oneThirdX, canvas.height);
  gridCtx.stroke();

  gridCtx.beginPath();
  gridCtx.moveTo(twoThirdsX, 0);
  gridCtx.lineTo(twoThirdsX, canvas.height);
  gridCtx.stroke();

  gridCtx.beginPath();
  gridCtx.moveTo(0, oneThirdY);
  gridCtx.lineTo(canvas.width, oneThirdY);
  gridCtx.stroke();

  gridCtx.beginPath();
  gridCtx.moveTo(0, twoThirdsY);
  gridCtx.lineTo(canvas.width, twoThirdsY);
  gridCtx.stroke();

  canvas.setBackgroundImage(
    gridCanvas.toDataURL(),
    canvas.renderAll.bind(canvas)
  );
}

function darkenColor(color, percent) {
  if (percent === 0) return color;
  var num = parseInt(color.slice(1), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;

  R = Math.max(Math.min(255, R), 0);
  G = Math.max(Math.min(255, G), 0);
  B = Math.max(Math.min(255, B), 0);

  return '#' + (
    (1 << 24) + (R << 16) + (G << 8) + B
  ).toString(16).slice(1).toUpperCase();
}
function removeGrid() {
  canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
}

function toggleGrid() {
  if (isGridVisible) {
    removeGrid();
    isGridVisible = false;
  } else {
    drawGrid();
    isGridVisible = true;
  }
  canvas.renderAll();
}

document.getElementById("toggleGridButton").addEventListener("click", toggleGrid);

function updateGridSize() {
  var newGridSize = parseInt(
    document.getElementById("gridSizeInput").value,
    10
  );
  if (newGridSize > 0) {
    gridSize = newGridSize;
    if (isGridVisible) {
      removeGrid();
      drawGrid();
    }
  }
}

document.getElementById("gridSizeInput").addEventListener("input", updateGridSize);

function snapToGrid(target) {
  if (isGridVisible) {
    target.set({
      left: Math.round(target.left / gridSize) * gridSize,
      top: Math.round(target.top / gridSize) * gridSize,
    });
    canvas.renderAll();
  }
}
function debounceSnapToGrid(target) {
  clearTimeout(snapTimeout);
  snapTimeout = setTimeout(function () {
    snapToGrid(target);
  }, 50);
}

document
  .getElementById("view_layers_checkbox")
  .addEventListener("change", function () {
    changeView("layer-panel", this.checked);
  });
document
  .getElementById("view_controles_checkbox")
  .addEventListener("change", function () {
    changeView("controls", this.checked);
  });






  let areNamesVisible = false;
  const promptTexts = [];
  
  function View() {
    if (areNamesVisible) {
      // Clear the contextTop
      canvas.clearContext(canvas.contextTop);
      promptTexts.length = 0;
    } else {
      canvas.getObjects().forEach((obj) => {
        if (isPanel(obj)) {
          let viewText = obj.name + "\n\nPrompt\n" + (obj.text2img_prompt || 'nothing');
          const wrappedText = wrapText(viewText, obj.width * obj.scaleX - 20, 16);
          const text = new fabric.Text(wrappedText, {
            left: obj.left + 10,
            top: obj.top + (obj.height * obj.scaleY / 4),
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            fill: "rgba(0, 0, 0, 0.8)",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            selectable: false,
            evented: false,
            lineHeight: 1.3,
            textAlign: 'left',
            padding: 5,
          });
          promptTexts.push(text);
        }
      });
    }
    areNamesVisible = !areNamesVisible;
    canvas.renderAll();
  }


  // カスタムレンダリングメソッドを追加
  fabric.util.object.extend(fabric.Canvas.prototype, {
    renderTop: function () {
      if (areNamesVisible) {
        const ctx = this.contextTop;
        ctx.save();
        ctx.transform.apply(ctx, this.viewportTransform);
        promptTexts.forEach((text) => {
          ctx.save();
          text.transform(ctx);
          text._render(ctx);
          ctx.restore();
        });
        ctx.restore();
      }
    }
  });
  
  // renderAllメソッドをオーバーライド
  const originalRenderAll = fabric.Canvas.prototype.renderAll;
  fabric.Canvas.prototype.renderAll = function() {
    originalRenderAll.call(this);
    this.renderTop();
  };
  
  function wrapText(text, width, fontSize) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];
  
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const testWidth = getTextWidth(testLine, fontSize);
      if (testWidth > width) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines.join('\n');
  }
  
  function getTextWidth(text, fontSize) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = fontSize + 'px Arial';
    const metrics = context.measureText(text);
    return metrics.width;
  }