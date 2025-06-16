// ========== グローバル変数 ==========
let finalCanvas;
let finalCtx;
let selectedFramePath = 'images/frame1.png'; // 初期選択
let capturedImages = [];


// ========== ページ遷移 ==========
function goToPage(pageNumber) {
  const pages = document.querySelectorAll('.page');
  pages.forEach((page, index) => {
    page.classList.toggle('active', index + 1 === pageNumber);
  });

  if (pageNumber === 2) startCamera();
  if (pageNumber === 3) setupPrintButton();
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  // ボタンの表示制御
  document.querySelectorAll('.page2-only,.page3-only, .page4-only').forEach(el => {
    el.style.display = 'none';
  });
  if (pageId === 'page3') {
    document.querySelectorAll('.page3-only').forEach(el => el.style.display = 'inline-block');
  } else if (pageId === 'page4') {
    document.querySelectorAll('.page4-only').forEach(el => el.style.display = 'inline-block');
  }
}

// ========== メッセージ表示 ==========

function showMessage(text) {
  const area = document.getElementById('message-area');
  area.textContent = text;
  setTimeout(() => area.textContent = '', 2000); // 2秒後に消える
}


// ========== カメラ起動 ==========
function startCamera() {
  const video = document.getElementById('camera');
  if (!video) {
    console.error('カメラ表示用の video 要素が見つかりません');
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      console.log('カメラのストリーム取得成功！');
      video.srcObject = stream;
    })
    .catch(err => {
      console.error('カメラの起動に失敗しました:', err);
      alert('カメラが使えませんでした。ブラウザの設定を確認してください。');
    });
}

function stopCamera() {
  const video = document.getElementById('camera');
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
}


// ========== 印刷ボタン処理 ==========
function setupPrintButton() {
  const printButton = document.getElementById('print-button');
  finalCanvas = document.getElementById('finalCanvas');

  if (printButton && finalCanvas) {
    printButton.onclick = () => {
      try {
        const imageURL = finalCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = imageURL;
        a.download = 'wedding_photo.png';
        a.click();
        goToPage(4);
      } catch (e) {
        console.error('画像の保存に失敗:', e);
        alert('画像保存に失敗しました。フレーム画像が外部URLになっていないか確認してください。');
      }
    };
  }
}


// ========== 2枚撮影 ==========
const take3ShotsButton = document.getElementById('take-3shots');
const photoCanvas = document.getElementById('photo-canvas');
const photoCtx = photoCanvas.getContext('2d');
const photoResults = document.getElementById('photo-results');
const countdownEl = document.getElementById('countdown');

take3ShotsButton.addEventListener('click', async () => {
  photoResults.innerHTML = '';
  capturedImages = [];
  const video = document.getElementById('camera');

  for (let i = 0; i < 2; i++) {
    await showCountdown(3);
    photoCanvas.width = video.videoWidth;
    photoCanvas.height = video.videoHeight;
    photoCtx.drawImage(video, 0, 0, photoCanvas.width, photoCanvas.height);

    const imageData = photoCanvas.toDataURL('image/png');
    capturedImages.push(imageData);

    const img = document.createElement('img');
    img.src = imageData;
    img.style.width = '150px';
    img.style.marginRight = '10px';
    photoResults.appendChild(img);
  }

  //alert('2枚の撮影が完了しました！');  
showMessage('2枚の撮影が完了しました！');

  document.getElementById("goToFrameSelect").style.display = "block";
});

async function showCountdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    countdownEl.textContent = i;
    await new Promise(res => setTimeout(res, 1000));
  }
  countdownEl.textContent = '';
}


// ========== フレーム合成 ==========
function combineWithFrame() {
  if (!selectedFramePath.startsWith('images/')) {
    alert('選択されたフレーム画像がローカルではありません。外部画像やURLは使用できません。');
    return;
  }

  if (!finalCanvas || !finalCtx) {
    alert('finalCanvasまたはContextが取得できません');
    return;
  }

  if (capturedImages.length !== 2) {
    alert('写真を2枚撮影してください！');
    return;
  }

  const [photo1, photo2] = [new Image(), new Image()];
  const frameImg = new Image();

  photo1.src = capturedImages[0];
  photo2.src = capturedImages[1];
  frameImg.src = selectedFramePath;

  Promise.all([
    new Promise(res => (photo1.onload = res)),
    new Promise(res => (photo2.onload = res)),
    new Promise(res => (frameImg.onload = res)),
  ]).then(() => {
    finalCanvas.width = 990;
    finalCanvas.height = 1410;

    finalCtx.drawImage(photo1, 25, 145, 475, 285);
    finalCtx.drawImage(photo1, 25, 845, 475, 285);
    finalCtx.drawImage(photo2, 500, 145, 475, 285);
    finalCtx.drawImage(photo2, 500, 845, 475, 285);

    finalCtx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);

    //alert('フレーム付き画像が完成しました！');
    showMessage('2枚の撮影が完了しました！');
  });
}


// ========== DOM読み込み後 ==========
document.addEventListener('DOMContentLoaded', () => {
  finalCanvas = document.getElementById('finalCanvas');
  finalCtx = finalCanvas?.getContext('2d');

  const startButton = document.getElementById('startButton');
  if (startButton) {
    startButton.addEventListener('click', () => {
      goToPage(2);
    });
  }

  const combineBtn = document.getElementById('combine-with-frame');
  if (combineBtn) {
    combineBtn.addEventListener('click', combineWithFrame);
  }

  document.querySelectorAll('.frame-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.frame-thumb').forEach(t => t.classList.remove('selected'));
      thumb.classList.add('selected');
      selectedFramePath = thumb.dataset.src;
      console.log("選択されたフレーム：", selectedFramePath);
    });
  });

  const backButton = document.getElementById('back-to-start');
  if (backButton) {
    backButton.addEventListener('click', () => {
      capturedImages = [];
      document.querySelectorAll('.frame-thumb').forEach(t => t.classList.remove('selected'));
      selectedFramePath = 'images/frame1.png';
      const ctx = finalCanvas?.getContext('2d');
      ctx?.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
      stopCamera();
      goToPage(1);
    });
  }

  goToPage(1);
});
